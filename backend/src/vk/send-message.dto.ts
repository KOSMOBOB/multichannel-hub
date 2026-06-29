import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class SendVKMessageDto {
  @ApiProperty({
    description: 'VK user ID',
    example: 123456789,
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: 'Message text',
    example: 'Hello from Multichannel Hub!',
  })
  @IsString()
  text: string;
}
