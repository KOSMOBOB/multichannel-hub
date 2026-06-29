import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Гард для защиты эндпоинтов JWT-токеном
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
