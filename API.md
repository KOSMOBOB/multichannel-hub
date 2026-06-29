# Документация REST API

Базовый URL: `http://localhost:4000/api`
Интерактивная документация (Swagger): `http://localhost:4000/api/docs`

Все защищённые эндпоинты требуют заголовок:
```
Authorization: Bearer <JWT-токен>
```

---

## Авторизация

### POST `/auth/login`
Вход в систему.

**Тело запроса:**
```json
{ "email": "admin@admin.com", "password": "admin123" }
```
**Ответ:**
```json
{
  "accessToken": "eyJhbGci...",
  "user": { "id": "...", "email": "admin@admin.com", "name": "Администратор", "role": "ADMIN", "language": "ru" }
}
```

### GET `/auth/me` 🔒
Данные текущего пользователя.

---

## Профиль

### PUT `/users/me` 🔒
Обновить профиль.
```json
{ "name": "Имя", "language": "ru" }
```

### PATCH `/users/me/password` 🔒
Сменить пароль.
```json
{ "currentPassword": "admin123", "newPassword": "newSecret123" }
```

---

## Каналы 🔒

### GET `/channels`
Список каналов.

### POST `/channels`
Создать канал.
```json
{ "name": "Поддержка", "type": "TELEGRAM", "config": { "token": "123456:ABC-DEF..." } }
```
`type`: `TELEGRAM` | `WEBFORM` | `WHATSAPP` | `VK` | `MAX` | `INSTAGRAM`

### GET `/channels/{id}`
Получить канал.

### PATCH `/channels/{id}`
Обновить канал.

### DELETE `/channels/{id}`
Удалить канал.

---

## Telegram

### POST `/telegram/channels/{id}/set-webhook` 🔒
Установить вебхук Telegram для канала.
```json
{ "publicUrl": "https://your-domain.com" }
```

### POST `/telegram/channels/{id}/send` 🔒
Отправить сообщение через бота.
```json
{ "chatId": "123456789", "text": "Здравствуйте!" }
```

### POST `/telegram/webhook/{token}`
Публичный эндпоинт приёма апдейтов от серверов Telegram (вызывается автоматически).

---

## WhatsApp 🔒

### POST `/whatsapp/channels/{id}/initialize`
Инициализировать WhatsApp клиент для канала. После вызова клиент начнёт генерировать QR-код.
**Ответ:**
```json
{ "success": true, "message": "Клиент инициализируется. Используйте /qr для получения QR-кода." }
```

### GET `/whatsapp/channels/{id}/qr`
Получить QR-код для авторизации WhatsApp канала. Отсканируйте его в WhatsApp: **Настройки → Связанные устройства → Привязать устройство**.
**Ответ:**
```json
{
  "qr": "data:image/png;base64,...",  // QR-код в формате data URL (если ещё не авторизован)
  "status": "WAITING_QR"              // Статус: WAITING_QR | CONNECTED | INITIALIZING | NOT_INITIALIZED
}
```

### GET `/whatsapp/channels/{id}/status`
Получить текущий статус WhatsApp клиента.
**Ответ:**
```json
{
  "status": "CONNECTED",
  "info": { ... }  // Информация о подключённом аккаунте (если доступна)
}
```

### POST `/whatsapp/channels/{id}/send`
Отправить сообщение через WhatsApp.
```json
{
  "phoneNumber": "79001234567@c.us",  // формат: countryCode+number@c.us
  "text": "Здравствуйте!"
}
```
**Ответ:**
```json
{ "success": true, "messageId": "..." }
```

### POST `/whatsapp/channels/{id}/stop`
Остановить WhatsApp клиент для канала (отключить сессию).
```json
{ "success": true, "message": "Клиент остановлен" }
```

---

## Telegram (пользовательский аккаунт / QR) 🔒

