import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { VK, MessageContext } from 'vk-io';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';

interface VKClient {
  vk: VK;
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';
  pollingStarted: boolean;
}

@Injectable()
export class VKService implements OnModuleDestroy {
  private readonly logger = new Logger(VKService.name);
  private clients = new Map<string, VKClient>();

  constructor(
    private prisma: PrismaService,
    private webhooks: WebhooksService,
  ) {}

  async onModuleDestroy() {
    this.logger.log('Shutting down all VK clients...');
    for (const [channelId, client] of this.clients.entries()) {
      await this.stopClient(channelId);
    }
  }

  async initialize(channelId: string): Promise<{ status: string; message: string }> {
    try {
      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
      });

      if (!channel || channel.type !== 'VK') {
        throw new Error('VK channel not found');
      }

      const config = channel.config as any;
      if (!config.accessToken) {
        throw new Error('Access token is required');
      }

      // Stop existing client if any
      if (this.clients.has(channelId)) {
        await this.stopClient(channelId);
      }

      const vk = new VK({
        token: config.accessToken,
        pollingGroupId: undefined, // User Long Poll, not group
      });

      const clientData: VKClient = {
        vk,
        status: 'CONNECTING',
        pollingStarted: false,
      };

      this.clients.set(channelId, clientData);

      // Start Long Poll
      await this.startLongPolling(channelId, clientData);

      clientData.status = 'CONNECTED';
      this.logger.log(`VK client initialized for channel ${channelId}`);

      return {
        status: 'CONNECTED',
        message: 'VK client connected successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to initialize VK client: ${error.message}`);
      throw error;
    }
  }

  async stopClient(channelId: string): Promise<void> {
    const client = this.clients.get(channelId);
    if (!client) return;

    try {
      if (client.pollingStarted) {
        await client.vk.updates.stop();
      }
      client.status = 'DISCONNECTED';
      this.clients.delete(channelId);
      this.logger.log(`VK client stopped for channel ${channelId}`);
    } catch (error) {
      this.logger.error(`Error stopping VK client: ${error.message}`);
    }
  }

  private async startLongPolling(channelId: string, clientData: VKClient): Promise<void> {
    const { vk } = clientData;

    // Handle incoming messages
    vk.updates.on('message_new', async (context: MessageContext) => {
      try {
        // Ignore outgoing messages
        if (context.isOutbox) {
          return;
        }

        this.logger.log(
          `Received VK message from user ${context.senderId} in channel ${channelId}`,
        );

        const messageData = {
          channelId,
          direction: 'INBOUND' as const,
          text: context.text || '',
          senderId: context.senderId.toString(),
          senderName: `VK User ${context.senderId}`,
          payload: {
            conversationMessageId: context.conversationMessageId,
            peerId: context.peerId,
            fromId: context.senderId,
            date: context.createdAt,
            attachments: context.attachments?.map((att) => ({
              type: att.type,
            })),
          },
        };

        // Save to database
        await this.prisma.message.create({
          data: messageData,
        });

        // Dispatch webhook
        await this.webhooks.dispatch('message.received', messageData);
      } catch (error) {
        this.logger.error(`Error handling VK message: ${error.message}`);
      }
    });

    // Start polling
    await vk.updates.start();
    clientData.pollingStarted = true;
    this.logger.log(`Long Poll started for channel ${channelId}`);
  }

  async getStatus(channelId: string): Promise<{ status: string }> {
    const client = this.clients.get(channelId);
    if (!client) {
      return { status: 'DISCONNECTED' };
    }
    return { status: client.status };
  }

  async sendMessage(
    channelId: string,
    userId: number,
    text: string,
  ): Promise<{ messageId: number }> {
    const client = this.clients.get(channelId);
    if (!client || client.status !== 'CONNECTED') {
      throw new Error('VK client is not connected');
    }

    try {
      const result = await client.vk.api.messages.send({
        user_id: userId,
        message: text,
        random_id: Math.floor(Math.random() * 1000000000),
      });

      // Save outgoing message to database
      await this.prisma.message.create({
        data: {
          channelId,
          direction: 'OUTBOUND',
          text,
          senderId: userId.toString(),
          senderName: `VK User ${userId}`,
          payload: {
            messageId: result,
            userId,
          },
        },
      });

      this.logger.log(`Sent VK message to user ${userId} from channel ${channelId}`);

      return { messageId: Number(result) };
    } catch (error) {
      this.logger.error(`Failed to send VK message: ${error.message}`);
      throw error;
    }
  }
}
