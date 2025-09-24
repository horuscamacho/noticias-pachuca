import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { GenerationLog, GenerationLogDocument } from '../schemas/generation-log.schema';
import { AIProviderService } from './ai-provider.service';

export interface CostAlert {
  id: string;
  type: 'daily_limit' | 'monthly_limit' | 'job_cost_spike' | 'provider_quota' | 'budget_threshold';
  severity: 'warning' | 'critical';
  message: string;
  details: {
    current: number;
    limit: number;
    provider?: string;
    timeframe: string;
  };
  triggeredAt: Date;
  acknowledged?: boolean;
}

export interface CostReport {
  timeframe: 'hour' | 'day' | 'week' | 'month';
  period: {
    start: Date;
    end: Date;
  };
  totals: {
    cost: number;
    tokens: number;
    requests: number;
    jobs: number;
  };
  byProvider: Record<string, {
    cost: number;
    tokens: number;
    requests: number;
    averageCostPerRequest: number;
    successRate: number;
  }>;
  byAgent: Record<string, {
    cost: number;
    jobs: number;
    averageCostPerJob: number;
    successRate: number;
  }>;
  topExpensive: Array<{
    jobId: string;
    contentId: string;
    cost: number;
    provider: string;
    timestamp: Date;
  }>;
  trends: {
    costGrowth: number; // % growth vs previous period
    efficiencyChange: number; // cost per successful job change
    qualityImpact: number; // cost vs quality correlation
  };
}

export interface BudgetConfig {
  dailyLimit: number;
  monthlyLimit: number;
  alertThresholds: {
    warning: number; // % of limit
    critical: number; // % of limit
  };
  perProviderLimits: Record<string, {
    dailyLimit: number;
    monthlyLimit: number;
  }>;
  costOptimization: {
    enableAutoFailover: boolean; // Switch to cheaper provider when expensive one fails
    preferCheaperProviders: boolean; // Prefer cheaper providers for non-urgent jobs
    maxCostPerJob: number; // Maximum cost allowed per individual job
  };
}

/**
 * 💰 Servicio de monitoreo y alertas de costos para generación de contenido AI
 * Tracking detallado, alertas automáticas, reportes y optimización de costos
 */
@Injectable()
export class CostMonitoringService {
  private readonly logger = new Logger(CostMonitoringService.name);

  private readonly defaultBudgetConfig: BudgetConfig = {
    dailyLimit: 100.0,  // $100/día
    monthlyLimit: 2000.0, // $2000/mes
    alertThresholds: {
      warning: 80,  // 80% del límite
      critical: 95, // 95% del límite
    },
    perProviderLimits: {
      'openai': { dailyLimit: 60.0, monthlyLimit: 1200.0 },
      'anthropic': { dailyLimit: 40.0, monthlyLimit: 800.0 },
    },
    costOptimization: {
      enableAutoFailover: true,
      preferCheaperProviders: false,
      maxCostPerJob: 5.0, // $5 max por job
    },
  };

  private budgetConfig: BudgetConfig = this.defaultBudgetConfig;
  private activeAlerts: Map<string, CostAlert> = new Map();

  constructor(
    @InjectModel(GenerationLog.name) private generationLogModel: Model<GenerationLogDocument>,
    private readonly aiProviderService: AIProviderService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.startPeriodicMonitoring();
  }

  /**
   * 📊 Event handler - Actualizar métricas cuando se completa un job
   */
  @OnEvent('content-generation.metrics-updated')
  async handleMetricsUpdated(event: {
    jobId: string;
    contentId: string;
    providerId?: string;
    cost: number;
    tokens: number;
    timestamp: Date;
  }): Promise<void> {
    try {
      // Crear registro de log
      await this.logGeneration({
        jobId: event.jobId,
        contentId: event.contentId,
        providerId: event.providerId,
        cost: event.cost,
        tokens: event.tokens,
        success: true,
        timestamp: event.timestamp,
      });

      // Verificar alertas de costo
      await this.checkCostAlerts(event.cost, event.providerId);

      // Verificar límites por job
      if (event.cost > this.budgetConfig.costOptimization.maxCostPerJob) {
        await this.createAlert({
          type: 'job_cost_spike',
          severity: 'warning',
          message: `Job ${event.jobId} cost ($${event.cost}) exceeds max cost per job limit`,
          details: {
            current: event.cost,
            limit: this.budgetConfig.costOptimization.maxCostPerJob,
            provider: event.providerId,
            timeframe: 'single_job',
          },
        });
      }

    } catch (error) {
      this.logger.error(`Failed to handle metrics update: ${error.message}`, error.stack);
    }
  }

