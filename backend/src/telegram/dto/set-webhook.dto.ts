import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class SetWebhookDto {
  @ApiProperty({
    example: 'https://your-domain.com',
    description: 'Публичный базовый URL шлюза (Telegram должен иметь к нему доступ)',
  })
  @IsUrl({ require_tld: false })
  publicUrl: string;
}
