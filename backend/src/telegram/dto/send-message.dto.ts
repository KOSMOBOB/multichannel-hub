import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: '123456789', description: 'chat_id получателя в Telegram' })
  @IsString()
  chatId: string;

  @ApiProperty({ example: 'Здравствуйте! Чем можем помочь?' })
  @IsString()
  text: string;
}
