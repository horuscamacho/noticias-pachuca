import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsObject,
  IsUUID,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  FileType,
  FileCategory,
  AccessLevel,
  ProcessingStatus,
} from '../schemas/file-metadata.schema';
import { UploadType } from '../schemas/upload-session.schema';

// ===============================
// FILE UPLOAD DTOs
// ===============================

export class FileUploadDto {
  @ApiProperty({
    description: 'Category of the file being uploaded',
    enum: FileCategory,
    example: FileCategory.USER_UPLOAD,
  })
  @IsEnum(FileCategory)
  @IsNotEmpty()
  category: FileCategory;

  @ApiPropertyOptional({
    description: 'Folder path where the file should be stored',
    example: 'documents/2024',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({
    description: 'Project ID if file belongs to a specific project',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the file',
    example: { title: 'My Document', description: 'Important file' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Tags for categorizing the file',
    example: { category: 'work', priority: 'high' },
  })
  @IsObject()
  @IsOptional()
  tags?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Whether the file should be publicly accessible',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean = false;

  @ApiPropertyOptional({
    description: 'Access level for the file',
    enum: AccessLevel,
    default: AccessLevel.PRIVATE,
  })
  @IsEnum(AccessLevel)
  @IsOptional()
  accessLevel?: AccessLevel = AccessLevel.PRIVATE;

  @ApiPropertyOptional({
    description: 'Expiration date for the file (ISO string)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Retention policy for the file',
    example: '7-years',
  })
  @IsString()
  @IsOptional()
  retentionPolicy?: string;
}

export class MultipleFileUploadDto extends FileUploadDto {
  @ApiProperty({
    description: 'Maximum number of files to upload',
    minimum: 1,
    maximum: 10,
    default: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxFiles?: number = 5;
}

// ===============================
// FILE PROCESSING DTOs
// ===============================

export class ImageProcessingDto {
  @ApiPropertyOptional({
    description: 'Image sizes to generate',
    example: ['thumbnail', 'medium', 'large'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sizes?: string[] = ['thumbnail', 'medium'];

  @ApiPropertyOptional({
    description: 'Output formats to generate',
    example: ['webp', 'jpeg'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  formats?: string[] = ['webp'];

  @ApiPropertyOptional({
    description: 'Image quality (1-100)',
    minimum: 1,
    maximum: 100,
    default: 85,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  quality?: number = 85;

  @ApiPropertyOptional({
    description: 'Whether to add watermark',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  addWatermark?: boolean = false;
}

export class VideoProcessingDto {
  @ApiPropertyOptional({
    description: 'Video qualities to generate',
    example: ['720p', '1080p'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  qualities?: string[] = ['720p'];

  @ApiPropertyOptional({
    description: 'Whether to generate thumbnail',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  generateThumbnail?: boolean = true;

  @ApiPropertyOptional({
    description: 'Timestamp for thumbnail generation (HH:MM:SS)',
    example: '00:00:05',
  })
  @IsString()
  @IsOptional()
  thumbnailTimestamp?: string = '00:00:01';
}

export class FileProcessingOptionsDto {
  @ApiPropertyOptional({
    description: 'Image processing options',
    type: ImageProcessingDto,
  })
  @ValidateNested()
  @Type(() => ImageProcessingDto)
  @IsOptional()
  image?: ImageProcessingDto;

  @ApiPropertyOptional({
    description: 'Video processing options',
    type: VideoProcessingDto,
  })
  @ValidateNested()
  @Type(() => VideoProcessingDto)
  @IsOptional()
  video?: VideoProcessingDto;
}

// ===============================
// PRESIGNED URL DTOs
// ===============================

export class PresignedUrlRequestDto {
  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({
    description: 'Size of the file in bytes',
    minimum: 1,
    example: 1048576,
  })
  @IsNumber()
  @Min(1)
  fileSize: number;

  @ApiProperty({
    description: 'Original filename',
    example: 'document.pdf',
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiPropertyOptional({
    description: 'Folder path for the file',
    example: 'documents/uploads',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiProperty({
    description: 'File category',
    enum: FileCategory,
    example: FileCategory.DOCUMENT_UPLOAD,
  })
  @IsEnum(FileCategory)
  category: FileCategory;

  @ApiPropertyOptional({
    description: 'URL expiration time in seconds',
    minimum: 300,
    maximum: 3600,
    default: 3600,
  })
  @IsNumber()
  @Min(300)
  @Max(3600)
  @IsOptional()
  expiresIn?: number = 3600;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;
}

export class VerifyUploadDto {
  @ApiProperty({
    description: 'Upload session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;
}

// ===============================
// CHUNK UPLOAD DTOs
// ===============================

export class ChunkUploadInitDto {
  @ApiProperty({
    description: 'Original filename',
    example: 'large-video.mp4',
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'video/mp4',
  })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({
    description: 'Total file size in bytes',
    minimum: 1,
    example: 104857600,
  })
  @IsNumber()
  @Min(1)
  fileSize: number;

  @ApiProperty({
    description: 'Total number of chunks',
    minimum: 1,
    example: 10,
  })
  @IsNumber()
  @Min(1)
  totalChunks: number;

  @ApiProperty({
    description: 'Size of each chunk in bytes',
    minimum: 1048576, // 1MB minimum
    example: 10485760,
  })
  @IsNumber()
  @Min(1048576)
  chunkSize: number;

  @ApiProperty({
    description: 'File category',
    enum: FileCategory,
    example: FileCategory.MEDIA_CONTENT,
  })
  @IsEnum(FileCategory)
  category: FileCategory;

  @ApiPropertyOptional({
    description: 'Folder path for the file',
    example: 'videos/uploads',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;
}

export class ChunkUploadDto {
  @ApiProperty({
    description: 'Upload session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Chunk number (1-based)',
    minimum: 1,
    example: 1,
  })
  @IsNumber()
  @Min(1)
  chunkNumber: number;
}

export class CompleteChunkUploadDto {
  @ApiProperty({
    description: 'Upload session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;
}

// ===============================
// FILE QUERY DTOs (extends PaginationDto)
// ===============================

export class FileQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by file type',
    enum: FileType,
    example: FileType.IMAGE,
  })
  @IsEnum(FileType)
  @IsOptional()
  type?: FileType;

  @ApiPropertyOptional({
    description: 'Filter by file category',
    enum: FileCategory,
    example: FileCategory.USER_UPLOAD,
  })
  @IsEnum(FileCategory)
  @IsOptional()
  category?: FileCategory;

  @ApiPropertyOptional({
    description: 'Filter by folder path',
    example: 'documents/2024',
  })
  @IsString()
  @IsOptional()
  folder?: string;

  @ApiPropertyOptional({
    description: 'Filter by processing status',
    enum: ProcessingStatus,
    example: ProcessingStatus.COMPLETED,
  })
  @IsEnum(ProcessingStatus)
  @IsOptional()
  processingStatus?: ProcessingStatus;

  @ApiPropertyOptional({
    description: 'Filter by access level',
    enum: AccessLevel,
    example: AccessLevel.PUBLIC,
  })
  @IsEnum(AccessLevel)
  @IsOptional()
  accessLevel?: AccessLevel;

  @ApiPropertyOptional({
    description: 'Search in filename and metadata',
    example: 'document',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by minimum file size in bytes',
    minimum: 0,
    example: 1024,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  minSize?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum file size in bytes',
    minimum: 1,
    example: 10485760,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  maxSize?: number;

  @ApiPropertyOptional({
    description: 'Filter by creation date (from)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date (to)',
    example: '2024-12-31',
  })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Include deleted files',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeDeleted?: boolean = false;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['createdAt', 'size', 'originalName', 'type'],
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// ===============================
// FILE METADATA UPDATE DTO
// ===============================

export class UpdateFileMetadataDto {
  @ApiPropertyOptional({
    description: 'New filename',
    example: 'renamed-document.pdf',
  })
  @IsString()
  @IsOptional()
  originalName?: string;

  @ApiPropertyOptional({
    description: 'Updated metadata',
    example: { title: 'Updated Title', description: 'New description' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Updated tags',
    example: { priority: 'low', category: 'archive' },
  })
  @IsObject()
  @IsOptional()
  tags?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Updated access level',
    enum: AccessLevel,
  })
  @IsEnum(AccessLevel)
  @IsOptional()
  accessLevel?: AccessLevel;

  @ApiPropertyOptional({
    description: 'Updated public access',
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Updated expiration date',
    example: '2025-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

// ===============================
// DOWNLOAD URL DTO
// ===============================

export class GenerateDownloadUrlDto {
  @ApiPropertyOptional({
    description: 'URL expiration time in seconds',
    minimum: 300,
    maximum: 86400,
    default: 3600,
  })
  @IsNumber()
  @Min(300)
  @Max(86400)
  @IsOptional()
  expiresIn?: number = 3600;

  @ApiPropertyOptional({
    description: 'Force download instead of inline display',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  forceDownload?: boolean = false;

  @ApiPropertyOptional({
    description: 'Custom filename for download',
    example: 'my-document.pdf',
  })
  @IsString()
  @IsOptional()
  downloadFilename?: string;
}

// ===============================
// BULK OPERATIONS DTOs
// ===============================

export class BulkDeleteDto {
  @ApiProperty({
    description: 'Array of file IDs to delete',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  fileIds: string[];

  @ApiPropertyOptional({
    description: 'Reason for deletion',
    example: 'Cleanup operation',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class BulkUpdateDto {
  @ApiProperty({
    description: 'Array of file IDs to update',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  fileIds: string[];

  @ApiPropertyOptional({
    description: 'Updated metadata to apply to all files',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Updated tags to apply to all files',
  })
  @IsObject()
  @IsOptional()
  tags?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Updated access level',
    enum: AccessLevel,
  })
  @IsEnum(AccessLevel)
  @IsOptional()
  accessLevel?: AccessLevel;
}