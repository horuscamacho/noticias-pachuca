import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as express from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🌐 CONFIGURAR CORS
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://[::1]:3001'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Platform',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ]
  });

  // 🔒 CONFIGURAR HELMET PARA SEGURIDAD
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, // Para compatibilidad con Swagger
  }));

  // 🔥 MIDDLEWARE CRÍTICO PARA STRIPE WEBHOOKS
  // DEBE estar ANTES de session y validation pipes
  app.use('/api/payments/webhooks', express.raw({ type: 'application/json' }));

  // Configurar express-session para cookies web
  app.use(
    session({
      secret:
        process.env.SESSION_SECRET ||
        'noticias-pachuca-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      name: 'sessionId',
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        sameSite: 'lax',
      },
      rolling: true, // Renovar cookie en cada request
    }),
  );

  // Configuración global de validación
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configurar prefijo global PRIMERO
  app.setGlobalPrefix('api');

  // Configuración de Swagger (después del prefijo)
  const config = new DocumentBuilder()
    .setTitle('Template Universal API')
    .setDescription(
      'API base reutilizable con NestJS, MongoDB, Redis y autenticación completa',
    )
    .setVersion('1.0')
    .addTag('auth', 'Autenticación y gestión de usuarios')
    .addTag('users', 'Gestión de usuarios')
    .addBearerAuth()
    .addServer('http://[::1]:4000', 'Desarrollo Local (IPv6)')
    .addServer('http://localhost:4000', 'Desarrollo Local (IPv4)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 4000);

  const baseUrl = await app.getUrl();
  console.log(`🚀 Application is running on: ${baseUrl}/api`);
  console.log(`📚 Swagger documentation: ${baseUrl}/api/docs`);
}
bootstrap();
