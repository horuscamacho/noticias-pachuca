/**
 * 🤖 Interfaces para configuración de proveedores de IA
 * Soporte para OpenAI, Anthropic, Google y otros providers
 */

export interface AIProviderConfig {
  name: string; // "OpenAI", "Anthropic", "Google"
  apiKey: string; // API key (se encripta antes de almacenar)
  baseUrl: string; // Endpoint base de la API
  model: string; // Modelo específico
  maxTokens: number; // Límite de tokens por request
  temperature: number; // Creatividad del modelo (0-2)
  isActive: boolean; // Proveedor activo
  costPerToken: number; // Costo por token para tracking
  rateLimits: RateLimits;
  healthStatus?: HealthStatus;
  usageStats?: UsageStats;
  configuration?: ProviderConfiguration;
}

export interface RateLimits {
  requestsPerMinute: number;
  requestsPerHour: number;
  tokensPerMinute?: number;
  tokensPerDay?: number;
}

export interface HealthStatus {
  lastCheck: Date;
  isHealthy: boolean;
  responseTime?: number; // ms
  errorCount?: number; // Errores en las últimas 24h
  lastError?: string;
}

export interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  lastUsed?: Date;
  monthlyRequests?: number;
  monthlyTokens?: number;
  monthlyCost?: number;
}

export interface ProviderConfiguration {
  systemPrompt?: string;
  maxRetries?: number;
  timeoutMs?: number;
  supportsStreaming?: boolean;
  supportsBatching?: boolean;
  priority?: number; // 1-10, 10 = mayor prioridad
}

export interface CreateAIProviderRequest {
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  costPerToken: number;
  rateLimits: RateLimits;
  configuration?: Partial<ProviderConfiguration>;
}

export interface UpdateAIProviderRequest {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  isActive?: boolean;
  costPerToken?: number;
  rateLimits?: Partial<RateLimits>;
  configuration?: Partial<ProviderConfiguration>;
}

export interface AIProviderResponse {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  isActive: boolean;
  costPerToken: number;
  rateLimits: RateLimits;
  healthStatus?: HealthStatus;
  usageStats?: UsageStats;
  configuration?: ProviderConfiguration;
  createdAt: Date;
  updatedAt: Date;
  apiKey: string; // API key maskeada para mostrar en frontend
}

export interface AIProviderHealthCheck {
  providerId: string;
  isHealthy: boolean;
  responseTime: number;
  error?: string;
  checkedAt: Date;
}