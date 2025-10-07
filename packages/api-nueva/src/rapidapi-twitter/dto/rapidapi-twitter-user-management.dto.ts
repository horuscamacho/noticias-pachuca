import { IsString, IsBoolean, IsOptional, IsObject, IsNumber, IsIn, ValidateNested, IsMongoId, IsUrl, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

interface UserDetailsDto {
  bio?: string;
  followers?: number;
  following?: number;
  tweetsCount?: number;
  verified?: boolean;
  isBlueVerified?: boolean;
  profilePicture?: string;
  location?: string;
  website?: string;
  rawData?: Record<string, unknown>;
}

interface UserStatsDto {
  totalPostsExtracted?: number;
  lastSuccessfulExtraction?: Date;
  lastError?: string;
}

class ExtractionFiltersDto {
  @ApiPropertyOptional({ example: '2023-01-01T00:00:00.000Z', description: 'Start date for extraction' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2023-12-31T23:59:59.999Z', description: 'End date for extraction' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: false, description: 'Include replies in extraction' })
  @IsBoolean()
  includeReplies: boolean;

  @ApiProperty({ example: true, description: 'Include retweets in extraction' })
  @IsBoolean()
  includeRetweets: boolean;
}

class ExtractionConfigDto {
  @ApiProperty({ example: true, description: 'Is extraction active for this user' })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ example: 'manual', enum: ['manual', 'daily', 'weekly'], description: 'Extraction frequency' })
  @IsIn(['manual', 'daily', 'weekly'])
  frequency: 'manual' | 'daily' | 'weekly';

  @ApiPropertyOptional({ example: '2023-12-01T10:30:00.000Z', description: 'Last extraction date' })
  @IsOptional()
  @IsDateString()
  lastExtraction?: string;

  @ApiPropertyOptional({ example: '2023-12-02T10:30:00.000Z', description: 'Next scheduled extraction' })
  @IsOptional()
  @IsDateString()
  nextScheduledExtraction?: string;

  @ApiProperty({ example: 20, description: 'Maximum tweets per extraction' })
  @IsNumber()
  maxPostsPerExtraction: number;

  @ApiProperty({ description: 'Extraction filters configuration' })
  @ValidateNested()
  @Type(() => ExtractionFiltersDto)
  extractionFilters: ExtractionFiltersDto;
}

export class CreateRapidAPITwitterUserDto {
  @ApiProperty({ example: '2455740283', description: 'Twitter user rest_id' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'MrBeast', description: 'Twitter username without @' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'MrBeast', description: 'Twitter display name' })
  @IsString()
  displayName: string;

  @ApiProperty({ example: 'https://twitter.com/MrBeast', description: 'Twitter profile URL' })
  @IsUrl()
  userUrl: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Twitter config ObjectId' })
  @IsMongoId()
  configId: string;

  @ApiPropertyOptional({ description: 'User details from Twitter API' })
  @IsOptional()
  @IsObject()
  userDetails?: UserDetailsDto;

  @ApiProperty({ description: 'Extraction configuration for this user' })
  @ValidateNested()
  @Type(() => ExtractionConfigDto)
  extractionConfig: ExtractionConfigDto;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'paused', 'error'], description: 'User status' })
  @IsOptional()
  @IsIn(['active', 'paused', 'error'])
  status?: 'active' | 'paused' | 'error';
}

export class UpdateRapidAPITwitterUserDto {
  @ApiPropertyOptional({ example: 'MrBeast_Updated', description: 'Twitter username' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'MrBeast Official', description: 'Twitter display name' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'https://twitter.com/MrBeast', description: 'Twitter profile URL' })
  @IsOptional()
  @IsUrl()
  userUrl?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Twitter config ObjectId' })
  @IsOptional()
  @IsMongoId()
  configId?: string;

  @ApiPropertyOptional({ description: 'User details from Twitter API' })
  @IsOptional()
  @IsObject()
  userDetails?: UserDetailsDto;

  @ApiPropertyOptional({ description: 'Extraction configuration for this user' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtractionConfigDto)
  extractionConfig?: ExtractionConfigDto;

  @ApiPropertyOptional({ description: 'User statistics' })
  @IsOptional()
  @IsObject()
  stats?: UserStatsDto;

  @ApiPropertyOptional({ example: 'paused', enum: ['active', 'paused', 'error'], description: 'User status' })
  @IsOptional()
  @IsIn(['active', 'paused', 'error'])
  status?: 'active' | 'paused' | 'error';
}

export class ValidateTwitterUserDto {
  @ApiProperty({ example: 'MrBeast', description: 'Twitter username to validate' })
  @IsString()
  username: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Config ID to use for validation' })
  @IsOptional()
  @IsMongoId()
  configId?: string;
}

export class ExtractTwitterUserDetailsDto {
  @ApiProperty({ example: 'MrBeast', description: 'Twitter username to extract details for' })
  @IsString()
  username: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Config ID to use for extraction' })
  @IsOptional()
  @IsMongoId()
  configId?: string;
}

export class ExtractTwitterUserTweetsDto {
  @ApiProperty({ example: '2455740283', description: 'Twitter user rest_id' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ example: 20, description: 'Number of tweets to extract', default: 20 })
  @IsOptional()
  @IsNumber()
  count?: number;

  @ApiPropertyOptional({ example: false, description: 'Include replies', default: false })
  @IsOptional()
  @IsBoolean()
  includeReplies?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Include retweets', default: true })
  @IsOptional()
  @IsBoolean()
  includeRetweets?: boolean;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Config ID to use for extraction' })
  @IsOptional()
  @IsMongoId()
  configId?: string;

  @ApiPropertyOptional({ example: '2023-01-01T00:00:00.000Z', description: 'Start date for extraction' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2023-12-31T23:59:59.999Z', description: 'End date for extraction' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}