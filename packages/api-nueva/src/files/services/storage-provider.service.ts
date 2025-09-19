import { Injectable, Logger } from '@nestjs/common';

import { AwsS3CoreService } from './aws-s3-core.service';
import { AppConfigService } from '../../config/config.service';
import {
  StorageProvider,
  UploadOptions,
  UploadResult,
  PresignedUploadOptions,
  PresignedUploadResult,
  FileStorageMetadata,
  ChunkUploadInitOptions,
  ChunkUploadSession,
  ChunkUploadResult,
  UploadVerificationResult,
  StorageProviderType,
  createFileKey,
  createBucketName,
} from '../interfaces/file.interface';

@Injectable()
export class StorageProviderService implements StorageProvider {
  private readonly logger = new Logger(StorageProviderService.name);
  private readonly currentProvider: StorageProviderType;

  constructor(
    private readonly awsS3Service: AwsS3CoreService,
    private readonly configService: AppConfigService,
  ) {
    this.currentProvider = StorageProviderType.AWS_S3;
    this.logger.log(`🔧 Storage Provider initialized: ${this.currentProvider}`);
  }

  async upload(file: Buffer, options: UploadOptions): Promise<UploadResult> {
    try {
      this.logOperation('upload', {
        key: options.key,
        size: file.length,
        contentType: options.contentType,
        category: options.category,
        provider: this.currentProvider,
      });

      const result = await this.executeUpload(file, options);

      this.logger.log(`✅ File uploaded successfully: ${options.key}`);
      return result;
    } catch (error) {
      this.logError('upload', error, {
        key: options.key,
        provider: this.currentProvider,
      });
      throw error;
    }
  }

  async delete(key: string, bucket?: string): Promise<void> {
    try {
      const bucketName = bucket || this.configService.s3Bucket;

      this.logOperation('delete', {
        key,
        bucket: bucketName,
        provider: this.currentProvider,
      });

      await this.executeDelete(key, bucketName);

      this.logger.log(`✅ File deleted successfully: ${key}`);
    } catch (error) {
      this.logError('delete', error, {
        key,
        bucket,
        provider: this.currentProvider,
      });
      throw error;
    }
  }

  async exists(key: string, bucket?: string): Promise<boolean> {
    try {
      const bucketName = bucket || this.configService.s3Bucket;

      this.logOperation('exists', {
        key,
        bucket: bucketName,
        provider: this.currentProvider,
      });

      const exists = await this.executeExists(key, bucketName);

      return exists;
    } catch (error) {
      this.logError('exists', error, {
        key,
        bucket,
        provider: this.currentProvider,
      });
      throw error;
    }
  }

  async getPresignedUrl(
    key: string,
    expiresIn: number,
    bucket?: string,
  ): Promise<string> {
    try {
      const bucketName = bucket || this.configService.s3Bucket;

      this.logOperation('getPresignedUrl', {
        key,
        bucket: bucketName,
        expiresIn,
        provider: this.currentProvider,
      });

      const url = await this.executeGetPresignedUrl(key, expiresIn, bucketName);

      this.logger.log(`✅ Presigned URL generated: ${key}`);
      return url;
    } catch (error) {
      this.logError('getPresignedUrl', error, {
        key,
        bucket,
        provider: this.currentProvider,
      });
      throw error;
    }
  }

  async getPresignedUploadUrl(
    options: PresignedUploadOptions,
  ): Promise<PresignedUploadResult> {
    try {
      this.logOperation('getPresignedUploadUrl', {
        bucket: options.bucket,
        contentType: options.contentType,
        fileSize: options.fileSize,
        sessionId: options.sessionId,
        provider: this.currentProvider,
      });

      const result = await this.executeGetPresignedUploadUrl(options);

      this.logger.log(`✅ Presigned upload URL generated: ${result.key}`);
      return result;
    } catch (error) {
      this.logError('getPresignedUploadUrl', error, {
        bucket: options.bucket,
        sessionId: options.sessionId,
        provider: this.currentProvider,
      });
      throw error;
    }
  }

