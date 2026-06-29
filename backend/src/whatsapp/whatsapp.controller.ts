import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('channels/:id/initialize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Инициализировать WhatsApp клиент для канала' })
  async initializeClient(@Param('id') id: string) {
    await this.whatsappService.initializeClient(id);
    return { success: true, message: 'Клиент инициализируется. Используйте /qr для получения QR-кода.' };
  }

  @Get('channels/:id/qr')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Получить QR-код для авторизации WhatsApp канала',
    description: 'Отсканируйте QR-код в приложении WhatsApp: Настройки → Связанные устройства → Привязать устройство'
  })
  async getQrCode(@Param('id') id: string) {
    return this.whatsappService.getQrCode(id);
  }

  @Get('channels/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить статус WhatsApp клиента для канала' })
  async getStatus(@Param('id') id: string) {
    return this.whatsappService.getStatus(id);
  }

  @Post('channels/:id/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отправить сообщение через WhatsApp' })
  async sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.whatsappService.sendMessage(id, dto.phoneNumber, dto.text);
  }

  @Post('channels/:id/stop')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Остановить WhatsApp клиент для канала' })
  async stopClient(@Param('id') id: string) {
    await this.whatsappService.stopClient(id);
    return { success: true, message: 'Клиент остановлен' };
  }
}
