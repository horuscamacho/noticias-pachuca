import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FacebookExtractionJobDocument = FacebookExtractionJob & Document;

export type ExtractionStatus = 'pending' | 'running' | 'completed' | 'failed';
export type ExtractionType = 'manual' | 'scheduled';

export interface JobMetadata {
  requestedBy: string;
  extractionType: ExtractionType;
  filters?: Record<string, unknown>;
  estimatedDuration?: number;
  priority?: 'low' | 'normal' | 'high';
}

@Schema({
  timestamps: true,
  collection: 'facebook_extraction_jobs'
})
export class FacebookExtractionJob {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true
  })
  jobId: string;

  @Prop({
    type: String,
    required: true,
    index: true,
    trim: true
  })
  pageId: string;

  @Prop({
    type: String,
    required: true,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending',
    index: true
  })
  status: ExtractionStatus;

  @Prop({
    type: Date,
    default: Date.now,
    index: true
  })
  startedAt: Date;

  @Prop({
    type: Date,
    default: null
  })
  completedAt: Date;

  @Prop({
    type: Number,
    required: true,
    default: 0,
    min: 0
  })
  postsExtracted: number;

  @Prop({
    type: Number,
    required: true,
    default: 0,
    min: 0
  })
  apiCallsUsed: number;

  @Prop({
    type: [String],
    default: []
  })
  errors: string[];

  @Prop({
    type: {
      requestedBy: {
        type: String,
        required: true
      },
      extractionType: {
        type: String,
        required: true,
        enum: ['manual', 'scheduled']
      },
      filters: {
        type: Object,
        default: {}
      },
      estimatedDuration: {
        type: Number,
        min: 0
      },
      priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
      }
    },
    required: true,
    _id: false
  })
  metadata: JobMetadata;

  createdAt: Date;
  updatedAt: Date;
}

export const FacebookExtractionJobSchema = SchemaFactory.createForClass(FacebookExtractionJob);

// Índices para optimización
FacebookExtractionJobSchema.index({ jobId: 1 }, { unique: true });
FacebookExtractionJobSchema.index({ pageId: 1, status: 1 });
FacebookExtractionJobSchema.index({ status: 1, startedAt: -1 });
FacebookExtractionJobSchema.index({ 'metadata.requestedBy': 1, createdAt: -1 });
FacebookExtractionJobSchema.index({ createdAt: -1 });

// TTL index para limpiar jobs antiguos después de 30 días
FacebookExtractionJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 días

// Métodos de instancia
FacebookExtractionJobSchema.methods.getDuration = function(): number | null {
  if (!this.completedAt) return null;
  return this.completedAt.getTime() - this.startedAt.getTime();
};

FacebookExtractionJobSchema.methods.markAsRunning = function(): void {
  this.status = 'running';
  this.startedAt = new Date();
};

FacebookExtractionJobSchema.methods.markAsCompleted = function(postsExtracted: number, apiCallsUsed: number): void {
  this.status = 'completed';
  this.completedAt = new Date();
  this.postsExtracted = postsExtracted;
  this.apiCallsUsed = apiCallsUsed;
};

FacebookExtractionJobSchema.methods.markAsFailed = function(error: string): void {
  this.status = 'failed';
  this.completedAt = new Date();
  this.errors.push(error);
};

FacebookExtractionJobSchema.methods.addError = function(error: string): void {
  this.errors.push(error);
};