import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SlackService } from './slack.service';
import { SendSlackMessageDto } from './dto/send-message.dto';

@ApiTags('Slack')
@Controller('slack')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SlackController {
  constructor(private readonly slack: SlackService) {}

  @Post('channels/:id/initialize')
  @ApiOperation({ summary: 'Инициализировать Slack-бота для канала' })
  async initialize(@Param('id') channelId: string) {
    await this.slack.initializeBot(channelId);
    return { success: true, message: 'Slack bot initialized' };
  }

  @Post('channels/:id/stop')
  @ApiOperation({ summary: 'Остановить Slack-бота' })
  async stop(@Param('id') channelId: string) {
    await this.slack.stopApp(channelId);
    return { success: true, message: 'Slack bot stopped' };
  }

  @Get('channels/:id/status')
  @ApiOperation({ summary: 'Получить статус Slack-бота' })
  async status(@Param('id') channelId: string) {
    const status = this.slack.getStatus(channelId);
    return { status };
  }

  @Post('channels/:id/send')
  @ApiOperation({ summary: 'Отправить сообщение в Slack-канал' })
  async send(@Param('id') channelId: string, @Body() dto: SendSlackMessageDto) {
    return this.slack.sendMessage(channelId, dto.slackChannelId, dto.text);
  }
}
