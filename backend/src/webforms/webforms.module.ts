import { Module } from '@nestjs/common';
import { WebformsController } from './webforms.controller';
import { WebformsService } from './webforms.service';
import { ChannelsModule } from '../channels/channels.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [ChannelsModule, MessagesModule],
  providers: [WebformsService],
  controllers: [WebformsController],
})
export class WebformsModule {}
