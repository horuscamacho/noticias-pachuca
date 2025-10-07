import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RapidAPITwitterExtractionJobDocument = RapidAPITwitterExtractionJob & Document;

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface JobProgress {
  totalExpected: number;
  tweetsProcessed: number;
  currentStep: string;
  percentage: number;
}

@Schema({ timestamps: true })
export class RapidAPITwitterExtractionJob {
  @Prop({ required: true, unique: true, trim: true })
  jobId: string;

  @Prop({ required: true, trim: true })
  userId: string; // Twitter user rest_id

  @Prop({ required: true, trim: true })
  mongoUserId: string; // MongoDB ObjectId as string

  @Prop({ required: true, trim: true })
  configId: string;

  @Prop({ required: true, trim: true })
  triggeredByUserId: string; // User who triggered the job

  @Prop({
    type: String,
    enum: Object.values(JobStatus),
    default: JobStatus.PENDING
  })
  status: JobStatus;

  @Prop({ type: Object, default: { totalExpected: 0, tweetsProcessed: 0, currentStep: 'Iniciando', percentage: 0 } })
  progress: JobProgress;

  @Prop({ type: Object })
  requestParams: {
    count?: number;
    includeReplies?: boolean;
    includeRetweets?: boolean;
    startDate?: Date;
    endDate?: Date;
  };

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ default: 0 })
  tweetsExtracted: number;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop({ default: 0 })
  apiCreditsUsed: number;

  @Prop([String])
  errors: string[];

  @Prop({ type: Object })
  result?: {
    tweetsExtracted: number;
    tweetsSkipped: number;
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

export const RapidAPITwitterExtractionJobSchema = SchemaFactory.createForClass(RapidAPITwitterExtractionJob);

// Indices para optimización
RapidAPITwitterExtractionJobSchema.index({ jobId: 1 });
RapidAPITwitterExtractionJobSchema.index({ userId: 1, status: 1 });
RapidAPITwitterExtractionJobSchema.index({ triggeredByUserId: 1, createdAt: -1 });