import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: '79001234567@c.us', description: 'WhatsApp ID получателя (номер в формате countrycode+number@c.us)' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'Здравствуйте! Чем можем помочь?' })
  @IsString()
  text: string;
}
