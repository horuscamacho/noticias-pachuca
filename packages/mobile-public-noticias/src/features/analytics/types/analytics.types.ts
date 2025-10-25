export interface TelemetryEvent {
  sessionId: string;
  deviceId: string;
  userId?: string;
  eventType: EventType;
  data: Record<string, unknown>;
  metadata: {
    appVersion: string;
    buildNumber: string;
    platform: 'ios' | 'android' | 'web';
    osVersion: string;
    locale: string;
    timezone: string;
  };
  timestamp?: Date;
}

export interface DeviceSessionData {
  sessionId: string;
  deviceId: string;
  userId?: string;
  deviceInfo: {
    brand: string;
    model: string;
    osName: string;
    osVersion: string;
    appVersion: string;
    buildNumber: string;
    platform: 'ios' | 'android' | 'web';
    locale: string;
    timezone: string;
    screenWidth: number;
    screenHeight: number;
    screenScale: number;
    isTablet: boolean;
  };
  networkInfo: {
    connectionType: 'none' | 'wifi' | 'cellular' | 'ethernet' | 'unknown';
    carrierName?: string;
    isConnected: boolean;
    isWifiEnabled: boolean;
    isCellularEnabled: boolean;
  };
  performanceMetrics: {
    appStartTime: number;
    memoryUsage: number;
    batteryLevel: number;
    isLowPowerMode: boolean;
    availableStorage: number;
    totalStorage: number;
  };
  appState: {
    isFirstLaunch: boolean;
    launchCount: number;
    installationId: string;
    lastActiveDate: Date;
    referralSource?: string;
  };
  contextInfo: {
    orientation: 'portrait' | 'landscape';
    isDarkMode: boolean;
    isScreenReaderEnabled: boolean;
    isReduceMotionEnabled: boolean;
  };
}

export enum EventType {
  APP_START = 'app_start',
  SCREEN_VIEW = 'screen_view',
  USER_ACTION = 'user_action',
  PERFORMANCE = 'performance',
  ERROR = 'error',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
}

export interface BatchTelemetryRequest {
  events: TelemetryEvent[];
}

export interface AnalyticsConfig {
  apiBaseUrl: string;
  batchSize: number;
  flushInterval: number; // ms
  enableDebugLogging: boolean;
  autoTrackScreenViews: boolean;
  autoTrackAppState: boolean;
}