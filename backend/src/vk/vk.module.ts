import { Module } from '@nestjs/common';
import { VKController } from './vk.controller';
import { VKService } from './vk.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [PrismaModule, WebhooksModule],
  controllers: [VKController],
  providers: [VKService],
  exports: [VKService],
})
export class VKModule {}
