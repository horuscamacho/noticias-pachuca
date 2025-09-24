/**
 * 🎯 Interfaces para requests de generación de contenido AI
 * Manejo de jobs, requests y configuración de generación
 */

export type GenerationJobType = 'single' | 'batch' | 'scheduled' | 'retry';
export type GenerationStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'reviewing' | 'approved' | 'rejected';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused';

export interface ContentGenerationRequest {
  contentIds: string[]; // IDs de contenido original a procesar
  agentId: string; // Agente editorial a usar
  templateId: string; // Template de prompt
  providerId?: string; // Proveedor específico (opcional, auto-select si no se especifica)
  jobConfiguration?: JobConfiguration;
  customPromptVars?: Record<string, string>; // Variables custom del prompt
  priority?: number; // 1-10, 10 = máxima prioridad
  description?: string; // Descripción del job
  callback?: CallbackConfiguration;
}

export interface JobConfiguration {
  batchSize?: number; // Tamaño del batch para procesamiento
  maxRetries?: number; // Máximo reintentos por item
  retryDelay?: number; // Delay entre reintentos (ms)
  timeoutMs?: number; // Timeout por item (ms)
  parallelProcessing?: boolean; // Procesar items en paralelo
  autoReview?: boolean; // Review automático vs manual
  autoPublish?: boolean; // Auto-publicar contenido aprobado
}

export interface CallbackConfiguration {
  webhookUrl?: string; // URL para notificaciones
  emailNotification?: string; // Email para notificar
  slackChannel?: string; // Canal Slack
  notifyOnComplete?: boolean;
  notifyOnError?: boolean;
}

export interface ScheduledGenerationRequest extends ContentGenerationRequest {
  scheduledAt: Date; // Cuándo ejecutar
  cronPattern?: string; // Para jobs recurrentes
  isRecurring?: boolean;
}

export interface BatchGenerationRequest {
  requests: ContentGenerationRequest[]; // Múltiples requests
  batchName?: string; // Nombre del batch
  globalConfiguration?: JobConfiguration; // Config global para todo el batch
}

export interface RetryGenerationRequest {
  originalJobId: string; // Job original que falló
  retryConfiguration?: Partial<JobConfiguration>;
  customPromptVars?: Record<string, string>; // Nuevas variables si es necesario
}

export interface GenerationProgress {
  jobId: string;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  currentItem?: number;
  percentComplete: number;
  estimatedTimeRemaining?: number; // ms
  currentStatus: JobStatus;
  errors?: string[];
  warnings?: string[];
}

export interface GenerationJobResponse {
  jobId: string;
  jobType: GenerationJobType;
  status: JobStatus;
  priority: number;
  contentIds: string[];
  agentId: string;
  templateId: string;
  providerId?: string;
  progress: GenerationProgress;
  generatedContentIds: string[];
  timing: {
    queuedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    totalDuration?: number; // ms
    avgProcessingTime?: number; // ms por item
  };
  resourceUsage?: {
    totalTokens?: number;
    totalCost?: number;
    avgTokensPerItem?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerationRequestValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  estimatedCost?: number;
  estimatedDuration?: number; // ms
  recommendedProvider?: string;
}