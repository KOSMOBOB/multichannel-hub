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

## Добавление новых каналов (для разработчиков)

Архитектура модульная. Чтобы добавить канал (например, WhatsApp или VK):

1. Добавьте значение в enum `ChannelType` в `backend/prisma/schema.prisma` и создайте миграцию.
2. Создайте новый модуль в `backend/src/<channel>/` по образцу `telegram/`.
3. Реализуйте приём входящих сообщений через `MessagesService.createInbound(...)` —
   это автоматически запустит доставку в вебхуки.
4. При необходимости добавьте тип канала в форму создания на фронтенде
   (`frontend/src/app/(panel)/channels/page.tsx`).
