import { Request } from 'express';
import { Session, SessionData as ExpressSessionData } from 'express-session';

export interface TokenPayload {
  sub: string;
  username: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  platform: string;
  deviceId?: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

export interface RefreshTokenPayload {
  sub: string;
  username: string;
  platform: string;
  deviceId?: string;
  tokenFamily: string;
  version: number;
}

export interface ResetTokenPayload {
  sub: string;
  email: string;
  type: 'password-reset' | 'email-verification';
  oneTimeUse: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresIn: number;
  sessionId?: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  payload?: TokenPayload | RefreshTokenPayload | ResetTokenPayload;
  error?: string;
  needsRefresh?: boolean;
}

export type Platform = 'web' | 'mobile' | 'api' | 'unknown';

export interface PlatformInfo {
  type: Platform;
  userAgent: string;
  isNative: boolean;
  deviceInfo?: {
    os?: string;
    version?: string;
    model?: string;
  };
}

export interface RefreshTokenMetadata {
  family: string;
  platform: string;
  deviceId?: string;
  createdAt: Date;
  lastUsed?: Date;
}

export interface LoginRecord {
  platform: string;
  deviceId?: string;
  userAgent?: string;
  ip?: string;
  loginTime: Date;
}

export interface LogoutRecord {
  platform: string;
  logoutTime: Date;
}

// Interface para tipado de Request de Express con session
export interface AuthRequest extends Omit<Request, 'session'> {
  user?: AuthenticatedUser;
  tokenPayload?: TokenPayload;
  platformInfo?: PlatformInfo;
  session?: {
    userId?: string;
    username?: string;
    platform?: string;
    destroy?: () => void;
    [key: string]: unknown;
  };
}

export interface AuthenticatedUser {
  userId: string;
  username: string;
  email?: string;
  roles: string[];
  permissions: string[];
  platform: string;
  deviceId?: string;
  sessionId?: string;
}

export interface SessionData {
  userId: string;
  username: string;
  platform: string;
  deviceInfo?: {
    os?: string;
    version?: string;
    model?: string;
  };
  lastActivity: Date;
  createdAt: Date;
}
