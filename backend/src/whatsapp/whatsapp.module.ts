import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { ChannelsModule } from '../channels/channels.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [ChannelsModule, MessagesModule],
  providers: [WhatsappService],
  controllers: [WhatsappController],
  exports: [WhatsappService],
})
export class WhatsappModule {}
