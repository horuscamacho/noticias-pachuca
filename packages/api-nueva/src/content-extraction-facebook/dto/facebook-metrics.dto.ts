import {
  IsOptional,
  IsDateString,
  IsEnum,
  IsString,
  IsNumber,
  Min
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * 🎯 DTOs PARA MÉTRICAS DE USO DE FACEBOOK API
 * Consultas y filtros para análisis de uso y rendimiento
 */

export class FacebookMetricsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for metrics query (ISO string)',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for metrics query (ISO string)',
    example: '2025-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Metrics aggregation period',
    example: 'daily',
    enum: ['hourly', 'daily', 'weekly', 'monthly']
  })
  @IsOptional()
  @IsEnum(['hourly', 'daily', 'weekly', 'monthly'])
  period?: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily';

  @ApiPropertyOptional({
    description: 'Filter by specific page ID',
    example: '123456789'
  })
  @IsOptional()
  @IsString()
  pageId?: string;

  @ApiPropertyOptional({
    description: 'Include detailed breakdown',
    example: true
  })
  @IsOptional()
  includeBreakdown?: boolean = false;
}

export class FacebookUsageStatsDto {
  @ApiPropertyOptional({
    description: 'Start date for usage stats (ISO string)',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for usage stats (ISO string)',
    example: '2025-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Minimum calls threshold for top pages',
    example: 10,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minCalls?: number = 1;

  @ApiPropertyOptional({
    description: 'Limit for top pages results',
    example: 10,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

export class FacebookPageStatsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Start date for page stats (ISO string)',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for page stats (ISO string)',
    example: '2025-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Sort by metric',
    example: 'totalCalls',
    enum: ['totalCalls', 'errors', 'avgResponseTime', 'successRate']
  })
  @IsOptional()
  @IsEnum(['totalCalls', 'errors', 'avgResponseTime', 'successRate'])
  sortBy?: 'totalCalls' | 'errors' | 'avgResponseTime' | 'successRate' = 'totalCalls';

  @ApiPropertyOptional({
    description: 'Sort direction',
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Filter by page category',
    example: 'Media/News Company'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Search by page name',
    example: 'pachuca'
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class FacebookErrorAnalysisDto {
  @ApiPropertyOptional({
    description: 'Start date for error analysis (ISO string)',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for error analysis (ISO string)',
    example: '2025-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by error type',
    example: 'rate_limit',
    enum: ['rate_limit', 'auth_error', 'timeout', 'invalid_request', 'server_error']
  })
  @IsOptional()
  @IsEnum(['rate_limit', 'auth_error', 'timeout', 'invalid_request', 'server_error'])
  errorType?: 'rate_limit' | 'auth_error' | 'timeout' | 'invalid_request' | 'server_error';

  @ApiPropertyOptional({
    description: 'Minimum error count threshold',
    example: 5,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minErrorCount?: number = 1;

  @ApiPropertyOptional({
    description: 'Group by time period',
    example: 'hour',
    enum: ['hour', 'day', 'week']
  })
  @IsOptional()
  @IsEnum(['hour', 'day', 'week'])
  groupBy?: 'hour' | 'day' | 'week' = 'day';
}

export class FacebookPerformanceDto {
  @ApiPropertyOptional({
    description: 'Start date for performance analysis (ISO string)',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for performance analysis (ISO string)',
    example: '2025-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Include percentile analysis',
    example: true
  })
  @IsOptional()
  includePercentiles?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include trend analysis',
    example: true
  })
  @IsOptional()
  includeTrends?: boolean = false;

  @ApiPropertyOptional({
    description: 'Performance metric to analyze',
    example: 'response_time',
    enum: ['response_time', 'success_rate', 'throughput', 'error_rate']
  })
  @IsOptional()
  @IsEnum(['response_time', 'success_rate', 'throughput', 'error_rate'])
  metric?: 'response_time' | 'success_rate' | 'throughput' | 'error_rate' = 'response_time';
}