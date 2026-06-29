import { Body, Controller, Patch, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class UpdateProfileDto {
  @ApiProperty({ required: false, example: 'Администратор' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, example: 'ru', description: 'ru | en | es' })
  @IsOptional()
  @IsString()
  language?: string;
}

class ChangePasswordDto {
  @ApiProperty({ example: 'admin123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'newSecurePassword' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

@ApiTags('Профиль')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('me')
  @ApiOperation({ summary: 'Обновить профиль текущего пользователя' })
  updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Сменить пароль' })
  changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.userId, dto.currentPassword, dto.newPassword);
  }
}
