// main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS nếu frontend khác port
  app.enableCors();

  // ✅ Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ các fields không khai báo trong DTO
      forbidNonWhitelisted: true, // Throw error nếu có field không hợp lệ
      transform: true, // Tự động convert types
    }),
  );

  await app.listen(3000);
  console.log('🚀 Server running on http://localhost:3000');
}
bootstrap();
