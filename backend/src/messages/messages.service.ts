import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';

// Сервис истории сообщений: сохранение входящих/исходящих, выборка с фильтрами
@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooksService: WebhooksService,
  ) {}

  // Сохранить входящее сообщение и инициировать доставку в вебхуки
  async createInbound(data: {
    channelId: string;
    externalId?: string;
    senderName?: string;
    senderId?: string;
    text?: string;
    payload?: any;
  }) {
    const message = await this.prisma.message.create({
      data: {
        channelId: data.channelId,
        direction: 'INBOUND',
        externalId: data.externalId,
        senderName: data.senderName,
        senderId: data.senderId,
        text: data.text,
        payload: data.payload ?? undefined,
        status: 'RECEIVED',
      },
    });

    // Асинхронно отправляем во внешние системы по событию message.received
    await this.webhooksService.dispatch('message.received', message);

    return message;
  }

  // Сохранить исходящее сообщение
  createOutbound(data: { channelId: string; senderId?: string; text?: string; externalId?: string }) {
    return this.prisma.message.create({
      data: {
        channelId: data.channelId,
        direction: 'OUTBOUND',
        senderId: data.senderId,
        text: data.text,
        externalId: data.externalId,
        status: 'FORWARDED',
      },
    });
  }

  // Список сообщений с фильтрами и пагинацией
  async findAll(params: { channelId?: string; page?: number; limit?: number }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 50;
    const where: Prisma.MessageWhereInput = {};
    if (params.channelId) where.channelId = params.channelId;

    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        include: { channel: { select: { id: true, name: true, type: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.message.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Сводная статистика для дашборда
  async stats() {
    const [totalMessages, totalChannels, activeChannels, totalWebhooks] = await Promise.all([
      this.prisma.message.count(),
      this.prisma.channel.count(),
      this.prisma.channel.count({ where: { isActive: true } }),
      this.prisma.webhook.count(),
    ]);

    // Сообщения по типам каналов
    const byChannel = await this.prisma.message.groupBy({
      by: ['channelId'],
      _count: { _all: true },
    });

    return { totalMessages, totalChannels, activeChannels, totalWebhooks, byChannel };
  }
}