  async copy(
    sourceKey: string,
    destinationKey: string,
    bucket?: string,
  ): Promise<void> {
    try {
      const bucketName = bucket || this.configService.s3Bucket;

      this.logOperation('copy', {
        sourceKey,
        destinationKey,
        bucket: bucketName,
        provider: this.currentProvider,
      });

      await this.executeCopy(sourceKey, destinationKey, bucketName);

      this.logger.log(`✅ File copied: ${sourceKey} → ${destinationKey}`);
    } catch (error) {
      this.logError('copy', error, {
        sourceKey,
        destinationKey,
        bucket,
        provider: this.currentProvider,
      });
      throw error;
    }
  }

  async move(
    sourceKey: string,
    destinationKey: string,
    bucket?: string,
  ): Promise<void> {
    try {
      const bucketName = bucket || this.configService.s3Bucket;

      this.logOperation('move', {
        sourceKey,
        destinationKey,
        bucket: bucketName,
        provider: this.currentProvider,
      });

      await this.copy(sourceKey, destinationKey, bucketName);
      await this.delete(sourceKey, bucketName);

      this.logger.log(`✅ File moved: ${sourceKey} → ${destinationKey}`);
    } catch (error) {
      this.logError('move', error, {
        sourceKey,
        destinationKey,
        bucket,
        provider: this.currentProvider,
      });
      throw error;
    }
  }

  async getMetadata(key: string, bucket?: string): Promise<FileStorageMetadata> {
    try {
      const bucketName = bucket || this.configService.s3Bucket;

      this.logOperation('getMetadata', {
        key,
        bucket: bucketName,
        provider: this.currentProvider,
      });

      const metadata = await this.executeGetMetadata(key, bucketName);

      return metadata;
    } catch (error) {
      this.logError('getMetadata', error, {
        key,
        bucket,
        provider: this.currentProvider,
      });
      throw error;
    }
  }

  async initializeChunkUpload(
    options: ChunkUploadInitOptions,
  ): Promise<ChunkUploadSession> {
    try {
      this.logOperation('initializeChunkUpload', {
        key: options.key,
        bucket: options.bucket,
        totalChunks: options.totalChunks,
        chunkSize: options.chunkSize,
        provider: this.currentProvider,
      });

      const session = await this.executeInitializeChunkUpload(options);

      this.logger.log(`✅ Chunk upload initialized: ${session.sessionId}`);
      return session;
    } catch (error) {
      this.logError('initializeChunkUpload', error, {
        key: options.key,
        bucket: options.bucket,
        provider: this.currentProvider,
      });
      throw error;
    }
  }

  async uploadChunk(
    sessionId: string,
    chunkNumber: number,
    chunkData: Buffer,
    options: {
      key: string;
      uploadId: string;
      bucket?: string;
    },
  ): Promise<ChunkUploadResult> {
    try {
      const bucketName = options.bucket || this.configService.s3Bucket;

      this.logOperation('uploadChunk', {
        sessionId,
        chunkNumber,
        key: options.key,
        bucket: bucketName,
        chunkSize: chunkData.length,
        provider: this.currentProvider,
      });

      const result = await this.executeUploadChunk(
        sessionId,
        chunkNumber,
        chunkData,
        { ...options, bucket: bucketName },
      );

      this.logger.log(`✅ Chunk uploaded: ${sessionId} - chunk ${chunkNumber}`);
      return result;
    } catch (error) {
      this.logError('uploadChunk', error, {
        sessionId,
        chunkNumber,
        key: options.key,
        provider: this.currentProvider,
      });
      throw error;
    }
  }

  async completeChunkUpload(
    sessionId: string,
    options: {
      key: string;
      uploadId: string;
      parts: Array<{ PartNumber: number; ETag: string }>;
      bucket?: string;
    },
  ): Promise<UploadResult> {
    try {
      const bucketName = options.bucket || this.configService.s3Bucket;

      this.logOperation('completeChunkUpload', {
        sessionId,
        key: options.key,
        bucket: bucketName,
        partsCount: options.parts.length,
        provider: this.currentProvider,
      });

      const result = await this.executeCompleteChunkUpload(sessionId, {
        ...options,
        bucket: bucketName,
      });

      this.logger.log(`✅ Chunk upload completed: ${sessionId}`);
      return result;
    } catch (error) {
      this.logError('completeChunkUpload', error, {
        sessionId,
        key: options.key,
        provider: this.currentProvider,
      });
      throw error;
    }
  }

