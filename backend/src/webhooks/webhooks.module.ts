import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WebhookProcessor } from './webhook.processor';

@Module({
  imports: [
    // Очередь доставки вебхуков
    BullModule.registerQueue({ name: 'webhooks' }),
  ],
  providers: [WebhooksService, WebhookProcessor],
  controllers: [WebhooksController],
  exports: [WebhooksService],
})
export class WebhooksModule {}
