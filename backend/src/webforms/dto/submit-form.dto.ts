import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

// Поля заявки с веб-формы. Все поля опциональны для гибкости интеграции.
export class SubmitFormDto {
  @ApiProperty({ required: false, example: 'Иван Иванов' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, example: 'ivan@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: '+7 999 123-45-67' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: 'Хочу узнать о ваших услугах' })
  @IsOptional()
  @IsString()
  message?: string;
}
