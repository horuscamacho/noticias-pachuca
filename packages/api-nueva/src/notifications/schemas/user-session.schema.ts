import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserSessionDocument = UserSession & Document;

export enum Platform {
  WEB = 'web',
  MOBILE = 'mobile',
  API = 'api',
}

export enum AppState {
  FOREGROUND = 'foreground',
  BACKGROUND = 'background',
}

@Schema({
  timestamps: true,
  collection: 'user_sessions',
  toJSON: {
    transform: (doc: Document, ret: Record<string, unknown>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class UserSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  deviceId: string;

  @Prop({ type: String, enum: Platform, required: true })
  platform: Platform;

  @Prop()
  socketId?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, enum: AppState, default: AppState.FOREGROUND })
  appState: AppState;

  @Prop()
  expoPushToken?: string;

  @Prop({
    type: {
      os: String,
      version: String,
      model: String,
      brand: String,
    },
  })
  deviceInfo?: {
    os?: string;
    version?: string;
    model?: string;
    brand?: string;
  };

  @Prop({ required: true })
  lastSeen: Date;

  @Prop()
  userAgent?: string;

  @Prop()
  ipAddress?: string;

  // TTL - Auto-delete después de 24 horas de inactividad
  @Prop({ default: Date.now, expires: 86400 })
  expiresAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);

// Índices únicos y performance
UserSessionSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
UserSessionSchema.index({ userId: 1, isActive: 1 });
UserSessionSchema.index({ platform: 1, isActive: 1 });
UserSessionSchema.index({ expoPushToken: 1 });
UserSessionSchema.index({ lastSeen: -1 });
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
