import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AIProvider, AIProviderDocument } from '../schemas/ai-provider.schema';
import { CreateAIProviderRequest, UpdateAIProviderRequest, AIProviderResponse } from '../interfaces';
import { ProviderFactoryService } from './provider-factory.service';
import * as crypto from 'crypto';

/**
 * 🤖 Servicio para gestión de proveedores de IA
 * CRUD operations, health checks, cost tracking, API key encryption
 */
@Injectable()
export class AIProviderService {
  private readonly logger = new Logger(AIProviderService.name);
  private readonly encryptionKey = process.env.AI_PROVIDER_ENCRYPTION_KEY || 'default-key-change-in-production';

  constructor(
    @InjectModel(AIProvider.name) private aiProviderModel: Model<AIProviderDocument>,
    private readonly providerFactory: ProviderFactoryService,
  ) {}

  /**
   * 📋 Obtener todos los proveedores
   */
  async findAll(): Promise<AIProviderResponse[]> {
    const providers = await this.aiProviderModel.find().exec();
    return providers.map(provider => this.toResponse(provider));
  }

  /**
   * 🔍 Obtener proveedor por ID
   */
  async findById(id: string): Promise<AIProviderResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid provider ID format');
    }

    const provider = await this.aiProviderModel.findById(id).exec();
    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    return this.toResponse(provider);
  }

  /**
   * 🔍 Obtener proveedor por nombre
   */
  async findByName(name: string): Promise<AIProviderResponse> {
    const provider = await this.aiProviderModel.findOne({ name }).exec();
    if (!provider) {
      throw new NotFoundException(`Provider with name ${name} not found`);
    }

    return this.toResponse(provider);
  }

  /**
   * ✅ Obtener solo proveedores activos
   */
  async findActive(): Promise<AIProviderResponse[]> {
    const providers = await this.aiProviderModel
      .find({ isActive: true })
      .sort({ 'configuration.priority': -1 })
      .exec();

    return providers.map(provider => this.toResponse(provider));
  }

  /**
   * 🆕 Crear nuevo proveedor
   */
  async create(createProviderDto: CreateAIProviderRequest): Promise<AIProviderResponse> {
    // Verificar que no existe proveedor con el mismo nombre
    const existingProvider = await this.aiProviderModel.findOne({ name: createProviderDto.name }).exec();
    if (existingProvider) {
      throw new BadRequestException(`Provider with name ${createProviderDto.name} already exists`);
    }

    // Encriptar API key
    const encryptedApiKey = this.encryptApiKey(createProviderDto.apiKey);

    // Crear proveedor
    const providerData = {
      ...createProviderDto,
      apiKey: encryptedApiKey,
      healthStatus: {
        lastCheck: new Date(),
        isHealthy: false,
        responseTime: 0,
        errorCount: 0,
      },
      usageStats: {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        monthlyRequests: 0,
        monthlyTokens: 0,
        monthlyCost: 0,
      },
    };

    const createdProvider = new this.aiProviderModel(providerData);
    const savedProvider = await createdProvider.save();

    this.logger.log(`Created new AI provider: ${savedProvider.name}`);

    // Configurar adapter si está disponible
    try {
      await this.configureProviderAdapter(savedProvider);
    } catch (error) {
      this.logger.warn(`Failed to configure adapter for ${savedProvider.name}: ${error.message}`);
    }

    return this.toResponse(savedProvider);
  }

  /**
   * 🔄 Actualizar proveedor
   */
  async update(id: string, updateProviderDto: UpdateAIProviderRequest): Promise<AIProviderResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid provider ID format');
    }

    const provider = await this.aiProviderModel.findById(id).exec();
    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    // Encriptar nueva API key si se proporciona
    if (updateProviderDto.apiKey) {
      updateProviderDto.apiKey = this.encryptApiKey(updateProviderDto.apiKey);
    }

    const updatedProvider = await this.aiProviderModel
      .findByIdAndUpdate(id, updateProviderDto, { new: true })
      .exec();

    this.logger.log(`Updated AI provider: ${updatedProvider!.name}`);

    // Reconfigurar adapter si es necesario
    if (updateProviderDto.apiKey || updateProviderDto.model) {
      try {
        await this.configureProviderAdapter(updatedProvider!);
      } catch (error) {
        this.logger.warn(`Failed to reconfigure adapter for ${updatedProvider!.name}: ${error.message}`);
      }
    }

    return this.toResponse(updatedProvider!);
  }

  /**
   * 🗑️ Eliminar proveedor
   */
  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid provider ID format');
    }

    const provider = await this.aiProviderModel.findById(id).exec();
    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    await this.aiProviderModel.findByIdAndDelete(id).exec();
    this.logger.log(`Deleted AI provider: ${provider.name}`);
  }

  /**
   * 🏥 Ejecutar health check para un proveedor
   */
  async performHealthCheck(id: string): Promise<{ isHealthy: boolean; responseTime: number; error?: string }> {
    const provider = await this.aiProviderModel.findById(id).exec();
    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    try {
      // Configurar adapter temporal para health check
      const adapter = this.providerFactory.getProvider(provider.name);
      const decryptedApiKey = this.decryptApiKey(provider.apiKey);

      await adapter.configure({
        apiKey: decryptedApiKey,
        baseUrl: provider.baseUrl,
        model: provider.model,
      });

      const healthResult = await adapter.healthCheck();

      // Actualizar estado de salud en DB
      await this.aiProviderModel.findByIdAndUpdate(id, {
        'healthStatus.lastCheck': new Date(),
        'healthStatus.isHealthy': healthResult.isHealthy,
        'healthStatus.responseTime': healthResult.responseTime,
        'healthStatus.lastError': healthResult.error || null,
      }).exec();

      return {
        isHealthy: healthResult.isHealthy,
        responseTime: healthResult.responseTime,
        error: healthResult.error,
      };
    } catch (error) {
      this.logger.error(`Health check failed for provider ${provider.name}: ${error.message}`);

      // Actualizar estado como no saludable
      await this.aiProviderModel.findByIdAndUpdate(id, {
        'healthStatus.lastCheck': new Date(),
        'healthStatus.isHealthy': false,
        'healthStatus.lastError': error.message,
        'healthStatus.errorCount': (provider.healthStatus?.errorCount || 0) + 1,
      }).exec();

      return {
        isHealthy: false,
        responseTime: 0,
        error: error.message,
      };
    }
  }

  /**
   * 🏥 Health check para todos los proveedores activos
   */
  async performAllHealthChecks(): Promise<Record<string, { isHealthy: boolean; responseTime: number; error?: string }>> {
    const activeProviders = await this.aiProviderModel.find({ isActive: true }).exec();
    const results: Record<string, { isHealthy: boolean; responseTime: number; error?: string }> = {};

    for (const provider of activeProviders) {
      try {
        const result = await this.performHealthCheck((provider._id as Types.ObjectId).toString());
        results[provider.name] = result;
      } catch (error) {
        results[provider.name] = {
          isHealthy: false,
          responseTime: 0,
          error: error.message,
        };
      }
    }

    return results;
  }

  /**
   * 📊 Actualizar estadísticas de uso
   */
  async updateUsageStats(
    providerId: string,
    usage: {
      requests: number;
      tokens: number;
      cost: number;
    }
  ): Promise<void> {
    const provider = await this.aiProviderModel.findById(providerId).exec();
    if (!provider) {
      this.logger.warn(`Provider ${providerId} not found for usage update`);
      return;
    }

    const currentStats = provider.usageStats || {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      monthlyRequests: 0,
      monthlyTokens: 0,
      monthlyCost: 0,
    };

    await this.aiProviderModel.findByIdAndUpdate(providerId, {
      'usageStats.totalRequests': currentStats.totalRequests + usage.requests,
      'usageStats.totalTokens': currentStats.totalTokens + usage.tokens,
      'usageStats.totalCost': currentStats.totalCost + usage.cost,
      'usageStats.monthlyRequests': (currentStats.monthlyRequests || 0) + usage.requests,
      'usageStats.monthlyTokens': (currentStats.monthlyTokens || 0) + usage.tokens,
      'usageStats.monthlyCost': (currentStats.monthlyCost || 0) + usage.cost,
      'usageStats.lastUsed': new Date(),
    }).exec();
  }

  /**
   * 🔄 Reset de estadísticas mensuales
   */
  async resetMonthlyStats(): Promise<void> {
    await this.aiProviderModel.updateMany(
      {},
      {
        'usageStats.monthlyRequests': 0,
        'usageStats.monthlyTokens': 0,
        'usageStats.monthlyCost': 0,
      }
    ).exec();

    this.logger.log('Reset monthly usage stats for all providers');
  }

  /**
   * 📈 Obtener estadísticas de costos
   */
  async getCostStats(timeframe: 'day' | 'week' | 'month' = 'month'): Promise<{
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
    providerBreakdown: Record<string, { cost: number; tokens: number; requests: number }>;
  }> {
    const providers = await this.aiProviderModel.find().exec();

    let totalCost = 0;
    let totalTokens = 0;
    let totalRequests = 0;
    const providerBreakdown: Record<string, { cost: number; tokens: number; requests: number }> = {};

    for (const provider of providers) {
      const stats = provider.usageStats;
      if (stats) {
        const cost = timeframe === 'month' ? stats.monthlyCost || 0 : stats.totalCost || 0;
        const tokens = timeframe === 'month' ? stats.monthlyTokens || 0 : stats.totalTokens || 0;
        const requests = timeframe === 'month' ? stats.monthlyRequests || 0 : stats.totalRequests || 0;

        totalCost += cost;
        totalTokens += tokens;
        totalRequests += requests;

        providerBreakdown[provider.name] = { cost, tokens, requests };
      }
    }

    return {
      totalCost,
      totalTokens,
      totalRequests,
      providerBreakdown,
    };
  }

  /**
   * 🔐 Encriptar API key
   */
  private encryptApiKey(apiKey: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey.padEnd(32, '0').slice(0, 32)), iv);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 🔓 Desencriptar API key
   */
  private decryptApiKey(encryptedApiKey: string): string {
    const parts = encryptedApiKey.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey.padEnd(32, '0').slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * 🔧 Configurar adapter del proveedor
   */
  private async configureProviderAdapter(provider: AIProviderDocument): Promise<void> {
    try {
      const adapter = this.providerFactory.getProvider(provider.name);
      const decryptedApiKey = this.decryptApiKey(provider.apiKey);

      await adapter.configure({
        apiKey: decryptedApiKey,
        baseUrl: provider.baseUrl,
        model: provider.model,
        defaultParams: provider.configuration,
      });

      this.logger.log(`Configured adapter for provider: ${provider.name}`);
    } catch (error) {
      this.logger.error(`Failed to configure adapter for ${provider.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🎯 Obtener estrategias de proveedores disponibles configuradas
   */
  async getAvailableStrategies(): Promise<Array<{
    name: string;
    displayName: string;
    models: string[];
    capabilities: {
      maxTokens: number;
      supportsStreaming: boolean;
      costPerInputToken: number;
      costPerOutputToken: number;
    };
  }>> {
    try {
      // Obtener proveedores disponibles del factory
      const openaiAdapter = this.providerFactory.getProvider('openai');
      const anthropicAdapter = this.providerFactory.getProvider('anthropic');

      const strategies: Array<{
        name: string;
        displayName: string;
        models: string[];
        capabilities: {
          maxTokens: number;
          supportsStreaming: boolean;
          costPerInputToken: number;
          costPerOutputToken: number;
        };
      }> = [];

      // OpenAI Strategy
      try {
        const openaiCapabilities = openaiAdapter.getCapabilities();
        strategies.push({
          name: 'openai',
          displayName: 'OpenAI',
          models: openaiAdapter.supportedModels || ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
          capabilities: {
            maxTokens: openaiCapabilities.maxTokens || 128000,
            supportsStreaming: openaiCapabilities.supportsStreaming || true,
            costPerInputToken: openaiCapabilities.costPerInputToken || 0.01,
            costPerOutputToken: openaiCapabilities.costPerOutputToken || 0.03,
          }
        });
      } catch (error) {
        this.logger.warn('OpenAI adapter not available:', error.message);
      }

      // Anthropic Strategy
      try {
        const anthropicCapabilities = anthropicAdapter.getCapabilities();
        strategies.push({
          name: 'anthropic',
          displayName: 'Anthropic',
          models: anthropicAdapter.supportedModels || ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
          capabilities: {
            maxTokens: anthropicCapabilities.maxTokens || 200000,
            supportsStreaming: anthropicCapabilities.supportsStreaming || true,
            costPerInputToken: anthropicCapabilities.costPerInputToken || 0.003,
            costPerOutputToken: anthropicCapabilities.costPerOutputToken || 0.015,
          }
        });
      } catch (error) {
        this.logger.warn('Anthropic adapter not available:', error.message);
      }

      this.logger.log(`✅ Found ${strategies.length} available AI provider strategies`);
      return strategies;

    } catch (error) {
      this.logger.error('Error getting available strategies:', error.message);
      // Fallback to hardcoded strategies if there's an error
      return [
        {
          name: 'openai',
          displayName: 'OpenAI',
          models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
          capabilities: {
            maxTokens: 128000,
            supportsStreaming: true,
            costPerInputToken: 0.01,
            costPerOutputToken: 0.03,
          }
        },
        {
          name: 'anthropic',
          displayName: 'Anthropic',
          models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
          capabilities: {
            maxTokens: 200000,
            supportsStreaming: true,
            costPerInputToken: 0.003,
            costPerOutputToken: 0.015,
          }
        }
      ];
    }
  }

  /**
   * 🔄 Convertir document a response DTO (sin API key)
   */
  private toResponse(provider: AIProviderDocument): AIProviderResponse {
    // Desencriptar y maskear API key para mostrar en frontend
    let maskedApiKey = '••••••••';
    try {
      const decryptedApiKey = this.decryptApiKey(provider.apiKey);
      maskedApiKey = this.maskApiKey(decryptedApiKey);
    } catch (error) {
      this.logger.warn(`Failed to decrypt API key for provider ${provider.name}: ${error.message}`);
      // Usar la API key cruda si falla la desencriptación (para casos donde no esté encriptada)
      maskedApiKey = this.maskApiKey(provider.apiKey);
    }

    return {
      id: (provider._id as Types.ObjectId).toString(),
      name: provider.name,
      baseUrl: provider.baseUrl,
      model: provider.model,
      maxTokens: provider.maxTokens,
      temperature: provider.temperature,
      isActive: provider.isActive,
      costPerToken: provider.costPerToken,
      rateLimits: provider.rateLimits,
      healthStatus: provider.healthStatus,
      usageStats: provider.usageStats,
      configuration: provider.configuration,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
      apiKey: maskedApiKey,  // Agregar API key maskeada
    };
  }

  /**
   * 🔒 Maskear API key para mostrar en frontend
   */
  private maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '••••••••';
    }

    // Para API keys muy largas (como las encriptadas), mostrar solo prefix y suffix
    if (apiKey.length > 100) {
      const prefix = apiKey.substring(0, 8);
      const suffix = apiKey.substring(apiKey.length - 8);
      return `${prefix}••••••••••••••••••••${suffix}`;
    }

    // Para API keys normales
    if (apiKey.startsWith('sk-') || apiKey.startsWith('ant-')) {
      const prefix = apiKey.substring(0, 8);
      const suffix = apiKey.substring(apiKey.length - 6);
      const middle = '•'.repeat(12);
      return `${prefix}${middle}${suffix}`;
    }

    // Fallback genérico
    const prefix = apiKey.substring(0, 4);
    const suffix = apiKey.substring(apiKey.length - 4);
    const middle = '•'.repeat(Math.min(16, apiKey.length - 8));

    return `${prefix}${middle}${suffix}`;
  }
}