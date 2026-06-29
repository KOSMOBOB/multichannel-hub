import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DiscordService } from './discord.service';
import { SendDiscordMessageDto } from './dto/send-message.dto';

@ApiTags('Discord')
@Controller('discord')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DiscordController {
  constructor(private readonly discord: DiscordService) {}

  @Post('channels/:id/initialize')
  @ApiOperation({ summary: 'Инициализировать Discord-бота для канала' })
  async initialize(@Param('id') channelId: string) {
    await this.discord.initializeBot(channelId);
    return { success: true, message: 'Discord bot initialized' };
  }

  @Post('channels/:id/stop')
  @ApiOperation({ summary: 'Остановить Discord-бота' })
  async stop(@Param('id') channelId: string) {
    await this.discord.stopClient(channelId);
    return { success: true, message: 'Discord bot stopped' };
  }

  @Get('channels/:id/status')
  @ApiOperation({ summary: 'Получить статус Discord-бота' })
  async status(@Param('id') channelId: string) {
    const status = this.discord.getStatus(channelId);
    return { status };
  }

  @Post('channels/:id/send')
  @ApiOperation({ summary: 'Отправить сообщение в Discord-канал' })
  async send(@Param('id') channelId: string, @Body() dto: SendDiscordMessageDto) {
    return this.discord.sendMessage(channelId, dto.discordChannelId, dto.text);
  }
}
