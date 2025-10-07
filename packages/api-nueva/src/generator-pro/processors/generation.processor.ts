import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { GeneratorProJob, GeneratorProJobDocument } from '../schemas/generator-pro-job.schema';
import { NewsWebsiteConfig, NewsWebsiteConfigDocument } from '../schemas/news-website-config.schema';
import { ExtractedNoticia, ExtractedNoticiaDocument } from '../../noticias/schemas/extracted-noticia.schema';
import { AIContentGeneration, AIContentGenerationDocument } from '../../content-ai/schemas/ai-content-generation.schema';
import { PromptTemplate, PromptTemplateDocument } from '../../content-ai/schemas/prompt-template.schema';

/**
 * 🤖 Processor para trabajos de generación de contenido con IA - Generator Pro
 * Integra con sistema Content-AI existente para generar contenido editorial
 * Procesa jobs de la cola: generate_content
 */

interface GenerationJobData {
  jobId: string;
  type: 'generate_content';
  websiteConfigId: Types.ObjectId;
  relatedEntityId: Types.ObjectId; // ID de ExtractedNoticia
  data: {
    originalContentId: Types.ObjectId;
    templateId: Types.ObjectId;
    generationSettings?: {
      generateOnExtraction?: boolean;
      requireApproval?: boolean;
      categoryMapping?: Record<string, string>;
    };
    metadata?: Record<string, unknown>;
    isRetry?: boolean;
    originalJobId?: string;
  };
  priority: number;
}

@Injectable()
@Processor('generator-pro-generation')
export class GenerationProcessor {
  private readonly logger = new Logger(GenerationProcessor.name);

  constructor(
    @InjectModel(GeneratorProJob.name)
    private readonly jobModel: Model<GeneratorProJobDocument>,
    @InjectModel(NewsWebsiteConfig.name)
    private readonly websiteConfigModel: Model<NewsWebsiteConfigDocument>,
    @InjectModel(ExtractedNoticia.name)
    private readonly extractedNoticiaModel: Model<ExtractedNoticiaDocument>,
    @InjectModel(AIContentGeneration.name)
    private readonly aiContentGenerationModel: Model<AIContentGenerationDocument>,
    @InjectModel(PromptTemplate.name)
    private readonly promptTemplateModel: Model<PromptTemplateDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('🤖 Generation Processor initialized');
  }

