import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Сервис хранения глобальных настроек системы (ключ-значение)
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.setting.findMany();
  }

  async get(key: string) {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    return setting?.value ?? null;
  }

  // Создать или обновить настройку
  set(key: string, value: any) {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}
