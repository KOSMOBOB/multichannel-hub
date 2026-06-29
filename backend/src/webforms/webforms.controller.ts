import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WebformsService } from './webforms.service';
import { SubmitFormDto } from './dto/submit-form.dto';

@ApiTags('Веб-формы')
@Controller('webforms')
export class WebformsController {
  constructor(private readonly webformsService: WebformsService) {}

  // Публичный эндпоинт приёма заявок (вызывается с сайта клиента)
  @Post(':channelId/submit')
  @ApiOperation({ summary: 'Принять заявку с веб-формы (публичный эндпоинт)' })
  submit(@Param('channelId') channelId: string, @Body() dto: SubmitFormDto) {
    return this.webformsService.submit(channelId, dto);
  }
}
