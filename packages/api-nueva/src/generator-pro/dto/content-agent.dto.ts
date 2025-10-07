import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  MinLength,
  IsObject,
  IsNumber,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { Types } from 'mongoose';

/**
 * 👤 DTOs para Content Agents - Perfiles Editoriales
 * Sistema de agentes con personalidades únicas para generación de contenido
 */

export enum AgentType {
  REPORTERO = 'reportero',
  COLUMNISTA = 'columnista',
  TRASCENDIDO = 'trascendido',
  SEO_SPECIALIST = 'seo-specialist'
}

export enum EditorialLean {
  CONSERVATIVE = 'conservative',
  PROGRESSIVE = 'progressive',
  NEUTRAL = 'neutral',
  HUMOR = 'humor',
  CRITICAL = 'critical',
  ANALYTICAL = 'analytical'
}

export enum WritingTone {
  FORMAL = 'formal',
  INFORMAL = 'informal',
  HUMOR = 'humor',
  ACADEMIC = 'academic',
  CONVERSATIONAL = 'conversational'
}

export enum VocabularyLevel {
  SIMPLE = 'simple',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  TECHNICAL = 'technical'
}

export enum ContentLength {
  SHORT = 'short',
  MEDIUM = 'medium',
  LONG = 'long',
  VARIABLE = 'variable'
}

export enum ContentStructure {
  LINEAR = 'linear',
  NARRATIVE = 'narrative',
  ANALYTICAL = 'analytical',
  OPINION = 'opinion'
}

export enum TargetAudience {
  GENERAL = 'general',
  SPECIALIZED = 'specialized',
  ACADEMIC = 'academic',
  YOUTH = 'youth',
  SENIOR = 'senior'
}

/**
 * 📝 DTO para estilo de escritura del agente
 */
export class WritingStyleDto {
  @IsEnum(WritingTone)
  tone: WritingTone;

  @IsEnum(VocabularyLevel)
  vocabulary: VocabularyLevel;

  @IsEnum(ContentLength)
  length: ContentLength;

  @IsEnum(ContentStructure)
  structure: ContentStructure;

  @IsEnum(TargetAudience)
  audience: TargetAudience;
}

/**
 * 📝 DTO para configuración avanzada del agente
 */
export class AgentConfigurationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxArticlesPerDay?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredProviders?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  qualityThreshold?: number;

  @IsOptional()
  @IsBoolean()
  autoPublish?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;
}

/**
 * 📝 DTO para restricciones del agente
 */
export class AgentConstraintsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bannedTopics?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredKeywords?: string[];

  @IsOptional()
  @IsNumber()
  @Min(50)
  maxWordCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  minWordCount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contentGuidelines?: string[];
}

/**
 * 📝 DTO para workflow del agente
 */
export class AgentWorkflowDto {
  @IsOptional()
  @IsBoolean()
  requiresFactCheck?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresHumanReview?: boolean;

  @IsOptional()
  @IsBoolean()
  autoCategories?: boolean;

  @IsOptional()
  @IsBoolean()
  generateSEO?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  steps?: string[];
}

/**
 * ✅ DTO para CREAR un nuevo Content Agent
 */
export class CreateContentAgentDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  name: string;

  @IsEnum(AgentType, { message: 'Tipo de agente inválido' })
  agentType: AgentType;

  @IsString()
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres' })
  description: string;

  @IsString()
  @MinLength(50, { message: 'La personalidad debe tener al menos 50 caracteres' })
  personality: string;

  @IsArray()
  @IsString({ each: true })
  specializations: string[];

  @IsEnum(EditorialLean, { message: 'Línea editorial inválida' })
  editorialLean: EditorialLean;

  @ValidateNested()
  @Type(() => WritingStyleDto)
  writingStyle: WritingStyleDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultTemplates?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => AgentConfigurationDto)
  configuration?: AgentConfigurationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AgentConstraintsDto)
  constraints?: AgentConstraintsDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sampleOutputs?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AgentWorkflowDto)
  workflow?: AgentWorkflowDto;
}

/**
 * ✅ DTO para ACTUALIZAR un Content Agent existente
 * Todos los campos son opcionales
 */
export class UpdateContentAgentDto extends PartialType(CreateContentAgentDto) {}

/**
 * 📊 DTO para métricas de performance del agente
 */
export class PerformanceMetricsDto {
  totalArticles: number;
  averageQuality: number;
  averageTime: number;
  successRate: number;
  userRatings: number;
  lastActive: Date;
}

/**
 * ✅ DTO de RESPUESTA para Content Agent
 * Incluye toda la información del agente más metadata
 */
export class ContentAgentResponseDto {
  id: string;
  name: string;
  agentType: string;
  description: string;
  personality: string;
  specializations: string[];
  editorialLean: string;
  writingStyle: WritingStyleDto;
  defaultTemplates?: string[];
  isActive: boolean;
  configuration?: AgentConfigurationDto;
  constraints?: AgentConstraintsDto;
  workflow?: AgentWorkflowDto;
  sampleOutputs?: string[];
  performanceMetrics?: PerformanceMetricsDto;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 📊 DTO para estadísticas del agente
 */
export class AgentStatisticsDto {
  agentId: string;
  agentName: string;
  totalArticlesGenerated: number;
  averageQualityScore: number;
  averageProcessingTime: number;
  successRate: number;
  failureRate: number;
  averageUserRating: number;
  lastActiveDate: Date;
  topSpecializations: string[];
  mostUsedTemplates: string[];
  contentDistribution: Record<string, number>;
}
