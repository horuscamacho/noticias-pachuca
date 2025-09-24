import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AIProviderDocument = AIProvider & Document;

/**
 * 🤖 Schema para configuración de proveedores de IA
 * Gestiona APIs de OpenAI, Anthropic, etc. con rate limiting y cost tracking
 */
@Schema({ timestamps: true })
export class AIProvider {
  @Prop({ required: true, trim: true, unique: true })
  name: string; // "OpenAI", "Anthropic", "Google"

  @Prop({ required: true })
  apiKey: string; // API key encriptada

  @Prop({ required: true, trim: true })
  baseUrl: string; // "https://api.openai.com/v1", "https://api.anthropic.com"

  @Prop({ required: true, trim: true })
  model: string; // "gpt-4o", "claude-4", "gemini-pro"

  @Prop({ required: true, min: 1, max: 200000 })
  maxTokens: number; // Límite de tokens por request

  @Prop({ required: true, min: 0, max: 2 })
  temperature: number; // Creatividad del modelo (0-2)

  @Prop({ default: true })
  isActive: boolean; // Proveedor activo

  @Prop({ required: true, min: 0 })
  costPerToken: number; // Costo por token para tracking

  @Prop({ type: Object, required: true })
  rateLimits: {
    requestsPerMinute: number; // Límite requests por minuto
    requestsPerHour: number; // Límite requests por hora
    tokensPerMinute?: number; // Límite tokens por minuto
    tokensPerDay?: number; // Límite tokens por día
  };

  @Prop({ type: Object })
  healthStatus?: {
    lastCheck: Date; // Último health check
    isHealthy: boolean; // Estado de salud
    responseTime?: number; // Tiempo de respuesta (ms)
    errorCount?: number; // Errores en las últimas 24h
    lastError?: string; // Último error registrado
  };

  @Prop({ type: Object })
  usageStats?: {
    totalRequests: number; // Total requests realizados
    totalTokens: number; // Total tokens consumidos
    totalCost: number; // Costo total acumulado
    lastUsed?: Date; // Última vez que se usó
    monthlyRequests?: number; // Requests este mes
    monthlyTokens?: number; // Tokens este mes
    monthlyCost?: number; // Costo este mes
  };

  @Prop({ type: Object })
  configuration?: {
    systemPrompt?: string; // System prompt global para este proveedor
    maxRetries?: number; // Máximo reintentos en caso de error
    timeoutMs?: number; // Timeout para requests (ms)
    supportsStreaming?: boolean; // Soporte para streaming
    supportsBatching?: boolean; // Soporte para batch processing
    priority?: number; // Prioridad de uso (1-10, 10 = mayor prioridad)
  };

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const AIProviderSchema = SchemaFactory.createForClass(AIProvider);

// Índices para performance y queries comunes
AIProviderSchema.index({ name: 1 });
AIProviderSchema.index({ isActive: 1 });
AIProviderSchema.index({ model: 1 });
AIProviderSchema.index({ 'configuration.priority': -1 });
AIProviderSchema.index({ 'healthStatus.isHealthy': 1 });
AIProviderSchema.index({ 'usageStats.lastUsed': -1 });

// Índice compuesto para selección de proveedor
AIProviderSchema.index({ isActive: 1, 'healthStatus.isHealthy': 1, 'configuration.priority': -1 });