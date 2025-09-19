import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Platform, ConnectionType } from '../types/analytics.types';

export type DeviceSessionDocument = DeviceSession & Document;

@Schema({
  timestamps: true,
  collection: 'device_sessions',
})
export class DeviceSession {
  @Prop({ required: true, unique: true, index: true })
  sessionId: string;

  @Prop({ required: true, index: true })
  deviceId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  userId?: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  startTime: Date;

  @Prop({ default: null })
  endTime?: Date;

  @Prop({ default: true, index: true })
  isActive: boolean;

  // Device Information
  @Prop({
    required: true,
    type: {
      brand: { type: String, required: true },
      model: { type: String, required: true },
      osName: { type: String, required: true },
      osVersion: { type: String, required: true },
      appVersion: { type: String, required: true },
      buildNumber: { type: String, required: true },
      platform: { type: String, enum: Platform, required: true },
      locale: { type: String, default: 'es-MX' },
      timezone: { type: String, default: 'America/Mexico_City' },
      screenWidth: { type: Number, required: true },
      screenHeight: { type: Number, required: true },
      screenScale: { type: Number, default: 1 },
      isTablet: { type: Boolean, default: false },
    },
  })
  deviceInfo: {
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
  };

  // Network Information
  @Prop({
    type: {
      connectionType: {
        type: String,
        enum: ConnectionType,
        default: ConnectionType.UNKNOWN,
      },
      carrierName: { type: String, default: null },
      isConnected: { type: Boolean, default: true },
      isWifiEnabled: { type: Boolean, default: false },
      isCellularEnabled: { type: Boolean, default: false },
    },
    default: {},
  })
  networkInfo: {
    connectionType: ConnectionType;
    carrierName?: string;
    isConnected: boolean;
    isWifiEnabled: boolean;
    isCellularEnabled: boolean;
  };

  // Performance Metrics
  @Prop({
    type: {
      appStartTime: { type: Number, default: 0 }, // ms
      memoryUsage: { type: Number, default: 0 }, // MB
      batteryLevel: { type: Number, default: 100 }, // 0-100%
      isLowPowerMode: { type: Boolean, default: false },
      availableStorage: { type: Number, default: 0 }, // MB
      totalStorage: { type: Number, default: 0 }, // MB
    },
    default: {},
  })
  performanceMetrics: {
    appStartTime: number;
    memoryUsage: number;
    batteryLevel: number;
    isLowPowerMode: boolean;
    availableStorage: number;
    totalStorage: number;
  };

  // App State
  @Prop({
    type: {
      isFirstLaunch: { type: Boolean, default: false },
      launchCount: { type: Number, default: 1 },
      installationId: { type: String, required: true },
      lastActiveDate: { type: Date, default: Date.now },
      referralSource: { type: String, default: null },
    },
    required: true,
  })
  appState: {
    isFirstLaunch: boolean;
    launchCount: number;
    installationId: string;
    lastActiveDate: Date;
    referralSource?: string;
  };

  // Context Info
  @Prop({
    type: {
      orientation: {
        type: String,
        enum: ['portrait', 'landscape'],
        default: 'portrait',
      },
      isDarkMode: { type: Boolean, default: false },
      isScreenReaderEnabled: { type: Boolean, default: false },
      isReduceMotionEnabled: { type: Boolean, default: false },
    },
    default: {},
  })
  contextInfo: {
    orientation: 'portrait' | 'landscape';
    isDarkMode: boolean;
    isScreenReaderEnabled: boolean;
    isReduceMotionEnabled: boolean;
  };

  // Timestamps automáticos de Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const DeviceSessionSchema = SchemaFactory.createForClass(DeviceSession);

// Índices para performance
DeviceSessionSchema.index({ deviceId: 1, startTime: -1 });
DeviceSessionSchema.index({ isActive: 1, startTime: -1 });
DeviceSessionSchema.index({ 'deviceInfo.platform': 1, startTime: -1 });
DeviceSessionSchema.index({ 'appState.installationId': 1 });
DeviceSessionSchema.index({ endTime: -1 }, { sparse: true });

// TTL index: Auto-delete después de 7 días para sessions
DeviceSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });
