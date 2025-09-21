import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RapidAPIExtractionLogDocument = RapidAPIExtractionLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class RapidAPIExtractionLog {
  @Prop({ type: Types.ObjectId, ref: 'RapidAPIFacebookPage', required: true })
  pageId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RapidAPIConfig', required: true })
  configId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  endpoint: string;

  @Prop({ type: Object, required: true })
  requestParams: Record<string, any>;

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
  rawRequest: Record<string, any>;

  @Prop({ type: Object })
  rawResponse: Record<string, any>;

  @Prop({ type: Object })
  error?: {
    message: string;
    code: string;
    details: Record<string, any>;
  };
}

export const RapidAPIExtractionLogSchema = SchemaFactory.createForClass(RapidAPIExtractionLog);