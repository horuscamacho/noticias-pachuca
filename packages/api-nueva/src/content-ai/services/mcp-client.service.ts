import { Injectable, Logger } from '@nestjs/common';
import { MCPContext, IMCPAdapter, IAIProviderAdapter } from '../adapters/ai-provider.interface';
import { ProviderFactoryService } from './provider-factory.service';

/**
 * 🌐 Model Context Protocol (MCP) Client Service
 * Estándar emergente 2025 para interoperabilidad entre proveedores IA
 *
 * Funcionalidades:
 * - Context sharing entre providers
 * - Cross-provider tool calling
 * - Session management unificado
 * - Memory sharing y sincronización
 */
@Injectable()
export class MCPClientService {
  private readonly logger = new Logger(MCPClientService.name);

  private activeSessions: Map<string, MCPContext> = new Map();
  private providerConnections: Map<string, IMCPAdapter> = new Map();

  constructor(
    private readonly providerFactory: ProviderFactoryService,
  ) {}

  /**
   * 🚀 Inicializar sesión MCP
   */
  async initializeSession(sessionConfig: {
    sessionId: string;
    providers: string[]; // ['openai', 'anthropic']
    initialContext?: Partial<MCPContext>;
  }): Promise<MCPContext> {
    const context: MCPContext = {
      sessionId: sessionConfig.sessionId,
      conversationHistory: [],
      sharedMemory: {},
      tools: [],
      metadata: {
        createdAt: new Date(),
        providers: sessionConfig.providers,
        version: '1.0',
      },
      ...sessionConfig.initialContext,
    };

    // Inicializar providers con MCP
    for (const providerName of sessionConfig.providers) {
      try {
        const provider = this.providerFactory.getProvider(providerName) as IAIProviderAdapter & IMCPAdapter;
        await provider.initializeMCP(context);
        this.providerConnections.set(`${sessionConfig.sessionId}:${providerName}`, provider);

        this.logger.log(`MCP initialized for provider ${providerName} in session ${sessionConfig.sessionId}`);
      } catch (error) {
        this.logger.error(`Failed to initialize MCP for ${providerName}: ${error.message}`);
      }
    }

    this.activeSessions.set(sessionConfig.sessionId, context);
    return context;
  }

  /**
   * 🔄 Sincronizar contexto entre providers
   */
  async syncContextBetweenProviders(
    sessionId: string,
    sourceProvider: string,
    targetProviders: string[]
  ): Promise<void> {
    const context = this.activeSessions.get(sessionId);
    if (!context) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const sourceAdapter = this.providerConnections.get(`${sessionId}:${sourceProvider}`);
    if (!sourceAdapter) {
      throw new Error(`Source provider ${sourceProvider} not connected to session ${sessionId}`);
    }

    for (const targetProvider of targetProviders) {
      try {
        await sourceAdapter.syncContext(targetProvider);
        this.logger.log(`Synced context from ${sourceProvider} to ${targetProvider}`);
      } catch (error) {
        this.logger.error(`Failed to sync context to ${targetProvider}: ${error.message}`);
      }
    }
  }

