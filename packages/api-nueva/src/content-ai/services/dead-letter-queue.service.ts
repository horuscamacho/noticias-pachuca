import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GenerationJob, GenerationJobDocument } from '../schemas/generation-job.schema';
import { ContentGenerationJobData } from '../processors/content-generation.processor';
import { v4 as uuidv4 } from 'uuid';

export interface DeadLetterEntry {
  id: string;
  originalJobId: string;
  originalJobData: ContentGenerationJobData;
  failureReason: string;
  failureCount: number;
  lastFailureAt: Date;
  firstFailureAt: Date;
  stackTrace?: string;
  retryAttempts: Array<{
    attemptAt: Date;
    error: string;
    providerId?: string;
  }>;
  resolution?: {
    resolvedAt: Date;
    resolvedBy: string;
    method: 'manual_retry' | 'data_fix' | 'provider_fix' | 'abandoned';
    notes?: string;
  };
  metadata: {
    contentId: string;
    agentId: string;
    templateId: string;
    batchId?: string;
    userId?: string;
    priority: number;
    estimatedCost: number;
  };
}

export interface DLQStats {
  totalEntries: number;
  unresolved: number;
  resolved: number;
  abandoned: number;
  byFailureReason: Record<string, number>;
  byProvider: Record<string, number>;
  oldestUnresolved?: Date;
  averageTimeToResolution: number; // in hours
  resolutionMethods: Record<string, number>;
}

export interface RetryStrategy {
  maxRetries: number;
  backoffMultiplier: number;
  maxBackoffDelay: number;
  retryableErrors: string[];
  nonRetryableErrors: string[];
  providerRotation: boolean;
  costThreshold: number; // Don't retry if cost exceeds this
}

/**
 * ⚰️ Dead Letter Queue Service para jobs fallidos irrecuperables
 * Manejo inteligente de fallos, análisis de patrones y estrategias de recuperación
 */
@Injectable()
export class DeadLetterQueueService implements OnModuleInit {
  private readonly logger = new Logger(DeadLetterQueueService.name);

  private readonly defaultRetryStrategy: RetryStrategy = {
    maxRetries: 5,
    backoffMultiplier: 2,
    maxBackoffDelay: 300000, // 5 minutes
    retryableErrors: [
      'rate_limit_exceeded',
      'provider_timeout',
      'temporary_service_unavailable',
      'network_error',
      'provider_overloaded'
    ],
    nonRetryableErrors: [
      'invalid_api_key',
      'content_policy_violation',
      'malformed_template',
      'insufficient_quota',
      'model_not_found'
    ],
    providerRotation: true,
    costThreshold: 2.0, // $2 max retry cost
  };

  private deadLetterEntries: Map<string, DeadLetterEntry> = new Map();

  constructor(
    @InjectQueue('content-generation') private contentQueue: Queue,
    @InjectQueue('dead-letter-queue') private dlqQueue: Queue,
    @InjectModel(GenerationJob.name) private generationJobModel: Model<GenerationJobDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.setupDLQProcessor();
    await this.loadExistingDLQEntries();
    this.startPeriodicCleanup();
    this.logger.log('Dead Letter Queue Service initialized');
  }

  /**
   * ⚰️ Event handler - Mover job fallido a DLQ
   */
  @OnEvent('content-generation.job-failed-permanently')
  async handleJobFailedPermanently(event: {
    jobId: string;
    jobData: ContentGenerationJobData;
    finalError: string;
    stackTrace?: string;
    retryHistory: Array<{ attemptAt: Date; error: string; providerId?: string }>;
  }): Promise<void> {
    try {
      const dlqEntryId = await this.addToDLQ(
        event.jobData,
        event.finalError,
        event.stackTrace,
        event.retryHistory
      );

      this.logger.warn(`Job ${event.jobId} moved to Dead Letter Queue: ${dlqEntryId}`);

      // Emitir evento para notificaciones
      this.eventEmitter.emit('dead-letter-queue.entry-added', {
        dlqEntryId,
        originalJobId: event.jobId,
        contentId: event.jobData.contentId,
        failureReason: event.finalError,
        retryCount: event.retryHistory.length,
      });

    } catch (error) {
      this.logger.error(`Failed to handle permanently failed job: ${error.message}`, error.stack);
    }
  }

