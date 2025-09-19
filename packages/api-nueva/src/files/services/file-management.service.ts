import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import * as path from 'path';
import { Express } from 'express';
import 'multer';

import { StorageProviderService } from './storage-provider.service';
import { AppConfigService } from '../../config/config.service';
import { PaginationService } from '../../common/services/pagination.service';
import {
  FileMetadata,
  FileMetadataDocument,
  FileType,
  FileCategory,
  ProcessingStatus,
  AccessLevel,
} from '../schemas/file-metadata.schema';
import {
  UploadSession,
  UploadSessionDocument,
  UploadType,
  UploadStatus,
  ChunkInfo,
} from '../schemas/upload-session.schema';
import {
  FileUploadDto,
  MultipleFileUploadDto,
  PresignedUrlRequestDto,
  ChunkUploadInitDto,
  ChunkUploadDto,
  CompleteChunkUploadDto,
  FileQueryDto,
  UpdateFileMetadataDto,
  GenerateDownloadUrlDto,
  BulkDeleteDto,
  BulkUpdateDto,
} from '../dto/file-upload.dto';
import {
  UploadOptions,
  UploadResult,
  PresignedUploadOptions,
  PresignedUploadResult,
  ChunkUploadInitOptions,
  ChunkUploadSession,
  ChunkUploadResult,
  UploadVerificationResult,
  FileStatistics,
  StorageUsage,
  createFileKey,
  createUserId,
  createSessionId,
} from '../interfaces/file.interface';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

interface FileUploadEvent {
  readonly fileId: string;
  readonly userId: string;
  readonly fileKey: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly fileType: FileType;
  readonly category: FileCategory;
  readonly uploadedAt: Date;
}

interface FileProcessingEvent {
  readonly fileId: string;
  readonly status: ProcessingStatus;
  readonly processingStartedAt?: Date;
  readonly processingCompletedAt?: Date;
  readonly errorMessage?: string;
}

@Injectable()
export class FileManagementService {
  private readonly logger = new Logger(FileManagementService.name);

