import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsBoolean
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * 🎯 DTOs ANÁLISIS DE CONTENIDO DE PÁGINAS
 * Para análisis detallado de contenido y patrones
 */

export class PageContentAnalysisDto {
  @ApiProperty({
    description: 'Facebook Page ID to analyze',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiPropertyOptional({
    description: 'Start date for content analysis',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for content analysis',
    example: '2025-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of posts to analyze',
    example: 100,
    minimum: 10,
    maximum: 500
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(500)
  maxPosts?: number;

  @ApiPropertyOptional({
    description: 'Include engagement analysis',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeEngagement?: boolean;

  @ApiPropertyOptional({
    description: 'Include posting pattern analysis',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includePostingPatterns?: boolean;

  @ApiPropertyOptional({
    description: 'Include hashtag analysis',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeHashtags?: boolean;

  @ApiPropertyOptional({
    description: 'Include content type analysis',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeContentTypes?: boolean;

  @ApiPropertyOptional({
    description: 'Generate content recommendations',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  generateRecommendations?: boolean;
}

export class PostEngagementAnalysisDto extends PaginationDto {
  @ApiProperty({
    description: 'Facebook Page ID',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiPropertyOptional({
    description: 'Filter by post type',
    example: 'photo',
    enum: ['status', 'photo', 'video', 'link', 'event', 'offer']
  })
  @IsOptional()
  @IsEnum(['status', 'photo', 'video', 'link', 'event', 'offer'])
  postType?: 'status' | 'photo' | 'video' | 'link' | 'event' | 'offer';

  @ApiPropertyOptional({
    description: 'Minimum engagement threshold',
    example: 100,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minEngagement?: number;

  @ApiPropertyOptional({
    description: 'Sort by engagement metric',
    example: 'total_engagement',
    enum: ['total_engagement', 'likes', 'comments', 'shares', 'created_time']
  })
  @IsOptional()
  @IsEnum(['total_engagement', 'likes', 'comments', 'shares', 'created_time'])
  sortBy?: 'total_engagement' | 'likes' | 'comments' | 'shares' | 'created_time';

  @ApiPropertyOptional({
    description: 'Date range start',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Date range end',
    example: '2025-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class PostingPatternAnalysisDto {
  @ApiProperty({
    description: 'Facebook Page ID',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiPropertyOptional({
    description: 'Analysis period in days',
    example: 30,
    minimum: 7,
    maximum: 365
  })
  @IsOptional()
  @IsNumber()
  @Min(7)
  @Max(365)
  periodDays?: number;

  @ApiPropertyOptional({
    description: 'Include hourly breakdown',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeHourlyBreakdown?: boolean;

  @ApiPropertyOptional({
    description: 'Include day of week analysis',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeDayOfWeekAnalysis?: boolean;

  @ApiPropertyOptional({
    description: 'Include content type correlation',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeContentTypeCorrelation?: boolean;

  @ApiPropertyOptional({
    description: 'Timezone for pattern analysis',
    example: 'America/Mexico_City'
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class HashtagAnalysisDto {
  @ApiProperty({
    description: 'Facebook Page ID',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiPropertyOptional({
    description: 'Minimum hashtag frequency',
    example: 2,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minFrequency?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of hashtags to return',
    example: 50,
    minimum: 10,
    maximum: 200
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Include engagement correlation',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeEngagementCorrelation?: boolean;

  @ApiPropertyOptional({
    description: 'Date range for hashtag analysis',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for hashtag analysis',
    example: '2025-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ContentTypeAnalysisDto {
  @ApiProperty({
    description: 'Facebook Page ID',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiPropertyOptional({
    description: 'Include performance metrics for each content type',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includePerformanceMetrics?: boolean;

  @ApiPropertyOptional({
    description: 'Include posting frequency for each type',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeFrequency?: boolean;

  @ApiPropertyOptional({
    description: 'Include best performing posts for each type',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeBestPerforming?: boolean;

  @ApiPropertyOptional({
    description: 'Number of best performing posts per type',
    example: 3,
    minimum: 1,
    maximum: 10
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  topPostsPerType?: number;

  @ApiPropertyOptional({
    description: 'Analysis period start',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Analysis period end',
    example: '2025-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class AudienceInsightsDto {
  @ApiProperty({
    description: 'Facebook Page ID',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiPropertyOptional({
    description: 'Include demographic data',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeDemographics?: boolean;

  @ApiPropertyOptional({
    description: 'Include geographic data',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeGeographics?: boolean;

  @ApiPropertyOptional({
    description: 'Include behavioral insights',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeBehavioral?: boolean;

  @ApiPropertyOptional({
    description: 'Date range for insights',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for insights',
    example: '2025-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ContentRecommendationsDto {
  @ApiProperty({
    description: 'Facebook Page ID',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiPropertyOptional({
    description: 'Include posting time recommendations',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeTimingRecommendations?: boolean;

  @ApiPropertyOptional({
    description: 'Include content type recommendations',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeContentTypeRecommendations?: boolean;

  @ApiPropertyOptional({
    description: 'Include hashtag recommendations',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeHashtagRecommendations?: boolean;

  @ApiPropertyOptional({
    description: 'Include frequency recommendations',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeFrequencyRecommendations?: boolean;

  @ApiPropertyOptional({
    description: 'Based on analysis period (days)',
    example: 30,
    minimum: 7,
    maximum: 90
  })
  @IsOptional()
  @IsNumber()
  @Min(7)
  @Max(90)
  analysisPeriodDays?: number;

  @ApiPropertyOptional({
    description: 'Include competitor benchmarking',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  includeCompetitorBenchmarking?: boolean;

  @ApiPropertyOptional({
    description: 'Competitor page IDs for benchmarking',
    isArray: true,
    example: ['987654321', '456789123']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  competitorPageIds?: string[];
}