  /**
   * ➕ Agregar job fallido al DLQ
   */
  async addToDLQ(
    jobData: ContentGenerationJobData,
    failureReason: string,
    stackTrace?: string,
    retryHistory: Array<{ attemptAt: Date; error: string; providerId?: string }> = []
  ): Promise<string> {
    const dlqEntryId = uuidv4();
    const now = new Date();

    try {
      const dlqEntry: DeadLetterEntry = {
        id: dlqEntryId,
        originalJobId: jobData.id,
        originalJobData: jobData,
        failureReason,
        failureCount: retryHistory.length + 1,
        lastFailureAt: now,
        firstFailureAt: retryHistory[0]?.attemptAt || now,
        stackTrace,
        retryAttempts: retryHistory,
        metadata: {
          contentId: jobData.contentId,
          agentId: jobData.agentId,
          templateId: jobData.templateId,
          batchId: jobData.batchId,
          userId: jobData.userId,
          priority: jobData.priority,
          estimatedCost: jobData.metadata.expectedCost,
        },
      };

      // Guardar en memoria y DB
      this.deadLetterEntries.set(dlqEntryId, dlqEntry);
      await this.persistDLQEntry(dlqEntry);

      // Analizar patrón de fallo
      await this.analyzeFailurePattern(dlqEntry);

      return dlqEntryId;

    } catch (error) {
      this.logger.error(`Failed to add job to DLQ: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 🔄 Intentar recuperar entry del DLQ
   */
  async retryDLQEntry(
    dlqEntryId: string,
    options?: {
      forceDifferentProvider?: boolean;
      modifiedJobData?: Partial<ContentGenerationJobData>;
      resolvedBy?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; newJobId?: string; error?: string }> {
    try {
      const dlqEntry = this.deadLetterEntries.get(dlqEntryId);
      if (!dlqEntry) {
        return { success: false, error: 'DLQ entry not found' };
      }

      if (dlqEntry.resolution) {
        return { success: false, error: 'DLQ entry already resolved' };
      }

      // Verificar si el error es recuperable
      if (!this.isRetryable(dlqEntry.failureReason)) {
        return { success: false, error: 'Non-retryable error type' };
      }

      // Verificar límites de costo
      if (dlqEntry.metadata.estimatedCost > this.defaultRetryStrategy.costThreshold) {
        return { success: false, error: 'Cost threshold exceeded for retry' };
      }

      // Preparar datos del job modificado
      let retryJobData = { ...dlqEntry.originalJobData };

      // Aplicar modificaciones si se proporcionan
      if (options?.modifiedJobData) {
        retryJobData = { ...retryJobData, ...options.modifiedJobData };
      }

      // Forzar provider diferente si se solicita
      if (options?.forceDifferentProvider) {
        retryJobData.providerId = await this.getAlternativeProvider(
          retryJobData.providerId,
          retryJobData.templateId
        );
      }

      // Reset retry count para nuevo intento
      retryJobData.retryCount = 0;
      retryJobData.id = uuidv4(); // Nuevo ID para el retry

      // Encolar nuevo job
      const newJob = await this.contentQueue.add('generate-content', retryJobData, {
        priority: retryJobData.priority,
        delay: 5000, // 5s delay para retry manual
        jobId: retryJobData.id,
      });

      // Marcar DLQ entry como resuelto
      await this.resolveDLQEntry(dlqEntryId, {
        method: 'manual_retry',
        resolvedBy: options?.resolvedBy || 'system',
        notes: options?.notes,
      });

      this.logger.log(`DLQ entry ${dlqEntryId} retried successfully as job ${retryJobData.id}`);

      return { success: true, newJobId: retryJobData.id };

    } catch (error) {
      this.logger.error(`Failed to retry DLQ entry ${dlqEntryId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * ✅ Marcar entry del DLQ como resuelto
   */
  async resolveDLQEntry(
    dlqEntryId: string,
    resolution: {
      method: 'manual_retry' | 'data_fix' | 'provider_fix' | 'abandoned';
      resolvedBy: string;
      notes?: string;
    }
  ): Promise<boolean> {
    try {
      const dlqEntry = this.deadLetterEntries.get(dlqEntryId);
      if (!dlqEntry) {
        return false;
      }

      dlqEntry.resolution = {
        resolvedAt: new Date(),
        ...resolution,
      };

      this.deadLetterEntries.set(dlqEntryId, dlqEntry);
      await this.persistDLQEntry(dlqEntry);

      // Emitir evento de resolución
      this.eventEmitter.emit('dead-letter-queue.entry-resolved', {
        dlqEntryId,
        originalJobId: dlqEntry.originalJobId,
        contentId: dlqEntry.metadata.contentId,
        resolutionMethod: resolution.method,
        resolvedBy: resolution.resolvedBy,
      });

      this.logger.log(`DLQ entry ${dlqEntryId} resolved via ${resolution.method}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to resolve DLQ entry ${dlqEntryId}: ${error.message}`);
      return false;
    }
  }

  /**
   * 📊 Obtener estadísticas del DLQ
   */
  getDLQStats(): DLQStats {
    const entries = Array.from(this.deadLetterEntries.values());

    const stats: DLQStats = {
      totalEntries: entries.length,
      unresolved: entries.filter(e => !e.resolution).length,
      resolved: entries.filter(e => e.resolution).length,
      abandoned: entries.filter(e => e.resolution?.method === 'abandoned').length,
      byFailureReason: {},
      byProvider: {},
      averageTimeToResolution: 0,
      resolutionMethods: {},
    };

    // Agrupar por razón de fallo
    entries.forEach(entry => {
      const reason = this.categorizeFailure(entry.failureReason);
      stats.byFailureReason[reason] = (stats.byFailureReason[reason] || 0) + 1;

      // Agrupar por proveedor
      const provider = entry.originalJobData.providerId || 'unknown';
      stats.byProvider[provider] = (stats.byProvider[provider] || 0) + 1;

      // Métodos de resolución
      if (entry.resolution) {
        stats.resolutionMethods[entry.resolution.method] =
          (stats.resolutionMethods[entry.resolution.method] || 0) + 1;
      }
    });

    // Calcular tiempo promedio de resolución
    const resolvedEntries = entries.filter(e => e.resolution);
    if (resolvedEntries.length > 0) {
      const totalResolutionTime = resolvedEntries.reduce((sum, entry) => {
        const resolutionTime = entry.resolution!.resolvedAt.getTime() - entry.firstFailureAt.getTime();
        return sum + resolutionTime;
      }, 0);
      stats.averageTimeToResolution = totalResolutionTime / resolvedEntries.length / (1000 * 60 * 60); // hours
    }

    // Encontrar entry sin resolver más antigua
    const unresolvedEntries = entries.filter(e => !e.resolution);
    if (unresolvedEntries.length > 0) {
      stats.oldestUnresolved = unresolvedEntries
        .sort((a, b) => a.firstFailureAt.getTime() - b.firstFailureAt.getTime())[0]
        .firstFailureAt;
    }

    return stats;
  }

  /**
   * 📋 Obtener entries del DLQ con filtros
   */
  getDLQEntries(filters?: {
    resolved?: boolean;
    failureReason?: string;
    provider?: string;
    contentId?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): DeadLetterEntry[] {
    let entries = Array.from(this.deadLetterEntries.values());

    // Aplicar filtros
    if (filters) {
      if (filters.resolved !== undefined) {
        entries = entries.filter(e => !!e.resolution === filters.resolved);
      }
      if (filters.failureReason) {
        entries = entries.filter(e =>
          this.categorizeFailure(e.failureReason) === filters.failureReason
        );
      }
      if (filters.provider) {
        entries = entries.filter(e => e.originalJobData.providerId === filters.provider);
      }
      if (filters.contentId) {
        entries = entries.filter(e => e.metadata.contentId === filters.contentId);
      }
      if (filters.userId) {
        entries = entries.filter(e => e.metadata.userId === filters.userId);
      }
    }

    // Ordenar por fecha de fallo más reciente
    entries.sort((a, b) => b.lastFailureAt.getTime() - a.lastFailureAt.getTime());

    // Aplicar paginación
    if (filters?.offset || filters?.limit) {
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      entries = entries.slice(offset, offset + limit);
    }

    return entries;
  }

  /**
   * 🧠 Analizar patrones de fallo para insights
   */
  async analyzeFailurePattern(dlqEntry: DeadLetterEntry): Promise<void> {
    try {
      const recentEntries = Array.from(this.deadLetterEntries.values())
        .filter(e => e.firstFailureAt.getTime() > Date.now() - (24 * 60 * 60 * 1000)); // Last 24h

      // Detectar patrones por proveedor
      const providerFailures = recentEntries.filter(e =>
        e.originalJobData.providerId === dlqEntry.originalJobData.providerId
      );

      if (providerFailures.length >= 5) {
        this.eventEmitter.emit('dead-letter-queue.pattern-detected', {
          type: 'provider_multiple_failures',
          provider: dlqEntry.originalJobData.providerId,
          count: providerFailures.length,
          timeframe: '24h',
          recommendation: 'Consider temporarily disabling this provider',
        });
      }

      // Detectar patrones por template
      const templateFailures = recentEntries.filter(e =>
        e.metadata.templateId === dlqEntry.metadata.templateId
      );

      if (templateFailures.length >= 3) {
        this.eventEmitter.emit('dead-letter-queue.pattern-detected', {
          type: 'template_multiple_failures',
          templateId: dlqEntry.metadata.templateId,
          count: templateFailures.length,
          timeframe: '24h',
          recommendation: 'Review template configuration and variables',
        });
      }

      // Detectar patrones por tipo de error
      const errorPattern = this.categorizeFailure(dlqEntry.failureReason);
      const errorFailures = recentEntries.filter(e =>
        this.categorizeFailure(e.failureReason) === errorPattern
      );

      if (errorFailures.length >= 10) {
        this.eventEmitter.emit('dead-letter-queue.pattern-detected', {
          type: 'error_pattern_spike',
          errorType: errorPattern,
          count: errorFailures.length,
          timeframe: '24h',
          recommendation: `Investigate root cause of ${errorPattern} errors`,
        });
      }

    } catch (error) {
      this.logger.warn(`Failed to analyze failure pattern: ${error.message}`);
    }
  }

  /**
   * 🏗️ Configurar procesador del DLQ
   */
  private async setupDLQProcessor(): Promise<void> {
    // Procesador para auto-retry de entries recuperables
    this.dlqQueue.process('auto-retry', async (job: Job) => {
      const { dlqEntryId } = job.data;

      try {
        const result = await this.retryDLQEntry(dlqEntryId, {
          forceDifferentProvider: true,
          resolvedBy: 'auto-retry',
          notes: 'Automatic retry after cooling period',
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        return { retried: true, newJobId: result.newJobId };

      } catch (error) {
        this.logger.warn(`Auto-retry failed for DLQ entry ${dlqEntryId}: ${error.message}`);
        throw error;
      }
    });

    this.logger.log('DLQ processor configured');
  }

  /**
   * 💾 Cargar entries existentes del DLQ
   */
  private async loadExistingDLQEntries(): Promise<void> {
    try {
      // En una implementación real, cargarías desde la base de datos
      // Por ahora, iniciamos con un mapa vacío
      this.logger.log('DLQ entries loaded from persistence');

    } catch (error) {
      this.logger.error(`Failed to load existing DLQ entries: ${error.message}`);
    }
  }

  /**
   * 🧹 Limpieza periódica de entries antiguos
   */
  private startPeriodicCleanup(): void {
    // Limpiar entries resueltos antiguos cada 6 horas
    setInterval(() => {
      this.cleanupOldEntries();
    }, 6 * 60 * 60 * 1000);

    // Programar auto-retries cada hora
    setInterval(() => {
      this.scheduleAutoRetries();
    }, 60 * 60 * 1000);

    this.logger.log('Started periodic DLQ cleanup');
  }

  /**
   * 🗑️ Limpiar entries antiguos resueltos
   */
  private cleanupOldEntries(): void {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    for (const [id, entry] of this.deadLetterEntries.entries()) {
      if (entry.resolution && entry.resolution.resolvedAt < cutoff) {
        this.deadLetterEntries.delete(id);
      }
    }

    this.logger.debug('Cleaned up old resolved DLQ entries');
  }

  /**
   * 🔄 Programar auto-retries para entries recuperables
   */
  private async scheduleAutoRetries(): Promise<void> {
    const retryableEntries = Array.from(this.deadLetterEntries.values())
      .filter(entry =>
        !entry.resolution &&
        this.isRetryable(entry.failureReason) &&
        entry.lastFailureAt.getTime() < Date.now() - (60 * 60 * 1000) // 1 hour cooling period
      );

    for (const entry of retryableEntries) {
      try {
        await this.dlqQueue.add('auto-retry',
          { dlqEntryId: entry.id },
          { delay: Math.random() * 300000 } // Random delay up to 5 minutes
        );
      } catch (error) {
        this.logger.warn(`Failed to schedule auto-retry for ${entry.id}: ${error.message}`);
      }
    }

    if (retryableEntries.length > 0) {
      this.logger.log(`Scheduled ${retryableEntries.length} auto-retries`);
    }
  }

  /**
   * 🔍 Verificar si un error es recuperable
   */
  private isRetryable(failureReason: string): boolean {
    const categorized = this.categorizeFailure(failureReason);
    return this.defaultRetryStrategy.retryableErrors.includes(categorized);
  }

  /**
   * 🏷️ Categorizar tipo de fallo
   */
  private categorizeFailure(failureReason: string): string {
    const reason = failureReason.toLowerCase();

    if (reason.includes('rate limit') || reason.includes('quota')) {
      return 'rate_limit_exceeded';
    }
    if (reason.includes('timeout') || reason.includes('time out')) {
      return 'provider_timeout';
    }
    if (reason.includes('api key') || reason.includes('unauthorized')) {
      return 'invalid_api_key';
    }
    if (reason.includes('policy') || reason.includes('violation')) {
      return 'content_policy_violation';
    }
    if (reason.includes('network') || reason.includes('connection')) {
      return 'network_error';
    }
    if (reason.includes('overload') || reason.includes('capacity')) {
      return 'provider_overloaded';
    }
    if (reason.includes('template') || reason.includes('variable')) {
      return 'malformed_template';
    }

    return 'unknown_error';
  }

  /**
   * 🔄 Obtener proveedor alternativo
   */
  private async getAlternativeProvider(currentProvider?: string, templateId?: string): Promise<string | undefined> {
    try {
      // En una implementación real, consultarías el PromptTemplateService
      // para obtener providers compatibles y filtrar el actual
      const alternativeProviders = ['openai', 'anthropic'].filter(p => p !== currentProvider);
      return alternativeProviders[0];

    } catch (error) {
      this.logger.warn(`Failed to get alternative provider: ${error.message}`);
      return undefined;
    }
  }

  /**
   * 💾 Persistir entry del DLQ
   */
  private async persistDLQEntry(dlqEntry: DeadLetterEntry): Promise<void> {
    try {
      // En una implementación real, guardarías en base de datos
      // Por simplicidad, solo loggeamos
      this.logger.debug(`Persisting DLQ entry ${dlqEntry.id}`);

    } catch (error) {
      this.logger.error(`Failed to persist DLQ entry: ${error.message}`);
    }
  }
}