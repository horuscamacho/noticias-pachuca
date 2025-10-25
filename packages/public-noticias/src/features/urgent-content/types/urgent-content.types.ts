/**
 * 🚨 Urgent Content Types
 * Tipos para contenido URGENT (Breaking News de última hora)
 */

export interface UrgentContent {
  id: string;
  originalTitle: string;
  mode: 'urgent' | 'normal';
  status: 'draft' | 'processing' | 'published' | 'closed' | 'failed';
  isUrgent: boolean;
  urgentAutoCloseAt?: string; // ISO string
  createdAt: string;
  updatedAt: string;

  // Campos agregados para el cintillo (populated desde PublishedNoticia)
  publishedNoticiaId?: string;
  slug?: string; // Para construir links
  title?: string; // Título generado por IA
}

export interface ActiveUrgentContentResponse {
  content: UrgentContent[];
  total: number;
}

export interface UrgentTimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  percentage: number; // 0-100
}
