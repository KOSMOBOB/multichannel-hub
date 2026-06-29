import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { SetWebhookDto } from './dto/set-webhook.dto';

@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  // Публичный эндпоинт приёма апдейтов от Telegram (без авторизации, токен в URL)
  @Post('webhook/:token')
  @ApiOperation({ summary: 'Приём апдейтов от Telegram (вызывается серверами Telegram)' })
  handleUpdate(@Param('token') token: string, @Body() update: any) {
    return this.telegramService.handleUpdate(token, update);
  }

  @Post('channels/:id/set-webhook')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Установить вебхук Telegram для канала' })
  setWebhook(@Param('id') id: string, @Body() dto: SetWebhookDto) {
    return this.telegramService.setWebhook(id, dto.publicUrl);
  }

  @Post('channels/:id/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отправить сообщение через Telegram-бота' })
  sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.telegramService.sendMessage(id, dto.chatId, dto.text);
  }
}
