# Примеры интеграций

Multichannel Hub отправляет события (например, `message.received`) на ваши вебхуки. Это позволяет
связать шлюз с любыми системами автоматизации и CRM. Ниже — готовые примеры.

## Формат события

На указанный URL приходит `POST`-запрос:

```json
{
  "event": "message.received",
  "data": {
    "id": "uuid",
    "channelId": "uuid",
    "direction": "INBOUND",
    "senderName": "Иван Иванов",
    "senderId": "123456789",
    "text": "Текст обращения",
    "payload": { "...": "исходные данные канала" },
    "createdAt": "2026-06-29T12:00:00.000Z"
  },
  "timestamp": "2026-06-29T12:00:00.000Z"
}
```

Заголовки:
- `Content-Type: application/json`
- `X-Webhook-Event: message.received`
- `X-Webhook-Signature: <HMAC-SHA256>` — если для вебхука задан `secret`.

### Проверка подписи (Node.js)

```js
const crypto = require('crypto');

function verify(rawBody, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
```

---

## n8n

1. Добавьте узел **Webhook** (метод `POST`), скопируйте его Production URL.
2. В админ-панели: **Вебхуки → Добавить вебхук**, вставьте URL, при желании задайте секрет.
3. Постройте сценарий: например, узел **Webhook → Set → CRM/Email/Telegram**.

Пример доступа к полям в n8n:
```
{{ $json.body.data.text }}
{{ $json.body.data.senderName }}
```

---

## Make (Integromat)

1. Создайте сценарий, добавьте триггер **Webhooks → Custom webhook**, получите адрес.
2. Вставьте адрес в **Вебхуки** админ-панели.
3. Отправьте тестовое сообщение в Telegram-бота, чтобы Make «определил структуру данных».
4. Далее добавляйте модули (Google Sheets, CRM, Email и т.д.), используя поля из `data`.

---

## Bitrix24

Вариант А — через открытую линию / входящий вебхук CRM:

1. В Bitrix24: **Разработчикам → Другое → Входящий вебхук**, выдайте право `crm`.
2. Получите URL вида `https://<portal>.bitrix24.ru/rest/<user>/<token>/`.
3. Чаще всего удобнее принять событие промежуточным сервисом (n8n/Make) и вызвать метод
   `crm.lead.add`. Пример тела запроса к Bitrix24:

```json
{
  "fields": {
    "TITLE": "Обращение из Multichannel Hub",
    "NAME": "Иван Иванов",
    "COMMENTS": "Текст обращения",
    "SOURCE_ID": "WEB"
  }
}
```

Вариант Б — прямой вызов: укажите в качестве URL вебхука эндпоинт вашего обработчика,
который преобразует событие в вызов `crm.lead.add`.

---

## Zapier

1. Создайте Zap с триггером **Webhooks by Zapier → Catch Hook**.
2. Скопируйте URL и добавьте его в **Вебхуки** админ-панели.
3. Настройте действие (Action) в нужный сервис, используя поля `data.text`, `data.senderName` и др.

---

## Приём заявок с веб-формы сайта

Создайте канал типа **Web Form** и отправляйте заявки на публичный эндпоинт:

```html
<form id="lead-form">
  <input name="name" placeholder="Имя" />
  <input name="email" placeholder="Email" />
  <input name="phone" placeholder="Телефон" />
  <textarea name="message" placeholder="Сообщение"></textarea>
  <button type="submit">Отправить</button>
</form>

<script>
  const CHANNEL_ID = 'ВАШ_CHANNEL_ID';
  document.getElementById('lead-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    await fetch(`https://your-domain.com/api/webforms/${CHANNEL_ID}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    alert('Заявка отправлена!');
  });
</script>
```

Заявка попадёт в историю сообщений и будет переслана во все активные вебхуки.

---

## Интеграция WhatsApp через API

WhatsApp работает через библиотеку **whatsapp-web.js** — неофициальный бесплатный API.
Авторизация происходит через QR-код (как при подключении связанного устройства).

### 1. Создание и авторизация канала

```bash
# Создать канал WhatsApp
POST /api/channels
{
  "name": "WhatsApp Support",
  "type": "WHATSAPP",
  "config": {}
}
# Ответ: { "id": "channel-uuid-123", ... }

# Инициализировать клиент
POST /api/whatsapp/channels/channel-uuid-123/initialize

