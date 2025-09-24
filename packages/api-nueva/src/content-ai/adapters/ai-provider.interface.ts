/**
 * 🔌 Interface base para adapters de proveedores de IA
 * Abstracción común para OpenAI, Anthropic, Google, etc.
 */

export interface AIProviderRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AIProviderResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'function_call';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  responseTime: number; // ms
  id?: string; // Response ID if provided by provider
  metadata?: Record<string, unknown>;
}

export interface AIProviderError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  httpStatus?: number;
  providerErrorCode?: string;
}

export interface HealthCheckResult {
  isHealthy: boolean;
  responseTime: number; // ms
  error?: string;
  timestamp: Date;
  version?: string;
  modelInfo?: {
    name: string;
    maxTokens: number;
    supportsStreaming: boolean;
  };
}

export interface ProviderCapabilities {
  maxTokens: number;
  supportedModels: string[];
  supportsStreaming: boolean;
  supportsBatching: boolean;
  supportsTools: boolean;
  supportsFunctionCalling: boolean;
  supportsVision: boolean;
  costPerInputToken: number;
  costPerOutputToken: number;
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    tokensPerMinute?: number;
    tokensPerDay?: number;
  };
}

export interface StreamingChunk {
  content: string;
  isComplete: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  metadata?: Record<string, unknown>;
}

export interface BatchRequest {
  requests: AIProviderRequest[];
  batchId?: string;
  metadata?: Record<string, unknown>;
}

export interface BatchResponse {
  responses: AIProviderResponse[];
  batchId?: string;
  totalUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  processingTime: number; // ms
  errors?: AIProviderError[];
}

/**
 * 🎯 Interface principal para adapters de proveedores IA
 */
export interface IAIProviderAdapter {
  // 🏷️ Identificación del proveedor
  readonly providerName: string;
  readonly supportedModels: string[];

  // 🔧 Configuración
  configure(config: {
    apiKey: string;
    baseUrl?: string;
    model: string;
    defaultParams?: Partial<AIProviderRequest>;
  }): Promise<void>;

  // 🚀 Generación de contenido
  generateContent(request: AIProviderRequest): Promise<AIProviderResponse>;

  // 📡 Generación con streaming
  generateContentStream(request: AIProviderRequest): AsyncGenerator<StreamingChunk, void, unknown>;

  // 📦 Procesamiento en batch
  generateBatch(batchRequest: BatchRequest): Promise<BatchResponse>;

  // 🏥 Health check
  healthCheck(): Promise<HealthCheckResult>;

  // 📊 Capacidades del proveedor
  getCapabilities(): ProviderCapabilities;

  // 💰 Cálculo de costos
  calculateCost(usage: { promptTokens: number; completionTokens: number }): number;

  // 🔄 Rate limiting check
  checkRateLimit(): Promise<{
    canProceed: boolean;
    retryAfterMs?: number;
    remainingRequests?: number;
  }>;

  // 🛠️ Validación de request
  validateRequest(request: AIProviderRequest): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  // 🔧 Transformación de parámetros específicos del proveedor
  transformParameters(request: AIProviderRequest): Record<string, unknown>;

  // 📈 Métricas y estadísticas
  getMetrics(): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageResponseTime: number;
    errorRate: number;
    lastUsed: Date;
  }>;

  // 🔒 Cleanup y liberación de recursos
  cleanup(): Promise<void>;
}

/**
 * 🎭 Interface para Model Context Protocol (MCP)
 * Estándar emergente 2025 para interoperabilidad entre providers
 */
export interface MCPContext {
  sessionId: string;
  conversationHistory?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  sharedMemory?: Record<string, unknown>;
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
  metadata?: Record<string, unknown>;
}

export interface IMCPAdapter {
  // 🔗 Inicialización MCP
  initializeMCP(context: MCPContext): Promise<void>;

  // 🔄 Sincronización de contexto entre providers
  syncContext(targetProvider: string): Promise<void>;

  // 📝 Actualización de contexto compartido
  updateSharedContext(updates: Partial<MCPContext>): Promise<void>;

  // 🛠️ Registro de herramientas cross-provider
  registerTools(tools: MCPContext['tools']): Promise<void>;

  // 📊 Estado del contexto MCP
  getMCPStatus(): Promise<{
    isActive: boolean;
    connectedProviders: string[];
    sharedMemorySize: number;
    lastSync: Date;
  }>;
}