import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { Client, GatewayIntentBits, Message as DiscordMessage, TextChannel } from 'discord.js';

@Injectable()
export class DiscordService implements OnModuleDestroy {
  private readonly logger = new Logger(DiscordService.name);
  private clients = new Map<string, Client>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhooksService,
  ) {}

  async onModuleDestroy() {
    for (const [channelId, client] of this.clients.entries()) {
      this.logger.log(`Destroying Discord client for channel ${channelId}`);
      await this.stopClient(channelId);
    }
  }

  /**
   * Инициализировать Discord-бота для канала
   */
  async initializeBot(channelId: string): Promise<void> {
    const channel = await this.prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel || channel.type !== 'DISCORD') {
      throw new Error('Channel not found or not a DISCORD channel');
    }

    const botToken = channel.config?.['botToken'] as string;
    if (!botToken) {
      throw new Error('Discord bot token not found in channel config');
    }

    // Если клиент уже запущен, останавливаем
    if (this.clients.has(channelId)) {
      await this.stopClient(channelId);
    }

    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
    });

    // Обработчик готовности
    client.once('ready', () => {
      this.logger.log(`Discord bot ready for channel ${channelId} (${client.user?.tag})`);
      this.prisma.channel.update({ where: { id: channelId }, data: { isActive: true } }).catch(() => {});
    });

    // Обработчик новых сообщений
    client.on('messageCreate', async (msg: DiscordMessage) => {
      // Игнорируем сообщения от самого бота
      if (msg.author.bot) return;

      this.logger.log(`Received message from ${msg.author.tag}: ${msg.content}`);

      // Сохраняем в БД
      const savedMessage = await this.prisma.message.create({
        data: {
          channelId,
          direction: 'INBOUND',
          senderName: msg.author.tag,
          senderId: msg.author.id,
          text: msg.content,
          externalId: msg.id,
          payload: {
            guildId: msg.guild?.id,
            channelId: msg.channel.id,
            authorId: msg.author.id,
          },
        },
      });

      // Отправляем вебхуки
      await this.webhooks.dispatch('message.received', {
        message: savedMessage,
        channel,
        platform: 'discord',
      });
    });

    // Обработчик ошибок
    client.on('error', (error) => {
      this.logger.error(`Discord client error for channel ${channelId}:`, error);
    });

    // Логин
    await client.login(botToken);
    this.clients.set(channelId, client);
  }

  /**
   * Остановить Discord-бота для канала
   */
  async stopClient(channelId: string): Promise<void> {
    const client = this.clients.get(channelId);
    if (!client) return;

    client.destroy();
    this.clients.delete(channelId);
    await this.prisma.channel.update({ where: { id: channelId }, data: { isActive: false } }).catch(() => {});
    this.logger.log(`Discord client stopped for channel ${channelId}`);
  }

  /**
   * Получить статус бота
   */
  getStatus(channelId: string): string {
    const client = this.clients.get(channelId);
    if (!client) return 'DISCONNECTED';
    return client.isReady() ? 'CONNECTED' : 'CONNECTING';
  }

  /**
   * Отправить сообщение в Discord-канал
   */
  async sendMessage(channelId: string, discordChannelId: string, text: string): Promise<any> {
    const client = this.clients.get(channelId);
    if (!client || !client.isReady()) {
      throw new Error('Discord bot is not connected');
    }

    const discordChannel = await client.channels.fetch(discordChannelId);
    if (!discordChannel || !(discordChannel instanceof TextChannel)) {
      throw new Error('Discord channel not found or not a text channel');
    }

    const sentMessage = await discordChannel.send(text);

    // Сохраняем в БД
    const channel = await this.prisma.channel.findUnique({ where: { id: channelId } });
    const savedMessage = await this.prisma.message.create({
      data: {
        channelId,
        direction: 'OUTBOUND',
        text,
        externalId: sentMessage.id,
        payload: {
          guildId: sentMessage.guild?.id,
          channelId: sentMessage.channel.id,
        },
      },
    });

    return { success: true, message: savedMessage };
  }
}