Интеграция через **MTProto** (библиотека GramJS) — работает как обычный клиент Telegram, авторизация
по QR-коду (как «Войти по QR» в приложении). Требует `apiId` и `apiHash`, полученных на
[my.telegram.org](https://my.telegram.org). Канал создаётся с типом `TELEGRAM` и конфигом
`{ "mode": "userbot", "apiId": 1234567, "apiHash": "..." }`.

### POST `/telegram-user/channels/{id}/initialize`
Инициализировать Telegram-клиент. Если валидная сессия уже сохранена — восстанавливает её,
иначе запускает QR-логин.
**Ответ:**
```json
{ "success": true, "message": "Клиент инициализируется. Используйте /qr для получения QR-кода." }
```

### GET `/telegram-user/channels/{id}/qr`
Получить QR-код. Отсканируйте его в Telegram: **Настройки → Устройства → Подключить устройство**.
**Ответ:**
```json
{
  "qr": "data:image/png;base64,...",  // QR-код в формате data URL (если ещё не авторизован)
  "status": "WAITING_QR"              // WAITING_QR | CONNECTED | INITIALIZING | NEEDS_PASSWORD | ERROR | NOT_INITIALIZED
}
```

### GET `/telegram-user/channels/{id}/status`
Получить текущий статус клиента.
**Ответ:**
```json
{
  "status": "CONNECTED",
  "info": { "id": "123456789", "username": "user", "phone": "79001234567", "firstName": "Имя" }
}
```

### POST `/telegram-user/channels/{id}/password`
Передать пароль двухфакторной аутентификации (2FA), если он запрошен при авторизации (статус `NEEDS_PASSWORD`).
```json
{ "password": "my-2fa-password" }
```
**Ответ:**
```json
{ "success": true, "message": "Пароль принят, продолжаем авторизацию" }
```

### POST `/telegram-user/channels/{id}/send`
Отправить сообщение через пользовательский аккаунт.
```json
{
  "peer": "@username",          // @username, +79001234567, числовой ID или "me"
  "text": "Здравствуйте!"
}
```
**Ответ:**
```json
{ "success": true, "messageId": 12345 }
```

### POST `/telegram-user/channels/{id}/stop`
Остановить клиент (отключить сессию).
```json
{ "success": true, "message": "Клиент остановлен" }
```

---

## Веб-формы

### POST `/webforms/{channelId}/submit`
Публичный эндпоинт приёма заявки с сайта (без авторизации).
```json
{
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "phone": "+7 999 123-45-67",
  "message": "Хочу узнать о ваших услугах"
}
```

---

## Сообщения 🔒

### GET `/messages?channelId=&page=1&limit=50`
История сообщений с фильтрацией и пагинацией.
**Ответ:**
```json
{ "items": [ ... ], "total": 120, "page": 1, "limit": 50, "totalPages": 3 }
```

### GET `/messages/stats`
Сводная статистика для дашборда.
```json
{ "totalMessages": 120, "totalChannels": 3, "activeChannels": 2, "totalWebhooks": 1, "byChannel": [ ... ] }
```

---

## Вебхуки 🔒

### GET `/webhooks`
Список вебхуков.

### POST `/webhooks`
Создать вебхук.
```json
{
  "name": "Интеграция с n8n",
  "url": "https://n8n.example.com/webhook/abc",
  "secret": "my-secret",
  "events": ["message.received"]
}
```

### GET `/webhooks/{id}` · PATCH `/webhooks/{id}` · DELETE `/webhooks/{id}`
Получить / обновить / удалить вебхук.

**Формат доставки вебхука** (POST на ваш `url`):
```json
{
  "event": "message.received",
  "data": { "id": "...", "channelId": "...", "text": "...", "senderName": "...", "createdAt": "..." },
  "timestamp": "2026-06-29T12:00:00.000Z"
}
```
Если задан `secret`, добавляется заголовок `X-Webhook-Signature` — HMAC-SHA256 от тела запроса.

---

## Настройки 🔒

### GET `/settings` · GET `/settings/{key}` · PUT `/settings/{key}`
Чтение и сохранение глобальных настроек (ключ-значение).

🔒 — требуется авторизация (JWT).
