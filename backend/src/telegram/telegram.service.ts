import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { ChannelsService } from '../channels/channels.service';
import { MessagesService } from '../messages/messages.service';

// Сервис интеграции с Telegram Bot API.
// Поддерживает установку вебхука, приём апдейтов и отправку сообщений.
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly apiBase = 'https://api.telegram.org/bot';

  constructor(
    private readonly channelsService: ChannelsService,
    private readonly messagesService: MessagesService,
  ) {}

  // Установить вебхук Telegram на наш публичный URL
  async setWebhook(channelId: string, publicUrl: string) {
    const channel = await this.channelsService.findOne(channelId);
    const token = (channel.config as any)?.token;
    if (!token) throw new NotFoundException('У канала не задан токен Telegram-бота');

    const webhookUrl = `${publicUrl.replace(/\/$/, '')}/api/telegram/webhook/${token}`;
    const { data } = await axios.post(`${this.apiBase}${token}/setWebhook`, {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query'],
    });
    return data;
  }

  // Получить информацию о боте (проверка токена)
  async getBotInfo(token: string) {
    const { data } = await axios.get(`${this.apiBase}${token}/getMe`);
    return data;
  }

  // Обработать входящий апдейт от Telegram
  async handleUpdate(token: string, update: any) {
    const channel = await this.channelsService.findTelegramByToken(token);
    if (!channel) {
      this.logger.warn('Получен апдейт для неизвестного Telegram-токена');
      return { ok: true };
    }

    const message = update?.message || update?.edited_message;
    if (!message) return { ok: true };

    const from = message.from || {};
    const senderName = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username;

    await this.messagesService.createInbound({
      channelId: channel.id,
      externalId: String(message.message_id),
      senderId: String(message.chat?.id),
      senderName,
      text: message.text || message.caption || '',
      payload: update,
    });

    return { ok: true };
  }

  // Отправить сообщение через Telegram-бота
  async sendMessage(channelId: string, chatId: string, text: string) {
    const channel = await this.channelsService.findOne(channelId);
    const token = (channel.config as any)?.token;
    if (!token) throw new NotFoundException('У канала не задан токен Telegram-бота');

    const { data } = await axios.post(`${this.apiBase}${token}/sendMessage`, {
      chat_id: chatId,
      text,
    });

    await this.messagesService.createOutbound({
      channelId,
      senderId: chatId,
      text,
      externalId: String(data?.result?.message_id),
    });

    return data;
  }
}