  /**
   * 📝 Actualizar contexto compartido
   */
  async updateSharedContext(
    sessionId: string,
    updates: {
      conversationHistory?: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
        timestamp: Date;
        provider?: string;
      }>;
      sharedMemory?: Record<string, unknown>;
      tools?: Array<{
        name: string;
        description: string;
        parameters: Record<string, unknown>;
      }>;
      metadata?: Record<string, unknown>;
    }
  ): Promise<MCPContext> {
    const context = this.activeSessions.get(sessionId);
    if (!context) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Actualizar contexto local
    if (updates.conversationHistory) {
      context.conversationHistory = [
        ...(context.conversationHistory || []),
        ...updates.conversationHistory,
      ];
    }

    if (updates.sharedMemory) {
      context.sharedMemory = {
        ...context.sharedMemory,
        ...updates.sharedMemory,
      };
    }

    if (updates.tools) {
      context.tools = [
        ...(context.tools || []),
        ...updates.tools,
      ];
    }

    if (updates.metadata) {
      context.metadata = {
        ...context.metadata,
        ...updates.metadata,
        lastUpdated: new Date(),
      };
    }

    // Propagar cambios a todos los providers conectados
    const connectedProviders = Array.from(this.providerConnections.keys())
      .filter(key => key.startsWith(`${sessionId}:`))
      .map(key => this.providerConnections.get(key)!);

    for (const provider of connectedProviders) {
      try {
        await provider.updateSharedContext(updates);
      } catch (error) {
        this.logger.warn(`Failed to update shared context for provider: ${error.message}`);
      }
    }

    this.activeSessions.set(sessionId, context);
    return context;
  }

  /**
   * 🛠️ Registrar herramientas cross-provider
   */
  async registerCrossProviderTools(
    sessionId: string,
    tools: Array<{
      name: string;
      description: string;
      parameters: Record<string, unknown>;
      supportedProviders: string[];
      handler?: (params: Record<string, unknown>) => Promise<unknown>;
    }>
  ): Promise<void> {
    const context = this.activeSessions.get(sessionId);
    if (!context) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Registrar tools en providers compatibles
    for (const tool of tools) {
      for (const providerName of tool.supportedProviders) {
        const adapter = this.providerConnections.get(`${sessionId}:${providerName}`);
        if (adapter) {
          try {
            await adapter.registerTools([{
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
            }]);

            this.logger.log(`Registered tool ${tool.name} for provider ${providerName}`);
          } catch (error) {
            this.logger.error(`Failed to register tool ${tool.name} for ${providerName}: ${error.message}`);
          }
        }
      }
    }

    // Actualizar contexto
    await this.updateSharedContext(sessionId, { tools });
  }

  /**
   * 📊 Estado de sesión MCP
   */
  async getSessionStatus(sessionId: string): Promise<{
    isActive: boolean;
    connectedProviders: string[];
    contextSize: number;
    toolCount: number;
    conversationLength: number;
    lastActivity: Date;
    syncStatus: Record<string, boolean>;
  }> {
    const context = this.activeSessions.get(sessionId);
    if (!context) {
      return {
        isActive: false,
        connectedProviders: [],
        contextSize: 0,
        toolCount: 0,
        conversationLength: 0,
        lastActivity: new Date(0),
        syncStatus: {},
      };
    }

    const connectedProviders = Array.from(this.providerConnections.keys())
      .filter(key => key.startsWith(`${sessionId}:`))
      .map(key => key.split(':')[1]);

    const syncStatus: Record<string, boolean> = {};
    for (const provider of connectedProviders) {
      const adapter = this.providerConnections.get(`${sessionId}:${provider}`);
      if (adapter) {
        try {
          const status = await adapter.getMCPStatus();
          syncStatus[provider] = status.isActive;
        } catch (error) {
          syncStatus[provider] = false;
        }
      }
    }

    return {
      isActive: true,
      connectedProviders,
      contextSize: JSON.stringify(context.sharedMemory || {}).length,
      toolCount: context.tools?.length || 0,
      conversationLength: context.conversationHistory?.length || 0,
      lastActivity: (context.metadata?.lastUpdated as Date) || (context.metadata?.createdAt as Date) || new Date(),
      syncStatus,
    };
  }

  /**
   * 🔄 Provider switching con context preservation
   */
  async switchProvider(
    sessionId: string,
    fromProvider: string,
    toProvider: string,
    preserveContext: boolean = true
  ): Promise<void> {
    if (preserveContext) {
      await this.syncContextBetweenProviders(sessionId, fromProvider, [toProvider]);
    }

    this.logger.log(`Switched provider in session ${sessionId} from ${fromProvider} to ${toProvider}`);
  }

  /**
   * 🧹 Cleanup de sesión MCP
   */
  async closeSession(sessionId: string): Promise<void> {
    const context = this.activeSessions.get(sessionId);
    if (!context) {
      return;
    }

    // Cleanup providers
    const connectedProviders = Array.from(this.providerConnections.keys())
      .filter(key => key.startsWith(`${sessionId}:`));

    for (const key of connectedProviders) {
      const adapter = this.providerConnections.get(key);
      if (adapter) {
        try {
          // Cleanup provider resources
          const provider = this.providerFactory.getProvider(key.split(':')[1]);
          await provider.cleanup();
        } catch (error) {
          this.logger.warn(`Error cleaning up provider ${key}: ${error.message}`);
        }
        this.providerConnections.delete(key);
      }
    }

    this.activeSessions.delete(sessionId);
    this.logger.log(`Closed MCP session ${sessionId}`);
  }

  /**
   * 📈 Estadísticas globales MCP
   */
  async getGlobalStats(): Promise<{
    activeSessions: number;
    totalProviderConnections: number;
    averageContextSize: number;
    mostUsedProviders: Record<string, number>;
  }> {
    const activeSessions = this.activeSessions.size;
    const totalProviderConnections = this.providerConnections.size;

    let totalContextSize = 0;
    const providerUsage: Record<string, number> = {};

    for (const context of this.activeSessions.values()) {
      totalContextSize += JSON.stringify(context.sharedMemory || {}).length;
    }

    for (const key of this.providerConnections.keys()) {
      const provider = key.split(':')[1];
      providerUsage[provider] = (providerUsage[provider] || 0) + 1;
    }

    return {
      activeSessions,
      totalProviderConnections,
      averageContextSize: activeSessions > 0 ? totalContextSize / activeSessions : 0,
      mostUsedProviders: providerUsage,
    };
  }
}