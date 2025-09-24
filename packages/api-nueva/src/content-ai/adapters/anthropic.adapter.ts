import { Injectable, Logger } from '@nestjs/common';
import {
  IAIProviderAdapter,
  AIProviderRequest,
  AIProviderResponse,
  AIProviderError,
  HealthCheckResult,
  ProviderCapabilities,
  StreamingChunk,
  BatchRequest,
  BatchResponse,
  IMCPAdapter,
  MCPContext,
} from './ai-provider.interface';

/**
 * 🧠 Anthropic Claude Adapter para Claude 4 y futuros modelos
 * Implementa interface común para generación de contenido
 */
@Injectable()
export class AnthropicAdapter implements IAIProviderAdapter, IMCPAdapter {
  private readonly logger = new Logger(AnthropicAdapter.name);

  // Configuración
  private apiKey: string;
  private baseUrl: string = 'https://api.anthropic.com';
  private model: string = 'claude-3-5-sonnet-20241022';
  private defaultParams: Partial<AIProviderRequest> = {};

  // Métricas
  private metrics = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    totalResponseTime: 0,
    errorCount: 0,
    lastUsed: new Date(),
  };

  // MCP Context
  private mcpContext: MCPContext | null = null;

  readonly providerName = 'Anthropic';
  readonly supportedModels = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ];

  async configure(config: {
    apiKey: string;
    baseUrl?: string;
    model: string;
    defaultParams?: Partial<AIProviderRequest>;
  }): Promise<void> {
    this.apiKey = config.apiKey;
    if (config.baseUrl) this.baseUrl = config.baseUrl;
    this.model = config.model;
    if (config.defaultParams) this.defaultParams = config.defaultParams;

    this.logger.log(`Configured Anthropic adapter with model: ${this.model}`);
  }

  async generateContent(request: AIProviderRequest): Promise<AIProviderResponse> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const payload = this.transformParameters(request);

      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw await this.handleAPIError(response);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      this.updateMetrics(data.usage, responseTime, 0);

      return {
        content: data.content[0].text,
        finishReason: this.mapFinishReason(data.stop_reason),
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
        model: data.model,
        responseTime,
        id: data.id,
        metadata: {
          role: data.role,
          type: data.type,
        },
      };
    } catch (error) {
      this.metrics.errorCount++;
      this.logger.error(`Anthropic generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async *generateContentStream(request: AIProviderRequest): AsyncGenerator<StreamingChunk, void, unknown> {
    const payload = this.transformParameters({ ...request, stream: true });

    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw await this.handleAPIError(response);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body reader available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const chunk = JSON.parse(data);

              if (chunk.type === 'content_block_delta') {
                yield {
                  content: chunk.delta.text || '',
                  isComplete: false,
                  metadata: { type: chunk.type, index: chunk.index },
                };
              } else if (chunk.type === 'message_stop') {
                yield {
                  content: '',
                  isComplete: true,
                  usage: chunk.usage,
                  finishReason: 'stop',
                  metadata: { type: chunk.type },
                };
                return;
              }
            } catch (parseError) {
              this.logger.warn(`Failed to parse streaming chunk: ${parseError.message}`);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Anthropic streaming failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async generateBatch(batchRequest: BatchRequest): Promise<BatchResponse> {
    const startTime = Date.now();
    const responses: AIProviderResponse[] = [];
    const errors: AIProviderError[] = [];
    let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    // Anthropic no tiene batch API nativo, procesamos secuencialmente con rate limiting
    for (const request of batchRequest.requests) {
      try {
        const response = await this.generateContent(request);
        responses.push(response);
        totalUsage.promptTokens += response.usage.promptTokens;
        totalUsage.completionTokens += response.usage.completionTokens;
        totalUsage.totalTokens += response.usage.totalTokens;

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        errors.push(error as AIProviderError);
      }
    }

    return {
      responses,
      batchId: batchRequest.batchId,
      totalUsage,
      processingTime: Date.now() - startTime,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Anthropic no tiene endpoint de health check específico, usamos un request mínimo
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        }),
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          isHealthy: true,
          responseTime,
          timestamp: new Date(),
          modelInfo: {
            name: this.model,
            maxTokens: this.getCapabilities().maxTokens,
            supportsStreaming: true,
          },
        };
      } else {
        return {
          isHealthy: false,
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: Date.now() - startTime,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      maxTokens: this.getModelMaxTokens(this.model),
      supportedModels: this.supportedModels,
      supportsStreaming: true,
      supportsBatching: false, // No batch API nativo
      supportsTools: true,
      supportsFunctionCalling: false,
      supportsVision: this.model.includes('claude-3'),
      costPerInputToken: this.getModelCostPerToken(this.model, 'input'),
      costPerOutputToken: this.getModelCostPerToken(this.model, 'output'),
      rateLimits: {
        requestsPerMinute: 50,
        requestsPerHour: 1000,
        tokensPerMinute: 40000,
        tokensPerDay: 1000000,
      },
    };
  }

  calculateCost(usage: { promptTokens: number; completionTokens: number }): number {
    const inputCost = usage.promptTokens * this.getModelCostPerToken(this.model, 'input');
    const outputCost = usage.completionTokens * this.getModelCostPerToken(this.model, 'output');
    return inputCost + outputCost;
  }

  async checkRateLimit(): Promise<{
    canProceed: boolean;
    retryAfterMs?: number;
    remainingRequests?: number;
  }> {
    const capabilities = this.getCapabilities();
    const requestsPerMinute = capabilities.rateLimits.requestsPerMinute;

    return {
      canProceed: this.metrics.totalRequests < requestsPerMinute,
      remainingRequests: Math.max(0, requestsPerMinute - this.metrics.totalRequests),
    };
  }

  async validateRequest(request: AIProviderRequest): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!request.userPrompt) {
      errors.push('userPrompt is required');
    }

    if (request.maxTokens > this.getCapabilities().maxTokens) {
      errors.push(`maxTokens exceeds model limit: ${this.getCapabilities().maxTokens}`);
    }

    if (request.temperature < 0 || request.temperature > 1) {
      errors.push('temperature must be between 0 and 1 for Anthropic');
    }

    if (request.maxTokens < 1) {
      errors.push('maxTokens must be greater than 0');
    }

    if (request.maxTokens > 4000) {
      warnings.push('High token count may result in increased costs');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  transformParameters(request: AIProviderRequest): Record<string, unknown> {
    const messages: Array<{ role: string; content: string }> = [];

    // Anthropic maneja system prompt separadamente
    messages.push({
      role: 'user',
      content: request.userPrompt,
    });

    return {
      model: this.model,
      messages,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      top_p: request.topP,
      system: request.systemPrompt,
      stop_sequences: request.stopSequences,
      stream: request.stream || false,
      ...this.defaultParams,
    };
  }

  async getMetrics(): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageResponseTime: number;
    errorRate: number;
    lastUsed: Date;
  }> {
    return {
      totalRequests: this.metrics.totalRequests,
      totalTokens: this.metrics.totalTokens,
      totalCost: this.metrics.totalCost,
      averageResponseTime: this.metrics.totalRequests > 0
        ? this.metrics.totalResponseTime / this.metrics.totalRequests
        : 0,
      errorRate: this.metrics.totalRequests > 0
        ? this.metrics.errorCount / this.metrics.totalRequests
        : 0,
      lastUsed: this.metrics.lastUsed,
    };
  }

  async cleanup(): Promise<void> {
    this.logger.log('Cleaning up Anthropic adapter resources');
  }

  // MCP Implementation
  async initializeMCP(context: MCPContext): Promise<void> {
    this.mcpContext = context;
    this.logger.log(`Initialized MCP context with session: ${context.sessionId}`);
  }

  async syncContext(targetProvider: string): Promise<void> {
    if (!this.mcpContext) {
      throw new Error('MCP context not initialized');
    }
    this.logger.log(`Syncing MCP context to provider: ${targetProvider}`);
  }

  async updateSharedContext(updates: Partial<MCPContext>): Promise<void> {
    if (this.mcpContext) {
      this.mcpContext = { ...this.mcpContext, ...updates };
    }
  }

  async registerTools(tools: MCPContext['tools']): Promise<void> {
    if (this.mcpContext) {
      this.mcpContext.tools = tools;
    }
  }

  async getMCPStatus(): Promise<{
    isActive: boolean;
    connectedProviders: string[];
    sharedMemorySize: number;
    lastSync: Date;
  }> {
    return {
      isActive: this.mcpContext !== null,
      connectedProviders: ['Anthropic'],
      sharedMemorySize: this.mcpContext?.sharedMemory
        ? Object.keys(this.mcpContext.sharedMemory).length
        : 0,
      lastSync: new Date(),
    };
  }

  // Helper methods
  private async handleAPIError(response: Response): Promise<AIProviderError> {
    const errorData = await response.json().catch(() => ({}));

    return {
      code: `ANTHROPIC_${response.status}`,
      message: errorData.error?.message || response.statusText,
      details: errorData,
      retryable: response.status >= 500 || response.status === 429,
      httpStatus: response.status,
      providerErrorCode: errorData.error?.type,
    };
  }

  private mapFinishReason(reason: string): AIProviderResponse['finishReason'] {
    switch (reason) {
      case 'end_turn': return 'stop';
      case 'max_tokens': return 'length';
      case 'stop_sequence': return 'stop';
      default: return 'stop';
    }
  }

  private updateMetrics(usage: { input_tokens: number; output_tokens: number }, responseTime: number, errorCount: number): void {
    this.metrics.totalTokens += usage.input_tokens + usage.output_tokens;
    this.metrics.totalResponseTime += responseTime;
    this.metrics.totalCost += this.calculateCost({
      promptTokens: usage.input_tokens,
      completionTokens: usage.output_tokens,
    });
    this.metrics.lastUsed = new Date();
  }

  private getModelMaxTokens(model: string): number {
    const limits: Record<string, number> = {
      'claude-3-5-sonnet-20241022': 200000,
      'claude-3-5-haiku-20241022': 200000,
      'claude-3-opus-20240229': 200000,
      'claude-3-sonnet-20240229': 200000,
      'claude-3-haiku-20240307': 200000,
    };
    return limits[model] || 200000;
  }

  private getModelCostPerToken(model: string, type: 'input' | 'output'): number {
    // Precios en USD por 1M tokens (actualizar según precios reales)
    const costs: Record<string, { input: number; output: number }> = {
      'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
      'claude-3-5-haiku-20241022': { input: 0.25, output: 1.25 },
      'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
      'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    };

    const modelCosts = costs[model] || costs['claude-3-5-sonnet-20241022'];
    return (modelCosts[type] / 1000000); // Convert to per-token cost
  }
}