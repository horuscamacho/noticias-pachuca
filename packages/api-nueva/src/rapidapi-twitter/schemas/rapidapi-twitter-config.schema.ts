import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RapidAPITwitterConfigDocument = RapidAPITwitterConfig & Document;

@Schema({ timestamps: true })
export class RapidAPITwitterConfig {
  @Prop({ required: true, trim: true })
  name: string; // "Twitter Config Primary"

  @Prop({ required: true, trim: true, default: 'twitter241.p.rapidapi.com' })
  host: string;

  @Prop({ required: true, trim: true })
  apiKey: string; // "1c2783bfb6msh69f13f0ff956d42p1be769jsn56ace9497881"

  @Prop({ required: true, trim: true, default: 'https://twitter241.p.rapidapi.com' })
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

export const RapidAPITwitterConfigSchema = SchemaFactory.createForClass(RapidAPITwitterConfig);