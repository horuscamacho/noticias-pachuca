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
  ImageGenerationOptions,
  ImageEditOptions,
  ImageGenerationResult,
} from './ai-provider.interface';

/**
 * 🔥 OpenAI Adapter para GPT-4/5 y futuros modelos
 * Implementa interface común para generación de contenido
 */
@Injectable()
export class OpenAIAdapter implements IAIProviderAdapter, IMCPAdapter {
  private readonly logger = new Logger(OpenAIAdapter.name);

  // Configuración
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  private model: string = 'gpt-5-nano'; // ⭐ Cambiado a GPT-5 nano (más barato con conocimiento 2025)
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

  readonly providerName = 'OpenAI';
  readonly supportedModels = [
    'gpt-5',           // ⭐ GPT-5 (nuevo)
    'gpt-5-mini',      // ⭐ GPT-5 mini (nuevo)
    'gpt-5-nano',      // ⭐ GPT-5 nano (nuevo, default)
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
    'o1-preview',
    'o1-mini',
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

    this.logger.log(`Configured OpenAI adapter with model: ${this.model}`);
  }

  async generateContent(request: AIProviderRequest): Promise<AIProviderResponse> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const payload = this.transformParameters(request);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw await this.handleAPIError(response);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      this.updateMetrics(data.usage, responseTime, 0);

      // 🐛 DEBUG: Log the response structure for GPT-5 models
      if (this.model.includes('gpt-5')) {
        this.logger.debug(`GPT-5 Response Structure: ${JSON.stringify({
          model: data.model,
          choices: data.choices?.map((c: any) => ({
            index: c.index,
            finish_reason: c.finish_reason,
            message: {
              role: c.message?.role,
              content: c.message?.content ? `[${c.message.content.length} chars]` : 'NULL',
              refusal: c.message?.refusal || 'N/A',
            }
          })),
          usage: data.usage
        }, null, 2)}`);
      }

      // Check for refusal or empty content
      const messageContent = data.choices[0].message.content;
      const refusal = data.choices[0].message.refusal;

      if (refusal) {
        this.logger.warn(`Model refused to generate content: ${refusal}`);
        throw new Error(`Model refused: ${refusal}`);
      }

      if (!messageContent || messageContent.trim() === '') {
        this.logger.error(`Empty content received from model. Full response: ${JSON.stringify(data)}`);
        throw new Error('Empty content received from AI model');
      }

