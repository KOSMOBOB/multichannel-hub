import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Client, LocalAuth, Message as WAMessage } from 'whatsapp-web.js';
import { ChannelsService } from '../channels/channels.service';
import { MessagesService } from '../messages/messages.service';

// Сервис интеграции с WhatsApp через whatsapp-web.js (неофициальный API через WhatsApp Web)
// Поддерживает QR-авторизацию, приём и отправку сообщений
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  // Хранилище активных клиентов WhatsApp: ключ — ID канала
  private clients = new Map<string, Client>();
  // Хранилище QR-кодов для каналов, ожидающих авторизацию
  private qrCodes = new Map<string, string>();

  constructor(
    private readonly channelsService: ChannelsService,
    private readonly messagesService: MessagesService,
  ) {}

  // Инициализировать клиент WhatsApp для канала
  async initializeClient(channelId: string): Promise<void> {
    const channel = await this.channelsService.findOne(channelId);
    
    if (this.clients.has(channelId)) {
      this.logger.log(`Клиент WhatsApp для канала ${channelId} уже существует`);
      return;
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: channelId, // уникальная сессия для каждого канала
        dataPath: './whatsapp-sessions', // папка для хранения сессий
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    // Событие: получен QR-код для сканирования
    client.on('qr', (qr: string) => {
      this.logger.log(`QR-код сгенерирован для канала ${channelId}`);
      this.qrCodes.set(channelId, qr);
    });

    // Событие: клиент готов к работе (авторизован)
    client.on('ready', () => {
      this.logger.log(`WhatsApp клиент для канала ${channelId} готов`);
      this.qrCodes.delete(channelId); // QR больше не нужен
    });

    // Событие: клиент аутентифицирован
    client.on('authenticated', () => {
      this.logger.log(`WhatsApp клиент для канала ${channelId} аутентифицирован`);
    });

    // Событие: ошибка аутентификации
    client.on('auth_failure', (msg) => {
      this.logger.error(`Ошибка аутентификации WhatsApp для канала ${channelId}: ${msg}`);
    });

    // Событие: клиент отключён
    client.on('disconnected', (reason) => {
      this.logger.warn(`WhatsApp клиент для канала ${channelId} отключён: ${reason}`);
      this.clients.delete(channelId);
    });

    // Событие: входящее сообщение
    client.on('message', async (message: WAMessage) => {
      await this.handleIncomingMessage(channelId, message);
    });

    // Сохраняем клиент и запускаем
    this.clients.set(channelId, client);
    await client.initialize();
  }

  // Обработать входящее сообщение из WhatsApp
  private async handleIncomingMessage(channelId: string, message: WAMessage) {
    try {
      const contact = await message.getContact();
      const chat = await message.getChat();

      await this.messagesService.createInbound({
        channelId,
        externalId: message.id.id,
        senderId: message.from,
        senderName: contact.name || contact.pushname || message.from,
        text: message.body || '',
        payload: {
          type: message.type,
          timestamp: message.timestamp,
          from: message.from,
          to: message.to,
          hasMedia: message.hasMedia,
          isForwarded: message.isForwarded,
          chatName: chat.name,
        },
      });

      this.logger.log(`Получено сообщение из WhatsApp (канал ${channelId}): ${message.from}`);
    } catch (error) {
      this.logger.error(`Ошибка обработки входящего сообщения WhatsApp: ${error.message}`);
    }
  }

  // Получить QR-код для авторизации канала (если ещё не авторизован)
  async getQrCode(channelId: string): Promise<{ qr?: string; status: string }> {
    const channel = await this.channelsService.findOne(channelId);
    
    const client = this.clients.get(channelId);
    const qr = this.qrCodes.get(channelId);

    if (client) {
      const state = await client.getState();
      return { status: state || 'CONNECTED' };
    }

    if (qr) {
      return { qr, status: 'WAITING_QR' };
    }

    // Если клиента нет и QR нет — инициализируем
    await this.initializeClient(channelId);
    
    // Ждём немного, чтобы QR успел сгенерироваться
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    const newQr = this.qrCodes.get(channelId);
    return { qr: newQr, status: newQr ? 'WAITING_QR' : 'INITIALIZING' };
  }

  // Отправить сообщение через WhatsApp
  async sendMessage(channelId: string, phoneNumber: string, text: string) {
    const channel = await this.channelsService.findOne(channelId);
    const client = this.clients.get(channelId);

    if (!client) {
      throw new NotFoundException('WhatsApp клиент для этого канала не инициализирован. Сначала авторизуйтесь через QR-код.');
    }

    // Убеждаемся, что номер в правильном формате (например, 79001234567@c.us)
    const formattedNumber = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;

    const sentMessage = await client.sendMessage(formattedNumber, text);

    await this.messagesService.createOutbound({
      channelId,
      senderId: formattedNumber,
      text,
      externalId: sentMessage.id.id,
    });

    this.logger.log(`Отправлено сообщение WhatsApp (канал ${channelId}) на ${formattedNumber}`);

    return { success: true, messageId: sentMessage.id.id };
  }

  // Получить статус клиента WhatsApp для канала
  async getStatus(channelId: string): Promise<{ status: string; info?: any }> {
    const channel = await this.channelsService.findOne(channelId);
    const client = this.clients.get(channelId);

    if (!client) {
      return { status: 'NOT_INITIALIZED' };
    }

    try {
      const state = await client.getState();
      const info = await client.info;
      return { status: state || 'UNKNOWN', info };
    } catch (error) {
      return { status: 'ERROR', info: error.message };
    }
  }

  // Остановить клиент WhatsApp для канала (например, при удалении канала)
  async stopClient(channelId: string): Promise<void> {
    const client = this.clients.get(channelId);
    if (client) {
      await client.destroy();
      this.clients.delete(channelId);
      this.qrCodes.delete(channelId);
      this.logger.log(`WhatsApp клиент для канала ${channelId} остановлен`);
    }
  }
}
