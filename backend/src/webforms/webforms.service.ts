import { Injectable, NotFoundException } from '@nestjs/common';
import { ChannelsService } from '../channels/channels.service';
import { MessagesService } from '../messages/messages.service';
import { SubmitFormDto } from './dto/submit-form.dto';

// Сервис приёма заявок с веб-форм сайта
@Injectable()
export class WebformsService {
  constructor(
    private readonly channelsService: ChannelsService,
    private readonly messagesService: MessagesService,
  ) {}

  // Принять заявку с формы и сохранить как входящее сообщение
  async submit(channelId: string, dto: SubmitFormDto) {
    const channel = await this.channelsService.findOne(channelId);
    if (channel.type !== 'WEBFORM') {
      throw new NotFoundException('Канал не является веб-формой');
    }

    // Формируем текст из полей формы
    const lines = [
      dto.name && `Имя: ${dto.name}`,
      dto.email && `Email: ${dto.email}`,
      dto.phone && `Телефон: ${dto.phone}`,
      dto.message && `Сообщение: ${dto.message}`,
    ].filter(Boolean);

    return this.messagesService.createInbound({
      channelId,
      senderName: dto.name,
      senderId: dto.email || dto.phone,
      text: lines.join('\n'),
      payload: { ...dto, source: 'webform' },
    });
  }
}