  constructor(
    @InjectModel(FileMetadata.name)
    private readonly fileMetadataModel: Model<FileMetadataDocument>,
    @InjectModel(UploadSession.name)
    private readonly uploadSessionModel: Model<UploadSessionDocument>,
    private readonly storageProvider: StorageProviderService,
    private readonly configService: AppConfigService,
    private readonly paginationService: PaginationService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('🔧 File Management Service initialized');
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadDto: FileUploadDto,
    userId: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
    } = {},
  ): Promise<FileMetadata> {
    try {
      this.logOperation('uploadFile', {
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        category: uploadDto.category,
        userId,
      });

      const fileType = this.determineFileType(file.mimetype);
      const validationResult = this.validateFile(file, fileType);

      if (!validationResult.success) {
        throw new BadRequestException(`File validation failed: ${validationResult.errors?.join(', ')}`);
      }

      const sessionId = this.generateSessionId();
      const fileKey = this.generateFileKey(file.originalname, uploadDto.folder, uploadDto.category);
      const checksum = this.calculateChecksum(file.buffer);

      const existingFile = await this.fileMetadataModel.findOne({ checksum }).exec();
      if (existingFile && !existingFile.deletedAt) {
        this.logger.warn(`⚠️ Duplicate file detected: ${checksum}`);
        if (this.configService.filesConfig.allowDuplicates) {
          this.logger.log('🔄 Allowing duplicate upload as per configuration');
        } else {
          throw new ConflictException('File already exists');
        }
      }

      const uploadOptions: UploadOptions = {
        bucket: this.configService.s3Bucket,
        key: fileKey,
        contentType: file.mimetype,
        folder: uploadDto.folder,
        category: uploadDto.category,
        userId,
        projectId: uploadDto.projectId,
        sessionId,
        metadata: {
          ...uploadDto.metadata,
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
        tags: uploadDto.tags,
        isPublic: uploadDto.isPublic,
        accessLevel: uploadDto.accessLevel,
        expiresAt: uploadDto.expiresAt ? new Date(uploadDto.expiresAt) : undefined,
        retentionPolicy: uploadDto.retentionPolicy,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      };

      const uploadResult = await this.storageProvider.upload(file.buffer, uploadOptions);

      const fileMetadata = await this.createFileMetadata({
        key: fileKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        type: fileType,
        category: uploadDto.category,
        size: file.size,
        bucket: this.configService.s3Bucket,
        folder: uploadDto.folder || 'uploads',
        url: uploadResult.url,
        uploadedBy: new Types.ObjectId(userId),
        uploadSession: sessionId,
        metadata: uploadDto.metadata || {},
        tags: uploadDto.tags || {},
        processingStatus: ProcessingStatus.PENDING,
        checksum,
        accessLevel: uploadDto.accessLevel || AccessLevel.PRIVATE,
        isPublic: uploadDto.isPublic || false,
        expiresAt: uploadDto.expiresAt ? new Date(uploadDto.expiresAt) : undefined,
        retentionPolicy: uploadDto.retentionPolicy,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      });

      this.eventEmitter.emit('file.uploaded', {
        fileId: (fileMetadata as unknown as { _id: Types.ObjectId })._id.toString(),
        userId,
        fileKey,
        fileName: file.originalname,
        fileSize: file.size,
        fileType,
        category: uploadDto.category,
        uploadedAt: new Date(),
      } as FileUploadEvent);

      this.logger.log(`✅ File uploaded successfully: ${fileKey}`);
      return fileMetadata;
    } catch (error) {
      this.logError('uploadFile', error, {
        originalName: file.originalname,
        userId,
        category: uploadDto.category,
      });
      throw error;
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    uploadDto: MultipleFileUploadDto,
    userId: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
    } = {},
  ): Promise<FileMetadata[]> {
    try {
      this.logOperation('uploadMultipleFiles', {
        fileCount: files.length,
        maxFiles: uploadDto.maxFiles,
        category: uploadDto.category,
        userId,
      });

      if (files.length > (uploadDto.maxFiles || 5)) {
        throw new BadRequestException(`Too many files. Maximum allowed: ${uploadDto.maxFiles || 5}`);
      }

      const results: FileMetadata[] = [];
      const errors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        try {
          const fileUploadDto: FileUploadDto = {
            category: uploadDto.category,
            folder: uploadDto.folder,
            projectId: uploadDto.projectId,
            metadata: {
              ...uploadDto.metadata,
              batchIndex: i.toString(),
              batchTotal: files.length.toString(),
            },
            tags: uploadDto.tags,
            isPublic: uploadDto.isPublic,
            accessLevel: uploadDto.accessLevel,
            expiresAt: uploadDto.expiresAt,
            retentionPolicy: uploadDto.retentionPolicy,
          };

          const result = await this.uploadFile(files[i], fileUploadDto, userId, options);
          results.push(result);
        } catch (error) {
          const errorMessage = `File ${i + 1} (${files[i].originalname}): ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
          this.logger.error(`❌ Failed to upload file ${i + 1}:`, errorMessage);
        }
      }

      if (errors.length > 0 && results.length === 0) {
        throw new BadRequestException(`All file uploads failed: ${errors.join('; ')}`);
      }

      if (errors.length > 0) {
        this.logger.warn(`⚠️ Partial upload success. ${results.length}/${files.length} files uploaded. Errors: ${errors.join('; ')}`);
      }

      this.logger.log(`✅ Multiple files uploaded: ${results.length}/${files.length} successful`);
      return results;
    } catch (error) {
      this.logError('uploadMultipleFiles', error, {
        fileCount: files.length,
        userId,
        category: uploadDto.category,
      });
      throw error;
    }
  }

  async generatePresignedUploadUrl(
    requestDto: PresignedUrlRequestDto,
    userId: string,
  ): Promise<PresignedUploadResult> {
    try {
      this.logOperation('generatePresignedUploadUrl', {
        contentType: requestDto.contentType,
        fileSize: requestDto.fileSize,
        filename: requestDto.filename,
        category: requestDto.category,
        userId,
      });

      const fileType = this.determineFileType(requestDto.contentType);
      const validationResult = this.validateFileRequest(requestDto, fileType);

      if (!validationResult.success) {
        throw new BadRequestException(`File validation failed: ${validationResult.errors?.join(', ')}`);
      }

      const sessionId = this.generateSessionId();

      const uploadSession = await this.createUploadSession({
        sessionId,
        userId: new Types.ObjectId(userId),
        uploadType: UploadType.PRESIGNED,
        bucket: this.configService.s3Bucket,
        originalFileName: requestDto.filename,
        mimeType: requestDto.contentType,
        fileSize: requestDto.fileSize,
        metadata: requestDto.metadata || {},
        uploadOptions: {
          category: requestDto.category,
          folder: requestDto.folder,
          expiresIn: requestDto.expiresIn,
        },
      });

      const presignedOptions: PresignedUploadOptions = {
        bucket: this.configService.s3Bucket,
        contentType: requestDto.contentType,
        fileSize: requestDto.fileSize,
        folder: requestDto.folder,
        userId,
        sessionId,
        expiresIn: requestDto.expiresIn,
        metadata: requestDto.metadata,
      };

      const result = await this.storageProvider.getPresignedUploadUrl(presignedOptions);

      await uploadSession.updateOne({
        presignedUrl: result.uploadUrl,
        presignedUrlExpiresAt: new Date(Date.now() + (requestDto.expiresIn || 3600) * 1000),
        key: result.key,
      });

      this.logger.log(`✅ Presigned upload URL generated: ${sessionId}`);
      return result;
    } catch (error) {
      this.logError('generatePresignedUploadUrl', error, {
        contentType: requestDto.contentType,
        userId,
        category: requestDto.category,
      });
      throw error;
    }
  }

  async verifyPresignedUpload(sessionId: string): Promise<UploadVerificationResult> {
    try {
      this.logOperation('verifyPresignedUpload', { sessionId });

      const session = await this.uploadSessionModel.findOne({ sessionId }).exec();
      if (!session) {
        throw new NotFoundException('Upload session not found');
      }

      if (!session.key) {
        throw new BadRequestException('Upload session has no associated file key');
      }

      const verificationResult = await this.storageProvider.verifyUpload(
        session.key,
        session.bucket,
      );

      if (verificationResult.success) {
        await session.updateOne({
          status: UploadStatus.COMPLETED,
          completedAt: new Date(),
          lastActivityAt: new Date(),
          resultFileKeys: [session.key]
        });

        if (session.originalFileName && session.mimeType && verificationResult.size) {
          const fileType = this.determineFileType(session.mimeType);
          const checksum = await this.calculateFileChecksum(session.key);

          await this.createFileMetadata({
            key: session.key,
            originalName: session.originalFileName,
            mimeType: session.mimeType,
            type: fileType,
            category: (session.uploadOptions as any)?.category || FileCategory.USER_UPLOAD,
            size: verificationResult.size,
            bucket: session.bucket || this.configService.s3Bucket,
            folder: (session.uploadOptions as any)?.folder || 'uploads',
            url: verificationResult.url || '',
            uploadedBy: session.userId,
            uploadSession: sessionId,
            metadata: session.metadata,
            processingStatus: ProcessingStatus.PENDING,
            checksum,
            accessLevel: AccessLevel.PRIVATE,
            isPublic: false,
          });
        }

        this.logger.log(`✅ Presigned upload verified: ${sessionId}`);
      } else {
        await session.updateOne({
          status: UploadStatus.FAILED,
          errorMessage: 'Upload verification failed',
          errorDetails: { error: verificationResult.error },
          lastActivityAt: new Date()
        });
        this.logger.error(`❌ Presigned upload verification failed: ${sessionId}`);
      }

      return verificationResult;
    } catch (error) {
      this.logError('verifyPresignedUpload', error, { sessionId });
      throw error;
    }
  }

  async initializeChunkUpload(
    initDto: ChunkUploadInitDto,
    userId: string,
  ): Promise<ChunkUploadSession> {
    try {
      this.logOperation('initializeChunkUpload', {
        filename: initDto.filename,
        fileSize: initDto.fileSize,
        totalChunks: initDto.totalChunks,
        chunkSize: initDto.chunkSize,
        category: initDto.category,
        userId,
      });

      const fileType = this.determineFileType(initDto.contentType);
      const validationResult = this.validateChunkUploadRequest(initDto, fileType);

      if (!validationResult.success) {
        throw new BadRequestException(`Chunk upload validation failed: ${validationResult.errors?.join(', ')}`);
      }

      const sessionId = this.generateSessionId();
      const fileKey = this.generateFileKey(initDto.filename, initDto.folder, initDto.category);

      const initOptions: ChunkUploadInitOptions = {
        bucket: this.configService.s3Bucket,
        key: fileKey,
        contentType: initDto.contentType,
        totalChunks: initDto.totalChunks,
        chunkSize: initDto.chunkSize,
        fileSize: initDto.fileSize,
        metadata: {
          ...initDto.metadata,
          originalName: initDto.filename,
          userId,
          sessionId,
        },
      };

      const chunkSession = await this.storageProvider.initializeChunkUpload(initOptions);

      await this.createUploadSession({
        sessionId,
        userId: new Types.ObjectId(userId),
        uploadType: UploadType.CHUNK,
        bucket: this.configService.s3Bucket,
        key: fileKey,
        uploadId: chunkSession.uploadId,
        originalFileName: initDto.filename,
        mimeType: initDto.contentType,
        fileSize: initDto.fileSize,
        totalChunks: initDto.totalChunks,
        metadata: initDto.metadata || {},
        uploadOptions: {
          category: initDto.category,
          folder: initDto.folder,
          chunkSize: initDto.chunkSize,
        },
      });

      this.logger.log(`✅ Chunk upload initialized: ${sessionId}`);
      return chunkSession;
    } catch (error) {
      this.logError('initializeChunkUpload', error, {
        filename: initDto.filename,
        userId,
        category: initDto.category,
      });
      throw error;
    }
  }

  async uploadChunk(
    chunkDto: ChunkUploadDto,
    chunkData: Buffer,
  ): Promise<ChunkUploadResult> {
    try {
      this.logOperation('uploadChunk', {
        sessionId: chunkDto.sessionId,
        chunkNumber: chunkDto.chunkNumber,
        chunkSize: chunkData.length,
      });

      const session = await this.uploadSessionModel.findOne({
        sessionId: chunkDto.sessionId,
      }).exec();

      if (!session) {
        throw new NotFoundException('Upload session not found');
      }

      if (session.status !== UploadStatus.INITIALIZED && session.status !== UploadStatus.IN_PROGRESS) {
        throw new BadRequestException(`Invalid session status: ${session.status}`);
      }

      if (!session.key || !session.uploadId) {
        throw new BadRequestException('Session missing required upload information');
      }

      if (session.status === UploadStatus.INITIALIZED) {
        await session.updateOne({
          status: UploadStatus.IN_PROGRESS,
          startedAt: new Date(),
          lastActivityAt: new Date()
        });
      }

      const result = await this.storageProvider.uploadChunk(
        chunkDto.sessionId,
        chunkDto.chunkNumber,
        chunkData,
        {
          key: session.key,
          uploadId: session.uploadId,
          bucket: session.bucket,
        },
      );

      const chunkInfo: ChunkInfo = {
        chunkNumber: chunkDto.chunkNumber,
        size: chunkData.length,
        etag: result.etag,
        uploadedAt: new Date(),
      };

      await session.updateOne({
        $push: { chunks: chunkInfo },
        $inc: { uploadedChunks: 1, uploadedBytes: chunkData.length },
        lastActivityAt: new Date()
      });

      this.logger.log(`✅ Chunk uploaded: ${chunkDto.sessionId} - chunk ${chunkDto.chunkNumber}`);
      return result;
    } catch (error) {
      this.logError('uploadChunk', error, {
        sessionId: chunkDto.sessionId,
        chunkNumber: chunkDto.chunkNumber,
      });
      throw error;
    }
  }

  async completeChunkUpload(
    completeDto: CompleteChunkUploadDto,
  ): Promise<FileMetadata> {
    try {
      this.logOperation('completeChunkUpload', {
        sessionId: completeDto.sessionId,
      });

      const session = await this.uploadSessionModel.findOne({
        sessionId: completeDto.sessionId,
      }).exec();

      if (!session) {
        throw new NotFoundException('Upload session not found');
      }

      if (!session.key || !session.uploadId) {
        throw new BadRequestException('Session missing required upload information');
      }

      if (session.uploadedChunks !== session.totalChunks) {
        throw new BadRequestException(
          `Upload incomplete: ${session.uploadedChunks}/${session.totalChunks} chunks uploaded`,
        );
      }

      const parts = session.chunks.map((chunk) => ({
        PartNumber: chunk.chunkNumber,
        ETag: chunk.etag,
      }));

      const uploadResult = await this.storageProvider.completeChunkUpload(
        completeDto.sessionId,
        {
          key: session.key,
          uploadId: session.uploadId,
          parts,
          bucket: session.bucket,
        },
      );

      const fileType = this.determineFileType(session.mimeType || '');
      const checksum = await this.calculateFileChecksum(session.key);

      const fileMetadata = await this.createFileMetadata({
        key: session.key,
        originalName: session.originalFileName || 'chunk-upload',
        mimeType: session.mimeType || 'application/octet-stream',
        type: fileType,
        category: (session.uploadOptions as any)?.category || FileCategory.USER_UPLOAD,
        size: session.fileSize || uploadResult.size,
        bucket: session.bucket || this.configService.s3Bucket,
        folder: (session.uploadOptions as any)?.folder || 'uploads',
        url: uploadResult.url,
        uploadedBy: session.userId,
        uploadSession: completeDto.sessionId,
        metadata: session.metadata,
        processingStatus: ProcessingStatus.PENDING,
        checksum,
        accessLevel: AccessLevel.PRIVATE,
        isPublic: false,
      });

      await session.updateOne({
        status: UploadStatus.COMPLETED,
        completedAt: new Date(),
        lastActivityAt: new Date(),
        resultFileKeys: [session.key]
      });

      this.eventEmitter.emit('file.uploaded', {
        fileId: (fileMetadata as unknown as { _id: Types.ObjectId })._id.toString(),
        userId: session.userId.toString(),
        fileKey: session.key,
        fileName: session.originalFileName || 'chunk-upload',
        fileSize: session.fileSize || uploadResult.size,
        fileType,
        category: (session.uploadOptions as any)?.category || FileCategory.USER_UPLOAD,
        uploadedAt: new Date(),
      } as FileUploadEvent);

      this.logger.log(`✅ Chunk upload completed: ${completeDto.sessionId}`);
      return fileMetadata;
    } catch (error) {
      this.logError('completeChunkUpload', error, {
        sessionId: completeDto.sessionId,
      });
      throw error;
    }
  }

  async getFiles(
    queryDto: FileQueryDto,
    userId?: string,
  ): Promise<PaginatedResponse<FileMetadata>> {
    try {
      this.logOperation('getFiles', {
        ...queryDto,
        userId,
      });

      const filter: Record<string, unknown> = {};

      if (userId) {
        filter.uploadedBy = new Types.ObjectId(userId);
      }

      if (queryDto.type) {
        filter.type = queryDto.type;
      }

      if (queryDto.category) {
        filter.category = queryDto.category;
      }

      if (queryDto.folder) {
        filter.folder = new RegExp(queryDto.folder, 'i');
      }

      if (queryDto.processingStatus) {
        filter.processingStatus = queryDto.processingStatus;
      }

      if (queryDto.accessLevel) {
        filter.accessLevel = queryDto.accessLevel;
      }

      if (queryDto.search) {
        filter.$text = { $search: queryDto.search };
      }

      if (queryDto.minSize || queryDto.maxSize) {
        filter.size = {};
        if (queryDto.minSize) {
          (filter.size as any).$gte = queryDto.minSize;
        }
        if (queryDto.maxSize) {
          (filter.size as any).$lte = queryDto.maxSize;
        }
      }

      if (queryDto.dateFrom || queryDto.dateTo) {
        filter.createdAt = {};
        if (queryDto.dateFrom) {
          (filter.createdAt as any).$gte = new Date(queryDto.dateFrom);
        }
        if (queryDto.dateTo) {
          (filter.createdAt as any).$lte = new Date(queryDto.dateTo);
        }
      }

      const sort: Record<string, 1 | -1> = {};
      if (queryDto.sortBy) {
        sort[queryDto.sortBy] = queryDto.sortOrder === 'asc' ? 1 : -1;
      }

      const options = {
        includeDeleted: queryDto.includeDeleted,
      };

      const result = await this.paginationService.paginate(
        this.fileMetadataModel,
        queryDto,
        filter,
        { sort, ...options },
      );

      return result;
    } catch (error) {
      this.logError('getFiles', error, { queryDto, userId });
      throw error;
    }
  }

  async getFileById(
    fileId: string,
    userId?: string,
  ): Promise<FileMetadata> {
    try {
      this.logOperation('getFileById', { fileId, userId });

      const filter: Record<string, unknown> = { _id: new Types.ObjectId(fileId) };

      if (userId) {
        filter.uploadedBy = new Types.ObjectId(userId);
      }

      const file = await this.fileMetadataModel.findOne(filter).exec();

      if (!file) {
        throw new NotFoundException('File not found');
      }

      await file.updateOne({
        lastAccessedAt: new Date(),
        $inc: { downloadCount: 1 }
      });

      return file;
    } catch (error) {
      this.logError('getFileById', error, { fileId, userId });
      throw error;
    }
  }

  async updateFileMetadata(
    fileId: string,
    updateDto: UpdateFileMetadataDto,
    userId?: string,
  ): Promise<FileMetadata> {
    try {
      this.logOperation('updateFileMetadata', { fileId, updateDto, userId });

      const filter: Record<string, unknown> = { _id: new Types.ObjectId(fileId) };

      if (userId) {
        filter.uploadedBy = new Types.ObjectId(userId);
      }

      const file = await this.fileMetadataModel.findOne(filter).exec();

      if (!file) {
        throw new NotFoundException('File not found');
      }

      const updateData: Partial<FileMetadata> = {};

      if (updateDto.originalName) {
        updateData.originalName = updateDto.originalName;
      }

      if (updateDto.metadata) {
        updateData.metadata = { ...file.metadata, ...updateDto.metadata };
      }

      if (updateDto.tags) {
        updateData.tags = { ...file.tags, ...updateDto.tags };
      }

      if (updateDto.accessLevel !== undefined) {
        updateData.accessLevel = updateDto.accessLevel;
      }

      if (updateDto.isPublic !== undefined) {
        updateData.isPublic = updateDto.isPublic;
      }

      if (updateDto.expiresAt) {
        updateData.expiresAt = new Date(updateDto.expiresAt);
      }

      const updatedFile = await this.fileMetadataModel
        .findByIdAndUpdate(fileId, updateData, { new: true })
        .exec();

      if (!updatedFile) {
        throw new NotFoundException('File not found after update');
      }

      this.logger.log(`✅ File metadata updated: ${fileId}`);
      return updatedFile;
    } catch (error) {
      this.logError('updateFileMetadata', error, { fileId, userId });
      throw error;
    }
  }

  async generateDownloadUrl(
    fileId: string,
    downloadDto: GenerateDownloadUrlDto,
    userId?: string,
  ): Promise<{ url: string; expiresIn: number }> {
    try {
      this.logOperation('generateDownloadUrl', { fileId, downloadDto, userId });

      const file = await this.getFileById(fileId, userId);

      if (file.accessLevel === AccessLevel.PRIVATE && !userId) {
        throw new BadRequestException('Authentication required for private files');
      }

      const options: Record<string, string> = {};

      if (downloadDto.forceDownload) {
        options.responseContentDisposition = `attachment; filename="${downloadDto.downloadFilename || file.originalName}"`;
      }

      const url = await this.storageProvider.getPresignedUrl(
        file.key,
        downloadDto.expiresIn || 3600,
        file.bucket,
      );

      this.logger.log(`✅ Download URL generated: ${fileId}`);
      return {
        url,
        expiresIn: downloadDto.expiresIn || 3600,
      };
    } catch (error) {
      this.logError('generateDownloadUrl', error, { fileId, userId });
      throw error;
    }
  }

  async deleteFile(fileId: string, userId?: string, reason?: string): Promise<void> {
    try {
      this.logOperation('deleteFile', { fileId, userId, reason });

      const filter: Record<string, unknown> = { _id: new Types.ObjectId(fileId) };

      if (userId) {
        filter.uploadedBy = new Types.ObjectId(userId);
      }

      const file = await this.fileMetadataModel.findOne(filter).exec();

      if (!file) {
        throw new NotFoundException('File not found');
      }

      await file.updateOne({
        deletedAt: new Date(),
        deletedBy: userId ? new Types.ObjectId(userId) : undefined,
        deleteReason: reason
      });

      if (this.configService.filesConfig.deleteFromStorage) {
        try {
          await this.storageProvider.delete(file.key, file.bucket);
        } catch (storageError) {
          this.logger.error('⚠️ Failed to delete file from storage:', storageError);
        }
      }

      this.logger.log(`✅ File deleted: ${fileId}`);
    } catch (error) {
      this.logError('deleteFile', error, { fileId, userId });
      throw error;
    }
  }

  async bulkDelete(bulkDeleteDto: BulkDeleteDto, userId?: string): Promise<{ deleted: number; failed: string[] }> {
    try {
      this.logOperation('bulkDelete', { fileIds: bulkDeleteDto.fileIds, userId, reason: bulkDeleteDto.reason });

      const results = { deleted: 0, failed: [] as string[] };

      for (const fileId of bulkDeleteDto.fileIds) {
        try {
          await this.deleteFile(fileId, userId, bulkDeleteDto.reason);
          results.deleted++;
        } catch (error) {
          results.failed.push(`${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.logger.log(`✅ Bulk delete completed: ${results.deleted}/${bulkDeleteDto.fileIds.length} files deleted`);
      return results;
    } catch (error) {
      this.logError('bulkDelete', error, { fileIds: bulkDeleteDto.fileIds, userId });
      throw error;
    }
  }

  async bulkUpdate(bulkUpdateDto: BulkUpdateDto, userId?: string): Promise<{ updated: number; failed: string[] }> {
    try {
      this.logOperation('bulkUpdate', { fileIds: bulkUpdateDto.fileIds, userId });

      const results = { updated: 0, failed: [] as string[] };

      for (const fileId of bulkUpdateDto.fileIds) {
        try {
          const updateDto: UpdateFileMetadataDto = {
            metadata: bulkUpdateDto.metadata,
            tags: bulkUpdateDto.tags,
            accessLevel: bulkUpdateDto.accessLevel,
          };

          await this.updateFileMetadata(fileId, updateDto, userId);
          results.updated++;
        } catch (error) {
          results.failed.push(`${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.logger.log(`✅ Bulk update completed: ${results.updated}/${bulkUpdateDto.fileIds.length} files updated`);
      return results;
    } catch (error) {
      this.logError('bulkUpdate', error, { fileIds: bulkUpdateDto.fileIds, userId });
      throw error;
    }
  }

  async getFileStatistics(userId?: string): Promise<FileStatistics> {
    try {
      this.logOperation('getFileStatistics', { userId });

      const filter: Record<string, unknown> = {};
      if (userId) {
        filter.uploadedBy = new Types.ObjectId(userId);
      }

      const [totalFiles, totalSizeResult, typeDistribution, categoryDistribution] = await Promise.all([
        this.fileMetadataModel.countDocuments(filter),
        this.fileMetadataModel.aggregate([
          { $match: filter },
          { $group: { _id: null, totalSize: { $sum: '$size' } } },
        ]),
        this.fileMetadataModel.aggregate([
          { $match: filter },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        this.fileMetadataModel.aggregate([
          { $match: filter },
          { $group: { _id: '$category', count: { $sum: 1 } } },
        ]),
      ]);

      const totalSize = totalSizeResult[0]?.totalSize || 0;
      const averageSize = totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0;

      const typeDistributionMap: Record<FileType, number> = {} as Record<FileType, number>;
      for (const type of Object.values(FileType)) {
        typeDistributionMap[type] = 0;
      }
      typeDistribution.forEach((item) => {
        if (item._id in typeDistributionMap) {
          typeDistributionMap[item._id as FileType] = item.count;
        }
      });

      const categoryDistributionMap: Record<FileCategory, number> = {} as Record<FileCategory, number>;
      for (const category of Object.values(FileCategory)) {
        categoryDistributionMap[category] = 0;
      }
      categoryDistribution.forEach((item) => {
        if (item._id in categoryDistributionMap) {
          categoryDistributionMap[item._id as FileCategory] = item.count;
        }
      });

      const byTypeSize = await this.fileMetadataModel.aggregate([
        { $match: filter },
        { $group: { _id: '$type', totalSize: { $sum: '$size' } } },
      ]);

      const byCategorySize = await this.fileMetadataModel.aggregate([
        { $match: filter },
        { $group: { _id: '$category', totalSize: { $sum: '$size' } } },
      ]);

      const byType: Record<FileType, number> = {} as Record<FileType, number>;
      for (const type of Object.values(FileType)) {
        byType[type] = 0;
      }
      byTypeSize.forEach((item) => {
        if (item._id in byType) {
          byType[item._id as FileType] = item.totalSize;
        }
      });

      const byCategory: Record<FileCategory, number> = {} as Record<FileCategory, number>;
      for (const category of Object.values(FileCategory)) {
        byCategory[category] = 0;
      }
      byCategorySize.forEach((item) => {
        if (item._id in byCategory) {
          byCategory[item._id as FileCategory] = item.totalSize;
        }
      });

      const storageQuota = this.configService.filesConfig.maxTotalSize;
      const storageUsage: StorageUsage = {
        used: totalSize,
        total: storageQuota,
        percentage: storageQuota > 0 ? Math.round((totalSize / storageQuota) * 100) : 0,
        byType,
        byCategory,
      };

      return {
        totalFiles,
        totalSize,
        averageSize,
        typeDistribution: typeDistributionMap,
        categoryDistribution: categoryDistributionMap,
        storageUsage,
      };
    } catch (error) {
      this.logError('getFileStatistics', error, { userId });
      throw error;
    }
  }

  private async createFileMetadata(data: Partial<FileMetadata>): Promise<FileMetadata> {
    const fileMetadata = new this.fileMetadataModel(data);
    return fileMetadata.save();
  }

  private async createUploadSession(data: Partial<UploadSession>): Promise<UploadSessionDocument> {
    const uploadSession = new this.uploadSessionModel(data);
    return uploadSession.save();
  }

  private determineFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) {
      return FileType.IMAGE;
    }
    if (mimeType.startsWith('video/')) {
      return FileType.VIDEO;
    }
    if (mimeType.startsWith('audio/')) {
      return FileType.AUDIO;
    }
    if (
      mimeType === 'application/pdf' ||
      mimeType === 'application/msword' ||
      mimeType.includes('document') ||
      mimeType.includes('text')
    ) {
      return FileType.DOCUMENT;
    }
    if (
      mimeType === 'application/zip' ||
      mimeType === 'application/x-tar' ||
      mimeType === 'application/gzip'
    ) {
      return FileType.ARCHIVE;
    }
    return FileType.DOCUMENT;
  }

  private validateFile(file: Express.Multer.File, fileType: FileType): { success: boolean; errors?: string[] } {
    const errors: string[] = [];
    const config = this.configService.filesConfig;

    if (file.size > config.maxFileSize) {
      errors.push(`File size exceeds maximum allowed (${config.maxFileSize} bytes)`);
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    const allowedMimeTypes = config.allowedMimeTypes[fileType];
    if (allowedMimeTypes && !allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type not allowed: ${file.mimetype}`);
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private validateFileRequest(
    request: PresignedUrlRequestDto,
    fileType: FileType,
  ): { success: boolean; errors?: string[] } {
    const errors: string[] = [];
    const config = this.configService.filesConfig;

    if (request.fileSize > config.maxFileSize) {
      errors.push(`File size exceeds maximum allowed (${config.maxFileSize} bytes)`);
    }

    if (request.fileSize === 0) {
      errors.push('File size must be greater than 0');
    }

    const allowedMimeTypes = config.allowedMimeTypes[fileType];
    if (allowedMimeTypes && !allowedMimeTypes.includes(request.contentType)) {
      errors.push(`File type not allowed: ${request.contentType}`);
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private validateChunkUploadRequest(
    request: ChunkUploadInitDto,
    fileType: FileType,
  ): { success: boolean; errors?: string[] } {
    const errors: string[] = [];
    const config = this.configService.filesConfig;

    if (request.fileSize > config.maxFileSize) {
      errors.push(`File size exceeds maximum allowed (${config.maxFileSize} bytes)`);
    }

    if (request.chunkSize < config.minChunkSize) {
      errors.push(`Chunk size too small (minimum: ${config.minChunkSize} bytes)`);
    }

    if (request.chunkSize > config.maxChunkSize) {
      errors.push(`Chunk size too large (maximum: ${config.maxChunkSize} bytes)`);
    }

    if (request.totalChunks > config.maxChunks) {
      errors.push(`Too many chunks (maximum: ${config.maxChunks})`);
    }

    const allowedMimeTypes = config.allowedMimeTypes[fileType];
    if (allowedMimeTypes && !allowedMimeTypes.includes(request.contentType)) {
      errors.push(`File type not allowed: ${request.contentType}`);
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  private generateFileKey(
    originalName: string,
    folder?: string,
    category?: FileCategory,
  ): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-');

    const basePath = folder || 'uploads';
    const categoryPath = category || 'general';

    return `${basePath}/${categoryPath}/${timestamp}-${random}-${sanitizedBaseName}${extension}`;
  }

  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private async calculateFileChecksum(fileKey: string): Promise<string> {
    try {
      const metadata = await this.storageProvider.getMetadata(fileKey);
      return metadata.etag.replace(/"/g, '');
    } catch (error) {
      this.logger.warn(`Could not calculate checksum for ${fileKey}, using fallback`);
      return crypto.randomBytes(32).toString('hex');
    }
  }

  private logOperation(operation: string, data?: Record<string, unknown>): void {
    const sanitizedData = data ? this.sanitizeForLog(data) : {};
    this.logger.log(`🔄 File ${operation}`, JSON.stringify(sanitizedData, null, 2));
  }

  private logError(
    operation: string,
    error: unknown,
    data?: Record<string, unknown>,
  ): void {
    const sanitizedData = data ? this.sanitizeForLog(data) : {};
    this.logger.error(`❌ File ${operation} failed`, {
      error: error instanceof Error ? error.message : String(error),
      data: sanitizedData,
    });
  }

  private sanitizeForLog(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...data };

    const sensitiveFields = [
      'buffer',
      'chunkData',
      'metadata.sessionId',
      'uploadOptions.sessionId',
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