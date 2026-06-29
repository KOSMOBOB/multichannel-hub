import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

// Сервис управления каналами связи (Telegram, веб-формы и пр.)
@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateChannelDto) {
    return this.prisma.channel.create({
      data: {
        name: dto.name,
        type: dto.type,
        config: dto.config ?? {},
        isActive: dto.isActive ?? true,
      },
    });
  }

  findAll() {
    return this.prisma.channel.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    });
  }

  async findOne(id: string) {
    const channel = await this.prisma.channel.findUnique({ where: { id } });
    if (!channel) throw new NotFoundException('Канал не найден');
    return channel;
  }

  // Найти Telegram-канал по токену бота (для маршрутизации входящих вебхуков)
  findTelegramByToken(token: string) {
    return this.prisma.channel.findFirst({
      where: { type: 'TELEGRAM', config: { path: ['token'], equals: token } },
    });
  }

  // Сохранить/обновить config канала, объединяя с существующими значениями.
  // Используется, например, для сохранения строки сессии Telegram (userbot) после QR-логина.
  async mergeConfig(id: string, patch: Record<string, any>) {
    const channel = await this.findOne(id);
    const currentConfig = (channel.config as Record<string, any>) ?? {};
    return this.prisma.channel.update({
      where: { id },
      data: { config: { ...currentConfig, ...patch } },
    });
  }

  async update(id: string, dto: UpdateChannelDto) {
    await this.findOne(id);
    return this.prisma.channel.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.channel.delete({ where: { id } });
    return { success: true };
  }
}
