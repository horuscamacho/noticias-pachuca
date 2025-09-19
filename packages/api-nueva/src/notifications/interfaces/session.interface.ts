import { Types } from 'mongoose';
import { Platform, AppState } from '../schemas/user-session.schema';

export interface SessionData {
  userId: string | Types.ObjectId;
  deviceId: string;
  platform: Platform;
  socketId?: string;
  isActive: boolean;
  appState: AppState;
  expoPushToken?: string;
  deviceInfo?: DeviceInfo;
  lastSeen: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface DeviceInfo {
  os?: string;
  version?: string;
  model?: string;
  brand?: string;
}

export interface AuthInfo {
  isValid: boolean;
  userId?: string;
  platform?: Platform;
  deviceId?: string;
  deviceInfo?: DeviceInfo;
  expoPushToken?: string;
}
