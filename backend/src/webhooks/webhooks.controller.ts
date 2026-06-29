import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Вебхуки')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @ApiOperation({ summary: 'Создать вебхук' })
  create(@Body() dto: CreateWebhookDto) {
    return this.webhooksService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список вебхуков' })
  findAll() {
    return this.webhooksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить вебхук по ID' })
  findOne(@Param('id') id: string) {
    return this.webhooksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить вебхук' })
  update(@Param('id') id: string, @Body() dto: UpdateWebhookDto) {
    return this.webhooksService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить вебхук' })
  remove(@Param('id') id: string) {
    return this.webhooksService.remove(id);
  }
}
