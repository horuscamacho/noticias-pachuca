import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FileMetadataDocument = FileMetadata & Document;

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  ARCHIVE = 'archive',
}

export enum FileCategory {
  PROFILE_PICTURE = 'profile_picture',
  PROJECT_ASSET = 'project_asset',
  DOCUMENT_UPLOAD = 'document_upload',
  MEDIA_CONTENT = 'media_content',
  TEMPORARY = 'temporary',
  USER_UPLOAD = 'user_upload',
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum AccessLevel {
  PRIVATE = 'private',
  PUBLIC = 'public',
  RESTRICTED = 'restricted',
}

export interface FileVariant {
  readonly name: string;
  readonly url: string;
  readonly key: string;
  readonly size: number;
  readonly width?: number;
  readonly height?: number;
  readonly format?: string;
  readonly quality?: number;
}

@Schema({
  timestamps: true,
  collection: 'file_metadata',
  toJSON: {
    transform: (doc: Document, ret: Record<string, unknown>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class FileMetadata {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  key: string;

  @Prop({
    type: String,
    required: true,
  })
  originalName: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  mimeType: string;

  @Prop({
    type: String,
    enum: Object.values(FileType),
    required: true,
    index: true,
  })
  type: FileType;

  @Prop({
    type: String,
    enum: Object.values(FileCategory),
    required: true,
    index: true,
  })
  category: FileCategory;

  @Prop({
    type: Number,
    required: true,
    index: true,
  })
  size: number;

  @Prop({
    type: String,
    required: true,
  })
  bucket: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  folder: string;

  @Prop({
    type: String,
    required: true,
  })
  url: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  uploadedBy: Types.ObjectId;

  @Prop({
    type: String,
    required: false,
  })
  uploadSession?: string;

  @Prop({
    type: Object,
    default: {},
  })
  metadata: Record<string, string>;

  @Prop({
    type: Object,
    default: {},
  })
  tags: Record<string, string>;

  @Prop({
    type: String,
    enum: Object.values(ProcessingStatus),
    default: ProcessingStatus.PENDING,
    index: true,
  })
  processingStatus: ProcessingStatus;

  @Prop({
    type: [Object],
    default: [],
  })
  variants: FileVariant[];

  @Prop({
    type: String,
    required: true,
  })
  checksum: string;

  @Prop({
    type: String,
    enum: Object.values(AccessLevel),
    default: AccessLevel.PRIVATE,
    index: true,
  })
  accessLevel: AccessLevel;

  @Prop({
    type: Boolean,
    default: false,
    index: true,
  })
  isPublic: boolean;

  @Prop({
    type: Date,
    required: false,
    index: true,
  })
  expiresAt?: Date;

  @Prop({
    type: String,
    required: false,
  })
  retentionPolicy?: string;

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
    type: Number,
    required: false,
  })
  width?: number;

  @Prop({
    type: Number,
    required: false,
  })
  height?: number;

  @Prop({
    type: Number,
    required: false,
  })
  duration?: number;

  @Prop({
    type: String,
    required: false,
  })
  encoding?: string;

  @Prop({
    type: Number,
    required: false,
  })
  bitrate?: number;

  @Prop({
    type: Number,
    required: false,
  })
  frameRate?: number;

  @Prop({
    type: Number,
    default: 0,
  })
  downloadCount: number;

  @Prop({
    type: Date,
    required: false,
  })
  lastAccessedAt?: Date;

  @Prop({
    type: Date,
    required: false,
  })
  deletedAt?: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: false,
  })
  deletedBy?: Types.ObjectId;

  @Prop({
    type: String,
    required: false,
  })
  deleteReason?: string;

  // Timestamps automáticos
  createdAt?: Date;
  updatedAt?: Date;
}

export const FileMetadataSchema = SchemaFactory.createForClass(FileMetadata);

// Índices compuestos para performance
FileMetadataSchema.index({ uploadedBy: 1, type: 1, createdAt: -1 });
FileMetadataSchema.index({ uploadedBy: 1, category: 1, createdAt: -1 });
FileMetadataSchema.index({ folder: 1, type: 1, createdAt: -1 });
FileMetadataSchema.index({ processingStatus: 1, createdAt: 1 });
FileMetadataSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
FileMetadataSchema.index({ deletedAt: 1, createdAt: -1 });

// Índice de texto para búsqueda
FileMetadataSchema.index({
  originalName: 'text',
  'metadata.title': 'text',
  'metadata.description': 'text',
  'tags.title': 'text',
});

// Virtuals
FileMetadataSchema.virtual('isExpired').get(function (this: FileMetadataDocument) {
  return this.expiresAt ? new Date() > this.expiresAt : false;
});

FileMetadataSchema.virtual('isDeleted').get(function (this: FileMetadataDocument) {
  return Boolean(this.deletedAt);
});

FileMetadataSchema.virtual('sizeFormatted').get(function (this: FileMetadataDocument) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  let size = this.size;
  let i = 0;

  while (size >= 1024 && i < sizes.length - 1) {
    size /= 1024;
    i++;
  }

  return `${size.toFixed(2)} ${sizes[i]}`;
});

FileMetadataSchema.virtual('hasVariants').get(function (this: FileMetadataDocument) {
  return this.variants && this.variants.length > 0;
});

// Middleware para soft delete
FileMetadataSchema.pre(/^find/, function() {
  // Solo mostrar archivos no eliminados por defecto
  const query = this as unknown as { getOptions(): { includeDeleted?: boolean }; where(filter: object): void };
  const options = query.getOptions();
  if (!options?.includeDeleted) {
    query.where({ deletedAt: null });
  }
});

// Middleware para actualizar lastAccessedAt
FileMetadataSchema.methods.markAsAccessed = function() {
  this.lastAccessedAt = new Date();
  this.downloadCount += 1;
  return this.save();
};

// Middleware para soft delete
FileMetadataSchema.methods.softDelete = function(deletedBy?: Types.ObjectId, reason?: string) {
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deleteReason = reason;
  return this.save();
};