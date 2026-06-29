import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

// Сервис управления пользователями: поиск, обновление профиля, смена пароля
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  // Обновление профиля (имя, язык интерфейса)
  async updateProfile(id: string, data: { name?: string; language?: string }) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      language: user.language,
    };
  }

  // Смена пароля с проверкой текущего
  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.findById(id);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw new BadRequestException('Текущий пароль указан неверно');
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { password: hash } });
    return { success: true, message: 'Пароль успешно изменён' };
  }
}
