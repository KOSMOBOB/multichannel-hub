import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({ example: 'Интеграция с n8n' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://n8n.example.com/webhook/abc' })
  @IsUrl({ require_tld: false })
  url: string;

  @ApiProperty({ required: false, description: 'Секрет для подписи HMAC' })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiProperty({
    required: false,
    example: ['message.received'],
    description: 'События: message.received',
  })
  @IsOptional()
  @IsArray()
  events?: string[];

  @ApiProperty({ required: false, description: 'Дополнительные HTTP-заголовки' })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
