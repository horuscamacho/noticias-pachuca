import { IsOptional, IsPositive, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

// For HTTP request validation (controllers)
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  skip?: number;
}

// For internal service usage (allows plain objects)
export interface IPaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

// Utility function for skip calculation
export function calculateSkip(page: number = 1, limit: number = 10): number {
  return (page - 1) * limit;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
