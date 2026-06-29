import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Каналы')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать канал (например, подключить Telegram-бота)' })
  create(@Body() dto: CreateChannelDto) {
    return this.channelsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список каналов' })
  findAll() {
    return this.channelsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить канал по ID' })
  findOne(@Param('id') id: string) {
    return this.channelsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить канал' })
  update(@Param('id') id: string, @Body() dto: UpdateChannelDto) {
    return this.channelsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить канал' })
  remove(@Param('id') id: string) {
    return this.channelsService.remove(id);
  }
}
