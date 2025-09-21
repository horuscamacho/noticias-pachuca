import { IsString, IsBoolean, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class QuotaLimitsDto {
  @IsNumber()
  requestsPerHour: number;

  @IsNumber()
  requestsPerDay: number;

  @IsNumber()
  requestsPerMonth: number;
}

export class CreateRapidAPIConfigDto {
  @IsString()
  name: string;

  @IsString()
  host: string;

  @IsString()
  apiKey: string;

  @IsString()
  baseUrl: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ValidateNested()
  @Type(() => QuotaLimitsDto)
  quotaLimits: QuotaLimitsDto;
}

export class UpdateRapidAPIConfigDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  host?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuotaLimitsDto)
  quotaLimits?: QuotaLimitsDto;
}

export class UpdateQuotaUsageDto {
  @IsOptional()
  @IsNumber()
  requestsToday?: number;

  @IsOptional()
  @IsNumber()
  requestsThisMonth?: number;

  @IsOptional()
  @IsNumber()
  addRequests?: number; // Para incrementar requests

  @IsOptional()
  @IsBoolean()
  resetDaily?: boolean;

  @IsOptional()
  @IsBoolean()
  resetMonthly?: boolean;
}