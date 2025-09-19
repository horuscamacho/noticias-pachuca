import { FileType, FileCategory, ProcessingStatus, AccessLevel } from '../schemas/file-metadata.schema';
import { Express } from 'express';
import 'multer';

// ===============================
// CORE FILE INTERFACES
// ===============================

export interface UploadOptions {
  readonly bucket: string;
  readonly key: string;
  readonly contentType: string;
  readonly folder?: string;
  readonly category: FileCategory;
  readonly userId: string;
  readonly projectId?: string;
  readonly sessionId?: string;
  readonly metadata?: Readonly<Record<string, string>>;
  readonly tags?: Readonly<Record<string, string>>;
  readonly isPublic?: boolean;
  readonly accessLevel?: AccessLevel;
  readonly expiresAt?: Date;
  readonly retentionPolicy?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly storageClass?: S3StorageClass;
}

export interface UploadResult {
  readonly url: string;
  readonly key: string;
  readonly size: number;
  readonly etag?: string;
  readonly metadata?: Record<string, string>;
  readonly uploadedAt: Date;
}

export interface ProcessedFile {
  readonly buffer: Buffer;
  readonly name?: string;
  readonly width?: number;
  readonly height?: number;
  readonly format?: string;
  readonly size?: number;
  readonly quality?: number;
}

// ===============================
// STORAGE PROVIDER INTERFACE
// ===============================

export interface StorageProvider {
  upload(file: Buffer, options: UploadOptions): Promise<UploadResult>;
  delete(key: string, bucket?: string): Promise<void>;
  exists(key: string, bucket?: string): Promise<boolean>;
  getPresignedUrl(key: string, expiresIn: number, bucket?: string): Promise<string>;
  getPresignedUploadUrl(options: PresignedUploadOptions): Promise<PresignedUploadResult>;
  copy(sourceKey: string, destinationKey: string, bucket?: string): Promise<void>;
  move(sourceKey: string, destinationKey: string, bucket?: string): Promise<void>;
  getMetadata(key: string, bucket?: string): Promise<FileStorageMetadata>;
}

export interface FileStorageMetadata {
  readonly size: number;
  readonly lastModified: Date;
  readonly etag: string;
  readonly contentType: string;
  readonly metadata: Record<string, string>;
}

// ===============================
// FILE PROCESSOR INTERFACE
// ===============================

export interface ProcessingOptions {
  readonly outputFormat?: string;
  readonly quality?: number;
  readonly transformations?: readonly Transformation[];
}

export interface ImageProcessingOptions extends ProcessingOptions {
  readonly sizes: readonly ImageSize[];
  readonly formats: readonly ImageFormat[];
  readonly watermark?: WatermarkOptions;
  readonly compression?: CompressionOptions;
}

export interface VideoProcessingOptions extends ProcessingOptions {
  readonly qualities: readonly VideoQuality[];
  readonly generateThumbnail: boolean;
  readonly thumbnailTimestamp?: string;
  readonly segments?: boolean;
}

export interface DocumentProcessingOptions extends ProcessingOptions {
  readonly generateThumbnail: boolean;
  readonly extractText: boolean;
  readonly sanitizeContent: boolean;
}

export interface AudioProcessingOptions extends ProcessingOptions {
  readonly bitrates: readonly AudioBitrate[];
  readonly generateWaveform: boolean;
  readonly normalizeAudio: boolean;
}

export interface FileProcessor<
  TOptions extends ProcessingOptions = ProcessingOptions,
  TResult = ProcessedFile
> {
  process(file: Buffer, options: TOptions): Promise<readonly TResult[]>;
  validate(file: Express.Multer.File): Promise<ValidationResult>;
  getMetadata(file: Buffer): Promise<FileMetadata>;
  supports(mimeType: string): boolean;
}

// ===============================
// VALIDATION INTERFACES
// ===============================

export interface FileValidationRules {
  readonly maxSize: number;
  readonly allowedTypes: readonly FileType[];
  readonly allowedMimeTypes: readonly string[];
  readonly allowedExtensions: readonly string[];
  readonly requireVirusCheck: boolean;
  readonly requireImageOptimization: boolean;
}

export type ValidationResult<T = ValidatedFile> =
  | { success: true; file: T }
  | { success: false; errors: readonly string[] };

export interface ValidatedFile extends Express.Multer.File {
  readonly detectedType: string;
  readonly detectedExtension: string;
  readonly isSecure: boolean;
  readonly checksum: string;
}

// ===============================
// PRESIGNED URL INTERFACES
// ===============================

