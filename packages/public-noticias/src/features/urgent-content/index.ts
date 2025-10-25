/**
 * 🚨 Urgent Content Feature
 *
 * Feature module para contenido URGENT (Breaking News de última hora)
 * - Server functions para obtener contenido activo
 * - Types compartidos
 *
 * NOTA: El cintillo usa BreakingNewsBannerWrapper (componente original del sistema de diseño)
 * Ver: src/components/shared/BreakingNewsBannerWrapper.tsx
 */

// Server functions
export { getActiveUrgentContent } from './server';

// Types
export type {
  UrgentContent,
  ActiveUrgentContentResponse,
  UrgentTimeRemaining,
} from './types/urgent-content.types';
