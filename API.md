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
