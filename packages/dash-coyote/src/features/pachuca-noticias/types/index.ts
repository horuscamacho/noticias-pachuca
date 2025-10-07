/**
 * 📰 Pachuca Noticias - Tipos
 * Exportaciones centralizadas
 */

export type {
  // Imágenes
  FeaturedImage,

  // SEO
  SeoData,

  // Social Media
  SocialMediaCopies,
  SocialMediaPublishing,

  // Estadísticas
  NoticiaStats,

  // Metadata
  PublishingMetadata,

  // Noticia principal
  PublishedNoticia,

  // DTOs
  PublishNoticiaDto,
  UpdateNoticiaDto,
  QueryNoticiasDto,

  // Respuestas API
  PublishedNoticiasResponse,
  PublishNoticiaResponse,
  ErrorResponse,

  // UI State
  PublishModalState,
  NoticiasTableFilters,
} from './published-noticia.types';

// ========================================
// 📋 COLA DE PUBLICACIÓN
// ========================================
export type {
  // Tipos base
  PublicationType,
  QueueStatus,
  TimeWindow,

  // Entidades
  PublicationQueueItem,
  QueueStats,

  // Filtros y requests
  QueueFilters,
  SchedulePublicationRequest,
  UpdatePriorityRequest,
  CancelScheduleRequest,

  // Respuestas
  QueueResponse,
  SchedulePublicationResponse,
} from './queue.types';

export {
  // Configuración UI
  PUBLICATION_TYPE_CONFIG,
  QUEUE_STATUS_CONFIG,

  // Helpers
  getRelativeTime,
  formatInterval,
} from './queue.types';
