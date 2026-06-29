import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Скрипт начального заполнения БД.
// Создаёт администратора по умолчанию: admin@admin.com / admin123
const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@admin.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Пользователь ${email} уже существует — пропускаем.`);
  } else {
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hash,
        name: 'Администратор',
        role: 'ADMIN',
        language: 'ru',
      },
    });
    console.log(`Создан администратор по умолчанию: ${email} / ${password}`);
  }

  // Базовые настройки системы
  await prisma.setting.upsert({
    where: { key: 'system' },
    update: {},
    create: {
      key: 'system',
      value: { initialized: true, defaultLanguage: 'ru' },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