  /**
   * 📊 Event handler - Registrar job fallido
   */
  @OnEvent('content-generation.failed')
  async handleJobFailed(event: {
    jobId: string;
    contentId: string;
    error: string;
    processingTime: number;
    retryCount: number;
    batchId?: string;
  }): Promise<void> {
    try {
      // Crear registro de log para job fallido
      await this.logGeneration({
        jobId: event.jobId,
        contentId: event.contentId,
        cost: 0, // No cost for failed jobs
        tokens: 0,
        success: false,
        errorMessage: event.error,
        processingTime: event.processingTime,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error(`Failed to handle job failure: ${error.message}`);
    }
  }

  /**
   * 💾 Registrar generación en log
   */
  async logGeneration(data: {
    jobId: string;
    contentId: string;
    agentId?: string;
    templateId?: string;
    providerId?: string;
    cost: number;
    tokens: number;
    success: boolean;
    errorMessage?: string;
    processingTime?: number;
    qualityScore?: number;
    timestamp: Date;
  }): Promise<void> {
    try {
      const logEntry = new this.generationLogModel({
        jobId: data.jobId,
        contentId: data.contentId,
        agentId: data.agentId,
        templateId: data.templateId,
        providerId: data.providerId || 'unknown',
        cost: data.cost,
        tokensUsed: data.tokens,
        success: data.success,
        errorMessage: data.errorMessage,
        processingTime: data.processingTime || 0,
        qualityScore: data.qualityScore,
        timestamp: data.timestamp,
      });

      await logEntry.save();

      this.logger.debug(`Logged generation: Job ${data.jobId}, Cost: $${data.cost}, Success: ${data.success}`);

    } catch (error) {
      this.logger.error(`Failed to log generation: ${error.message}`);
    }
  }

  /**
   * 📈 Generar reporte de costos
   */
  async generateCostReport(
    timeframe: 'hour' | 'day' | 'week' | 'month',
    startDate?: Date,
    endDate?: Date
  ): Promise<CostReport> {
    try {
      const period = this.calculatePeriod(timeframe, startDate, endDate);

      // Obtener logs del período
      const logs = await this.generationLogModel.find({
        timestamp: {
          $gte: period.start,
          $lte: period.end,
        },
      }).exec();

      // Calcular totales
      const totals = logs.reduce((acc, log) => ({
        cost: acc.cost + (log.usage?.cost || 0),
        tokens: acc.tokens + (log.usage?.totalTokens || 0),
        requests: acc.requests + 1,
        jobs: acc.jobs + (log.logLevel === 'completed' ? 1 : 0),
      }), { cost: 0, tokens: 0, requests: 0, jobs: 0 });

      // Agrupar por proveedor
      const byProvider = this.groupByProvider(logs);

      // Agrupar por agente
      const byAgent = this.groupByAgent(logs);

      // Obtener jobs más costosos
      const topExpensive = logs
        .filter(log => log.logLevel === 'completed')
        .sort((a, b) => (b.usage?.cost || 0) - (a.usage?.cost || 0))
        .slice(0, 10)
        .map(log => ({
          jobId: log.jobId.toString(),
          contentId: log.metadata?.correlationId || 'unknown',
          cost: log.usage?.cost || 0,
          provider: log.providerId.toString(),
          timestamp: log.timestamp,
        }));

      // Calcular tendencias
      const trends = await this.calculateTrends(timeframe, period);

      return {
        timeframe,
        period,
        totals,
        byProvider,
        byAgent,
        topExpensive,
        trends,
      };

    } catch (error) {
      this.logger.error(`Failed to generate cost report: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🚨 Obtener alertas activas
   */
  getActiveAlerts(): CostAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  /**
   * ✅ Confirmar alerta
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.activeAlerts.set(alertId, alert);

      this.eventEmitter.emit('cost-monitoring.alert-acknowledged', {
        alertId,
        type: alert.type,
        acknowledgedAt: new Date(),
      });

      return true;
    }
    return false;
  }

  /**
   * ⚙️ Actualizar configuración de presupuesto
   */
  updateBudgetConfig(config: Partial<BudgetConfig>): void {
    this.budgetConfig = { ...this.budgetConfig, ...config };

    this.eventEmitter.emit('cost-monitoring.budget-updated', {
      config: this.budgetConfig,
      updatedAt: new Date(),
    });

    this.logger.log('Budget configuration updated');
  }

  /**
   * 💡 Obtener recomendaciones de optimización
   */
  async getOptimizationRecommendations(): Promise<Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    potentialSavings: number;
    implementation: string;
  }>> {
    const recommendations: Array<{
      type: string;
      priority: 'high' | 'medium' | 'low';
      description: string;
      potentialSavings: number;
      implementation: string;
    }> = [];

    try {
      // Analizar últimos 7 días
      const report = await this.generateCostReport('week');

      // Recomendación 1: Provider más caro
      const expensiveProvider = Object.entries(report.byProvider)
        .sort(([,a], [,b]) => b.averageCostPerRequest - a.averageCostPerRequest)[0];

      if (expensiveProvider && expensiveProvider[1].averageCostPerRequest > 0.05) {
        recommendations.push({
          type: 'expensive_provider',
          priority: 'high' as const,
          description: `Provider ${expensiveProvider[0]} tiene costo promedio alto: $${expensiveProvider[1].averageCostPerRequest}/request`,
          potentialSavings: expensiveProvider[1].cost * 0.3, // 30% potential savings
          implementation: 'Considerar usar providers alternativos para jobs no críticos',
        });
      }

      // Recomendación 2: Jobs fallidos costosos
      const failedJobsCost = report.totals.cost - (report.totals.jobs * 0.03); // Estimated wasted cost
      if (failedJobsCost > 10) {
        recommendations.push({
          type: 'failed_jobs',
          priority: 'medium' as const,
          description: `Costo estimado en jobs fallidos: $${failedJobsCost.toFixed(2)}`,
          potentialSavings: failedJobsCost,
          implementation: 'Mejorar validación de input y health checks de providers',
        });
      }

      // Recomendación 3: Optimización por hora
      if (report.totals.cost > 50) {
        recommendations.push({
          type: 'scheduling_optimization',
          priority: 'low' as const,
          description: 'Considerar programar jobs no urgentes en horarios de menor demanda',
          potentialSavings: report.totals.cost * 0.15, // 15% potential savings
          implementation: 'Implementar scheduling inteligente basado en costos por hora',
        });
      }

      return recommendations;

    } catch (error) {
      this.logger.error(`Failed to generate optimization recommendations: ${error.message}`);
      return [];
    }
  }

  /**
   * 🔄 Monitoreo periódico automático
   */
  private startPeriodicMonitoring(): void {
    // Verificar límites cada 15 minutos
    setInterval(() => {
      this.checkPeriodLimits();
    }, 15 * 60 * 1000);

    // Limpiar alertas viejas cada hora
    setInterval(() => {
      this.cleanupOldAlerts();
    }, 60 * 60 * 1000);

    this.logger.log('Started periodic cost monitoring');
  }

  /**
   * 🚨 Verificar alertas de costo
   */
  private async checkCostAlerts(jobCost: number, providerId?: string): Promise<void> {
    // Verificar límites diarios y mensuales
    await this.checkPeriodLimits();

    // Verificar límites por proveedor
    if (providerId) {
      await this.checkProviderLimits(providerId);
    }
  }

  /**
   * 📊 Verificar límites por período
   */
  private async checkPeriodLimits(): Promise<void> {
    try {
      // Obtener costos del día actual
      const todayReport = await this.generateCostReport('day');
      const dailyCost = todayReport.totals.cost;

      // Verificar límite diario
      if (dailyCost >= this.budgetConfig.dailyLimit * (this.budgetConfig.alertThresholds.critical / 100)) {
        await this.createAlert({
          type: 'daily_limit',
          severity: 'critical',
          message: `Daily cost limit exceeded: $${dailyCost}/$${this.budgetConfig.dailyLimit}`,
          details: {
            current: dailyCost,
            limit: this.budgetConfig.dailyLimit,
            timeframe: 'daily',
          },
        });
      } else if (dailyCost >= this.budgetConfig.dailyLimit * (this.budgetConfig.alertThresholds.warning / 100)) {
        await this.createAlert({
          type: 'daily_limit',
          severity: 'warning',
          message: `Daily cost warning: $${dailyCost}/$${this.budgetConfig.dailyLimit}`,
          details: {
            current: dailyCost,
            limit: this.budgetConfig.dailyLimit,
            timeframe: 'daily',
          },
        });
      }

      // Obtener costos del mes actual
      const monthReport = await this.generateCostReport('month');
      const monthlyCost = monthReport.totals.cost;

      // Verificar límite mensual
      if (monthlyCost >= this.budgetConfig.monthlyLimit * (this.budgetConfig.alertThresholds.critical / 100)) {
        await this.createAlert({
          type: 'monthly_limit',
          severity: 'critical',
          message: `Monthly cost limit exceeded: $${monthlyCost}/$${this.budgetConfig.monthlyLimit}`,
          details: {
            current: monthlyCost,
            limit: this.budgetConfig.monthlyLimit,
            timeframe: 'monthly',
          },
        });
      }

    } catch (error) {
      this.logger.error(`Failed to check period limits: ${error.message}`);
    }
  }

  /**
   * 🏭 Verificar límites por proveedor
   */
  private async checkProviderLimits(providerId: string): Promise<void> {
    try {
      const providerLimits = this.budgetConfig.perProviderLimits[providerId];
      if (!providerLimits) return;

      const costStats = await this.aiProviderService.getCostStats('day');
      const providerStats = costStats.providerBreakdown[providerId];

      if (providerStats && providerStats.cost >= providerLimits.dailyLimit * 0.9) {
        await this.createAlert({
          type: 'provider_quota',
          severity: 'warning',
          message: `Provider ${providerId} approaching daily limit: $${providerStats.cost}/$${providerLimits.dailyLimit}`,
          details: {
            current: providerStats.cost,
            limit: providerLimits.dailyLimit,
            provider: providerId,
            timeframe: 'daily',
          },
        });
      }

    } catch (error) {
      this.logger.error(`Failed to check provider limits for ${providerId}: ${error.message}`);
    }
  }

  /**
   * 🚨 Crear nueva alerta
   */
  private async createAlert(alertData: Omit<CostAlert, 'id' | 'triggeredAt'>): Promise<void> {
    const alertId = `${alertData.type}-${Date.now()}`;
    const alert: CostAlert = {
      id: alertId,
      triggeredAt: new Date(),
      ...alertData,
    };

    this.activeAlerts.set(alertId, alert);

    // Emitir evento de alerta
    this.eventEmitter.emit('cost-monitoring.alert-created', alert);

    this.logger.warn(`Cost alert created: ${alert.type} - ${alert.message}`);
  }

  /**
   * 🧹 Limpiar alertas antiguas
   */
  private cleanupOldAlerts(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago

    for (const [id, alert] of this.activeAlerts.entries()) {
      if (alert.triggeredAt < cutoff && alert.acknowledged) {
        this.activeAlerts.delete(id);
      }
    }
  }

  /**
   * 📅 Calcular período de tiempo
   */
  private calculatePeriod(timeframe: string, startDate?: Date, endDate?: Date): { start: Date; end: Date } {
    const now = new Date();
    const end = endDate || now;

    let start: Date;
    switch (timeframe) {
      case 'hour':
        start = startDate || new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        start = startDate || new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = startDate || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        start = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  /**
   * 📊 Agrupar logs por proveedor
   */
  private groupByProvider(logs: GenerationLogDocument[]): Record<string, {
    cost: number;
    tokens: number;
    requests: number;
    successful: number;
    averageCostPerRequest: number;
    successRate: number;
  }> {
    const grouped = logs.reduce((acc, log) => {
      const provider = log.providerId?.toString() || 'unknown';
      if (!acc[provider]) {
        acc[provider] = { cost: 0, tokens: 0, requests: 0, successful: 0, averageCostPerRequest: 0, successRate: 0 };
      }
      acc[provider].cost += log.usage?.cost || 0;
      acc[provider].tokens += log.usage?.totalTokens || 0;
      acc[provider].requests += 1;
      if (log.logLevel === 'completed') acc[provider].successful += 1;
      return acc;
    }, {} as Record<string, { cost: number; tokens: number; requests: number; successful: number; averageCostPerRequest: number; successRate: number }>);

    // Calcular métricas derivadas
    for (const provider in grouped) {
      const stats = grouped[provider];
      stats.averageCostPerRequest = stats.requests > 0 ? stats.cost / stats.requests : 0;
      stats.successRate = stats.requests > 0 ? (stats.successful / stats.requests) * 100 : 0;
    }

    return grouped;
  }

  /**
   * 👤 Agrupar logs por agente
   */
  private groupByAgent(logs: GenerationLogDocument[]): Record<string, {
    cost: number;
    jobs: number;
    successful: number;
    averageCostPerJob: number;
    successRate: number;
  }> {
    const grouped = logs.reduce((acc, log) => {
      const agent = log.agentId?.toString() || 'unknown';
      if (!acc[agent]) {
        acc[agent] = { cost: 0, jobs: 0, successful: 0, averageCostPerJob: 0, successRate: 0 };
      }
      acc[agent].cost += log.usage?.cost || 0;
      acc[agent].jobs += 1;
      if (log.logLevel === 'completed') acc[agent].successful += 1;
      return acc;
    }, {} as Record<string, { cost: number; jobs: number; successful: number; averageCostPerJob: number; successRate: number }>);

    // Calcular métricas derivadas
    for (const agent in grouped) {
      const stats = grouped[agent];
      stats.averageCostPerJob = stats.jobs > 0 ? stats.cost / stats.jobs : 0;
      stats.successRate = stats.jobs > 0 ? (stats.successful / stats.jobs) * 100 : 0;
    }

    return grouped;
  }

  /**
   * 📈 Calcular tendencias
   */
  private async calculateTrends(timeframe: string, period: { start: Date; end: Date }): Promise<{
    costGrowth: number;
    efficiencyChange: number;
    qualityImpact: number;
  }> {
    try {
      // Obtener período anterior para comparación
      const duration = period.end.getTime() - period.start.getTime();
      const previousStart = new Date(period.start.getTime() - duration);
      const previousEnd = period.start;

      const previousLogs = await this.generationLogModel.find({
        timestamp: {
          $gte: previousStart,
          $lte: previousEnd,
        },
      }).exec();

      const currentCost = await this.generationLogModel.aggregate([
        { $match: { timestamp: { $gte: period.start, $lte: period.end } } },
        { $group: { _id: null, total: { $sum: '$usage.cost' } } }
      ]);

      const previousCost = previousLogs.reduce((sum, log) => sum + (log.usage?.cost || 0), 0);
      const currentTotal = currentCost[0]?.total || 0;

      const costGrowth = previousCost > 0 ? ((currentTotal - previousCost) / previousCost) * 100 : 0;

      return {
        costGrowth: Math.round(costGrowth * 100) / 100,
        efficiencyChange: 0, // Placeholder for efficiency calculation
        qualityImpact: 0,    // Placeholder for quality correlation
      };

    } catch (error) {
      this.logger.warn(`Failed to calculate trends: ${error.message}`);
      return { costGrowth: 0, efficiencyChange: 0, qualityImpact: 0 };
    }
  }
}