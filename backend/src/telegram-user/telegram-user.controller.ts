import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TelegramUserService } from './telegram-user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { SubmitPasswordDto } from './dto/submit-password.dto';

// Контроллер интеграции Telegram через пользовательский аккаунт (MTProto, QR-логин)
@ApiTags('Telegram (User / QR)')
@Controller('telegram-user')
export class TelegramUserController {
  constructor(private readonly telegramUserService: TelegramUserService) {}

  @Post('channels/:id/initialize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Инициализировать Telegram-клиент (QR) для канала' })
  async initializeClient(@Param('id') id: string) {
    await this.telegramUserService.initializeClient(id);
    return { success: true, message: 'Клиент инициализируется. Используйте /qr для получения QR-кода.' };
  }

  @Get('channels/:id/qr')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить QR-код для авторизации Telegram-канала',
    description:
      'Отсканируйте QR-код в приложении Telegram: Настройки → Устройства → Подключить устройство → Сканировать QR-код',
  })
  async getQrCode(@Param('id') id: string) {
    return this.telegramUserService.getQrCode(id);
  }

  @Get('channels/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить статус Telegram-клиента (QR) для канала' })
  async getStatus(@Param('id') id: string) {
    return this.telegramUserService.getStatus(id);
  }

  @Post('channels/:id/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Передать пароль 2FA, если он запрошен при авторизации' })
  async submitPassword(@Param('id') id: string, @Body() dto: SubmitPasswordDto) {
    return this.telegramUserService.submitPassword(id, dto.password);
  }

  @Post('channels/:id/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отправить сообщение через пользовательский Telegram-аккаунт' })
  async sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.telegramUserService.sendMessage(id, dto.peer, dto.text);
  }

  @Post('channels/:id/stop')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Остановить Telegram-клиент (QR) для канала' })
  async stopClient(@Param('id') id: string) {
    await this.telegramUserService.stopClient(id);
    return { success: true, message: 'Клиент остановлен' };
  }
}
