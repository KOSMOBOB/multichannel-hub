import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

// DTO отправки сообщения через пользовательский Telegram-аккаунт (MTProto)
export class SendMessageDto {
  @ApiProperty({
    example: '@username',
    description:
      'Получатель: @username, номер телефона (+79001234567), числовой ID пользователя/чата или "me" (избранное)',
  })
  @IsString()
  peer: string;

  @ApiProperty({ example: 'Здравствуйте! Чем можем помочь?' })
  @IsString()
  text: string;
}
