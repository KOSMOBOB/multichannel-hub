import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import axios from 'axios';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

// Обработчик очереди доставки вебхуков.
// Выполняет HTTP POST на целевой URL с подписью HMAC при наличии секрета.
@Processor('webhooks')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ webhookId: string; event: string; payload: any }>) {
    const { webhookId, event, payload } = job.data;
    const webhook = await this.prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook || !webhook.isActive) return;

    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': event,
      ...((webhook.headers as Record<string, string>) || {}),
    };

    // Подпись тела запроса HMAC-SHA256, если задан секрет
    if (webhook.secret) {
      const signature = crypto.createHmac('sha256', webhook.secret).update(body).digest('hex');
      headers['X-Webhook-Signature'] = signature;
    }

    try {
      await axios.post(webhook.url, body, { headers, timeout: 15000 });
      this.logger.log(`Вебхук ${webhook.name} доставлен (событие ${event})`);
    } catch (err) {
      this.logger.error(`Ошибка доставки вебхука ${webhook.name}: ${err.message}`);
      throw err; // повтор по политике backoff
    }
  }
}
