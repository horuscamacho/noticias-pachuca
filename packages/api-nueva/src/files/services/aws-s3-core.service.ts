import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListObjectsV2Command,
  StorageClass,
  ServerSideEncryption,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';

import { AppConfigService } from '../../config/config.service';

@Injectable()
export class AwsS3CoreService implements OnModuleInit {
  private readonly logger = new Logger(AwsS3CoreService.name);
  private s3Client: S3Client;

  constructor(private readonly configService: AppConfigService) {}

  onModuleInit() {
    this.initializeS3Client();
  }

  private initializeS3Client(): void {
    try {
      const awsConfig = this.configService.awsConfig;

      this.s3Client = new S3Client({
        region: awsConfig.region,
        credentials: {
          accessKeyId: awsConfig.accessKeyId,
          secretAccessKey: awsConfig.secretAccessKey,
        },
        // Performance optimizations
        maxAttempts: 3,
        retryMode: 'adaptive',
        requestHandler: {
          timeout: 30000, // 30 seconds
          connectionTimeout: 5000, // 5 seconds
        },
      });

      this.logger.log(`✅ AWS S3 Client initialized for region: ${awsConfig.region}`);

      if (this.configService.isDevelopment) {
        this.logger.warn('⚠️ Running in DEVELOPMENT mode with AWS S3');
      }
    } catch (error) {
      this.logger.error('❌ Error initializing AWS S3 Client:', error);
      throw error;
    }
  }

