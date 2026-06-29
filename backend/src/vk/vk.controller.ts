import { Controller, Post, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { VKService } from './vk.service';
import { SendVKMessageDto } from './send-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('VK')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vk')
export class VKController {
  constructor(private vkService: VKService) {}

  @Post('channels/:id/initialize')
  @ApiOperation({ summary: 'Initialize VK client for channel' })
  @ApiResponse({ status: 200, description: 'VK client initialized successfully' })
  async initialize(@Param('id') channelId: string) {
    return this.vkService.initialize(channelId);
  }

  @Delete('channels/:id/stop')
  @ApiOperation({ summary: 'Stop VK client for channel' })
  @ApiResponse({ status: 200, description: 'VK client stopped successfully' })
  async stop(@Param('id') channelId: string) {
    await this.vkService.stopClient(channelId);
    return { status: 'DISCONNECTED', message: 'VK client stopped' };
  }

  @Get('channels/:id/status')
  @ApiOperation({ summary: 'Get VK client status for channel' })
  @ApiResponse({ status: 200, description: 'Returns VK client status' })
  async getStatus(@Param('id') channelId: string) {
    return this.vkService.getStatus(channelId);
  }

  @Post('channels/:id/send')
  @ApiOperation({ summary: 'Send message via VK' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  async sendMessage(
    @Param('id') channelId: string,
    @Body() dto: SendVKMessageDto,
  ) {
    return this.vkService.sendMessage(channelId, dto.userId, dto.text);
  }
}