export interface PresignedUploadOptions {
  readonly bucket: string;
  readonly contentType: string;
  readonly fileSize: number;
  readonly folder?: string;
  readonly userId: string;
  readonly sessionId: string;
  readonly expiresIn?: number;
  readonly metadata?: Record<string, string>;
  readonly conditions?: PresignedUrlCondition[];
}

export interface PresignedUploadResult {
  readonly uploadUrl: string;
  readonly fields?: Record<string, string>;
  readonly key: string;
  readonly sessionId: string;
  readonly expiresIn: number;
  readonly conditions?: PresignedUrlCondition[];
}

export interface PresignedUrlCondition {
  readonly field: string;
  readonly operator: 'eq' | 'starts-with' | 'content-length-range';
  readonly value: string | number;
}

export interface UploadVerificationResult {
  readonly success: boolean;
  readonly url?: string;
  readonly key?: string;
  readonly size?: number;
  readonly lastModified?: Date;
  readonly error?: string;
}

// ===============================
// CHUNK UPLOAD INTERFACES
// ===============================

export interface ChunkUploadInitOptions {
  readonly bucket: string;
  readonly key: string;
  readonly contentType: string;
  readonly totalChunks: number;
  readonly chunkSize: number;
  readonly fileSize: number;
  readonly metadata?: Record<string, string>;
}

export interface ChunkUploadSession {
  readonly sessionId: string;
  readonly uploadId: string;
  readonly chunkSize: number;
  readonly totalChunks: number;
}

export interface ChunkUploadResult {
  readonly chunkNumber: number;
  readonly etag: string;
  readonly progress: number;
  readonly isComplete: boolean;
  readonly nextChunk?: number;
}

// ===============================
// FILE METADATA INTERFACES
// ===============================

export interface FileMetadata {
  readonly size: number;
  readonly mimeType: string;
  readonly width?: number;
  readonly height?: number;
  readonly duration?: number;
  readonly bitrate?: number;
  readonly frameRate?: number;
  readonly hasAudio?: boolean;
  readonly hasVideo?: boolean;
  readonly format?: string;
  readonly codec?: string;
  readonly colorSpace?: string;
  readonly checksum: string;
}

export interface FileStatistics {
  readonly totalFiles: number;
  readonly totalSize: number;
  readonly averageSize: number;
  readonly typeDistribution: Record<FileType, number>;
  readonly categoryDistribution: Record<FileCategory, number>;
  readonly storageUsage: StorageUsage;
}

export interface StorageUsage {
  readonly used: number;
  readonly total: number;
  readonly percentage: number;
  readonly byType: Record<FileType, number>;
  readonly byCategory: Record<FileCategory, number>;
}

// ===============================
// TRANSFORMATION INTERFACES
// ===============================

export interface Transformation {
  readonly type: TransformationType;
  readonly params: Record<string, unknown>;
}

export interface WatermarkOptions {
  readonly text?: string;
  readonly image?: Buffer;
  readonly position: WatermarkPosition;
  readonly opacity: number;
  readonly fontSize?: number;
  readonly color?: string;
}

export interface CompressionOptions {
  readonly quality: number;
  readonly progressive?: boolean;
  readonly optimizeHuffman?: boolean;
  readonly mozJpeg?: boolean;
}

// ===============================
// ENUMS AND TYPES
// ===============================

export enum StorageProviderType {
  AWS_S3 = 'aws_s3',
  CLOUDFLARE_R2 = 'cloudflare_r2',
  AZURE_BLOB = 'azure_blob',
  GOOGLE_CLOUD = 'google_cloud',
}

export enum S3StorageClass {
  STANDARD = 'STANDARD',
  STANDARD_IA = 'STANDARD_IA',
  ONEZONE_IA = 'ONEZONE_IA',
  GLACIER = 'GLACIER',
  GLACIER_IR = 'GLACIER_IR',
  DEEP_ARCHIVE = 'DEEP_ARCHIVE',
}

export enum TransformationType {
  RESIZE = 'resize',
  CROP = 'crop',
  ROTATE = 'rotate',
  FLIP = 'flip',
  BLUR = 'blur',
  SHARPEN = 'sharpen',
  GRAYSCALE = 'grayscale',
  SEPIA = 'sepia',
  NORMALIZE = 'normalize',
  WATERMARK = 'watermark',
  COMPRESS = 'compress',
}

export enum ImageSize {
  THUMBNAIL = 'thumbnail',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  XLARGE = 'xlarge',
  ORIGINAL = 'original',
}

export enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
  AVIF = 'avif',
  TIFF = 'tiff',
  GIF = 'gif',
}

export enum VideoQuality {
  LOW = '480p',
  MEDIUM = '720p',
  HIGH = '1080p',
  ULTRA = '4K',
}

export enum AudioBitrate {
  LOW = '64k',
  MEDIUM = '128k',
  HIGH = '256k',
  LOSSLESS = '320k',
}

export enum WatermarkPosition {
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
  CENTER = 'center',
}

// ===============================
// TYPE MAPPINGS
// ===============================

export type ProcessingOptionsMap = {
  [FileType.IMAGE]: ImageProcessingOptions;
  [FileType.VIDEO]: VideoProcessingOptions;
  [FileType.DOCUMENT]: DocumentProcessingOptions;
  [FileType.AUDIO]: AudioProcessingOptions;
  [FileType.ARCHIVE]: ProcessingOptions;
};

export type TypedUploadOptions<T extends FileType> = Omit<UploadOptions, 'contentType' | 'key'> & {
  readonly type: T;
  readonly processing?: Partial<ProcessingOptionsMap[T]>;
};

export type TypedUploadResult<T extends FileType> = UploadResult & {
  readonly id: string;
  readonly type: T;
  readonly variants: readonly FileVariant[];
  readonly metadata: Record<string, unknown>;
};

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

// ===============================
// BRANDED TYPES FOR TYPE SAFETY
// ===============================

export type FileKey = string & { readonly __brand: unique symbol };
export type BucketName = string & { readonly __brand: unique symbol };
export type UserId = string & { readonly __brand: unique symbol };
export type SessionId = string & { readonly __brand: unique symbol };

export function createFileKey(key: string): FileKey {
  return key as FileKey;
}

export function createBucketName(bucket: string): BucketName {
  return bucket as BucketName;
}

export function createUserId(userId: string): UserId {
  return userId as UserId;
}

export function createSessionId(sessionId: string): SessionId {
  return sessionId as SessionId;
}

// ===============================
// TYPE GUARDS
// ===============================

export function isImageFile(file: { mimeType: string; type?: FileType }): file is { mimeType: string; type: FileType.IMAGE } {
  return file.type === FileType.IMAGE || file.mimeType.startsWith('image/');
}

export function isVideoFile(file: { mimeType: string; type?: FileType }): file is { mimeType: string; type: FileType.VIDEO } {
  return file.type === FileType.VIDEO || file.mimeType.startsWith('video/');
}

export function isDocumentFile(file: { mimeType: string; type?: FileType }): file is { mimeType: string; type: FileType.DOCUMENT } {
  return file.type === FileType.DOCUMENT ||
         ['application/pdf', 'application/msword', 'text/plain'].includes(file.mimeType);
}

export function isAudioFile(file: { mimeType: string; type?: FileType }): file is { mimeType: string; type: FileType.AUDIO } {
  return file.type === FileType.AUDIO || file.mimeType.startsWith('audio/');
}

export function isArchiveFile(file: { mimeType: string; type?: FileType }): file is { mimeType: string; type: FileType.ARCHIVE } {
  return file.type === FileType.ARCHIVE ||
         ['application/zip', 'application/x-tar', 'application/gzip'].includes(file.mimeType);
}

// ===============================
// UTILITY TYPES
// ===============================

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type FileOperation<T extends FileType> =
  T extends FileType.IMAGE ? ImageOperation :
  T extends FileType.VIDEO ? VideoOperation :
  T extends FileType.DOCUMENT ? DocumentOperation :
  T extends FileType.AUDIO ? AudioOperation :
  BaseFileOperation;

export interface BaseFileOperation {
  readonly upload: boolean;
  readonly download: boolean;
  readonly delete: boolean;
  readonly metadata: boolean;
}

export interface ImageOperation extends BaseFileOperation {
  readonly resize: boolean;
  readonly crop: boolean;
  readonly watermark: boolean;
  readonly optimize: boolean;
}

export interface VideoOperation extends BaseFileOperation {
  readonly transcode: boolean;
  readonly thumbnail: boolean;
  readonly segment: boolean;
  readonly trim: boolean;
}

export interface DocumentOperation extends BaseFileOperation {
  readonly thumbnail: boolean;
  readonly textExtraction: boolean;
  readonly sanitize: boolean;
  readonly merge: boolean;
}

export interface AudioOperation extends BaseFileOperation {
  readonly transcode: boolean;
  readonly normalize: boolean;
  readonly waveform: boolean;
  readonly trim: boolean;
}