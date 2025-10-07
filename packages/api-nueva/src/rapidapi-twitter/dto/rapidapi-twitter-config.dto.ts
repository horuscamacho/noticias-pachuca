import { IsString, IsBoolean, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class QuotaLimitsDto {
  @ApiProperty({ example: 100, description: 'Requests per hour limit' })
  @IsNumber()
  requestsPerHour: number;

  @ApiProperty({ example: 1000, description: 'Requests per day limit' })
  @IsNumber()
  requestsPerDay: number;

  @ApiProperty({ example: 10000, description: 'Requests per month limit' })
  @IsNumber()
  requestsPerMonth: number;
}

export class CreateRapidAPITwitterConfigDto {
  @ApiProperty({ example: 'Twitter Config Primary', description: 'Configuration name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'twitter241.p.rapidapi.com', description: 'RapidAPI host' })
  @IsString()
  host: string;

  @ApiProperty({ example: '1c2783bfb6msh69f13f0ff956d42p1be769jsn56ace9497881', description: 'RapidAPI key' })
  @IsString()
  apiKey: string;

  @ApiProperty({ example: 'https://twitter241.p.rapidapi.com', description: 'Base URL' })
  @IsString()
  baseUrl: string;

  @ApiPropertyOptional({ example: true, description: 'Is this config active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({ description: 'Quota limits configuration' })
  @ValidateNested()
  @Type(() => QuotaLimitsDto)
  quotaLimits: QuotaLimitsDto;
}

export class UpdateRapidAPITwitterConfigDto {
  @ApiPropertyOptional({ example: 'Twitter Config Updated', description: 'Configuration name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'twitter241.p.rapidapi.com', description: 'RapidAPI host' })
  @IsOptional()
  @IsString()
  host?: string;

  @ApiPropertyOptional({ example: 'new_api_key_here', description: 'RapidAPI key' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ example: 'https://twitter241.p.rapidapi.com', description: 'Base URL' })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({ example: false, description: 'Is this config active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Quota limits configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuotaLimitsDto)
  quotaLimits?: QuotaLimitsDto;
}

export class UpdateTwitterQuotaUsageDto {
  @ApiPropertyOptional({ example: 50, description: 'Total requests today' })
  @IsOptional()
  @IsNumber()
  requestsToday?: number;

  @ApiPropertyOptional({ example: 500, description: 'Total requests this month' })
  @IsOptional()
  @IsNumber()
  requestsThisMonth?: number;

  @ApiPropertyOptional({ example: 5, description: 'Number of requests to add to counters' })
  @IsOptional()
  @IsNumber()
  addRequests?: number; // Para incrementar requests

  @ApiPropertyOptional({ example: false, description: 'Reset daily counters' })
  @IsOptional()
  @IsBoolean()
  resetDaily?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Reset monthly counters' })
  @IsOptional()
  @IsBoolean()
  resetMonthly?: boolean;
}