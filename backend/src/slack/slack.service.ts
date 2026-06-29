import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { WebClient } from '@slack/web-api';
import { App } from '@slack/bolt';

@Injectable()
export class SlackService implements OnModuleDestroy {
  private readonly logger = new Logger(SlackService.name);
  private apps = new Map<string, App>();
  private webClients = new Map<string, WebClient>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhooksService,
  ) {}

  async onModuleDestroy() {
    for (const [channelId, app] of this.apps.entries()) {
      this.logger.log(`Destroying Slack app for channel ${channelId}`);
      await this.stopApp(channelId);
    }
  }

  /**
   * Инициализировать Slack-бота для канала
   */
  async initializeBot(channelId: string): Promise<void> {
    const channel = await this.prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel || channel.type !== 'SLACK') {
      throw new Error('Channel not found or not a SLACK channel');
    }

    const botToken = channel.config?.['botToken'] as string;
    const signingSecret = channel.config?.['signingSecret'] as string;
    const appToken = channel.config?.['appToken'] as string;

    if (!botToken) {
      throw new Error('Slack bot token not found in channel config');
    }

    // Если приложение уже запущено, останавливаем
    if (this.apps.has(channelId)) {
      await this.stopApp(channelId);
    }

    // WebClient для отправки сообщений
    const webClient = new WebClient(botToken);
    this.webClients.set(channelId, webClient);

    // Если есть appToken и signingSecret, можно запустить Socket Mode для получения событий
    if (appToken && signingSecret) {
      const app = new App({
        token: botToken,
        signingSecret,
        appToken,
        socketMode: true,
      });

      // Обработчик сообщений
      app.message(async ({ message, say }) => {
        // Игнорируем сообщения от ботов
        if ((message as any).bot_id) return;

        this.logger.log(`Received Slack message: ${(message as any).text}`);

        // Сохраняем в БД
        const savedMessage = await this.prisma.message.create({
          data: {
            channelId,
            direction: 'INBOUND',
            senderId: (message as any).user,
            text: (message as any).text || '',
            externalId: (message as any).ts,
            payload: {
              channel: (message as any).channel,
              teamId: (message as any).team,
            },
          },
        });

        // Отправляем вебхуки
        await this.webhooks.dispatch('message.received', {
          message: savedMessage,
          channel,
          platform: 'slack',
        });
      });

      await app.start();
      this.apps.set(channelId, app);
      this.logger.log(`Slack Socket Mode app started for channel ${channelId}`);
    } else {
      this.logger.warn(
        `Slack channel ${channelId} initialized without Socket Mode (missing appToken or signingSecret). Only outbound messages will work.`,
      );
    }

    await this.prisma.channel.update({ where: { id: channelId }, data: { isActive: true } }).catch(() => {});
  }

  /**
   * Остановить Slack-бота для канала
   */
  async stopApp(channelId: string): Promise<void> {
    const app = this.apps.get(channelId);
    if (app) {
      await app.stop();
      this.apps.delete(channelId);
    }
    this.webClients.delete(channelId);
    await this.prisma.channel.update({ where: { id: channelId }, data: { isActive: false } }).catch(() => {});
    this.logger.log(`Slack app stopped for channel ${channelId}`);
  }

  /**
   * Получить статус бота
   */
  getStatus(channelId: string): string {
    const app = this.apps.get(channelId);
    const webClient = this.webClients.get(channelId);
    if (app) return 'CONNECTED_SOCKET_MODE';
    if (webClient) return 'CONNECTED_API_ONLY';
    return 'DISCONNECTED';
  }

  /**
   * Отправить сообщение в Slack-канал
   */
  async sendMessage(channelId: string, slackChannelId: string, text: string): Promise<any> {
    const webClient = this.webClients.get(channelId);
    if (!webClient) {
      throw new Error('Slack bot is not connected');
    }

    const result = await webClient.chat.postMessage({
      channel: slackChannelId,
      text,
    });

    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`);
    }

    // Сохраняем в БД
    const channel = await this.prisma.channel.findUnique({ where: { id: channelId } });
    const savedMessage = await this.prisma.message.create({
      data: {
        channelId,
        direction: 'OUTBOUND',
        text,
        externalId: result.ts,
        payload: {
          channel: slackChannelId,
        },
      },
    });

    return { success: true, message: savedMessage };
  }
}
