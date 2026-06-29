# Dockerfile для backend (NestJS)
FROM node:20-alpine

WORKDIR /app

# Устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем исходники и генерируем Prisma-клиент
COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 4000

# Применяем миграции, заполняем БД и запускаем сервер
CMD ["sh", "-c", "npx prisma migrate deploy && npx ts-node prisma/seed.ts && node dist/main"]
