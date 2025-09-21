import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  ArrayNotEmpty,
  IsUrl
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * 🎯 DTOs PARA GESTIÓN DE PÁGINAS DE FACEBOOK
 * Administración de páginas monitoreadas con paginación estándar
 */

export class FacebookExtractionConfigDto {
  @ApiPropertyOptional({
    description: 'Maximum posts to extract per job',
    example: 50,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxPosts?: number = 50;

  @ApiPropertyOptional({
    description: 'Extraction frequency',
    example: 'manual',
    enum: ['manual', 'daily', 'weekly']
  })
  @IsOptional()
  @IsEnum(['manual', 'daily', 'weekly'])
  frequency?: 'manual' | 'daily' | 'weekly' = 'manual';

  @ApiPropertyOptional({
    description: 'Facebook API fields to extract',
    example: ['message', 'created_time', 'likes', 'shares', 'comments'],
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[] = ['message', 'created_time', 'likes', 'shares', 'comments'];
}

export class FacebookPageListDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return value;
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by Facebook page category',
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

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'lastExtraction',
    enum: ['pageName', 'category', 'lastExtraction', 'totalExtractions', 'createdAt']
  })
  @IsOptional()
  @IsEnum(['pageName', 'category', 'lastExtraction', 'totalExtractions', 'createdAt'])
  sortBy?: 'pageName' | 'category' | 'lastExtraction' | 'totalExtractions' | 'createdAt' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class CreateFacebookPageDto {
  @ApiProperty({
    description: 'Facebook Page ID',
    example: '123456789'
  })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiProperty({
    description: 'Page name for identification',
    example: 'Pachuca Noticias'
  })
  @IsString()
  @IsNotEmpty()
  pageName: string;

  @ApiProperty({
    description: 'Facebook page category',
    example: 'Media/News Company'
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({
    description: 'Enable monitoring immediately',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Extraction configuration'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FacebookExtractionConfigDto)
  extractionConfig?: FacebookExtractionConfigDto;
}

export class UpdateFacebookPageDto {
  @ApiPropertyOptional({
    description: 'Update page name',
    example: 'Updated Page Name'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  pageName?: string;

  @ApiPropertyOptional({
    description: 'Update page category',
    example: 'Updated Category'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;

  @ApiPropertyOptional({
    description: 'Update monitoring status',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Update extraction configuration'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FacebookExtractionConfigDto)
  extractionConfig?: FacebookExtractionConfigDto;
}

export class CreateFacebookPageFromUrlDto {
  @ApiProperty({
    description: 'Facebook page URL',
    example: 'https://www.facebook.com/PageName'
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'Must be a valid Facebook URL' })
  pageUrl: string;

  @ApiPropertyOptional({
    description: 'Enable monitoring immediately',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Extraction configuration'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FacebookExtractionConfigDto)
  extractionConfig?: FacebookExtractionConfigDto;
}

export class FacebookExtractionRequestDto {
  @ApiProperty({
    description: 'Array of Facebook page IDs to extract',
    example: ['123456789', '987654321'],
    isArray: true
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  pageIds: string[];

  @ApiPropertyOptional({
    description: 'Maximum posts per page to extract',
    example: 25,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxPosts?: number = 25;

  @ApiPropertyOptional({
    description: 'Facebook API fields to extract',
    example: ['message', 'created_time', 'likes', 'shares'],
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[] = ['message', 'created_time', 'likes', 'shares', 'comments'];

  @ApiPropertyOptional({
    description: 'Job priority for queue processing',
    example: 'normal',
    enum: ['low', 'normal', 'high']
  })
  @IsOptional()
  @IsEnum(['low', 'normal', 'high'])
  priority?: 'low' | 'normal' | 'high' = 'normal';

  @ApiPropertyOptional({
    description: 'Requested by user ID',
    example: 'user_123'
  })
  @IsOptional()
  @IsString()
  requestedBy?: string;

  @ApiPropertyOptional({
    description: 'Additional filters for extraction',
    example: { since: '2025-01-01', until: '2025-01-31' }
  })
  @IsOptional()
  filters?: Record<string, unknown>;
}

export class ExtractedPostListDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by Facebook page ID',
    example: '123456789'
  })
  @IsOptional()
  @IsString()
  pageId?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return value;
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Start date filter (ISO string)',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date filter (ISO string)',
    example: '2025-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Search in post content',
    example: 'pachuca'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by hashtag',
    example: '#pachuca'
  })
  @IsOptional()
  @IsString()
  hashtag?: string;

  @ApiPropertyOptional({
    description: 'Minimum engagement score',
    example: 100,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minEngagement?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'engagementScore',
    enum: ['createdTime', 'extractedAt', 'engagementScore', 'likes', 'shares', 'comments']
  })
  @IsOptional()
  @IsEnum(['createdTime', 'extractedAt', 'engagementScore', 'likes', 'shares', 'comments'])
  sortBy?: 'createdTime' | 'extractedAt' | 'engagementScore' | 'likes' | 'shares' | 'comments' = 'createdTime';

  @ApiPropertyOptional({
    description: 'Sort direction',
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class FacebookJobListDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by job status',
    example: 'completed',
    enum: ['pending', 'running', 'completed', 'failed']
  })
  @IsOptional()
  @IsEnum(['pending', 'running', 'completed', 'failed'])
  status?: 'pending' | 'running' | 'completed' | 'failed';

  @ApiPropertyOptional({
    description: 'Filter by Facebook page ID',
    example: '123456789'
  })
  @IsOptional()
  @IsString()
  pageId?: string;

  @ApiPropertyOptional({
    description: 'Filter by requested user',
    example: 'user_123'
  })
  @IsOptional()
  @IsString()
  requestedBy?: string;

  @ApiPropertyOptional({
    description: 'Start date filter (ISO string)',
    example: '2025-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date filter (ISO string)',
    example: '2025-01-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'completedAt', 'postsExtracted', 'apiCallsUsed', 'status']
  })
  @IsOptional()
  @IsEnum(['createdAt', 'completedAt', 'postsExtracted', 'apiCallsUsed', 'status'])
  sortBy?: 'createdAt' | 'completedAt' | 'postsExtracted' | 'apiCallsUsed' | 'status' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}