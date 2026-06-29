import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import * as QRCode from 'qrcode';
import { ChannelsService } from '../channels/channels.service';
import { MessagesService } from '../messages/messages.service';

// Сервис интеграции с Telegram через ПОЛЬЗОВАТЕЛЬСКИЙ аккаунт (MTProto, библиотека GramJS).
// В отличие от Bot API, работает как обычный клиент Telegram: авторизация по QR-коду
// (как «Войти по QR» в официальном приложении), сессия хранится и держится открытой.
// Требует API_ID и API_HASH, которые пользователь получает бесплатно на https://my.telegram.org
@Injectable()
export class TelegramUserService {
  private readonly logger = new Logger(TelegramUserService.name);
  // Активные клиенты: ключ — ID канала
  private clients = new Map<string, TelegramClient>();
  // QR-коды (data URL PNG) для каналов, ожидающих сканирование
  private qrCodes = new Map<string, string>();
  // Текущий статус логина по каналу
  private statuses = new Map<string, string>();
  // Резолверы ожидания пароля 2FA по каналу
  private passwordResolvers = new Map<string, (password: string) => void>();

  constructor(
    private readonly channelsService: ChannelsService,
    private readonly messagesService: MessagesService,
  ) {}

  // Прочитать и проверить API_ID / API_HASH из config канала
  private readCredentials(config: Record<string, any>): { apiId: number; apiHash: string } {
    const apiId = Number(config?.apiId);
    const apiHash = String(config?.apiHash || '');
    if (!apiId || Number.isNaN(apiId) || !apiHash) {
      throw new BadRequestException(
        'Для Telegram (QR) необходимо указать apiId и apiHash в настройках канала. Получите их на https://my.telegram.org',
      );
    }
    return { apiId, apiHash };
  }

