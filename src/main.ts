import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import helmet from 'helmet';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1. MUST BE FIRST: Cookie Parser
  app.use(cookieParser());

  // 2. MUST BE SECOND: CORS (Allows Vite to connect and send cookies)
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Frontend URLs
    credentials: true, 
  });

  // 3. SECURITY: Helmet
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // Required to allow frontend to load images!
  }));

  // 4. SECURITY: Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 5. API Prefix
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1', 
  });

  // 6. Start Server
  const PORT = configService.get<number>('PORT') || 3001;
  await app.listen(PORT);
  
  console.log(`🚀 Ruh Musafir Security Watchdog is awake on: http://localhost:${PORT}/api/v1`);
}
bootstrap();