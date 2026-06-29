import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

// DTO для передачи пароля двухфакторной аутентификации (2FA) Telegram,
// если аккаунт защищён облачным паролем
export class SubmitPasswordDto {
  @ApiProperty({ example: 'my-2fa-password', description: 'Облачный пароль (2FA) аккаунта Telegram' })
  @IsString()
  password: string;
}
