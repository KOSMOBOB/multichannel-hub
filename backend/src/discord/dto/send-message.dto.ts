import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendDiscordMessageDto {
  @ApiProperty({ description: 'Discord channel ID (получить из Discord: ПКМ → Copy ID)', example: '123456789012345678' })
  @IsString()
  @IsNotEmpty()
  discordChannelId: string;

  @ApiProperty({ description: 'Текст сообщения', example: 'Hello from omnichannel hub!' })
  @IsString()
  @IsNotEmpty()
  text: string;
}
