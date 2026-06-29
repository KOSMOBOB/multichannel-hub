# Docker-конфигурации

Эта папка содержит вспомогательные материалы по контейнеризации проекта.

Основные Dockerfile расположены рядом с кодом сервисов:

- `../backend/Dockerfile` — образ backend (NestJS). Применяет миграции Prisma, заполняет БД администратором по умолчанию и запускает API.
- `../frontend/Dockerfile` — образ frontend (Next.js, standalone-сборка).

Оркестрация всех сервисов описана в корневом файле `../docker-compose.yml`:

| Сервис    | Образ / сборка        | Порт  | Назначение                     |
|-----------|-----------------------|-------|--------------------------------|
| postgres  | postgres:16-alpine    | 5432  | База данных                    |
| redis     | redis:7-alpine        | 6379  | Очереди сообщений (BullMQ)      |
| backend   | ./backend             | 4000  | REST API + Swagger (`/api/docs`) |
| frontend  | ./frontend            | 3000  | Админ-панель                   |

## Запуск

```bash
cp .env.example .env
docker compose up -d --build
```

После запуска:
- Админ-панель: http://localhost:3000
- API + Swagger: http://localhost:4000/api/docs
- Логин по умолчанию: `admin@admin.com` / `admin123`