  async abortChunkUpload(
    sessionId: string,
    options: {
      key: string;
      uploadId: string;
      bucket?: string;
    },
  ): Promise<void> {
    try {
      const bucketName = options.bucket || this.configService.s3Bucket;

      this.logOperation('abortChunkUpload', {
        sessionId,
        key: options.key,
        bucket: bucketName,
        provider: this.currentProvider,
      });

      await this.executeAbortChunkUpload(sessionId, {
        ...options,
        bucket: bucketName,
      });

      this.logger.log(`✅ Chunk upload aborted: ${sessionId}`);
    } catch (error) {
      this.logError('abortChunkUpload', error, {
        sessionId,
        key: options.key,
        provider: this.currentProvider,
      });
      throw error;
    }
  }

  async verifyUpload(
    key: string,
    bucket?: string,
  ): Promise<UploadVerificationResult> {
    try {
      const bucketName = bucket || this.configService.s3Bucket;

      this.logOperation('verifyUpload', {
        key,
        bucket: bucketName,
        provider: this.currentProvider,
      });

      const result = await this.executeVerifyUpload(key, bucketName);

      return result;
    } catch (error) {
      this.logError('verifyUpload', error, {
        key,
        bucket,
        provider: this.currentProvider,
      });
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.logOperation('healthCheck', {
        provider: this.currentProvider,
      });

      const isHealthy = await this.executeHealthCheck();

      if (isHealthy) {
        this.logger.log(`✅ Storage provider health check passed: ${this.currentProvider}`);
      } else {
        this.logger.error(`❌ Storage provider health check failed: ${this.currentProvider}`);
      }

      return isHealthy;
    } catch (error) {
      this.logError('healthCheck', error, {
        provider: this.currentProvider,
      });
      return false;
    }
  }

  private async executeUpload(
    file: Buffer,
    options: UploadOptions,
  ): Promise<UploadResult> {
    switch (this.currentProvider) {
      case StorageProviderType.AWS_S3:
        return this.executeAwsS3Upload(file, options);
      default:
        throw new Error(`Unsupported storage provider: ${this.currentProvider}`);
    }
  }

  private async executeDelete(key: string, bucket: string): Promise<void> {
    switch (this.currentProvider) {
      case StorageProviderType.AWS_S3:
        return this.awsS3Service.deleteObject(key, bucket);
      default:
        throw new Error(`Unsupported storage provider: ${this.currentProvider}`);
    }
  }

  private async executeExists(key: string, bucket: string): Promise<boolean> {
    switch (this.currentProvider) {
      case StorageProviderType.AWS_S3:
        return this.awsS3Service.objectExists(key, bucket);
      default:
        throw new Error(`Unsupported storage provider: ${this.currentProvider}`);
    }
  }

  private async executeGetPresignedUrl(
    key: string,
    expiresIn: number,
    bucket: string,
  ): Promise<string> {
    switch (this.currentProvider) {
      case StorageProviderType.AWS_S3:
        return this.awsS3Service.getPresignedDownloadUrl(key, expiresIn, {
          bucket,
        });
      default:
        throw new Error(`Unsupported storage provider: ${this.currentProvider}`);
    }
  }

  private async executeGetPresignedUploadUrl(
    options: PresignedUploadOptions,
  ): Promise<PresignedUploadResult> {
    switch (this.currentProvider) {
      case StorageProviderType.AWS_S3:
        return this.executeAwsS3PresignedUploadUrl(options);
      default:
        throw new Error(`Unsupported storage provider: ${this.currentProvider}`);
    }
  }

  private async executeCopy(
    sourceKey: string,
    destinationKey: string,
    bucket: string,
  ): Promise<void> {
    switch (this.currentProvider) {
      case StorageProviderType.AWS_S3:
        return this.awsS3Service.copyObject(sourceKey, destinationKey, {
          sourceBucket: bucket,
          destinationBucket: bucket,
        });
      default:
        throw new Error(`Unsupported storage provider: ${this.currentProvider}`);
    }
  }

  private async executeGetMetadata(
    key: string,
    bucket: string,
  ): Promise<FileStorageMetadata> {
    switch (this.currentProvider) {
      case StorageProviderType.AWS_S3:
        return this.awsS3Service.getObjectMetadata(key, bucket);
      default:
        throw new Error(`Unsupported storage provider: ${this.currentProvider}`);
    }
  }