  // Инициализировать клиент Telegram для канала
  async initializeClient(channelId: string): Promise<void> {
    const channel = await this.channelsService.findOne(channelId);
    const config = (channel.config as Record<string, any>) ?? {};
    const { apiId, apiHash } = this.readCredentials(config);

    const existing = this.clients.get(channelId);
    if (existing && existing.connected) {
      this.logger.log(`Клиент Telegram (QR) для канала ${channelId} уже активен`);
      return;
    }

    const session = new StringSession(String(config.session || ''));
    const client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 5,
    });
    // Уменьшаем шум логов GramJS
    client.setLogLevel('error' as any);

    await client.connect();
    this.clients.set(channelId, client);

    // Если уже авторизованы (есть валидная сессия) — просто вешаем обработчики
    if (config.session && (await client.isUserAuthorized())) {
      this.setupHandlers(channelId, client);
      this.statuses.set(channelId, 'CONNECTED');
      this.logger.log(`Telegram (QR) канал ${channelId} восстановлен из сессии`);
      return;
    }

    // Иначе запускаем QR-логин в фоне (не блокируем запрос)
    this.statuses.set(channelId, 'INITIALIZING');
    this.startQrLogin(channelId, client, apiId, apiHash);
  }

  // Фоновый процесс QR-логина: генерирует QR, ждёт сканирование, сохраняет сессию
  private startQrLogin(
    channelId: string,
    client: TelegramClient,
    apiId: number,
    apiHash: string,
  ): void {
    client
      .signInUserWithQrCode(
        { apiId, apiHash },
        {
          onError: async (err: Error) => {
            this.logger.error(`QR-логин Telegram (канал ${channelId}): ${err.message}`);
            this.statuses.set(channelId, 'ERROR');
            return true; // прекратить попытки
          },
          // Колбэк генерации QR-кода (вызывается повторно при обновлении токена)
          qrCode: async (code: { token: Buffer; expires: number }) => {
            const token = code.token.toString('base64url');
            const url = `tg://login?token=${token}`;
            const dataUrl = await QRCode.toDataURL(url);
            this.qrCodes.set(channelId, dataUrl);
            this.statuses.set(channelId, 'WAITING_QR');
            this.logger.log(`QR-код Telegram сгенерирован для канала ${channelId}`);
          },
          // Колбэк ввода пароля 2FA (если включён облачный пароль)
          password: async () => {
            this.statuses.set(channelId, 'NEEDS_PASSWORD');
            this.logger.log(`Telegram (канал ${channelId}) требует пароль 2FA`);
            return this.waitForPassword(channelId);
          },
        },
      )
      .then(async () => {
        const sessionString = client.session.save() as unknown as string;
        await this.channelsService.mergeConfig(channelId, { session: sessionString });
        this.setupHandlers(channelId, client);
        this.qrCodes.delete(channelId);
        this.statuses.set(channelId, 'CONNECTED');
        this.logger.log(`Telegram (QR) канал ${channelId} успешно авторизован`);
      })
      .catch((err) => {
        this.logger.error(`Ошибка QR-логина Telegram (канал ${channelId}): ${err.message}`);
        this.statuses.set(channelId, 'ERROR');
      });
  }

  // Промис ожидания пароля 2FA — резолвится при вызове submitPassword
  private waitForPassword(channelId: string): Promise<string> {
    return new Promise<string>((resolve) => {
      this.passwordResolvers.set(channelId, resolve);
    });
  }

  // Передать пароль 2FA, если он был запрошен
  async submitPassword(channelId: string, password: string) {
    const resolver = this.passwordResolvers.get(channelId);
    if (!resolver) {
      throw new BadRequestException('Сейчас пароль 2FA не запрашивается для этого канала');
    }
    resolver(password);
    this.passwordResolvers.delete(channelId);
    return { success: true, message: 'Пароль принят, продолжаем авторизацию' };
  }

  // Навесить обработчик входящих сообщений
  private setupHandlers(channelId: string, client: TelegramClient): void {
    client.addEventHandler(async (event: NewMessageEvent) => {
      await this.handleIncomingMessage(channelId, event);
    }, new NewMessage({ incoming: true }));
  }

  // Обработать входящее сообщение
  private async handleIncomingMessage(channelId: string, event: NewMessageEvent) {
    try {
      const message = event.message;
      if (message.out) return; // игнорируем исходящие

      const senderId = message.senderId ? String(message.senderId) : undefined;
      let senderName = senderId;
      try {
        const sender: any = await message.getSender();
        if (sender) {
          senderName =
            sender.username ||
            [sender.firstName, sender.lastName].filter(Boolean).join(' ') ||
            senderId;
        }
      } catch {
        // не критично, оставляем senderId
      }

      await this.messagesService.createInbound({
        channelId,
        externalId: String(message.id),
        senderId,
        senderName,
        text: message.message || '',
        payload: {
          date: message.date,
          chatId: message.chatId ? String(message.chatId) : undefined,
          out: message.out,
          isPrivate: message.isPrivate,
          isGroup: message.isGroup,
        },
      });

      this.logger.log(`Получено сообщение Telegram (QR, канал ${channelId}) от ${senderName}`);
    } catch (error) {
      this.logger.error(`Ошибка обработки входящего Telegram (QR): ${error.message}`);
    }
  }

  // Получить QR-код для авторизации канала
  async getQrCode(channelId: string): Promise<{ qr?: string; status: string }> {
    await this.channelsService.findOne(channelId);

    const client = this.clients.get(channelId);
    const qr = this.qrCodes.get(channelId);

    if (client && client.connected && (await client.isUserAuthorized())) {
      return { status: 'CONNECTED' };
    }
    if (qr) {
      return { qr, status: this.statuses.get(channelId) || 'WAITING_QR' };
    }

    // Клиента нет — инициализируем и ждём генерацию QR
    if (!client) {
      await this.initializeClient(channelId);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const newQr = this.qrCodes.get(channelId);
    return {
      qr: newQr,
      status: this.statuses.get(channelId) || (newQr ? 'WAITING_QR' : 'INITIALIZING'),
    };
  }

  // Отправить сообщение через пользовательский аккаунт
  async sendMessage(channelId: string, peer: string, text: string) {
    await this.channelsService.findOne(channelId);
    const client = this.clients.get(channelId);

    if (!client || !client.connected) {
      throw new NotFoundException(
        'Клиент Telegram (QR) для этого канала не инициализирован. Сначала авторизуйтесь по QR-коду.',
      );
    }

    const sent: any = await client.sendMessage(peer, { message: text });
    const messageId = Array.isArray(sent) ? sent[0]?.id : sent?.id;

    await this.messagesService.createOutbound({
      channelId,
      senderId: peer,
      text,
      externalId: messageId ? String(messageId) : undefined,
    });

    this.logger.log(`Отправлено сообщение Telegram (QR, канал ${channelId}) на ${peer}`);
    return { success: true, messageId };
  }

  // Получить статус клиента
  async getStatus(channelId: string): Promise<{ status: string; info?: any }> {
    await this.channelsService.findOne(channelId);
    const client = this.clients.get(channelId);

    if (!client) {
      return { status: this.statuses.get(channelId) || 'NOT_INITIALIZED' };
    }

    try {
      if (client.connected && (await client.isUserAuthorized())) {
        const me: any = await client.getMe();
        return {
          status: 'CONNECTED',
          info: {
            id: me?.id ? String(me.id) : undefined,
            username: me?.username,
            phone: me?.phone,
            firstName: me?.firstName,
          },
        };
      }
      return { status: this.statuses.get(channelId) || 'DISCONNECTED' };
    } catch (error) {
      return { status: 'ERROR', info: error.message };
    }
  }

  // Остановить клиент (например, при удалении канала)
  async stopClient(channelId: string): Promise<void> {
    const client = this.clients.get(channelId);
    if (client) {
      try {
        await client.disconnect();
      } catch {
        // игнорируем ошибки отключения
      }
      this.clients.delete(channelId);
      this.qrCodes.delete(channelId);
      this.statuses.delete(channelId);
      this.passwordResolvers.delete(channelId);
      this.logger.log(`Telegram (QR) клиент для канала ${channelId} остановлен`);
    }
  }
}
