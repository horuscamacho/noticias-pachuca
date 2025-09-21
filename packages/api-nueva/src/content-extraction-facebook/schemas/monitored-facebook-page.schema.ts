import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MonitoredFacebookPageDocument = MonitoredFacebookPage & Document;

export interface FacebookExtractionConfig {
  maxPosts: number;
  frequency: 'manual' | 'daily' | 'weekly';
  fields: string[];
}

@Schema({
  timestamps: true,
  collection: 'monitored_facebook_pages'
})
export class MonitoredFacebookPage {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  })
  pageId: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  })
  pageName: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  })
  category: string;

  @Prop({
    type: Boolean,
    required: true,
    default: true,
    index: true
  })
  isActive: boolean;

  @Prop({
    type: Date,
    default: null
  })
  lastExtraction: Date;

  @Prop({
    type: Number,
    required: true,
    default: 0,
    min: 0
  })
  totalExtractions: number;

  @Prop({
    type: {
      maxPosts: {
        type: Number,
        required: true,
        default: 50,
        min: 1,
        max: 100
      },
      frequency: {
        type: String,
        required: true,
        enum: ['manual', 'daily', 'weekly'],
        default: 'manual'
      },
      fields: {
        type: [String],
        required: true,
        default: ['message', 'created_time', 'likes', 'shares', 'comments']
      }
    },
    required: true,
    _id: false
  })
  extractionConfig: FacebookExtractionConfig;

  createdAt: Date;
  updatedAt: Date;
}

export const MonitoredFacebookPageSchema = SchemaFactory.createForClass(MonitoredFacebookPage);

// Índices adicionales para optimización
MonitoredFacebookPageSchema.index({ pageId: 1 }, { unique: true });
MonitoredFacebookPageSchema.index({ isActive: 1, category: 1 });
MonitoredFacebookPageSchema.index({ lastExtraction: -1 });
MonitoredFacebookPageSchema.index({ createdAt: -1 });

// Método para verificar si necesita extracción
MonitoredFacebookPageSchema.methods.needsExtraction = function(): boolean {
  if (!this.isActive) return false;
  if (this.extractionConfig.frequency === 'manual') return false;

  if (!this.lastExtraction) return true;

  const now = new Date();
  const diffHours = (now.getTime() - this.lastExtraction.getTime()) / (1000 * 60 * 60);

  switch (this.extractionConfig.frequency) {
    case 'daily':
      return diffHours >= 24;
    case 'weekly':
      return diffHours >= 168; // 24 * 7
    default:
      return false;
  }
};

// Método para actualizar estadísticas de extracción
MonitoredFacebookPageSchema.methods.updateExtractionStats = function(): void {
  this.lastExtraction = new Date();
  this.totalExtractions += 1;
};