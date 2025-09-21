import { IsString, IsBoolean, IsOptional, IsObject, IsNumber, IsIn, ValidateNested, IsMongoId, IsUrl, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

interface PageDetailsDto {
  name?: string;
  about?: string;
  category?: string;
  followers?: number;
  likes?: number;
  website?: string;
  verified?: boolean;
  profilePicture?: string;
  coverPhoto?: string;
  rawData?: Record<string, unknown>;
}

interface PageStatsDto {
  totalPostsExtracted?: number;
  lastSuccessfulExtraction?: Date;
  extractionErrors?: number;
  avgPostsPerDay?: number;
}

class ExtractionFiltersDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsBoolean()
  includeComments: boolean;

  @IsBoolean()
  includeReactions: boolean;
}

class ExtractionConfigDto {
  @IsBoolean()
  isActive: boolean;

  @IsIn(['manual', 'daily', 'weekly'])
  frequency: 'manual' | 'daily' | 'weekly';

  @IsOptional()
  @IsDateString()
  lastExtraction?: string;

  @IsOptional()
  @IsDateString()
  nextScheduledExtraction?: string;

  @IsNumber()
  maxPostsPerExtraction: number;

  @ValidateNested()
  @Type(() => ExtractionFiltersDto)
  extractionFilters: ExtractionFiltersDto;
}

export class CreateRapidAPIFacebookPageDto {
  @IsString()
  pageId: string;

  @IsString()
  pageName: string;

  @IsUrl()
  pageUrl: string;

  @IsMongoId()
  configId: string;

  @IsOptional()
  @IsObject()
  pageDetails?: PageDetailsDto;

  @ValidateNested()
  @Type(() => ExtractionConfigDto)
  extractionConfig: ExtractionConfigDto;
}

export class UpdateRapidAPIFacebookPageDto {
  @IsOptional()
  @IsString()
  pageName?: string;

  @IsOptional()
  @IsUrl()
  pageUrl?: string;

  @IsOptional()
  @IsMongoId()
  configId?: string;

  @IsOptional()
  @IsObject()
  pageDetails?: PageDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractionConfigDto)
  extractionConfig?: ExtractionConfigDto;

  @IsOptional()
  @IsObject()
  stats?: PageStatsDto;
}

export class ValidatePageUrlDto {
  @IsUrl()
  @IsString()
  pageUrl: string;

  @IsOptional()
  @IsMongoId()
  configId?: string;
}

export class ExtractPageDetailsDto {
  @IsString()
  @IsUrl()
  pageUrl: string;

  @IsMongoId()
  @IsOptional()
  configId?: string;
}