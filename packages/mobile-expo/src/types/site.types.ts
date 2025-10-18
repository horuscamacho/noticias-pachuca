/**
 * 🌐 FASE 8: Tipos SIMPLIFICADOS para gestión de Sites
 *
 * IMPORTANTE: Schema simplificado - solo campos esenciales
 * - CDN, SEO, branding manejados por cada frontend
 * - socialMedia se agrega en FASE 13
 */

// ========================================
// SUB-TIPOS (FASE 13)
// ========================================

export interface FacebookPage {
  pageId: string;
  pageName: string;
  publishingConfigId?: string;
  isActive: boolean;
  priority: number;
}

export interface TwitterAccount {
  accountId: string;
  username: string;
  displayName: string;
  publishingConfigId?: string;
  isActive: boolean;
  priority: number;
}

export interface SocialMedia {
  facebookPages?: FacebookPage[];
  twitterAccounts?: TwitterAccount[];
  getLateApiKey?: string;
}

// ========================================
// SITE (SIMPLIFICADO)
// ========================================

export interface Site {
  id: string;
  domain: string;
  slug: string;
  name: string;
  description: string;

  // Social Media (FASE 13)
  socialMedia?: SocialMedia;

  // Estado
  isActive: boolean;
  isMainSite: boolean;

  // Stats (auto-generadas)
  totalNoticias: number;
  totalViews: number;
  totalSocialPosts: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ========================================
// CREATE/UPDATE PAYLOADS (SIMPLIFICADOS - 5 campos)
// ========================================

export interface CreateSitePayload {
  domain: string;
  name: string;
  description: string;
  isMainSite?: boolean;
  isActive?: boolean;
}

export interface UpdateSitePayload {
  domain?: string;
  name?: string;
  description?: string;
  isMainSite?: boolean;
  isActive?: boolean;
  socialMedia?: SocialMedia; // FASE 13
}

// ========================================
// API RESPONSES
// ========================================

export interface SitesListResponse {
  sites: Site[];
  total: number;
}

export interface SiteStatsResponse {
  totalAgents: number;
  totalSites: number;
  totalNoticias: number;
  totalOutlets: number;
  siteStats: Array<{
    siteId: string;
    siteName: string;
    totalNoticias: number;
    totalViews: number;
    totalSocialPosts: number;
  }>;
}

// ========================================
// FILTROS Y QUERY PARAMS
// ========================================

export interface SitesFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
