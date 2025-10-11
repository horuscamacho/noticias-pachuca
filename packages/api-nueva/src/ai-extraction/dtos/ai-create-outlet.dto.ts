import { IsUrl, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AiAnalyzeListingResponseDto } from './ai-analyze-listing.dto';
import { AiAnalyzeContentResponseDto } from './ai-analyze-content.dto';

/**
 * DTO para solicitud de creación automática de outlet con AI
 */
export class AiCreateOutletDto {
  @ApiProperty({
    description: 'Nombre del sitio web',
    example: 'El Sol de Pachuca',
  })
  @IsString({ message: 'name debe ser una cadena de texto' })
  @MinLength(3, { message: 'name debe tener al menos 3 caracteres' })
  @IsNotEmpty({ message: 'name es requerido' })
  name: string;

  @ApiProperty({
    description: 'URL base del sitio web',
    example: 'https://www.elsolde pachuca.com.mx',
  })
  @IsUrl({}, { message: 'baseUrl debe ser una URL válida' })
  @IsNotEmpty({ message: 'baseUrl es requerido' })
  baseUrl: string;

  @ApiProperty({
    description: 'URL de la página de listado de noticias',
    example: 'https://www.elsoldepachuca.com.mx/local',
  })
  @IsUrl({}, { message: 'listingUrl debe ser una URL válida' })
  @IsNotEmpty({ message: 'listingUrl es requerido' })
  listingUrl: string;

  @ApiProperty({
    description: 'URL de un artículo de prueba (opcional)',
    example: 'https://www.elsoldepachuca.com.mx/local/articulo-1',
    required: false,
  })
  @IsUrl({}, { message: 'testUrl debe ser una URL válida' })
  @IsOptional()
  testUrl?: string;
}

/**
 * DTO para resultados de validación
 */
export class ValidationResultsDto {
  @ApiProperty({
    description: 'Validación de listado exitosa',
    example: true,
  })
  listingSuccess: boolean;

  @ApiProperty({
    description: 'Validación de contenido exitosa',
    example: true,
  })
  contentSuccess: boolean;

  @ApiProperty({
    description: 'Confianza general del análisis (0-1)',
    example: 0.93,
  })
  overallConfidence: number;

  @ApiProperty({
    description: 'Mensajes de validación',
    example: ['12 artículos encontrados en listado', 'Contenido extraído correctamente'],
    type: [String],
  })
  messages: string[];
}

/**
 * DTO para respuesta de creación de outlet con AI
 */
export class AiCreateOutletResponseDto {
  @ApiProperty({
    description: 'Outlet creado exitosamente',
  })
  outlet: any; // Será el tipo OutletConfig real

  @ApiProperty({
    description: 'Resultados del análisis de listado',
    type: AiAnalyzeListingResponseDto,
  })
  listingAnalysis: AiAnalyzeListingResponseDto;

  @ApiProperty({
    description: 'Resultados del análisis de contenido',
    type: AiAnalyzeContentResponseDto,
  })
  contentAnalysis: AiAnalyzeContentResponseDto;

  @ApiProperty({
    description: 'Resultados de validación',
    type: ValidationResultsDto,
  })
  validationResults: ValidationResultsDto;

  @ApiProperty({
    description: 'Tiempo total de procesamiento en milisegundos',
    example: 12500,
  })
  processingTimeMs: number;
}
