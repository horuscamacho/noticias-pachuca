import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExternalUrlDocument = ExternalUrl & Document;

/**
 * 🔗 Schema para URLs externas detectadas en posts de Facebook
 * Persiste las URLs encontradas para seguimiento y configuración
 */
@Schema({
  timestamps: true,
  collection: 'external_urls'
})
export class ExternalUrl {
  @Prop({ required: true, trim: true })
  url: string;

  @Prop({ required: true, trim: true })
  domain: string;

  @Prop({ required: true, trim: true })
  facebookPostId: string;

  @Prop({ required: false, trim: true })
  pageId?: string;

  @Prop({ required: false, trim: true })
  postUrl?: string;

  @Prop({ required: true, default: Date.now })
  detectedAt: Date;

  @Prop({ required: true, default: false })
  hasConfig: boolean;

  @Prop({ required: false, trim: true })
  configId?: string;

  @Prop({
    enum: ['pending', 'extracted', 'failed', 'skipped'],
    default: 'pending'
  })
  extractionStatus?: 'pending' | 'extracted' | 'failed' | 'skipped';

  @Prop({ required: false })
  lastAttemptAt?: Date;

  @Prop({ required: false })
  extractionAttempts?: number;

  @Prop({ required: false })
  lastError?: string;
}

export const ExternalUrlSchema = SchemaFactory.createForClass(ExternalUrl);

// Índices para optimizar consultas
ExternalUrlSchema.index({ url: 1 }, { unique: true });
ExternalUrlSchema.index({ domain: 1 });
ExternalUrlSchema.index({ facebookPostId: 1 });
ExternalUrlSchema.index({ pageId: 1 });
ExternalUrlSchema.index({ hasConfig: 1 });
ExternalUrlSchema.index({ extractionStatus: 1 });
ExternalUrlSchema.index({ detectedAt: -1 });