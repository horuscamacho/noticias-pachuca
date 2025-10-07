import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RapidAPITwitterExtractionLogDocument = RapidAPITwitterExtractionLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class RapidAPITwitterExtractionLog {
  @Prop({ type: Types.ObjectId, ref: 'RapidAPITwitterUser', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RapidAPITwitterConfig', required: true })
  configId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  endpoint: string;

  @Prop({ type: Object, required: true })
  requestParams: Record<string, string | number | boolean>;

  @Prop({ enum: ['success', 'error', 'partial'], required: true })
  status: 'success' | 'error' | 'partial';

  @Prop({ required: true })
  httpStatusCode: number;

  @Prop({ required: true })
  responseTime: number;

  @Prop({ default: 0 })
  itemsExtracted: number;

  @Prop({ default: 1 })
  totalApiCreditsUsed: number;

  @Prop({ type: Object })
  rawRequest: Record<string, string | number | boolean>;

  @Prop({ type: Object })
  rawResponse: Record<string, unknown>;

  @Prop({ type: Object })
  error?: {
    message: string;
    code: string;
    details: Record<string, unknown>;
  };
}

export const RapidAPITwitterExtractionLogSchema = SchemaFactory.createForClass(RapidAPITwitterExtractionLog);