  // Getter for S3 client
  get client(): S3Client {
    if (!this.s3Client) {
      throw new Error('AWS S3 Client not initialized');
    }
    return this.s3Client;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.configService.s3Bucket,
        MaxKeys: 1,
      });

      await this.s3Client.send(command);
      this.logger.log('✅ AWS S3 health check passed');
      return true;
    } catch (error) {
      this.logger.error('❌ AWS S3 health check failed:', error);
      return false;
    }
  }

  // Put object
  async putObject(
    key: string,
    body: Buffer | Uint8Array | string,
    options: {
      contentType?: string;
      metadata?: Record<string, string>;
      bucket?: string;
      storageClass?: string;
      serverSideEncryption?: string;
      cacheControl?: string;
      contentDisposition?: string;
    } = {}
  ): Promise<{ etag: string; versionId?: string }> {
    try {
      const bucket = options.bucket || this.configService.s3Bucket;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: options.metadata,
        StorageClass: (options.storageClass as StorageClass) || StorageClass.STANDARD,
        ServerSideEncryption: (options.serverSideEncryption as ServerSideEncryption) || ServerSideEncryption.AES256,
        CacheControl: options.cacheControl,
        ContentDisposition: options.contentDisposition,
      });

      this.logS3Operation('putObject', { key, bucket, contentType: options.contentType });

      const result = await this.s3Client.send(command);

      return {
        etag: result.ETag || '',
        versionId: result.VersionId,
      };
    } catch (error) {
      this.logS3Error('putObject', error, { key, bucket: options.bucket });
      throw error;
    }
  }

  // Get object
  async getObject(
    key: string,
    options: {
      bucket?: string;
      range?: string;
    } = {}
  ): Promise<Buffer> {
    try {
      const bucket = options.bucket || this.configService.s3Bucket;

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        Range: options.range,
      });

      this.logS3Operation('getObject', { key, bucket });

      const result = await this.s3Client.send(command);

      if (!result.Body) {
        throw new Error('Object body is empty');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const stream = result.Body as NodeJS.ReadableStream;

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error) {
      this.logS3Error('getObject', error, { key, bucket: options.bucket });
      throw error;
    }
  }

  // Check if object exists
  async objectExists(
    key: string,
    bucket?: string
  ): Promise<boolean> {
    try {
      const bucketName = bucket || this.configService.s3Bucket;

      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if ((error as any).name === 'NotFound') {
        return false;
      }
      this.logS3Error('objectExists', error, { key, bucket });
      throw error;
    }
  }

  // Get object metadata
  async getObjectMetadata(
    key: string,
    bucket?: string
  ): Promise<{
    size: number;
    lastModified: Date;
    etag: string;
    contentType: string;
    metadata: Record<string, string>;
  }> {
    try {
      const bucketName = bucket || this.configService.s3Bucket;

      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      this.logS3Operation('getObjectMetadata', { key, bucket: bucketName });

      const result = await this.s3Client.send(command);

      return {
        size: result.ContentLength || 0,
        lastModified: result.LastModified || new Date(),
        etag: result.ETag || '',
        contentType: result.ContentType || 'application/octet-stream',
        metadata: result.Metadata || {},
      };
    } catch (error) {
      this.logS3Error('getObjectMetadata', error, { key, bucket });
      throw error;
    }
  }

  // Delete object
  async deleteObject(
    key: string,
    bucket?: string
  ): Promise<void> {
    try {
      const bucketName = bucket || this.configService.s3Bucket;

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      this.logS3Operation('deleteObject', { key, bucket: bucketName });

      await this.s3Client.send(command);
    } catch (error) {
      this.logS3Error('deleteObject', error, { key, bucket });
      throw error;
    }
  }

  // Copy object
  async copyObject(
    sourceKey: string,
    destinationKey: string,
    options: {
      sourceBucket?: string;
      destinationBucket?: string;
      metadata?: Record<string, string>;
      metadataDirective?: 'COPY' | 'REPLACE';
    } = {}
  ): Promise<void> {
    try {
      const sourceBucket = options.sourceBucket || this.configService.s3Bucket;
      const destinationBucket = options.destinationBucket || this.configService.s3Bucket;

      const command = new CopyObjectCommand({
        Bucket: destinationBucket,
        Key: destinationKey,
        CopySource: `${sourceBucket}/${sourceKey}`,
        Metadata: options.metadata,
        MetadataDirective: options.metadataDirective || 'COPY',
      });

      this.logS3Operation('copyObject', {
        sourceKey,
        destinationKey,
        sourceBucket,
        destinationBucket,
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logS3Error('copyObject', error, {
        sourceKey,
        destinationKey,
        sourceBucket: options.sourceBucket,
        destinationBucket: options.destinationBucket,
      });
      throw error;
    }
  }

  // Generate presigned URL for download
  async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
    options: {
      bucket?: string;
      responseContentDisposition?: string;
      responseContentType?: string;
    } = {}
  ): Promise<string> {
    try {
      const bucket = options.bucket || this.configService.s3Bucket;

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentDisposition: options.responseContentDisposition,
        ResponseContentType: options.responseContentType,
      });

      this.logS3Operation('getPresignedDownloadUrl', { key, bucket, expiresIn });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logS3Error('getPresignedDownloadUrl', error, { key, bucket: options.bucket });
      throw error;
    }
  }

  // Generate presigned URL for upload
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600,
    options: {
      bucket?: string;
      contentLength?: number;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<string> {
    try {
      const bucket = options.bucket || this.configService.s3Bucket;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: options.contentLength,
        Metadata: options.metadata,
      });

      this.logS3Operation('getPresignedUploadUrl', {
        key,
        bucket,
        contentType,
        expiresIn,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logS3Error('getPresignedUploadUrl', error, {
        key,
        bucket: options.bucket,
        contentType,
      });
      throw error;
    }
  }

  // Multipart upload methods
  async createMultipartUpload(
    key: string,
    contentType: string,
    options: {
      bucket?: string;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<string> {
    try {
      const bucket = options.bucket || this.configService.s3Bucket;

      const command = new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        Metadata: options.metadata,
      });

      this.logS3Operation('createMultipartUpload', { key, bucket, contentType });

      const result = await this.s3Client.send(command);

      if (!result.UploadId) {
        throw new Error('Failed to create multipart upload');
      }

      return result.UploadId;
    } catch (error) {
      this.logS3Error('createMultipartUpload', error, {
        key,
        bucket: options.bucket,
        contentType,
      });
      throw error;
    }
  }

  async uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer,
    bucket?: string
  ): Promise<string> {
    try {
      const bucketName = bucket || this.configService.s3Bucket;

      const command = new UploadPartCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: body,
      });

      this.logS3Operation('uploadPart', {
        key,
        bucket: bucketName,
        uploadId,
        partNumber,
        bodySize: body.length,
      });

      const result = await this.s3Client.send(command);

      if (!result.ETag) {
        throw new Error(`Failed to upload part ${partNumber}`);
      }

      return result.ETag;
    } catch (error) {
      this.logS3Error('uploadPart', error, {
        key,
        bucket,
        uploadId,
        partNumber,
      });
      throw error;
    }
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ PartNumber: number; ETag: string }>,
    bucket?: string
  ): Promise<string> {
    try {
      const bucketName = bucket || this.configService.s3Bucket;

      const command = new CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts,
        },
      });

      this.logS3Operation('completeMultipartUpload', {
        key,
        bucket: bucketName,
        uploadId,
        partsCount: parts.length,
      });

      const result = await this.s3Client.send(command);

      if (!result.Location) {
        throw new Error('Failed to complete multipart upload');
      }

      return result.Location;
    } catch (error) {
      this.logS3Error('completeMultipartUpload', error, {
        key,
        bucket,
        uploadId,
        partsCount: parts.length,
      });
      throw error;
    }
  }

  async abortMultipartUpload(
    key: string,
    uploadId: string,
    bucket?: string
  ): Promise<void> {
    try {
      const bucketName = bucket || this.configService.s3Bucket;

      const command = new AbortMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: uploadId,
      });

      this.logS3Operation('abortMultipartUpload', {
        key,
        bucket: bucketName,
        uploadId,
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logS3Error('abortMultipartUpload', error, {
        key,
        bucket,
        uploadId,
      });
      throw error;
    }
  }

  // Helper for managed uploads (handles multipart automatically)
  async managedUpload(
    key: string,
    body: Buffer | Uint8Array | string,
    options: {
      contentType?: string;
      metadata?: Record<string, string>;
      bucket?: string;
      partSize?: number;
      queueSize?: number;
    } = {}
  ): Promise<{ url: string; etag: string }> {
    try {
      const bucket = options.bucket || this.configService.s3Bucket;

      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: options.contentType || 'application/octet-stream',
          Metadata: options.metadata,
        },
        partSize: options.partSize || 1024 * 1024 * 10, // 10MB
        queueSize: options.queueSize || 4,
        leavePartsOnError: false,
      });

      this.logS3Operation('managedUpload', {
        key,
        bucket,
        contentType: options.contentType,
        bodySize: typeof body === 'string' ? body.length : body.byteLength,
      });

      const result = await upload.done();

      return {
        url: result.Location || `https://${bucket}.s3.amazonaws.com/${key}`,
        etag: result.ETag || '',
      };
    } catch (error) {
      this.logS3Error('managedUpload', error, {
        key,
        bucket: options.bucket,
        contentType: options.contentType,
      });
      throw error;
    }
  }

  // Logging helpers
  private logS3Operation(operation: string, data?: Record<string, unknown>): void {
    const sanitizedData = data ? this.sanitizeForLog(data) : {};
    this.logger.log(`🔄 S3 ${operation}`, JSON.stringify(sanitizedData, null, 2));
  }

  private logS3Error(
    operation: string,
    error: unknown,
    data?: Record<string, unknown>
  ): void {
    const sanitizedData = data ? this.sanitizeForLog(data) : {};
    this.logger.error(`❌ S3 ${operation} failed`, {
      error: error instanceof Error ? error.message : String(error),
      data: sanitizedData,
    });
  }

  private sanitizeForLog(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...data };

    // Remove sensitive fields
    const sensitiveFields = [
      'accessKeyId',
      'secretAccessKey',
      'sessionToken',
      'body',
      'buffer',
    ];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}