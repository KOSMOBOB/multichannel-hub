import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChannelsModule } from './channels/channels.module';
import { TelegramModule } from './telegram/telegram.module';
import { TelegramUserModule } from './telegram-user/telegram-user.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { WebformsModule } from './webforms/webforms.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { MessagesModule } from './messages/messages.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    // Глобальная конфигурация переменных окружения
    ConfigModule.forRoot({ isGlobal: true }),

    // Очереди BullMQ через Redis
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),

    PrismaModule,
    AuthModule,
    UsersModule,
    ChannelsModule,
    TelegramModule,
    TelegramUserModule,
    WhatsappModule,
    WebformsModule,
    WebhooksModule,
    MessagesModule,
    SettingsModule,
  ],
})
export class AppModule {}