  private async executeInitializeChunkUpload(
    options: ChunkUploadInitOptions,
  ): Promise<ChunkUploadSession> {
    switch (this.currentProvider) {
      case StorageProviderType.AWS_S3:
        return this.executeAwsS3InitializeChunkUpload(options);
      default:
        throw new Error(`Unsupported storage provider: ${this.currentProvider}`);
    }
  }

  private async executeUploadChunk(
    sessionId: string,
    chunkNumber: number,
    chunkData: Buffer,
    options: {
      key: string;
      uploadId: string;
      bucket: string;
    },
  ): Promise<ChunkUploadResult> {
    switch (this.currentProvider) {
      case StorageProviderType.AWS_S3:
        return this.executeAwsS3UploadChunk(
          sessionId,
          chunkNumber,
          chunkData,
          options,
        );
      default:
        throw new Error(`Unsupported storage provider: ${this.currentProvider}`);
    }
  }

  private async executeCompleteChunkUpload(
    sessionId: string,
    options: {
      key: string;
      uploadId: string;
      parts: Array<{ PartNumber: number; ETag: string }>;
      bucket: string;
    },
  ): Promise<UploadResult> {
    switch (this.currentProvider) {
      case StorageProviderType.AWS_S3:
        return this.executeAwsS3CompleteChunkUpload(sessionId, options);
      default:
        throw new Error(`Unsupported storage provider: ${this.currentProvider}`);
    }
  }

  private async executeAbortChunkUpload(
    sessionId: string,
    options: {
      key: string;
      uploadId: string;
      bucket: string;
    },
  ): Promise<void> {
    switch (this.currentProvider) {
      case StorageProviderType.AWS_S3:
        return this.awsS3Service.abortMultipartUpload(
          options.key,
          options.uploadId,
          options.bucket,
        );
      default:
        throw new Error(`Unsupported storage provider: ${this.currentProvider}`);
    }
  }

  private async executeVerifyUpload(
    key: string,
    bucket: string,
  ): Promise<UploadVerificationResult> {
    switch (this.currentProvider) {
      case StorageProviderType.AWS_S3:
        return this.executeAwsS3VerifyUpload(key, bucket);
      default:
        throw new Error(`Unsupported storage provider: ${this.currentProvider}`);
    }
  }

  private async executeHealthCheck(): Promise<boolean> {
    switch (this.currentProvider) {
      case StorageProviderType.AWS_S3:
        return this.awsS3Service.healthCheck();
      default:
        throw new Error(`Unsupported storage provider: ${this.currentProvider}`);
    }
  }

  private async executeAwsS3Upload(
    file: Buffer,
    options: UploadOptions,
  ): Promise<UploadResult> {
    const s3Options = {
      contentType: options.contentType,
      metadata: {
        ...options.metadata,
        category: options.category,
        userId: options.userId,
        uploadedAt: new Date().toISOString(),
        ...(options.projectId && { projectId: options.projectId }),
        ...(options.sessionId && { sessionId: options.sessionId }),
        ...(options.retentionPolicy && { retentionPolicy: options.retentionPolicy }),
      },
      bucket: options.bucket,
      storageClass: options.storageClass,
    };

    const result = await this.awsS3Service.managedUpload(
      options.key,
      file,
      s3Options,
    );

    return {
      url: this.configService.s3CustomUrl
        ? `${this.configService.s3CustomUrl}/${options.key}`
        : result.url,
      key: createFileKey(options.key),
      size: file.length,
      etag: result.etag,
      metadata: options.metadata,
      uploadedAt: new Date(),
    };
  }

  private async executeAwsS3PresignedUploadUrl(
    options: PresignedUploadOptions,
  ): Promise<PresignedUploadResult> {
    const key = this.generateUploadKey(options.folder, options.userId);

    const uploadUrl = await this.awsS3Service.getPresignedUploadUrl(
      key,
      options.contentType,
      options.expiresIn || 3600,
      {
        bucket: options.bucket,
        contentLength: options.fileSize,
        metadata: {
          ...options.metadata,
          userId: options.userId,
          sessionId: options.sessionId,
          uploadedAt: new Date().toISOString(),
        },
      },
    );

    return {
      uploadUrl,
      key: createFileKey(key),
      sessionId: options.sessionId,
      expiresIn: options.expiresIn || 3600,
      conditions: options.conditions,
    };
  }

