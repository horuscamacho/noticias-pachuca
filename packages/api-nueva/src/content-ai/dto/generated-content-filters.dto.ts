import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { GenerationStatus } from '../interfaces/content-generation-request.interface';

/**
 * 📋 DTO para filtros de contenido generado con paginación
 * Extiende de PaginationDto para usar el patrón estándar del proyecto
 */
export class GeneratedContentFiltersDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado de generación',
    enum: ['pending', 'generating', 'completed', 'failed', 'reviewing', 'approved', 'rejected'],
    isArray: true,
    example: ['completed', 'approved'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(['pending', 'generating', 'completed', 'failed', 'reviewing', 'approved', 'rejected'], { each: true })
  @Transform(({ value }) => {
    // Si es string, convertir a array
    if (typeof value === 'string') return [value];
    // Si ya es array, retornar
    return value;
  })
  status?: GenerationStatus[];

  @ApiPropertyOptional({
    description: 'Filtrar por ID de agente',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de template',
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de proveedor de IA',
    example: '507f1f77bcf86cd799439013',
  })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiPropertyOptional({
    description: 'Fecha desde (ISO string)',
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Fecha hasta (ISO string)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Puntuación mínima de calidad',
    example: 80,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minQualityScore?: number;

  @ApiPropertyOptional({
    description: 'Filtrar contenido con revisión',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  hasReview?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar contenido publicado',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isPublished?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por categoría',
    example: 'política',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tags',
    isArray: true,
    example: ['elecciones', 'debate'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') return [value];
    return value;
  })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Búsqueda de texto en título, contenido y resumen',
    example: 'elecciones',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
