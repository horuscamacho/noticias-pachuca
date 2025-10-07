/**
 * 📋 Tipos para sistema de cola de publicación inteligente
 */

/**
 * Tipos de publicación (prioridad)
 */
export type PublicationType = 'breaking' | 'news' | 'blog';

/**
 * Estados de la cola
 */
export type QueueStatus = 'queued' | 'processing' | 'published' | 'failed' | 'cancelled';

/**
 * Ventanas de tiempo
 */
export type TimeWindow = 'peak' | 'valley' | 'normal';

/**
 * 📰 Noticia poblada (cuando status='published')
 */
export interface PopulatedNoticia {
  _id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  publishedAt: string;
  status: string;
}

/**
 * 📝 Contenido generado poblado
 */
export interface PopulatedContent {
  _id: string;
  generatedTitle: string;
  generatedCategory: string;
  generatedSummary: string;
}

/**
 * 📦 Item individual en la cola de publicación
 */
export interface PublicationQueueItem {
  _id: string;
  noticiaId: string | PopulatedNoticia; // Puede ser ID o noticia poblada (cuando status='published')
  contentId: string | PopulatedContent; // Puede ser ID o contenido poblado (siempre poblado en queryQueue)

  // Scheduling
  scheduledPublishAt: string; // ISO date
  queueType: PublicationType;
  priority: number; // 10 (breaking), 8 (news), 3 (blog)
  status: QueueStatus;

  // BullMQ
  bullJobId?: string;
  publishedAt?: string; // ISO date

  // Metadata de procesamiento
  processingMetadata?: {
    attemptCount: number;
    lastAttemptAt?: string;
    lastError?: string;
    processingStartedAt?: string;
    processingCompletedAt?: string;
    actualPublishTime?: string;
    delayFromScheduled?: number; // ms
  };

  // Metadata de cálculo
  calculationMetadata?: {
    queueSizeAtScheduling: number;
    queuePositionAtScheduling: number;
    baseIntervalMs: number;
    priorityMultiplier: number; // 0.7 o 1.0
    randomizationFactor: number; // 0.85-1.15
    finalIntervalMs: number;
    timeWindow: TimeWindow;
    adjustedForTimeWindow: boolean;
    originalScheduledAt?: string;
  };

  // Auditoría
  cancelledAt?: string;
  cancelReason?: string;
  errors: string[];
  warnings: string[];

  createdAt: string;
  updatedAt: string;
}

/**
 * 📊 Estadísticas de la cola
 */
export interface QueueStats {
  totalQueued: number;
  byPriority: {
    high: number; // news (priority >= 8)
    normal: number; // blog (priority < 8)
  };
  byType: {
    breaking: number; // siempre 0 (no entra en cola)
    news: number;
    blog: number;
  };
  estimatedNextPublish: string | null; // ISO date
  averageIntervalMinutes: number;
  publishedToday: number;
}

/**
 * 🔍 Filtros para consultar cola
 */
export interface QueueFilters {
  status?: QueueStatus;
  queueType?: PublicationType;
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  page?: number;
  limit?: number;
}

/**
 * 📄 Respuesta paginada de cola
 */
export interface QueueResponse {
  success: boolean;
  data: PublicationQueueItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 📅 DTO para programar publicación
 */
export interface SchedulePublicationRequest {
  contentId: string;
  publicationType: PublicationType;
  useOriginalImage: boolean;
  customImageUrl?: string;
  isFeatured?: boolean;
  manualScheduleAt?: string; // ISO date - override del algoritmo
}

/**
 * 🔄 DTO para cambiar prioridad
 */
export interface UpdatePriorityRequest {
  priority: number; // 1-10
}

/**
 * 🚫 DTO para cancelar publicación
 */
export interface CancelScheduleRequest {
  reason?: string;
}

/**
 * ✅ Respuesta de programación exitosa
 */
export interface SchedulePublicationResponse {
  success: boolean;
  message: string;
  data: PublicationQueueItem | Record<string, unknown>; // QueueItem o PublishedNoticia si es breaking
  type: 'scheduled' | 'published'; // scheduled para cola, published para breaking
}

/**
 * 🎨 UI Helpers - Configuración de badges por tipo
 */
export const PUBLICATION_TYPE_CONFIG = {
  breaking: {
    label: 'Última Noticia',
    variant: 'destructive' as const,
    emoji: '🔴',
    description: 'Se publicará INMEDIATAMENTE al confirmar. No entra en cola.',
  },
  news: {
    label: 'Es Noticia',
    variant: 'default' as const,
    emoji: '🟡',
    description: 'Se publicará lo antes posible. Prioridad alta en cola (~30-60 min).',
  },
  blog: {
    label: 'Blog Normal',
    variant: 'secondary' as const,
    emoji: '🔵',
    description: 'Se publicará cuando corresponda. Prioridad normal en cola (~2-4 horas).',
  },
} as const;

/**
 * 🎨 UI Helpers - Configuración de badges por estado
 */
export const QUEUE_STATUS_CONFIG = {
  queued: {
    label: 'En Cola',
    variant: 'outline' as const,
    emoji: '⏳',
  },
  processing: {
    label: 'Procesando',
    variant: 'default' as const,
    emoji: '⚙️',
  },
  published: {
    label: 'Publicada',
    variant: 'default' as const,
    emoji: '✅',
  },
  failed: {
    label: 'Fallida',
    variant: 'destructive' as const,
    emoji: '❌',
  },
  cancelled: {
    label: 'Cancelada',
    variant: 'secondary' as const,
    emoji: '🚫',
  },
} as const;

/**
 * 🛠️ Helper: Obtener tiempo relativo para mostrar en UI
 * Ej: "En 15 min", "En 2 horas", "Hace 1 hora"
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 0) {
    // En el pasado
    const absDiff = Math.abs(diffMinutes);
    if (absDiff < 60) return `Hace ${absDiff} min`;
    if (absDiff < 1440) return `Hace ${Math.round(absDiff / 60)} horas`;
    return `Hace ${Math.round(absDiff / 1440)} días`;
  }

  // En el futuro
  if (diffMinutes < 60) return `En ${diffMinutes} min`;
  if (diffMinutes < 1440) return `En ${Math.round(diffMinutes / 60)} horas`;
  return `En ${Math.round(diffMinutes / 1440)} días`;
}

/**
 * 🛠️ Helper: Formatear intervalo en minutos a texto legible
 * Ej: 30 min, 2 horas, 1 día
 */
export function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} horas`;
  return `${Math.round(minutes / 1440)} días`;
}