  private async executeAwsS3InitializeChunkUpload(
    options: ChunkUploadInitOptions,
  ): Promise<ChunkUploadSession> {
    const uploadId = await this.awsS3Service.createMultipartUpload(
      options.key,
      options.contentType,
      {
        bucket: options.bucket,
        metadata: options.metadata,
      },
    );

    return {
      sessionId: `${uploadId}-${Date.now()}`,
      uploadId,
      chunkSize: options.chunkSize,
      totalChunks: options.totalChunks,
    };
  }

  private async executeAwsS3UploadChunk(
    sessionId: string,
    chunkNumber: number,
    chunkData: Buffer,
    options: {
      key: string;
      uploadId: string;
      bucket: string;
    },
  ): Promise<ChunkUploadResult> {
    const etag = await this.awsS3Service.uploadPart(
      options.key,
      options.uploadId,
      chunkNumber,
      chunkData,
      options.bucket,
    );

    return {
      chunkNumber,
      etag,
      progress: 0,
      isComplete: false,
      nextChunk: chunkNumber + 1,
    };
  }

  private async executeAwsS3CompleteChunkUpload(
    sessionId: string,
    options: {
      key: string;
      uploadId: string;
      parts: Array<{ PartNumber: number; ETag: string }>;
      bucket: string;
    },
  ): Promise<UploadResult> {
    const location = await this.awsS3Service.completeMultipartUpload(
      options.key,
      options.uploadId,
      options.parts,
      options.bucket,
    );

    const totalSize = options.parts.reduce((sum, part) => sum + (part as any).Size || 0, 0);

    return {
      url: this.configService.s3CustomUrl
        ? `${this.configService.s3CustomUrl}/${options.key}`
        : location,
      key: createFileKey(options.key),
      size: totalSize,
      uploadedAt: new Date(),
    };
  }

  private async executeAwsS3VerifyUpload(
    key: string,
    bucket: string,
  ): Promise<UploadVerificationResult> {
    try {
      const exists = await this.awsS3Service.objectExists(key, bucket);

      if (!exists) {
        return {
          success: false,
          error: 'File not found',
        };
      }

      const metadata = await this.awsS3Service.getObjectMetadata(key, bucket);

      return {
        success: true,
        url: this.configService.s3CustomUrl
          ? `${this.configService.s3CustomUrl}/${key}`
          : `https://${bucket}.s3.amazonaws.com/${key}`,
        key: createFileKey(key),
        size: metadata.size,
        lastModified: metadata.lastModified,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private generateUploadKey(folder?: string, userId?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const basePath = folder || 'uploads';
    const userPath = userId ? `user-${userId}` : 'anonymous';

    return `${basePath}/${userPath}/${timestamp}-${random}`;
  }

  private logOperation(
    operation: string,
    data?: Record<string, unknown>,
  ): void {
    const sanitizedData = data ? this.sanitizeForLog(data) : {};
    this.logger.log(
      `🔄 Storage ${operation}`,
      JSON.stringify(sanitizedData, null, 2),
    );
  }

  private logError(
    operation: string,
    error: unknown,
    data?: Record<string, unknown>,
  ): void {
    const sanitizedData = data ? this.sanitizeForLog(data) : {};
    this.logger.error(`❌ Storage ${operation} failed`, {
      error: error instanceof Error ? error.message : String(error),
      data: sanitizedData,
    });
  }

  private sanitizeForLog(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...data };

    const sensitiveFields = [
      'accessKeyId',
      'secretAccessKey',
      'sessionToken',
      'buffer',
      'chunkData',
      'metadata.userId',
    ];

    sensitiveFields.forEach((field) => {
      const keys = field.split('.');
      let obj = sanitized;

      for (let i = 0; i < keys.length - 1; i++) {
        if (obj[keys[i]] && typeof obj[keys[i]] === 'object') {
          obj = obj[keys[i]] as Record<string, unknown>;
        } else {
          return;
        }
      }

      const lastKey = keys[keys.length - 1];
      if (obj[lastKey]) {
        obj[lastKey] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}