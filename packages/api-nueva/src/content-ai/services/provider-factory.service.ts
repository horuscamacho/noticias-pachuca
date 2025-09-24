import { Injectable, Logger } from '@nestjs/common';
import { OpenAIAdapter } from '../adapters/openai.adapter';
import { AnthropicAdapter } from '../adapters/anthropic.adapter';
import { IAIProviderAdapter, HealthCheckResult } from '../adapters/ai-provider.interface';

/**
 * 🏭 Factory para selección dinámica de proveedores IA
 * Implementa adapter pattern con failover automático
 */
@Injectable()
export class ProviderFactoryService {
  private readonly logger = new Logger(ProviderFactoryService.name);

  constructor(
    private readonly openAIAdapter: OpenAIAdapter,
    private readonly anthropicAdapter: AnthropicAdapter,
  ) {}

  /**
   * 🎯 Obtener proveedor específico por nombre
   */
  getProvider(providerName: string): IAIProviderAdapter {
    switch (providerName.toLowerCase()) {
      case 'openai':
        return this.openAIAdapter;
      case 'anthropic':
        return this.anthropicAdapter;
      default:
        throw new Error(`Provider ${providerName} not supported`);
    }
  }

  /**
   * 📊 Obtener proveedor óptimo basado en criterios
   */
  async getOptimalProvider(criteria: {
    maxTokens?: number;
    maxCost?: number;
    requiresStreaming?: boolean;
    preferredProviders?: string[];
  }): Promise<IAIProviderAdapter> {
    const availableProviders = ['openai', 'anthropic'];

    // Filtrar por criterios
    const eligibleProviders = availableProviders.filter(providerName => {
      const provider = this.getProvider(providerName);
      const capabilities = provider.getCapabilities();

      if (criteria.maxTokens && capabilities.maxTokens < criteria.maxTokens) {
        return false;
      }

      if (criteria.requiresStreaming && !capabilities.supportsStreaming) {
        return false;
      }

      return true;
    });

    // Aplicar preferencias
    if (criteria.preferredProviders) {
      for (const preferred of criteria.preferredProviders) {
        if (eligibleProviders.includes(preferred.toLowerCase())) {
          return this.getProvider(preferred);
        }
      }
    }

    // Seleccionar por cost-effectiveness
    let bestProvider: IAIProviderAdapter | null = null;
    let lowestCost = Infinity;

    for (const providerName of eligibleProviders) {
      const provider = this.getProvider(providerName);
      const capabilities = provider.getCapabilities();
      const estimatedCost = capabilities.costPerInputToken + capabilities.costPerOutputToken;

      if (estimatedCost < lowestCost) {
        lowestCost = estimatedCost;
        bestProvider = provider;
      }
    }

    if (!bestProvider) {
      throw new Error('No eligible provider found for criteria');
    }

    return bestProvider;
  }

  /**
   * 🏥 Obtener proveedores saludables con failover
   */
  async getHealthyProviders(): Promise<Array<{ name: string; provider: IAIProviderAdapter; health: HealthCheckResult }>> {
    const providers = ['openai', 'anthropic'];
    const healthyProviders: Array<{ name: string; provider: IAIProviderAdapter; health: HealthCheckResult }> = [];

    for (const providerName of providers) {
      try {
        const provider = this.getProvider(providerName);
        const health = await provider.healthCheck();

        if (health.isHealthy) {
          healthyProviders.push({
            name: providerName,
            provider,
            health,
          });
        }
      } catch (error) {
        this.logger.warn(`Health check failed for ${providerName}: ${error.message}`);
      }
    }

    return healthyProviders.sort((a, b) => a.health.responseTime - b.health.responseTime);
  }

  /**
   * 🔄 Failover automático a proveedor secundario
   */
  async getProviderWithFailover(primaryProvider: string, request?: Record<string, unknown>): Promise<IAIProviderAdapter> {
    try {
      const provider = this.getProvider(primaryProvider);
      const rateLimit = await provider.checkRateLimit();

      if (rateLimit.canProceed) {
        return provider;
      }
    } catch (error) {
      this.logger.warn(`Primary provider ${primaryProvider} failed: ${error.message}`);
    }

    // Failover logic
    const healthyProviders = await this.getHealthyProviders();
    const fallbackProviders = healthyProviders.filter(p => p.name !== primaryProvider);

    if (fallbackProviders.length === 0) {
      throw new Error('No healthy fallback providers available');
    }

    this.logger.log(`Failing over from ${primaryProvider} to ${fallbackProviders[0].name}`);
    return fallbackProviders[0].provider;
  }

  /**
   * 📈 Estadísticas de uso por proveedor
   */
  async getProviderStats(): Promise<Record<string, { totalRequests: number; totalTokens: number; totalCost: number; averageResponseTime: number; errorRate: number; lastUsed: Date } | { error: string }>> {
    const providers = ['openai', 'anthropic'];
    const stats: Record<string, { totalRequests: number; totalTokens: number; totalCost: number; averageResponseTime: number; errorRate: number; lastUsed: Date } | { error: string }> = {};

    for (const providerName of providers) {
      try {
        const provider = this.getProvider(providerName);
        stats[providerName] = await provider.getMetrics();
      } catch (error) {
        this.logger.warn(`Failed to get stats for ${providerName}: ${error.message}`);
        stats[providerName] = { error: error.message };
      }
    }

    return stats;
  }

  /**
   * 🛠️ Configurar proveedor dinámicamente
   */
  async configureProvider(
    providerName: string,
    config: {
      apiKey: string;
      baseUrl?: string;
      model: string;
      defaultParams?: Record<string, unknown>;
    }
  ): Promise<void> {
    const provider = this.getProvider(providerName);
    await provider.configure(config);
    this.logger.log(`Configured provider ${providerName} with model ${config.model}`);
  }
}