/**
 * 🎯 Image Bank Events
 *
 * Definiciones de eventos emitidos por el módulo Image Bank.
 * Usa EventEmitter2 para desacoplar módulos y evitar dependencias circulares.
 *
 * Eventos disponibles:
 * - image-bank.image.created - Imagen creada manualmente
 * - image-bank.image.processed - Imagen procesada desde URL
 * - image-bank.image.updated - Metadata de imagen actualizada
 * - image-bank.image.deleted - Imagen eliminada (soft delete)
 * - image-bank.image.failed - Fallo al procesar imagen
 * - image-bank.batch.started - Batch de procesamiento iniciado
 * - image-bank.batch.completed - Batch completado
 * - image-bank.batch.failed - Batch fallido
 */

// ============================================================================
// EVENT PAYLOADS
// ============================================================================

/**
 * Payload: Imagen creada
 */
export interface ImageCreatedEvent {
  imageId: string;
  outlet: string;
  keywords: string[];
  categories: string[];
  quality: 'high' | 'medium' | 'low';
  extractedNoticiaId?: string;
  createdAt: Date;
}

/**
 * Payload: Imagen procesada exitosamente
 */
export interface ImageProcessedEvent {
  imageId: string;
  jobId?: number | string;
  batchId?: string;
  duration: number; // Milisegundos
  outlet: string;
  quality: 'high' | 'medium' | 'low';
  originalUrl: string;
  s3BaseKey: string;
}

/**
 * Payload: Imagen actualizada
 */
export interface ImageUpdatedEvent {
  imageId: string;
  updatedFields: string[]; // Campos modificados
  outlet: string;
  updatedAt: Date;
}

/**
 * Payload: Imagen eliminada
 */
export interface ImageDeletedEvent {
  imageId: string;
  outlet: string;
  deletedAt: Date;
}

/**
 * Payload: Fallo al procesar imagen
 */
export interface ImageFailedEvent {
  jobId?: number | string;
  batchId?: string;
  imageUrl: string;
  outlet: string;
  error: string;
  duration: number; // Milisegundos
  attemptsMade?: number;
}

/**
 * Payload: Batch iniciado
 */
export interface BatchStartedEvent {
  batchId: string;
  jobId?: number | string;
  totalImages: number;
  startedAt?: Date;
}

/**
 * Payload: Batch completado
 */
export interface BatchCompletedEvent {
  batchId: string;
  jobId?: number | string;
  totalImages: number;
  successful: number;
  failed: number;
  duration: number; // Milisegundos
  completedAt?: Date;
}

/**
 * Payload: Batch fallido
 */
export interface BatchFailedEvent {
  batchId: string;
  jobId?: number | string;
  error: string;
  duration: number; // Milisegundos
  failedAt?: Date;
}

// ============================================================================
// EVENT NAMES (constants para evitar typos)
// ============================================================================

export const IMAGE_BANK_EVENTS = {
  // Eventos de imagen individual
  IMAGE_CREATED: 'image-bank.image.created',
  IMAGE_PROCESSED: 'image-bank.image.processed',
  IMAGE_UPDATED: 'image-bank.image.updated',
  IMAGE_DELETED: 'image-bank.image.deleted',
  IMAGE_FAILED: 'image-bank.image.failed',

  // Eventos de batch
  BATCH_STARTED: 'image-bank.batch.started',
  BATCH_COMPLETED: 'image-bank.batch.completed',
  BATCH_FAILED: 'image-bank.batch.failed',
} as const;

// Type para validar nombres de eventos
export type ImageBankEventName =
  (typeof IMAGE_BANK_EVENTS)[keyof typeof IMAGE_BANK_EVENTS];