      return {
        content: messageContent,
        finishReason: this.mapFinishReason(data.choices[0].finish_reason),
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        model: data.model,
        responseTime,
        id: data.id,
        metadata: {
          created: data.created,
          systemFingerprint: data.system_fingerprint,
        },
      };
    } catch (error) {
      this.metrics.errorCount++;
      this.logger.error(`OpenAI generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async *generateContentStream(request: AIProviderRequest): AsyncGenerator<StreamingChunk, void, unknown> {
    const payload = this.transformParameters({ ...request, stream: true });

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
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
              const delta = chunk.choices[0].delta;

              yield {
                content: delta.content || '',
                isComplete: chunk.choices[0].finish_reason !== null,
                usage: chunk.usage,
                finishReason: chunk.choices[0].finish_reason,
                metadata: { id: chunk.id, created: chunk.created },
              };
            } catch (parseError) {
              this.logger.warn(`Failed to parse streaming chunk: ${parseError.message}`);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`OpenAI streaming failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async generateBatch(batchRequest: BatchRequest): Promise<BatchResponse> {
    const startTime = Date.now();
    const responses: AIProviderResponse[] = [];
    const errors: AIProviderError[] = [];
    let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    // OpenAI batch processing - concurrent requests with rate limiting
    const concurrency = 10; // Max concurrent requests
    const chunks = this.chunkArray(batchRequest.requests, concurrency);

    for (const chunk of chunks) {
      const promises = chunk.map(async (request) => {
        try {
          const response = await this.generateContent(request);
          responses.push(response);
          totalUsage.promptTokens += response.usage.promptTokens;
          totalUsage.completionTokens += response.usage.completionTokens;
          totalUsage.totalTokens += response.usage.totalTokens;
        } catch (error) {
          errors.push(error as AIProviderError);
        }
      });

      await Promise.all(promises);

      // Rate limiting delay between chunks
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
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
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const modelInfo = data.data.find((m: { id: string }) => m.id === this.model);

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
      supportsBatching: true,
      supportsTools: true,
      supportsFunctionCalling: true,
      supportsVision: this.model.includes('gpt-5') || this.model.includes('gpt-4'), // ⭐ GPT-5 también tiene visión
      costPerInputToken: this.getModelCostPerToken(this.model, 'input'),
      costPerOutputToken: this.getModelCostPerToken(this.model, 'output'),
      rateLimits: {
        // ⭐ GPT-5 tiene mejores límites que GPT-4
        requestsPerMinute: (this.model.includes('gpt-5') || this.model.includes('gpt-4')) ? 500 : 3500,
        requestsPerHour: (this.model.includes('gpt-5') || this.model.includes('gpt-4')) ? 10000 : 50000,
        tokensPerMinute: (this.model.includes('gpt-5') || this.model.includes('gpt-4')) ? 30000 : 90000,
        tokensPerDay: (this.model.includes('gpt-5') || this.model.includes('gpt-4')) ? 1000000 : 2000000,
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
    // Basic rate limiting logic - en producción se usaría Redis para tracking
    const capabilities = this.getCapabilities();
    const requestsPerMinute = capabilities.rateLimits.requestsPerMinute;

    // Simplified check - en producción sería más sofisticado
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

    if (!request.systemPrompt && !request.userPrompt) {
      errors.push('Either systemPrompt or userPrompt is required');
    }

    if (request.maxTokens > this.getCapabilities().maxTokens) {
      errors.push(`maxTokens exceeds model limit: ${this.getCapabilities().maxTokens}`);
    }

    if (request.temperature < 0 || request.temperature > 2) {
      errors.push('temperature must be between 0 and 2');
    }

    if (request.topP && (request.topP < 0 || request.topP > 1)) {
      errors.push('topP must be between 0 and 1');
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
    // Merge default params with request, with request taking priority
    const mergedRequest = { ...this.defaultParams, ...request };

    const messages: Array<{ role: string; content: string }> = [];

    if (mergedRequest.systemPrompt) {
      messages.push({
        role: 'system',
        content: mergedRequest.systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: mergedRequest.userPrompt,
    });

    // ⚠️ GPT-5 models use 'max_completion_tokens' instead of 'max_tokens'
    const isGPT5Model = this.model.includes('gpt-5');
    const maxTokensParam = isGPT5Model ? 'max_completion_tokens' : 'max_tokens';

    const payload: Record<string, unknown> = {
      model: this.model,
      messages,
      [maxTokensParam]: mergedRequest.maxTokens,
      stream: mergedRequest.stream || false,
    };

    // ⚠️ GPT-5 models have limited parameter support
    // They ONLY support: model, messages, max_completion_tokens, stream, stop
    // They do NOT support: temperature, top_p, frequency_penalty, presence_penalty
    if (!isGPT5Model) {
      // For GPT-4 and earlier models, include all standard parameters
      if (mergedRequest.temperature !== undefined) {
        payload.temperature = mergedRequest.temperature;
      }
      if (mergedRequest.topP !== undefined) {
        payload.top_p = mergedRequest.topP;
      }
      if (mergedRequest.frequencyPenalty !== undefined) {
        payload.frequency_penalty = mergedRequest.frequencyPenalty;
      }
      if (mergedRequest.presencePenalty !== undefined) {
        payload.presence_penalty = mergedRequest.presencePenalty;
      }
    } else {
      // ⚠️ GPT-5 models support reasoning_effort parameter
      // Use "minimal" to reduce reasoning tokens and get faster visible output
      // Options: minimal, low, medium, high
      payload.reasoning_effort = 'low'; // Balance between speed and quality
    }

    // Stop sequences are supported by all models
    if (mergedRequest.stopSequences !== undefined) {
      payload.stop = mergedRequest.stopSequences;
    }

    return payload;
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
    this.logger.log('Cleaning up OpenAI adapter resources');
    // Cleanup logic - cerrar conexiones, limpiar cache, etc.
  }

  /**
   * 🎨 Genera una imagen usando gpt-image-1
   * @param options - Opciones de generación (prompt, calidad, tamaño, formato)
   * @returns Buffer con la imagen generada y metadata
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const { prompt, quality = 'medium', size = '1024x1024', outputFormat = 'png' } = options;

      this.logger.log(`Generating image with gpt-image-1: ${prompt.substring(0, 50)}...`);

      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt,
          n: 1,
          size,
          quality,
          // NOTA: gpt-image-1 NO acepta response_format y retorna SOLO base64 (b64_json)
        }),
      });

      if (!response.ok) {
        throw await this.handleAPIError(response);
      }

      const data = await response.json();
      const base64Image = data.data[0].b64_json;

      if (!base64Image) {
        throw new Error('No image data returned from gpt-image-1');
      }

      // Convertir base64 a buffer
      this.logger.log(`Converting base64 image to buffer (${size})`);
      const buffer = Buffer.from(base64Image, 'base64');

      const cost = this.calculateImageCost(quality, size);
      const responseTime = Date.now() - startTime;

      // Actualizar métricas
      this.metrics.totalCost += cost;
      this.metrics.totalResponseTime += responseTime;
      this.metrics.lastUsed = new Date();

      this.logger.log(`Image generated successfully. Cost: $${cost.toFixed(4)}, Time: ${responseTime}ms`);

      return {
        imageBuffer: buffer,
        format: outputFormat,
        cost,
        size,
        quality,
      };
    } catch (error) {
      this.metrics.errorCount++;
      this.logger.error(`Image generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 🖼️ Edita una imagen usando gpt-image-1
   * @param options - Opciones de edición (imagen, prompt, máscara, tamaño)
   * @returns Buffer con la imagen editada y metadata
   */
  async editImage(options: ImageEditOptions): Promise<ImageGenerationResult> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const { imageBuffer, prompt, maskBuffer, size = '1024x1024' } = options;

      this.logger.log(`Editing image with gpt-image-1: ${prompt.substring(0, 50)}...`);

      // Crear FormData compatible con Node.js usando Blob polyfill
      const formData = new FormData();

      // Convertir Buffer a Blob usando Uint8Array como intermediario
      const imageBlob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/png' });
      const imageFile = new File([imageBlob], 'image.png', { type: 'image/png' });
      formData.append('image', imageFile);

      formData.append('prompt', prompt);
      formData.append('model', 'gpt-image-1');
      formData.append('n', '1');
      formData.append('size', size);
      // NOTA: gpt-image-1 NO acepta response_format y retorna SOLO base64

      if (maskBuffer) {
        const maskBlob = new Blob([new Uint8Array(maskBuffer)], { type: 'image/png' });
        const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' });
        formData.append('mask', maskFile);
      }

      const response = await fetch(`${this.baseUrl}/images/edits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw await this.handleAPIError(response);
      }

      const data = await response.json();
      const base64Image = data.data[0].b64_json;

      if (!base64Image) {
        throw new Error('No image data returned from gpt-image-1');
      }

      // Convertir base64 a buffer
      this.logger.log(`Converting edited base64 image to buffer (${size})`);
      const buffer = Buffer.from(base64Image, 'base64');

      // El costo de edición es similar a generación (usar calidad medium como base)
      const cost = this.calculateImageCost('medium', size);
      const responseTime = Date.now() - startTime;

      // Actualizar métricas
      this.metrics.totalCost += cost;
      this.metrics.totalResponseTime += responseTime;
      this.metrics.lastUsed = new Date();

      this.logger.log(`Image edited successfully. Cost: $${cost.toFixed(4)}, Time: ${responseTime}ms`);

      return {
        imageBuffer: buffer,
        format: 'png',
        cost,
        size,
        quality: 'medium',
      };
    } catch (error) {
      this.metrics.errorCount++;
      this.logger.error(`Image editing failed: ${error.message}`, error.stack);
      throw error;
    }
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
    // MCP sync logic
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
      connectedProviders: ['OpenAI'],
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
      code: `OPENAI_${response.status}`,
      message: errorData.error?.message || response.statusText,
      details: errorData,
      retryable: response.status >= 500 || response.status === 429,
      httpStatus: response.status,
      providerErrorCode: errorData.error?.code,
    };
  }

  private mapFinishReason(reason: string): AIProviderResponse['finishReason'] {
    switch (reason) {
      case 'stop': return 'stop';
      case 'length': return 'length';
      case 'content_filter': return 'content_filter';
      case 'tool_calls': return 'tool_calls';
      case 'function_call': return 'function_call';
      default: return 'stop';
    }
  }

  private updateMetrics(usage: { total_tokens: number; prompt_tokens?: number; completion_tokens?: number }, responseTime: number, errorCount: number): void {
    this.metrics.totalTokens += usage.total_tokens;
    this.metrics.totalResponseTime += responseTime;
    this.metrics.totalCost += this.calculateCost({
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
    });
    this.metrics.lastUsed = new Date();
  }

  private getModelMaxTokens(model: string): number {
    const limits: Record<string, number> = {
      'gpt-5': 200000,        // ⭐ GPT-5 (200K context)
      'gpt-5-mini': 200000,   // ⭐ GPT-5 mini (200K context)
      'gpt-5-nano': 128000,   // ⭐ GPT-5 nano (128K context)
      'gpt-4o': 128000,
      'gpt-4o-mini': 128000,
      'gpt-4-turbo': 128000,
      'gpt-4': 8192,
      'gpt-3.5-turbo': 16385,
      'o1-preview': 32768,
      'o1-mini': 32768,
    };
    return limits[model] || 4096;
  }

  private getModelCostPerToken(model: string, type: 'input' | 'output'): number {
    // Precios en USD por 1M tokens (actualizados Octubre 2025)
    const costs: Record<string, { input: number; output: number }> = {
      // ⭐ GPT-5 Series (Nuevo - Agosto 2025)
      'gpt-5': { input: 1.25, output: 10.00 },        // GPT-5 completo
      'gpt-5-mini': { input: 0.25, output: 2.00 },    // GPT-5 mini (balance)
      'gpt-5-nano': { input: 0.05, output: 0.40 },    // ⭐ GPT-5 nano (más barato, default)

      // GPT-4o Series
      'gpt-4o': { input: 5.00, output: 15.00 },
      'gpt-4o-mini': { input: 0.15, output: 0.60 },

      // GPT-4 Series (legacy)
      'gpt-4-turbo': { input: 10.00, output: 30.00 },
      'gpt-4': { input: 30.00, output: 60.00 },

      // GPT-3.5 Series (legacy)
      'gpt-3.5-turbo': { input: 0.50, output: 1.50 },

      // o1 Series (reasoning models)
      'o1-preview': { input: 15.00, output: 60.00 },
      'o1-mini': { input: 3.00, output: 12.00 },
    };

    const modelCosts = costs[model] || costs['gpt-5-nano']; // Default a GPT-5 nano si no se encuentra
    return (modelCosts[type] / 1000000); // Convert to per-token cost
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 💰 Calcula el costo de generación de imágenes
   * @param quality - Calidad de la imagen (low, medium, high)
   * @param size - Dimensiones de la imagen (ej: "1024x1024")
   * @returns Costo en USD
   */
  private calculateImageCost(quality: 'low' | 'medium' | 'high', size: string): number {
    // Costos base para gpt-image-1 según calidad (1024x1024)
    const baseCosts: Record<'low' | 'medium' | 'high', number> = {
      low: 0.01,
      medium: 0.04,
      high: 0.17,
    };

    let cost = baseCosts[quality];

    // Escalar para tamaños diferentes (proporcional a píxeles)
    const [width, height] = size.split('x').map(Number);
    const basePixels = 1024 * 1024;
    const actualPixels = width * height;
    const scaleFactor = actualPixels / basePixels;

    return cost * scaleFactor;
  }
}