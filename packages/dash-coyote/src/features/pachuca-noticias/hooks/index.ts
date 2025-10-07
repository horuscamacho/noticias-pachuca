/**
 * 📰 Pachuca Noticias - Hooks
 * Exportaciones centralizadas
 */

export {
  usePublishedNoticias,
  usePublishedNoticiaById,
  usePublishedNoticiaBySlug,
  publishedNoticiasKeys,
} from './usePublishedNoticias';

export {
  usePublishNoticia,
  useUpdateNoticia,
  useUnpublishNoticia,
} from './usePublishNoticia';

export {
  useAvailableContent,
  useAvailableContentById,
  useAvailableContentCategories,
  availableContentKeys,
} from './useAvailableContent';

export type {
  AvailableContent,
  AvailableContentFilters,
  OriginalContent,
} from './useAvailableContent';

// ========================================
// 📋 COLA DE PUBLICACIÓN
// ========================================
export {
  usePublicationQueue,
  useQueueStats,
  queueKeys,
} from './usePublicationQueue';

export {
  useSchedulePublication,
} from './useSchedulePublication';

export {
  useCancelSchedule,
  useChangePriority,
  useForcePublish,
} from './useQueueMutations';
