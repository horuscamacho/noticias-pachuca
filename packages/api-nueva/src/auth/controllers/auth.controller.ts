import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RefreshJwtAuthGuard } from '../guards/refresh-jwt-auth.guard';

// DTOs
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

// Decorators
import { CurrentUser } from '../decorators/current-user.decorator';
import { Platform } from '../decorators/platform.decorator';
import { Public } from '../guards/jwt-auth.guard';

// Interfaces
import {
  AuthRequest,
  AuthenticatedUser,
  PlatformInfo,
} from '../interfaces/auth.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login with platform detection',
    description:
      'Authenticate user with email/username and password. Supports multi-platform detection.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        tokenType: 'Bearer',
        expiresIn: 900,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Req() request: AuthRequest) {
    return this.authService.login(loginDto, request);
  }

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'User registration',
    description: 'Create a new user account',
  })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({
    status: 400,
    description: 'User already exists or validation failed',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() request: AuthRequest,
  ) {
    return this.authService.register(registerDto, request);
  }

  @Public()
  @Post('refresh')
  @UseGuards(RefreshJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate new access token using refresh token',
  })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() request: AuthRequest,
  ) {
    return this.authService.refreshToken(refreshTokenDto, request);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from current device',
    description:
      'Invalidate current access token and refresh tokens for current platform',
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @CurrentUser('userId') userId: string,
    @Req() request: AuthRequest,
  ) {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Authorization token is required');
    }
    await this.authService.logout(token, userId, request);
    return { message: 'Logout successful' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Invalidate all tokens and sessions for the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout from all devices successful',
  })
  async logoutAll(@CurrentUser('userId') userId: string) {
    await this.authService.logoutAllDevices(userId);
    return { message: 'Logout from all devices successful' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset email to user',
  })
  @ApiResponse({ status: 200, description: 'Reset email sent if user exists' })
  async forgotPassword(@Body('email') email: string) {
    await this.authService.requestPasswordReset(email);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Reset user password using token from email',
  })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password reset successful' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email with token',
    description: 'Verify user email address using token from email',
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async verifyEmail(@Body('token') token: string) {
    await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Get authenticated user profile information',
  })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Platform() platform: PlatformInfo,
  ) {
    // Obtener datos completos del usuario desde la base de datos
    const fullUser = await this.authService.getUserProfile(user.userId);

    return {
      user: {
        userId: fullUser.id,
        username: fullUser.username,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        roles: user.roles,
        permissions: user.permissions,
        isActive: fullUser.isActive,
        emailVerified: fullUser.emailVerified,
        lastLoginAt: fullUser.lastLoginAt,
        createdAt: fullUser.createdAt,
        updatedAt: fullUser.updatedAt,
        platform: user.platform
      },
      platform,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password for authenticated user',
    description:
      'Change user password (requires current password verification)',
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const { currentPassword, newPassword } = changePasswordDto;
    await this.authService.changePassword(userId, currentPassword, newPassword);
    return { message: 'Password changed successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get detailed user profile',
    description: 'Get complete user profile from database',
  })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getUserProfile(@CurrentUser('userId') userId: string) {
    const profile = await this.authService.getUserProfile(userId);
    return profile;
  }
}
