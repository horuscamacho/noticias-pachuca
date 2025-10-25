/**
 * 📝 User Generated Content Types
 * Tipos para contenido manual creado por usuarios (URGENT y NORMAL)
 */

import { SocialMediaCopies, GenerationMetadata } from './generated-content.types';

// ============================================================
// ENUMS
// ============================================================

export enum PublicationType {
  BREAKING = 'breaking',
  NOTICIA = 'noticia',
  BLOG = 'blog',
}

export enum UserContentMode {
  URGENT = 'urgent',
  NORMAL = 'normal',
}

export enum UserContentStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  FAILED = 'failed',
}

// ============================================================
// USER GENERATED CONTENT (Core Entity)
// ============================================================

export interface UserGeneratedContent {
  id: string;
  originalTitle: string;
  originalContent: string;
  uploadedImageUrls: string[];
  uploadedVideoUrls: string[];
  mode: UserContentMode;
  publicationType?: PublicationType;

  // Urgent fields
  isUrgent: boolean;
  urgentCreatedAt?: string;
  urgentAutoCloseAt?: string;
  urgentClosed: boolean;
  urgentClosedAt?: string;
  urgentClosedBy?: 'user' | 'system';

  // References
  generatedContentId?: string;
  publishedNoticiaId?: string;
  createdBy: string;

  // Status
  status: UserContentStatus;

  // Metadata
  processingMetadata?: {
    startedAt?: string;
    completedAt?: string;
    processingTime?: number;
    retries?: number;
    errors?: string[];
  };

  urgentMetrics?: {
    viewsDuringActive?: number;
    updatesCount?: number;
    timeActive?: number;
    closureReason?: string;
  };

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// CREATE DTOs
// ============================================================

export interface CreateUrgentContentDto {
  originalTitle: string;
  originalContent: string;
  agentId: string; // Required: ID del agente editorial para generar el contenido
  siteId: string; // Required: ID del sitio donde se publicará el contenido
  uploadedImageUrls?: string[];
  uploadedVideoUrls?: string[];
}

export interface CreateNormalContentDto {
  originalTitle: string;
  originalContent: string;
  agentId: string; // Required: ID del agente editorial para generar el contenido
  siteId: string; // Required: ID del sitio donde se publicará el contenido
  publicationType: PublicationType;
  uploadedImageUrls?: string[];
  uploadedVideoUrls?: string[];
}

// ============================================================
// UPDATE DTOs
// ============================================================

export interface UpdateUrgentContentDto {
  newContent: string;
  newImageUrls?: string[];
}

// ============================================================
// RESPONSE DTOs
// ============================================================

export interface UserGeneratedContentResponse {
  id: string;
  originalTitle: string;
  mode: UserContentMode;
  status: UserContentStatus;
  isUrgent?: boolean;
  urgentAutoCloseAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveUrgentContentResponse {
  content: UserGeneratedContentResponse[];
  total: number;
}

// ============================================================
// API RESPONSE WRAPPERS
// ============================================================

export interface CreateUrgentContentResponse {
  content: UserGeneratedContentResponse;
}

export interface CreateNormalContentResponse {
  content: UserGeneratedContentResponse;
}

export interface UpdateUrgentContentResponse {
  content: UserGeneratedContentResponse;
}

export interface CloseUrgentContentResponse {
  content: UserGeneratedContentResponse;
}

// ============================================================
// DETAILED CONTENT (Para vista detalle)
// ============================================================

export interface UserGeneratedContentDetail extends UserGeneratedContent {
  // Contenido generado por IA
  generatedContent?: {
    title: string;
    content: string;
    summary?: string;
    keywords?: string[];
    tags?: string[];
    category?: string;
    socialMediaCopies?: SocialMediaCopies;
    generationMetadata?: GenerationMetadata;
  };

  // Contenido publicado
  publishedContent?: {
    slug: string;
    publishedAt: string;
    url: string;
    views?: number;
    shares?: number;
  };
}

// ============================================================
// UPLOAD FILE RESPONSE
// ============================================================

export interface UploadFileResponse {
  urls: string[];
  message: string;
}

// ============================================================
// STATISTICS
// ============================================================

export interface UrgentContentStats {
  totalActive: number;
  totalExpiredPendingClosure: number;
  totalClosed: number;
  nextClosureIn?: number; // Minutos hasta el próximo cierre
}

// ============================================================
// TIME HELPERS
// ============================================================

export interface UrgentTimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  percentage: number; // 0-100
}

// ============================================================
// UI HELPERS
// ============================================================

export interface UserContentCardData {
  id: string;
  title: string;
  mode: UserContentMode;
  status: UserContentStatus;
  isUrgent: boolean;
  timeRemaining?: UrgentTimeRemaining;
  createdAt: string;
  updatedAt: string;
  canUpdate: boolean;
  canClose: boolean;
}

export interface UserContentFilters {
  mode?: UserContentMode;
  status?: UserContentStatus;
  isUrgent?: boolean;
  dateFrom?: string;
  dateTo?: string;
}
