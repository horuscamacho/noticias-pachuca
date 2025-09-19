import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import {
  Platform,
  PlatformInfo,
  AuthRequest,
} from '../interfaces/auth.interface';

@Injectable()
export class PlatformDetectionService {
  private readonly mobileUserAgents = [
    'react-native',
    'expo',
    'flutter',
    'ionic',
    'cordova',
    'mobile-app',
  ];

  private readonly mobilePatterns = [
    /android/i,
    /iphone/i,
    /ipad/i,
    /mobile/i,
    /expo/i,
    /react-native/i,
  ];

  detectPlatform(request: Request | AuthRequest): PlatformInfo {
    const userAgent = request.headers['user-agent'] || '';
    const platformHeader = request.headers['x-platform'] as Platform;

    // 1. Header explícito (más confiable)
    if (platformHeader && this.isValidPlatform(platformHeader)) {
      return {
        type: platformHeader,
        userAgent,
        isNative: platformHeader === 'mobile',
        deviceInfo: this.extractDeviceInfo(request),
      };
    }

    // 2. User-Agent detection
    const detectedType = this.detectFromUserAgent(userAgent);

    return {
      type: detectedType,
      userAgent,
      isNative: detectedType === 'mobile',
      deviceInfo: this.extractDeviceInfo(request),
    };
  }

  private detectFromUserAgent(userAgent: string): Platform {
    const lowerUA = userAgent.toLowerCase();

    // Verificar patterns específicos de apps nativas
    for (const agent of this.mobileUserAgents) {
      if (lowerUA.includes(agent)) {
        return 'mobile';
      }
    }

    // Verificar patterns de mobile
    for (const pattern of this.mobilePatterns) {
      if (pattern.test(userAgent)) {
        return 'mobile';
      }
    }

    // API clients
    if (
      lowerUA.includes('postman') ||
      lowerUA.includes('insomnia') ||
      lowerUA.includes('curl')
    ) {
      return 'api';
    }

    // Default a web
    return 'web';
  }

  private extractDeviceInfo(
    request: Request | AuthRequest,
  ): PlatformInfo['deviceInfo'] {
    const deviceHeader = request.headers['x-device-info'] as string;
    const osHeader = request.headers['x-device-os'] as string;
    const versionHeader = request.headers['x-device-version'] as string;

    if (deviceHeader) {
      try {
        return JSON.parse(deviceHeader);
      } catch {
        // Continuar con headers individuales
      }
    }

    return {
      os: osHeader,
      version: versionHeader,
      model: request.headers['x-device-model'] as string,
    };
  }

  private isValidPlatform(platform: string): platform is Platform {
    return ['web', 'mobile', 'api', 'unknown'].includes(platform);
  }

  // Métodos helper
  isMobile(platformInfo: PlatformInfo): boolean {
    return platformInfo.type === 'mobile' || platformInfo.isNative;
  }

  isWeb(platformInfo: PlatformInfo): boolean {
    return platformInfo.type === 'web';
  }

  isAPI(platformInfo: PlatformInfo): boolean {
    return platformInfo.type === 'api';
  }

  shouldUseCookies(platformInfo: PlatformInfo): boolean {
    return this.isWeb(platformInfo);
  }

  shouldUseTokens(platformInfo: PlatformInfo): boolean {
    return this.isMobile(platformInfo) || this.isAPI(platformInfo);
  }
}
