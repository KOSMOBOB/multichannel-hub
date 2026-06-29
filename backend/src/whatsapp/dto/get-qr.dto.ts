import { ApiProperty } from '@nestjs/swagger';

export class GetQrResponseDto {
  @ApiProperty({ description: 'QR-код в формате data URL для отображения в браузере' })
  qr: string;

  @ApiProperty({ description: 'Статус сессии WhatsApp' })
  status: string;
}
