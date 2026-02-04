import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ CORS - frontend URL baad me add karenge
  app.enableCors({
    origin: [
      'http://localhost:5173',
      process.env.FRONTEND_URL || 'http://localhost:5173', // ✅ Dynamic
    ],
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // ✅ Important: 0.0.0.0
  console.log(`🚀 Server running on port ${port}`);
}
bootstrap();
