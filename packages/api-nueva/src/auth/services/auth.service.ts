import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { compare, hash } from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User, UserDocument } from '../../schemas/user.schema';
import { TokenManagerService } from './token-manager.service';
import { RedisAuthService } from './redis-auth.service';
import { PlatformDetectionService } from './platform-detection.service';
import {
  TokenResponse,
  AuthRequest,
  RefreshTokenPayload,
} from '../interfaces/auth.interface';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import {
  UserRegisteredEvent,
  EmailConfirmationRequestedEvent,
  PasswordResetRequestedEvent,
  PasswordChangedEvent,
} from '../../modules/mail/events/mail.events';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly tokenManager: TokenManagerService,
    private readonly redisAuth: RedisAuthService,
    private readonly platformDetection: PlatformDetectionService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // 🔐 LOGIN
  async login(
    loginDto: LoginDto,
    request: AuthRequest,
  ): Promise<TokenResponse> {
    const { email, username, password, deviceId } = loginDto;
    const platformInfo = this.platformDetection.detectPlatform(request);

    // Buscar usuario por email o username
    const identifier = email || username;

    if (!identifier) {
      throw new UnauthorizedException('Email or username is required');
    }

    const user = await this.findUserByEmailOrUsername(identifier);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verificar password
    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verificar si la cuenta está activa
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Actualizar información de login
    const userId = (user._id as Types.ObjectId).toString();
    await this.updateLoginInfo(
      userId,
      request.ip || '',
      request.headers['user-agent'] || '',
    );

    // Generar tokens
    const tokenResponse = await this.tokenManager.generateTokenResponse(
      userId,
      user.username,
      platformInfo,
      true, // Include refresh token
    );

    // Guardar información de login en Redis
    await this.redisAuth.recordLogin(userId, {
      platform: platformInfo.type,
      deviceId,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      loginTime: new Date(),
    });

    // Para web, también crear sesión si es necesario
    if (platformInfo.type === 'web' && request.session) {
      request.session.userId = userId;
      request.session.username = user.username;
      request.session.platform = platformInfo.type;
    }

    return tokenResponse;
  }

  // 👤 REGISTER
  async register(
    registerDto: RegisterDto,
    request: AuthRequest,
  ): Promise<TokenResponse> {
    const { email, username, password, firstName, lastName } = registerDto;
    const platformInfo = this.platformDetection.detectPlatform(request);

    // Verificar si el usuario ya existe
    const existingUser = await this.findUserByEmailOrUsername(email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Crear usuario
    const newUser = await this.userModel.create({
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      isActive: true,
      emailVerified: false,
      loginCount: 0,
      deletedAt: null,
    });

    // Generar tokens
    const userId = (newUser._id as Types.ObjectId).toString();
    const tokenResponse = await this.tokenManager.generateTokenResponse(
      userId,
      newUser.username,
      platformInfo,
      true,
    );

    // Generar token de verificación de email
    const verificationToken = await this.tokenManager.generateResetToken(
      userId,
      newUser.email,
      'email-verification',
    );

    // Emitir eventos para envío de emails
    this.eventEmitter.emit(
      'user.registered',
      new UserRegisteredEvent({
        id: userId,
        name: `${newUser.firstName} ${newUser.lastName}`.trim(),
        email: newUser.email,
      }),
    );

    this.eventEmitter.emit(
      'email.confirmation.requested',
      new EmailConfirmationRequestedEvent(
        {
          name: `${newUser.firstName} ${newUser.lastName}`.trim(),
          email: newUser.email,
        },
        verificationToken,
      ),
    );

    return tokenResponse;
  }

  // 🔄 REFRESH TOKEN
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
    request: AuthRequest,
  ): Promise<TokenResponse> {
    const { refresh_token: refreshToken } = refreshTokenDto;
    const tokenPreview = refreshToken ? refreshToken.substring(0, 30) + '...' : 'null';
    const platformInfo = this.platformDetection.detectPlatform(request);

    console.log('🔄 [AuthService] Refresh token request:', {
      tokenPreview,
      platform: platformInfo.type,
      deviceId: request.headers['x-device-id'],
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    // Validar refresh token
    const validation =
      await this.tokenManager.validateRefreshToken(refreshToken);
    if (!validation.isValid || !validation.payload) {
      console.error('❌ [AuthService] Token validation failed:', {
        tokenPreview,
        error: validation.error,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshPayload = validation.payload as RefreshTokenPayload;
    const { sub: userId, username } = refreshPayload;

    console.log('🔄 [AuthService] Token validated, checking user:', {
      userId,
      username,
      tokenFamily: refreshPayload.tokenFamily,
      version: refreshPayload.version,
    });

    // Verificar que el usuario aún existe y está activo
    const user = await this.userModel.findById(userId);
    if (!user || !user.isActive) {
      console.error('❌ [AuthService] User not found or disabled:', {
        userId,
        userExists: !!user,
        isActive: user?.isActive,
      });
      throw new UnauthorizedException('User not found or disabled');
    }

    console.log('🔄 [AuthService] User verified, rotating token...');

    // Rotar refresh token (token rotation security)
    const newRefreshToken =
      await this.tokenManager.rotateRefreshToken(refreshToken);

    console.log('🔄 [AuthService] Token rotated, generating access token...');

    // Generar nuevo access token
    const accessToken = await this.tokenManager.generateAccessToken(
      userId,
      username,
      platformInfo,
    );

    const response: TokenResponse = {
      accessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer' as const,
      expiresIn: this.tokenManager['getAccessTokenTTL'](),
    };

    console.log('✅ [AuthService] Refresh token successful:', {
      userId,
      username,
      tokenFamily: refreshPayload.tokenFamily,
      accessTokenPreview: accessToken.substring(0, 30) + '...',
      newRefreshTokenPreview: newRefreshToken.substring(0, 30) + '...',
    });

    return response;
  }

  // 🚪 LOGOUT
  async logout(
    token: string,
    userId: string,
    request: AuthRequest,
  ): Promise<void> {
    const platformInfo = this.platformDetection.detectPlatform(request);

    // Blacklist access token
    await this.tokenManager.blacklistToken(token);

    // Invalidar refresh tokens del usuario en esta plataforma
    await this.tokenManager.revokeUserTokensByPlatform(
      userId,
      platformInfo.type,
    );

    // Limpiar sesión si es web
    if (
      platformInfo.type === 'web' &&
      request.session &&
      request.session.destroy
    ) {
      request.session.destroy();
    }

    // Registrar logout en Redis
    await this.redisAuth.recordLogout(userId, {
      platform: platformInfo.type,
      logoutTime: new Date(),
    });
  }

  // 🚪 LOGOUT ALL DEVICES
  async logoutAllDevices(userId: string): Promise<void> {
    // Revocar todos los tokens del usuario
    await this.tokenManager.revokeAllUserTokens(userId);

    // Limpiar todas las sesiones
    await this.redisAuth.clearAllUserSessions(userId);
  }

  // 🔑 RESET PASSWORD
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      // No revelar si el email existe o no por seguridad
      return;
    }

    // Generar token de reset
    const resetToken = await this.tokenManager.generateResetToken(
      (user._id as Types.ObjectId).toString(),
      user.email,
      'password-reset',
    );

    // Emitir evento para envío de email de reset
    this.eventEmitter.emit(
      'password.reset.requested',
      new PasswordResetRequestedEvent(
        {
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
        },
        resetToken,
      ),
    );
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    // Validar token de reset
    const validation = await this.tokenManager.validateResetToken(token);
    if (!validation.isValid || !validation.payload) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const { sub: userId } = validation.payload;

    // Marcar token como usado
    await this.tokenManager.markResetTokenAsUsed(token);

    // Hash nueva password
    const hashedPassword = await this.hashPassword(newPassword);

    // Actualizar password en la base de datos
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });

    // Revocar todos los tokens existentes por seguridad
    await this.tokenManager.revokeAllUserTokens(userId);
  }

  // 🔒 VERIFICAR EMAIL
  async verifyEmail(token: string): Promise<void> {
    const validation = await this.tokenManager.validateResetToken(token);
    if (!validation.isValid || !validation.payload) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    const { sub: userId } = validation.payload;

    // Marcar token como usado
    await this.tokenManager.markResetTokenAsUsed(token);

    // Marcar email como verificado
    await this.userModel.findByIdAndUpdate(userId, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  }

  // 🔐 CAMBIAR PASSWORD (usuario autenticado)
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId).select('+password');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verificar password actual
    const isCurrentPasswordValid = await compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash nueva password
    const hashedPassword = await this.hashPassword(newPassword);

    // Actualizar password
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });

    // Emitir evento para notificación de cambio de contraseña
    this.eventEmitter.emit(
      'password.changed',
      new PasswordChangedEvent({
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
      }),
    );

    // Revocar todos los tokens excepto el actual para forzar re-login en otros dispositivos
    await this.tokenManager.revokeAllUserTokens(userId);
  }

  // 👤 OBTENER PERFIL DE USUARIO
  async getUserProfile(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  // 🛠️ UTILITY METHODS
  private async hashPassword(password: string): Promise<string> {
    const rounds = this.configService.get<number>(
      'config.auth.bcryptRounds',
      12,
    );
    return hash(password, rounds);
  }

  private async findUserByEmailOrUsername(
    emailOrUsername: string,
  ): Promise<UserDocument | null> {
    return await this.userModel
      .findOne({
        $or: [
          { email: emailOrUsername.toLowerCase() },
          { username: emailOrUsername },
        ],
      })
      .select('+password');
  }

  private async updateLoginInfo(
    userId: string,
    ip: string,
    userAgent: string,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $inc: { loginCount: 1 },
      $set: {
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
        lastLoginIP: ip,
        lastLoginUserAgent: userAgent,
      },
    });
  }
}