# Получить QR-код для сканирования
GET /api/whatsapp/channels/channel-uuid-123/qr
# Ответ: { "qr": "data:image/png;base64,...", "status": "WAITING_QR" }
```

Отсканируйте QR-код в приложении WhatsApp:
**Настройки → Связанные устройства → Привязать устройство**.

### 2. Проверка статуса подключения

```bash
GET /api/whatsapp/channels/channel-uuid-123/status
# Ответ: { "status": "CONNECTED", "info": { ... } }
```

### 3. Отправка сообщений

```bash
POST /api/whatsapp/channels/channel-uuid-123/send
{
  "phoneNumber": "79001234567@c.us",
  "text": "Здравствуйте! Спасибо за обращение."
}
```

**Формат номера:** `[countryCode][number]@c.us` (например, `79001234567@c.us` для России).

### 4. Приём входящих сообщений

Входящие сообщения из WhatsApp автоматически:
- Сохраняются в базу данных (таблица `messages`)
- Доступны в API `/api/messages`
- Отправляются на все активные вебхуки с событием `message.received`

Пример вебхука:
```json
{
  "event": "message.received",
  "timestamp": "2026-06-29T12:00:00Z",
  "data": {
    "id": "msg-uuid",
    "channelId": "channel-uuid-123",
    "channelType": "WHATSAPP",
    "direction": "INBOUND",
    "senderId": "79001234567@c.us",
    "senderName": "Иван Иванов",
    "text": "Привет! Как дела?",
    "payload": { ... }
  }
}
```

### 5. Автоматизация через n8n / Make

**n8n пример:**
1. Webhook Trigger → получение событий `message.received` от Multichannel Hub
2. Switch Node → фильтрация по `data.channelType === 'WHATSAPP'`
3. HTTP Request → отправка ответа через `/api/whatsapp/channels/{id}/send`

**Make пример:**
1. Custom Webhook → подписка на события Multichannel Hub
2. Router → фильтр по типу канала
3. HTTP Module → отправка сообщения в WhatsApp через API

> ⚠️ **Важно:** Сессии WhatsApp сохраняются в папке `whatsapp-sessions/`. При использовании Docker
> рекомендуется монтировать эту папку как volume, чтобы не терять авторизацию при перезапуске контейнера.

---

## Интеграция Telegram (QR / пользовательский аккаунт) через API

Режим работает через **MTProto** (библиотека GramJS) — это полноценный клиент Telegram с авторизацией
по QR-коду, без регистрации бота. Подходит, когда нужно вести переписку от лица реального аккаунта.

### 1. Получение API ID / API Hash

Каждый пользователь получает свои ключи на [my.telegram.org](https://my.telegram.org) →
**API development tools**. Эти `api_id` и `api_hash` указываются в настройках канала
(каждый пользователь настраивает под свой аккаунт).

### 2. Создание канала и авторизация

```bash
# Создать канал (тип TELEGRAM, режим userbot)
POST /api/channels
{
  "name": "Telegram QR Support",
  "type": "TELEGRAM",
  "config": { "mode": "userbot", "apiId": 1234567, "apiHash": "0123456789abcdef0123456789abcdef" }
}

# Инициализировать клиент
POST /api/telegram-user/channels/{channelId}/initialize

# Получить QR-код (data URL PNG)
GET /api/telegram-user/channels/{channelId}/qr
```

Отсканируйте QR-код в Telegram: **Настройки → Устройства → Подключить устройство**.
Если включён облачный пароль (2FA), передайте его:

```bash
POST /api/telegram-user/channels/{channelId}/password
{ "password": "my-2fa-password" }
```

### 3. Отправка сообщений

```bash
POST /api/telegram-user/channels/{channelId}/send
{
  "peer": "@username",
  "text": "Здравствуйте! Чем можем помочь?"
}
```

### 4. Приём входящих сообщений

Входящие сообщения автоматически сохраняются в БД и отправляются на вебхуки с событием
`message.received`. Структура полностью совпадает с другими каналами (`channelType: "TELEGRAM"`).

### 5. Автоматизация через n8n / Make

1. Webhook Trigger → получение событий `message.received`
2. Фильтр по `data.channelType === 'TELEGRAM'`
3. HTTP Request → ответ через `/api/telegram-user/channels/{id}/send`

> ⚠️ **Важно:** Строка сессии сохраняется в БД (`config.session` канала) — авторизация переживает
> перезапуск. Автоматизация пользовательского аккаунта формально нарушает ToS Telegram: избегайте
> массовых рассылок и спама, иначе аккаунт может быть заблокирован.

---

## Добавление новых каналов (для разработчиков)

Архитектура модульная. Чтобы добавить канал (например, VK или MAX):

1. Добавьте значение в enum `ChannelType` в `backend/prisma/schema.prisma` и создайте миграцию.
2. Создайте новый модуль в `backend/src/<channel>/` по образцу `telegram/` или `whatsapp/`.
3. Реализуйте приём входящих сообщений через `MessagesService.createInbound(...)` —
   это автоматически запустит доставку в вебхуки.
4. При необходимости добавьте тип канала в форму создания на фронтенде
   (`frontend/src/app/(panel)/channels/page.tsx`).

Подробнее см. [`AGENTS.md`](./AGENTS.md) — руководство для разработчиков и AI-агентов.
