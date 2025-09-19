import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  IsDate,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { EventType, Platform, ConnectionType } from '../types/analytics.types';

export class MetadataDto {
  @IsNotEmpty()
  @IsString()
  appVersion: string;

  @IsNotEmpty()
  @IsString()
  buildNumber: string;

  @IsEnum(Platform)
  platform: Platform;

  @IsNotEmpty()
  @IsString()
  osVersion: string;

  @IsOptional()
  @IsString()
  locale: string = 'es-MX';

  @IsOptional()
  @IsString()
  timezone: string = 'America/Mexico_City';
}

export class TelemetryEventDto {
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @IsNotEmpty()
  @IsString()
  deviceId: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsEnum(EventType)
  eventType: EventType;

  @IsObject()
  data: Record<string, any>;

  @ValidateNested()
  @Type(() => MetadataDto)
  metadata: MetadataDto;

  @IsOptional()
  @Type(() => Date)
  @Transform(({ value }) => (value ? new Date(value) : new Date()))
  timestamp: Date = new Date();
}

export class BatchTelemetryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TelemetryEventDto)
  events: TelemetryEventDto[];
}

// Device Info DTO
export class DeviceInfoDto {
  @IsNotEmpty()
  @IsString()
  brand: string;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsNotEmpty()
  @IsString()
  osName: string;

  @IsNotEmpty()
  @IsString()
  osVersion: string;

  @IsNotEmpty()
  @IsString()
  appVersion: string;

  @IsNotEmpty()
  @IsString()
  buildNumber: string;

  @IsEnum(Platform)
  platform: Platform;

  @IsOptional()
  @IsString()
  locale: string = 'es-MX';

  @IsOptional()
  @IsString()
  timezone: string = 'America/Mexico_City';

  @IsNumber()
  screenWidth: number;

  @IsNumber()
  screenHeight: number;

  @IsOptional()
  @IsNumber()
  screenScale: number = 1;

  @IsOptional()
  @IsBoolean()
  isTablet: boolean = false;
}

// Network Info DTO
export class NetworkInfoDto {
  @IsOptional()
  @IsEnum(ConnectionType)
  connectionType: ConnectionType = ConnectionType.UNKNOWN;

  @IsOptional()
  @IsString()
  carrierName?: string;

  @IsOptional()
  @IsBoolean()
  isConnected: boolean = true;

  @IsOptional()
  @IsBoolean()
  isWifiEnabled: boolean = false;

  @IsOptional()
  @IsBoolean()
  isCellularEnabled: boolean = false;
}

// Performance Metrics DTO
export class PerformanceMetricsDto {
  @IsOptional()
  @IsNumber()
  appStartTime: number = 0;

  @IsOptional()
  @IsNumber()
  memoryUsage: number = 0;

  @IsOptional()
  @IsNumber()
  batteryLevel: number = 100;

  @IsOptional()
  @IsBoolean()
  isLowPowerMode: boolean = false;

  @IsOptional()
  @IsNumber()
  availableStorage: number = 0;

  @IsOptional()
  @IsNumber()
  totalStorage: number = 0;
}

// App State DTO
export class AppStateDto {
  @IsOptional()
  @IsBoolean()
  isFirstLaunch: boolean = false;

  @IsOptional()
  @IsNumber()
  launchCount: number = 1;

  @IsNotEmpty()
  @IsString()
  installationId: string;

  @IsOptional()
  @Type(() => Date)
  @Transform(({ value }) => (value ? new Date(value) : new Date()))
  lastActiveDate: Date = new Date();

  @IsOptional()
  @IsString()
  referralSource?: string;
}

// Context Info DTO
export class ContextInfoDto {
  @IsOptional()
  @IsString()
  orientation: 'portrait' | 'landscape' = 'portrait';

  @IsOptional()
  @IsBoolean()
  isDarkMode: boolean = false;

  @IsOptional()
  @IsBoolean()
  isScreenReaderEnabled: boolean = false;

  @IsOptional()
  @IsBoolean()
  isReduceMotionEnabled: boolean = false;
}

// Device Session DTO
export class DeviceSessionDto {
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @IsNotEmpty()
  @IsString()
  deviceId: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NetworkInfoDto)
  networkInfo: NetworkInfoDto = new NetworkInfoDto();

  @IsOptional()
  @ValidateNested()
  @Type(() => PerformanceMetricsDto)
  performanceMetrics: PerformanceMetricsDto = new PerformanceMetricsDto();

  @ValidateNested()
  @Type(() => AppStateDto)
  appState: AppStateDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContextInfoDto)
  contextInfo: ContextInfoDto = new ContextInfoDto();
}
