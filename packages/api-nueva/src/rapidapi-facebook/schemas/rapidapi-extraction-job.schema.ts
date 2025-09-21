import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RapidAPIExtractionJobDocument = RapidAPIExtractionJob & Document;

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface JobProgress {
  totalExpected: number;
  postsProcessed: number;
  currentStep: string;
  percentage: number;
}

@Schema({ timestamps: true })
export class RapidAPIExtractionJob {
  @Prop({ required: true, unique: true, trim: true })
  jobId: string;

  @Prop({ required: true, trim: true })
  pageId: string;

  @Prop({ required: true, trim: true })
  configId: string;

  @Prop({ required: true, trim: true })
  userId: string;

  @Prop({
    type: String,
    enum: Object.values(JobStatus),
    default: JobStatus.PENDING
  })
  status: JobStatus;

  @Prop({ type: Object, default: { totalExpected: 0, postsProcessed: 0, currentStep: 'Iniciando', percentage: 0 } })
  progress: JobProgress;

  @Prop({ type: Object })
  requestParams: {
    limit?: number;
    includeComments?: boolean;
    includeReactions?: boolean;
    startDate?: Date;
    endDate?: Date;
  };

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ default: 0 })
  postsExtracted: number;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop({ default: 0 })
  apiCreditsUsed: number;

  @Prop([String])
  errors: string[];

  @Prop({ type: Object })
  result?: {
    postsExtracted: number;
    postsSkipped: number;
    duration: number;
    creditsUsed: number;
  };

  @Prop({ type: Object })
  errorDetails?: {
    code: string;
    message: string;
    stack?: string;
    rapidApiError?: Record<string, unknown>;
  };
}

export const RapidAPIExtractionJobSchema = SchemaFactory.createForClass(RapidAPIExtractionJob);

// Indices para optimización
RapidAPIExtractionJobSchema.index({ jobId: 1 });
RapidAPIExtractionJobSchema.index({ pageId: 1, status: 1 });
RapidAPIExtractionJobSchema.index({ userId: 1, createdAt: -1 });