  /**
   * 🤖 PROCESAR GENERACIÓN DE CONTENIDO CON IA
   */
  @Process('generate_content')
  async processContentGeneration(job: Job<GenerationJobData>): Promise<{ contentGenerated: boolean; message: string }> {
    const startTime = Date.now();
    this.logger.log(`🤖 Processing content generation job: ${job.data.jobId}`);

    try {
      // Actualizar job como iniciado
      await this.updateJobStatus(job.data.jobId, 'processing', { startedAt: new Date() });

      // Obtener configuración del sitio web
      const websiteConfig = await this.websiteConfigModel.findById(job.data.websiteConfigId);
      if (!websiteConfig || !websiteConfig.isActive) {
        throw new Error(`Website config ${job.data.websiteConfigId} not found or not active`);
      }

      job.progress(10);

      // Obtener noticia original
      const originalNoticia = await this.extractedNoticiaModel.findById(job.data.data.originalContentId);
      if (!originalNoticia || originalNoticia.status !== 'extracted') {
        throw new Error(`Original noticia ${job.data.data.originalContentId} not found or not extracted`);
      }

      job.progress(20);

      // Obtener template para generación
      const template = await this.promptTemplateModel.findById(job.data.data.templateId);
      if (!template || !template.isActive) {
        throw new Error(`Template ${job.data.data.templateId} not found or not active`);
      }

      job.progress(30);

      // Verificar si ya existe contenido generado
      let existingGeneration = await this.aiContentGenerationModel.findOne({
        originalContentId: originalNoticia._id,
        templateId: template._id,
      });

      if (existingGeneration && existingGeneration.status === 'completed' && !job.data.data.isRetry) {
        this.logger.log(`Content already generated for noticia: ${originalNoticia._id}`);

        await this.updateJobStatus(job.data.jobId, 'completed', {
          completedAt: new Date(),
          processingTime: Date.now() - startTime,
          result: {
            contentGenerated: false,
            reason: 'already_generated',
            existingGenerationId: existingGeneration._id,
          },
        });

        return {
          contentGenerated: false,
          message: 'Content already generated',
        };
      }

      job.progress(40);

      // TODO: Implementar generación con EventEmitter2
      this.logger.log(`Simulating content generation for: ${originalNoticia.title}`);

      // Simular resultado de generación por ahora
      const generationResult = {
        generatedTitle: `Generated: ${originalNoticia.title}`,
        generatedContent: `Generated content based on: ${(originalNoticia.content || '').substring(0, 100)}...`,
        generatedKeywords: ['keyword1', 'keyword2'],
        generatedTags: ['tag1', 'tag2'],
        generatedCategory: 'General',
        generatedSummary: `Summary of ${originalNoticia.title}`,
        provider: { name: 'simulation' },
        generationMetadata: { totalTokens: 100, cost: 0.01 }
      };

      job.progress(80);

      // Crear o actualizar registro de generación
      if (!existingGeneration) {
        existingGeneration = new this.aiContentGenerationModel({
          originalContentId: originalNoticia._id,
          templateId: template._id,
          originalTitle: originalNoticia.title,
          originalContent: originalNoticia.content,
          status: 'processing',
          generationMetadata: {
            websiteConfigId: websiteConfig._id,
            jobId: job.data.jobId,
            generatedBy: 'generator-pro',
          },
        });
      }

      // Actualizar con contenido generado
      existingGeneration.generatedTitle = generationResult.generatedTitle;
      existingGeneration.generatedContent = generationResult.generatedContent;
      existingGeneration.generatedKeywords = generationResult.generatedKeywords;
      existingGeneration.generatedTags = generationResult.generatedTags;
      existingGeneration.category = generationResult.generatedCategory;
      existingGeneration.summary = generationResult.generatedSummary;
      existingGeneration.status = 'completed';
      existingGeneration.completedAt = new Date();
      existingGeneration.generationMetadata = {
        ...existingGeneration.generationMetadata,
        processingTime: Date.now() - startTime,
        contentQuality: this.calculateContentQuality(generationResult, originalNoticia),
        aiProvider: generationResult.provider?.name || 'openai',
        tokensUsed: generationResult.generationMetadata?.totalTokens || 0,
        costEstimate: generationResult.generationMetadata?.cost || 0,
      };

      await existingGeneration.save();

      const processingTime = Date.now() - startTime;

      // Actualizar job como completado
      const result = {
        contentGenerated: true,
        generationId: existingGeneration._id,
        originalTitle: originalNoticia.title,
        generatedTitle: generationResult.generatedTitle,
        contentQuality: existingGeneration.generationMetadata?.contentQuality,
        processingTime,
        websiteName: websiteConfig.name,
        templateName: template.name,
      };

      await this.updateJobStatus(job.data.jobId, 'completed', {
        completedAt: new Date(),
        processingTime,
        result,
      });

      // Marcar noticia original como procesada para generación
      await this.extractedNoticiaModel.findByIdAndUpdate(originalNoticia._id, {
        isProcessed: true,
        processedAt: new Date(),
        generatedContentId: existingGeneration._id,
      });

      // Emitir evento de éxito
      this.eventEmitter.emit('generator-pro.generation.content_generated', {
        jobId: job.data.jobId,
        websiteId: websiteConfig._id,
        noticiaId: originalNoticia._id,
        generationId: existingGeneration._id,
        contentQuality: existingGeneration.generationMetadata?.contentQuality,
        processingTime,
        timestamp: new Date(),
      });

      job.progress(100);

      this.logger.log(`✅ Content generation completed for: ${originalNoticia.title}`);

      return {
        contentGenerated: true,
        message: 'Content generated successfully',
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error(`❌ Content generation failed for job ${job.data.jobId}: ${error.message}`);

      // Actualizar job como fallido
      await this.updateJobStatus(job.data.jobId, 'failed', {
        error: error.message,
        errorDetails: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date(),
          processingTime,
          originalContentId: job.data.data.originalContentId,
          templateId: job.data.data.templateId,
        },
      });

      // Marcar generación como fallida si existe
      if (job.data.data.originalContentId) {
        await this.aiContentGenerationModel.findOneAndUpdate(
          { originalContentId: job.data.data.originalContentId },
          {
            status: 'failed',
            errorMessage: error.message,
            generationMetadata: {
              error: error.message,
              jobId: job.data.jobId,
              failedAt: new Date(),
            },
          }
        );
      }

      // Emitir evento de fallo
      this.eventEmitter.emit('generator-pro.generation.failed', {
        jobId: job.data.jobId,
        originalContentId: job.data.data.originalContentId,
        error: error.message,
        processingTime,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * 🔧 MÉTODOS AUXILIARES
   */
  private buildReferenceContent(
    noticia: ExtractedNoticiaDocument,
    websiteConfig: NewsWebsiteConfigDocument
  ): string | undefined {
    // Construir contenido de referencia contextual
    const referenceData: string[] = [];

    if (noticia.category) {
      referenceData.push(`Categoría: ${noticia.category}`);
    }

    if (noticia.author) {
      referenceData.push(`Autor original: ${noticia.author}`);
    }

    if (noticia.tags && noticia.tags.length > 0) {
      referenceData.push(`Tags: ${noticia.tags.join(', ')}`);
    }

    referenceData.push(`Fuente: ${websiteConfig.name}`);
    referenceData.push(`Fecha de extracción: ${noticia.extractedAt?.toLocaleDateString()}`);

    return referenceData.length > 0 ? referenceData.join('\n') : undefined;
  }

  private calculateContentQuality(
    generationResult: any,
    originalNoticia: ExtractedNoticiaDocument
  ): number {
    let quality = 50; // Base score

    // Factores positivos
    if (generationResult.generatedTitle && generationResult.generatedTitle.length >= 20) quality += 10;
    if (generationResult.generatedContent && generationResult.generatedContent.length >= 200) quality += 10;
    if (generationResult.generatedKeywords && generationResult.generatedKeywords.length >= 3) quality += 5;
    if (generationResult.generatedTags && generationResult.generatedTags.length >= 2) quality += 5;
    if (generationResult.generatedSummary && generationResult.generatedSummary.length >= 50) quality += 10;

    // Factor de transformación (evitar copia exacta)
    if (generationResult.generatedContent && originalNoticia.content) {
      const similarity = this.calculateTextSimilarity(generationResult.generatedContent, originalNoticia.content);
      if (similarity < 0.3) quality += 10; // Buena transformación
      else if (similarity > 0.7) quality -= 20; // Demasiado similar
    }

    // Factor de longitud apropiada
    if (generationResult.generatedContent) {
      const wordCount = generationResult.generatedContent.split(' ').length;
      if (wordCount >= 100 && wordCount <= 800) quality += 10;
    }

    return Math.max(0, Math.min(100, quality));
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Algoritmo simple de similitud basado en palabras comunes
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(word => word.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(word => word.length > 3));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private async updateJobStatus(
    jobId: string,
    status: string,
    updates: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await this.jobModel.findByIdAndUpdate(jobId, {
        status,
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      this.logger.warn(`Failed to update job status for ${jobId}: ${error.message}`);
    }
  }
}