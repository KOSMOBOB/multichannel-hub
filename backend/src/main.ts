import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Глобальный префикс для всех REST-эндпоинтов
  app.setGlobalPrefix('api');

  // Включаем CORS для админ-панели
  app.enableCors({
    origin: (process.env.CORS_ORIGIN || '*').split(','),
    credentials: true,
  });

  // Глобальная валидация DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger-документация
  const config = new DocumentBuilder()
    .setTitle('Multichannel Hub API')
    .setDescription('REST API омниканального шлюза: каналы, сообщения, вебхуки, авторизация')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Backend запущен на порту ${port}. Swagger: /api/docs`);
}
bootstrap();
