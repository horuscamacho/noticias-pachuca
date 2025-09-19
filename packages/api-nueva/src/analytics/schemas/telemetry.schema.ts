import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EventType, Platform } from '../types/analytics.types';

export type TelemetryDocument = Telemetry & Document;

@Schema({
  timestamps: true,
  collection: 'telemetry',
})
export class Telemetry {
  @Prop({ required: true, index: true })
  sessionId: string;

  @Prop({ required: true, index: true })
  deviceId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  userId?: Types.ObjectId;

  @Prop({ required: true, enum: EventType, index: true })
  eventType: EventType;

  @Prop({ required: true, type: Object })
  data: Record<string, any>;

  @Prop({
    required: true,
    type: {
      appVersion: { type: String, required: true },
      buildNumber: { type: String, required: true },
      platform: { type: String, enum: Platform, required: true },
      osVersion: { type: String, required: true },
      locale: { type: String, default: 'es-MX' },
      timezone: { type: String, default: 'America/Mexico_City' },
    },
  })
  metadata: {
    appVersion: string;
    buildNumber: string;
    platform: Platform;
    osVersion: string;
    locale: string;
    timezone: string;
  };

  @Prop({ default: Date.now, index: true })
  timestamp: Date;

  // Timestamps automáticos de Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const TelemetrySchema = SchemaFactory.createForClass(Telemetry);

// Índices para performance
TelemetrySchema.index({ sessionId: 1, timestamp: -1 });
TelemetrySchema.index({ deviceId: 1, eventType: 1, timestamp: -1 });
TelemetrySchema.index({ userId: 1, timestamp: -1 }, { sparse: true });
TelemetrySchema.index({ 'metadata.platform': 1, timestamp: -1 });
TelemetrySchema.index({ eventType: 1, timestamp: -1 });

// TTL index: Auto-delete después de 30 días
TelemetrySchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
