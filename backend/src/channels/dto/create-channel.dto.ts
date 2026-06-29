import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { ChannelType } from '@prisma/client';

export class CreateChannelDto {
  @ApiProperty({ example: 'Поддержка в Telegram' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ChannelType, example: ChannelType.TELEGRAM })
  @IsEnum(ChannelType)
  type: ChannelType;

  @ApiProperty({
    required: false,
    description: 'Конфигурация канала. Для Telegram: { "token": "<токен бота>" }',
    example: { token: '123456:ABC-DEF...' },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
