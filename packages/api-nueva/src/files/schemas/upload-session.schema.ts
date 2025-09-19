import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UploadSessionDocument = UploadSession & Document;

export enum UploadType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
  CHUNK = 'chunk',
  PRESIGNED = 'presigned',
}

export enum UploadStatus {
  INITIALIZED = 'initialized',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface ChunkInfo {
  readonly chunkNumber: number;
  readonly size: number;
  readonly etag: string;
  readonly uploadedAt: Date;
}

export interface UploadProgress {
  readonly uploadedBytes: number;
  readonly totalBytes: number;
  readonly percentage: number;
  readonly speed?: number; // bytes per second
  readonly remainingTime?: number; // seconds
}

@Schema({
  timestamps: true,
  collection: 'upload_sessions',
  toJSON: {
    transform: (doc: Document, ret: Record<string, unknown>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class UploadSession {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  sessionId: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(UploadType),
    required: true,
  })
  uploadType: UploadType;

  @Prop({
    type: String,
    enum: Object.values(UploadStatus),
    default: UploadStatus.INITIALIZED,
    index: true,
  })
  status: UploadStatus;

  @Prop({
    type: String,
    required: false,
  })
  bucket?: string;

  @Prop({
    type: String,
    required: false,
  })
  key?: string;

  @Prop({
    type: String,
    required: false,
  })
  uploadId?: string; // Para multipart uploads

  @Prop({
    type: String,
    required: false,
  })
  presignedUrl?: string;

  @Prop({
    type: Date,
    required: false,
  })
  presignedUrlExpiresAt?: Date;

  @Prop({
    type: String,
    required: false,
  })
  originalFileName?: string;

  @Prop({
    type: String,
    required: false,
  })
  mimeType?: string;

  @Prop({
    type: Number,
    required: false,
  })
  fileSize?: number;

  @Prop({
    type: Number,
    default: 0,
  })
  uploadedBytes: number;

  @Prop({
    type: Number,
    required: false,
  })
  totalChunks?: number;

  @Prop({
    type: Number,
    default: 0,
  })
  uploadedChunks: number;

  @Prop({
    type: [Object],
    default: [],
  })
  chunks: ChunkInfo[];

  @Prop({
    type: Object,
    required: false,
  })
  progress?: UploadProgress;

  @Prop({
    type: Object,
    default: {},
  })
  metadata: Record<string, string>;

  @Prop({
    type: Object,
    default: {},
  })
  uploadOptions: Record<string, unknown>;

  @Prop({
    type: String,
    required: false,
  })
  errorMessage?: string;

  @Prop({
    type: Object,
    required: false,
  })
  errorDetails?: Record<string, unknown>;

  @Prop({
    type: Date,
    required: false,
  })
  startedAt?: Date;

  @Prop({
    type: Date,
    required: false,
  })
  completedAt?: Date;

  @Prop({
    type: Date,
    required: false,
  })
  lastActivityAt?: Date;

  @Prop({
    type: String,
    required: false,
  })
  ipAddress?: string;

  @Prop({
    type: String,
    required: false,
  })
  userAgent?: string;

  @Prop({
    type: [String],
    default: [],
  })
  resultFileKeys: string[];

  @Prop({
    type: Number,
    required: false,
  })
  retryCount?: number;

  @Prop({
    type: Date,
    required: false,
  })
  nextRetryAt?: Date;

  // TTL automático - sessions expire after 24 hours
  @Prop({
    type: Date,
    default: Date.now,
    expires: 86400, // 24 hours
    index: true,
  })
  expiresAt: Date;

  // Timestamps automáticos
  createdAt?: Date;
  updatedAt?: Date;
}

export const UploadSessionSchema = SchemaFactory.createForClass(UploadSession);

// Índices compuestos para performance
UploadSessionSchema.index({ userId: 1, status: 1, createdAt: -1 });
UploadSessionSchema.index({ uploadType: 1, status: 1, createdAt: -1 });
UploadSessionSchema.index({ lastActivityAt: 1, status: 1 });

// Índice para cleanup de sessions expiradas
UploadSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtuals
UploadSessionSchema.virtual('isExpired').get(function (this: UploadSessionDocument) {
  return new Date() > this.expiresAt;
});

UploadSessionSchema.virtual('isActive').get(function (this: UploadSessionDocument) {
  return [UploadStatus.INITIALIZED, UploadStatus.IN_PROGRESS].includes(this.status);
});

UploadSessionSchema.virtual('isCompleted').get(function (this: UploadSessionDocument) {
  return this.status === UploadStatus.COMPLETED;
});

UploadSessionSchema.virtual('isFailed').get(function (this: UploadSessionDocument) {
  return [UploadStatus.FAILED, UploadStatus.CANCELLED, UploadStatus.EXPIRED].includes(this.status);
});

UploadSessionSchema.virtual('progressPercentage').get(function (this: UploadSessionDocument) {
  if (!this.fileSize || this.fileSize === 0) return 0;
  return Math.round((this.uploadedBytes / this.fileSize) * 100);
});

UploadSessionSchema.virtual('chunkProgressPercentage').get(function (this: UploadSessionDocument) {
  if (!this.totalChunks || this.totalChunks === 0) return 0;
  return Math.round((this.uploadedChunks / this.totalChunks) * 100);
});

UploadSessionSchema.virtual('duration').get(function (this: UploadSessionDocument) {
  if (!this.startedAt) return 0;
  const endTime = this.completedAt || new Date();
  return Math.round((endTime.getTime() - this.startedAt.getTime()) / 1000); // seconds
});

// Methods
UploadSessionSchema.methods.updateProgress = function(uploadedBytes: number, speed?: number) {
  this.uploadedBytes = uploadedBytes;
  this.lastActivityAt = new Date();

  if (this.fileSize && this.fileSize > 0) {
    const percentage = Math.round((uploadedBytes / this.fileSize) * 100);
    const remainingBytes = this.fileSize - uploadedBytes;
    const remainingTime = speed && speed > 0 ? Math.round(remainingBytes / speed) : undefined;

    this.progress = {
      uploadedBytes,
      totalBytes: this.fileSize,
      percentage,
      speed,
      remainingTime,
    };
  }

  return this.save();
};

UploadSessionSchema.methods.addChunk = function(chunkInfo: ChunkInfo) {
  this.chunks.push(chunkInfo);
  this.uploadedChunks = this.chunks.length;
  this.lastActivityAt = new Date();

  if (this.totalChunks && this.uploadedChunks >= this.totalChunks) {
    this.status = UploadStatus.COMPLETED;
    this.completedAt = new Date();
  }

  return this.save();
};

UploadSessionSchema.methods.markAsStarted = function() {
  this.status = UploadStatus.IN_PROGRESS;
  this.startedAt = new Date();
  this.lastActivityAt = new Date();
  return this.save();
};

UploadSessionSchema.methods.markAsCompleted = function(resultFileKeys?: string[]) {
  this.status = UploadStatus.COMPLETED;
  this.completedAt = new Date();
  this.lastActivityAt = new Date();

  if (resultFileKeys) {
    this.resultFileKeys = resultFileKeys;
  }

  return this.save();
};

UploadSessionSchema.methods.markAsFailed = function(errorMessage: string, errorDetails?: Record<string, unknown>) {
  this.status = UploadStatus.FAILED;
  this.errorMessage = errorMessage;
  this.errorDetails = errorDetails;
  this.lastActivityAt = new Date();
  return this.save();
};

UploadSessionSchema.methods.markAsCancelled = function() {
  this.status = UploadStatus.CANCELLED;
  this.lastActivityAt = new Date();
  return this.save();
};

UploadSessionSchema.methods.incrementRetry = function() {
  this.retryCount = (this.retryCount || 0) + 1;
  this.nextRetryAt = new Date(Date.now() + Math.pow(2, this.retryCount) * 1000); // Exponential backoff
  return this.save();
};

// Pre-save middleware
UploadSessionSchema.pre('save', function() {
  // Auto-expire inactive sessions after 1 hour
  if (this.isModified('lastActivityAt') || this.isNew) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }

  // Mark as expired if past expiry time
  if (new Date() > this.expiresAt && [UploadStatus.INITIALIZED, UploadStatus.IN_PROGRESS].includes(this.status)) {
    this.status = UploadStatus.EXPIRED;
  }
});