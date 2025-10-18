import {
  IsString,
  IsBoolean,
  IsOptional,
  IsUrl,
  IsObject,
  ValidateNested,
  IsArray,
  IsNumber,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 🌐 FASE 7: DTOs SIMPLIFICADOS para gestión de Sites
 *
 * IMPORTANTE: Schema simplificado - solo campos esenciales
 * - CDN, SEO, branding manejados por cada frontend
 * - socialMedia se agrega en FASE 13
 */

// ========================================
// SUB-DTOs para objetos anidados (FASE 13)
// ========================================

export class FacebookPageDto {
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @IsString()
  @IsNotEmpty()
  pageName: string;

  @IsOptional()
  @IsString()
  publishingConfigId?: string;

  @IsBoolean()
  isActive: boolean;

  @IsNumber()
  priority: number;
}

export class TwitterAccountDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsOptional()
  @IsString()
  publishingConfigId?: string;

  @IsBoolean()
  isActive: boolean;

  @IsNumber()
  priority: number;
}

export class SocialMediaDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacebookPageDto)
  facebookPages?: FacebookPageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TwitterAccountDto)
  twitterAccounts?: TwitterAccountDto[];

  @IsOptional()
  @IsString()
  getLateApiKey?: string;
}

// ========================================
// CREATE SITE DTO - SIMPLIFICADO (5 campos)
// ========================================

export class CreateSiteDto {
  @IsUrl({}, { message: 'domain debe ser una URL válida' })
  @IsNotEmpty()
  domain: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @IsOptional()
  @IsBoolean()
  isMainSite?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ========================================
// UPDATE SITE DTO - SIMPLIFICADO
// ========================================

export class UpdateSiteDto {
  @IsOptional()
  @IsUrl({}, { message: 'domain debe ser una URL válida' })
  domain?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isMainSite?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Redes sociales (FASE 13)
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto;
}

// ========================================
// RESPONSE DTO - SIMPLIFICADO
// ========================================

export class SiteResponseDto {
  id: string;
  domain: string;
  slug: string;
  name: string;
  description: string;

  socialMedia?: {
    facebookPages?: FacebookPageDto[];
    twitterAccounts?: TwitterAccountDto[];
    getLateApiKey?: string;
  };

  isActive: boolean;
  isMainSite: boolean;

  // Stats (auto-generadas)
  totalNoticias: number;
  totalViews: number;
  totalSocialPosts: number;

  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// STATS DTO
// ========================================

export class StatsResponseDto {
  totalAgents: number;
  totalSites: number;
  totalNoticias: number;
  totalOutlets: number; // Total de NewsWebsiteConfig (outlets de scraping)

  // Stats detalladas por sitio
  siteStats: Array<{
    siteId: string;
    siteName: string;
    totalNoticias: number;
    totalViews: number;
    totalSocialPosts: number;
  }>;
}

// ========================================
// QUERY/FILTERS DTO
// ========================================

export class QuerySitesDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}
