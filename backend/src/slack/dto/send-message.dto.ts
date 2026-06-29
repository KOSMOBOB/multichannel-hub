import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendSlackMessageDto {
  @ApiProperty({ description: 'Slack channel ID (например, C1234567890) или имя канала (#general)', example: 'C1234567890' })
  @IsString()
  @IsNotEmpty()
  slackChannelId: string;

  @ApiProperty({ description: 'Текст сообщения', example: 'Hello from omnichannel hub!' })
  @IsString()
  @IsNotEmpty()
  text: string;
}
