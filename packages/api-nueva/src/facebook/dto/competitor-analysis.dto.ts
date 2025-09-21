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
 * 🎯 DTOs ANÁLISIS DE COMPETIDORES
 * Validación estricta para monitoreo competitivo
 */

export class AlertThresholdsDto {
  @ApiPropertyOptional({
    description: 'Engagement score threshold for viral content alerts',
    example: 1000,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  viralEngagementScore?: number;

  @ApiPropertyOptional({
    description: 'Follower growth rate threshold (percentage)',
    example: 5.0,
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  followerGrowthRate?: number;

  @ApiPropertyOptional({
    description: 'Posting frequency change threshold (percentage)',
    example: 50.0,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  postingFrequencyChange?: number;

  @ApiPropertyOptional({
    description: 'Engagement drop threshold (percentage)',
    example: 25.0,
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  engagementDropPercentage?: number;
}

export class CompetitorAnalysisDto {
  @ApiProperty({
    description: 'Array of competitor Facebook page IDs',
    example: ['123456789', '987654321', '456789123'],
    isArray: true
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  competitorPageIds: string[];

  @ApiPropertyOptional({
    description: 'Start date for analysis (ISO string)',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for analysis (ISO string)',
    example: '2025-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Type of analysis to perform',
    example: 'full',
    enum: ['full', 'metrics_only', 'content_only']
  })
  @IsOptional()
  @IsEnum(['full', 'metrics_only', 'content_only'])
  analysisType?: 'full' | 'metrics_only' | 'content_only';

  @ApiPropertyOptional({
    description: 'Include insights and recommendations',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeInsights?: boolean;

  @ApiPropertyOptional({
    description: 'Generate downloadable report',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  generateReport?: boolean;

  @ApiPropertyOptional({
    description: 'Job priority for queue processing',
    example: 'normal',
    enum: ['low', 'normal', 'high']
  })
  @IsOptional()
  @IsEnum(['low', 'normal', 'high'])
  priority?: 'low' | 'normal' | 'high';
}

export class AddCompetitorDto {
  @ApiProperty({
    description: 'Facebook Page ID to monitor',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiProperty({
    description: 'Competitor name for identification',
    example: 'Competitor XYZ'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Competitor category',
    example: 'Media/News Company'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Monitoring frequency',
    example: 'daily',
    enum: ['hourly', 'daily', 'weekly']
  })
  @IsOptional()
  @IsEnum(['hourly', 'daily', 'weekly'])
  monitoringFrequency?: 'hourly' | 'daily' | 'weekly';

  @ApiPropertyOptional({
    description: 'Alert thresholds configuration'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AlertThresholdsDto)
  alertThresholds?: AlertThresholdsDto;
}

export class CompetitorListDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by category',
    example: 'Media/News Company'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Search by name',
    example: 'competitor'
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateCompetitorDto {
  @ApiPropertyOptional({
    description: 'Update competitor name',
    example: 'New Competitor Name'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Update competitor category',
    example: 'Updated Category'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Update monitoring status',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Update monitoring frequency',
    example: 'daily',
    enum: ['hourly', 'daily', 'weekly']
  })
  @IsOptional()
  @IsEnum(['hourly', 'daily', 'weekly'])
  monitoringFrequency?: 'hourly' | 'daily' | 'weekly';

  @ApiPropertyOptional({
    description: 'Update alert thresholds'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AlertThresholdsDto)
  alertThresholds?: AlertThresholdsDto;
}

export class CompetitorReportRequestDto {
  @ApiProperty({
    description: 'Array of competitor page IDs to include in report',
    example: ['123456789', '987654321'],
    isArray: true
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  competitorPageIds: string[];

  @ApiProperty({
    description: 'Report period start date',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Report period end date',
    example: '2025-01-31T23:59:59.999Z'
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Report format',
    example: 'pdf',
    enum: ['pdf', 'excel', 'json']
  })
  @IsOptional()
  @IsEnum(['pdf', 'excel', 'json'])
  format?: 'pdf' | 'excel' | 'json';

  @ApiPropertyOptional({
    description: 'Include detailed insights',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeInsights?: boolean;

  @ApiPropertyOptional({
    description: 'Include recommendations',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeRecommendations?: boolean;

  @ApiPropertyOptional({
    description: 'Report template',
    example: 'professional',
    enum: ['minimal', 'standard', 'professional', 'detailed']
  })
  @IsOptional()
  @IsEnum(['minimal', 'standard', 'professional', 'detailed'])
  template?: 'minimal' | 'standard' | 'professional' | 'detailed';
}

export class ViralContentAlertDto {
  @ApiProperty({
    description: 'Type of viral content alert',
    example: 'viral_content',
    enum: ['viral_content', 'high_engagement', 'trending_hashtag', 'growth_spike']
  })
  @IsEnum(['viral_content', 'high_engagement', 'trending_hashtag', 'growth_spike'])
  type: 'viral_content' | 'high_engagement' | 'trending_hashtag' | 'growth_spike';

  @ApiProperty({
    description: 'Alert severity level',
    example: 'warning',
    enum: ['info', 'warning', 'critical']
  })
  @IsEnum(['info', 'warning', 'critical'])
  severity: 'info' | 'warning' | 'critical';

  @ApiProperty({
    description: 'Competitor page ID',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  competitorId: string;

  @ApiProperty({
    description: 'Alert message',
    example: 'Competitor posted viral content with 10K+ engagements'
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Additional alert data'
  })
  data: Record<string, unknown>;
}

export class MonitoringConfigDto {
  @ApiPropertyOptional({
    description: 'Enable/disable monitoring',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Monitoring interval in minutes',
    example: 60,
    minimum: 15,
    maximum: 1440
  })
  @IsOptional()
  @IsNumber()
  @Min(15) // Minimum 15 minutes
  @Max(1440) // Maximum 24 hours
  intervalMinutes?: number;

  @ApiPropertyOptional({
    description: 'Maximum concurrent monitoring jobs',
    example: 5,
    minimum: 1,
    maximum: 20
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxConcurrentJobs?: number;

  @ApiPropertyOptional({
    description: 'Enable viral content detection',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  enableViralDetection?: boolean;

  @ApiPropertyOptional({
    description: 'Enable growth spike detection',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  enableGrowthDetection?: boolean;
}