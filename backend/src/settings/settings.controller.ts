import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Настройки')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Все настройки системы' })
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Получить настройку по ключу' })
  get(@Param('key') key: string) {
    return this.settingsService.get(key);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Сохранить настройку по ключу' })
  set(@Param('key') key: string, @Body('value') value: any) {
    return this.settingsService.set(key, value);
  }
}
