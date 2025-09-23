import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Schemas
import { User, UserSchema } from '../schemas/user.schema';

// Services
import { AuthService } from './services/auth.service';
import { TokenManagerService } from './services/token-manager.service';
import { PlatformDetectionService } from './services/platform-detection.service';
import { RedisAuthService } from './services/redis-auth.service';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';

// Controllers
import { AuthController } from './controllers/auth.controller';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Global() // 🔥 Global para reutilizar en cualquier módulo
@Module({
  imports: [
    // Configuración de Mongoose para User
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),

    // JWT Configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('config.auth.jwtAccessSecret'),
        signOptions: {
          expiresIn: configService.get<string>('config.auth.jwtAccessExpires'),
          issuer: 'noticias-pachuca-api',
          audience: 'noticias-pachuca-users',
        },
      }),
      inject: [ConfigService],
    }),

    // Passport Configuration
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false, // Solo para JWT, sessions manejadas por separado
    }),

    // Event Emitter para envío de emails
    EventEmitterModule.forRoot(),
  ],

  providers: [
    // Core Services
    AuthService,
    TokenManagerService,
    PlatformDetectionService,
    RedisAuthService,

    // Strategies
    JwtStrategy,
    RefreshJwtStrategy,

    // Guards
    JwtAuthGuard,
  ],

  controllers: [AuthController],

  exports: [
    AuthService,
    TokenManagerService,
    PlatformDetectionService,
    RedisAuthService,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
