import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RapidAPIConfigDocument = RapidAPIConfig & Document;

@Schema({ timestamps: true })
export class RapidAPIConfig {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  host: string;

  @Prop({ required: true, trim: true })
  apiKey: string;

  @Prop({ required: true, trim: true })
  baseUrl: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object, default: {} })
  currentUsage: {
    requestsToday: number;
    requestsThisMonth: number;
    lastResetDate: Date;
    lastRequestDate?: Date;
    remainingDailyRequests: number;
    remainingMonthlyRequests: number;
  };

  @Prop({ type: Object, required: true })
  quotaLimits: {
    requestsPerHour: number;
    requestsPerDay: number;
    requestsPerMonth: number;
  };
}

export const RapidAPIConfigSchema = SchemaFactory.createForClass(RapidAPIConfig);