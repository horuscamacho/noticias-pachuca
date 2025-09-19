// Shared utilities for Noticias Pachuca workspace

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'editor' | 'author';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  published: boolean;
  publishedAt?: Date;
  authorId: string;
  categories: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Telemetry types
export enum EventType {
  APP_START = 'app_start',
  SCREEN_VIEW = 'screen_view',
  USER_ACTION = 'user_action',
  PERFORMANCE = 'performance',
  ERROR = 'error',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
}

export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
}

export enum ConnectionType {
  WIFI = 'wifi',
  CELLULAR = 'cellular',
  ETHERNET = 'ethernet',
  UNKNOWN = 'unknown',
}

export interface DeviceInfo {
  brand: string;
  model: string;
  osName: string;
  osVersion: string;
  appVersion: string;
  buildNumber: string;
  platform: Platform;
  locale: string;
  timezone: string;
  screenWidth: number;
  screenHeight: number;
  screenScale: number;
  isTablet: boolean;
}

export interface NetworkInfo {
  connectionType: ConnectionType;
  carrierName?: string;
  isConnected: boolean;
  isWifiEnabled: boolean;
  isCellularEnabled: boolean;
}

export interface PerformanceMetrics {
  appStartTime: number; // ms
  memoryUsage: number; // MB
  batteryLevel: number; // 0-100%
  isLowPowerMode: boolean;
  availableStorage: number; // MB
  totalStorage: number; // MB
}

export interface AppState {
  isFirstLaunch: boolean;
  launchCount: number;
  installationId: string;
  lastActiveDate: Date;
  referralSource?: string;
}

export interface ContextInfo {
  orientation: 'portrait' | 'landscape';
  isDarkMode: boolean;
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
}

export interface TelemetryEvent {
  sessionId: string;
  deviceId: string;
  userId?: string;
  eventType: EventType;
  data: Record<string, any>;
  metadata: {
    appVersion: string;
    buildNumber: string;
    platform: Platform;
    osVersion: string;
    locale: string;
    timezone: string;
  };
  timestamp: Date;
}

export interface DeviceSession {
  sessionId: string;
  deviceId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  deviceInfo: DeviceInfo;
  networkInfo: NetworkInfo;
  performanceMetrics: PerformanceMetrics;
  appState: AppState;
  contextInfo: ContextInfo;
}

// Utility functions
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Mexico_City'
  }).format(date);
};

export { z } from 'zod';
export { format, parseISO } from 'date-fns';