import { Module } from '@nestjs/common';
import { TelegramUserService } from './telegram-user.service';
import { TelegramUserController } from './telegram-user.controller';
import { ChannelsModule } from '../channels/channels.module';
import { MessagesModule } from '../messages/messages.module';

// Модуль Telegram через пользовательский аккаунт (MTProto / QR-логин)
@Module({
  imports: [ChannelsModule, MessagesModule],
  providers: [TelegramUserService],
  controllers: [TelegramUserController],
  exports: [TelegramUserService],
})
export class TelegramUserModule {}
