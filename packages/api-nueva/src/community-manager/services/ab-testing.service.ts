import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ABTestExperiment,
  ABTestExperimentDocument,
  ABTestVariant,
} from '../schemas/ab-test-experiment.schema';
import {
  ScheduledPost,
  ScheduledPostDocument,
} from '../schemas/scheduled-post.schema';

/**
 * 🧪 A/B Testing Service
 *
 * FASE 9: A/B Testing de contenido
 *
 * Responsabilidades:
 * - Crear experimentos A/B con múltiples variantes
 * - Programar publicación de variantes
 * - Analizar resultados con significancia estadística
 * - Declarar ganador basado en confianza
 * - Generar insights de los experimentos
 */
@Injectable()
export class ABTestingService {
  private readonly logger = new Logger(ABTestingService.name);

  constructor(
    @InjectModel(ABTestExperiment.name)
    private abTestExperimentModel: Model<ABTestExperimentDocument>,
    @InjectModel(ScheduledPost.name)
    private scheduledPostModel: Model<ScheduledPostDocument>,
  ) {
    this.logger.log('🧪 A/B Testing Service initialized');
  }

  /**
   * 🆕 Crea un nuevo experimento A/B
   *
   * @param data - Datos del experimento
   * @returns Experimento creado
   */
  async createExperiment(data: {
    experimentName: string;
    description: string;
    noticiaId: string;
    platform: 'facebook' | 'twitter';
    testType: 'copy' | 'timing' | 'hashtags' | 'media';
    variants: Array<{
      variantName: string;
      postContent: string;
    }>;
    startDate: Date;
    endDate: Date;
    requiredConfidence?: number;
    minimumSampleSize?: number;
  }): Promise<ABTestExperimentDocument> {
    // Validar que haya al menos 2 variantes
    if (data.variants.length < 2) {
      throw new Error('Se requieren al menos 2 variantes para un experimento A/B');
    }

    // Construir variantes con IDs
    const variants: ABTestVariant[] = data.variants.map((variant, index) => ({
      variantId: String.fromCharCode(65 + index), // A, B, C, etc.
      variantName: variant.variantName,
      postContent: variant.postContent,
      totalEngagement: 0,
      totalReach: 0,
      engagementRate: 0,
      clicks: 0,
      conversions: 0,
    }));

    // Crear experimento
    const experiment = new this.abTestExperimentModel({
      experimentName: data.experimentName,
      description: data.description,
      noticiaId: new Types.ObjectId(data.noticiaId),
      platform: data.platform,
      testType: data.testType,
      variants,
      status: 'draft',
      startDate: data.startDate,
      endDate: data.endDate,
      requiredConfidence: data.requiredConfidence || 95,
      minimumSampleSize: data.minimumSampleSize || 100,
    });

    await experiment.save();

    this.logger.log(
      `🧪 Experimento A/B creado: ${experiment.experimentName} (${variants.length} variantes)`,
    );

    return experiment;
  }

  /**
   * 🚀 Inicia un experimento A/B
   *
   * Cambia status a 'running' y programa publicación de variantes
   *
   * @param experimentId - ID del experimento
   * @returns Experimento actualizado
   */
  async startExperiment(
    experimentId: string,
  ): Promise<ABTestExperimentDocument> {
    const experiment = await this.abTestExperimentModel.findById(experimentId);

    if (!experiment) {
      throw new NotFoundException(`Experimento ${experimentId} no encontrado`);
    }

    if (experiment.status !== 'draft') {
      throw new Error(
        `Experimento está en status ${experiment.status}, no puede iniciarse`,
      );
    }

    // Validar que startDate esté en el futuro
    if (experiment.startDate <= new Date()) {
      throw new Error('La fecha de inicio debe estar en el futuro');
    }

    // Marcar como running
    experiment.status = 'running';
    await experiment.save();

    this.logger.log(
      `🚀 Experimento A/B iniciado: ${experiment.experimentName}`,
    );

    // TODO: Aquí se programarían los scheduled posts para cada variante
    // usando el CommunityManagerService.scheduleContent()

    return experiment;
  }

  /**
   * 📊 Analiza resultados de un experimento
   *
   * Calcula significancia estadística y determina ganador
   *
   * @param experimentId - ID del experimento
   * @returns Experimento con resultados
   */
  async analyzeExperiment(
    experimentId: string,
  ): Promise<ABTestExperimentDocument> {
    const experiment = await this.abTestExperimentModel.findById(experimentId);

    if (!experiment) {
      throw new NotFoundException(`Experimento ${experimentId} no encontrado`);
    }

    if (experiment.status !== 'running') {
      throw new Error(
        `Experimento debe estar en status 'running' para analizar`,
      );
    }

    // Actualizar métricas de variantes desde ScheduledPost
    await this.updateVariantMetrics(experiment);

    // Verificar que se haya alcanzado el sample size mínimo
    const totalReach = experiment.variants.reduce(
      (sum, v) => sum + v.totalReach,
      0,
    );

    if (totalReach < experiment.minimumSampleSize) {
      this.logger.warn(
        `⚠️ Experimento ${experimentId}: Sample size insuficiente (${totalReach}/${experiment.minimumSampleSize})`,
      );
      return experiment;
    }

    // Ordenar variantes por engagement rate
    const sortedVariants = [...experiment.variants].sort(
      (a, b) => b.engagementRate - a.engagementRate,
    );

    const winner = sortedVariants[0];
    const runnerUp = sortedVariants[1];

    // Calcular confianza usando test de proporciones
    const confidence = this.calculateStatisticalConfidence(winner, runnerUp);

    // Calcular mejora porcentual
    const improvement =
      runnerUp.engagementRate > 0
        ? ((winner.engagementRate - runnerUp.engagementRate) /
            runnerUp.engagementRate) *
          100
        : 0;

    // Si la confianza es suficiente, marcar como completado
    if (confidence >= experiment.requiredConfidence) {
      experiment.status = 'completed';
      experiment.results = {
        winnerVariantId: winner.variantId,
        confidenceLevel: confidence,
        improvementPercentage: parseFloat(improvement.toFixed(2)),
        insights: this.generateInsights(experiment, winner, runnerUp),
        completedAt: new Date(),
      };

      await experiment.save();

      this.logger.log(
        `✅ Experimento ${experimentId} completado. Ganador: Variante ${winner.variantId} con ${confidence}% confianza`,
      );
    } else {
      this.logger.log(
        `📊 Experimento ${experimentId} analizado. Confianza: ${confidence}% (requiere ${experiment.requiredConfidence}%)`,
      );
    }

    return experiment;
  }

  /**
   * 🔄 Actualiza métricas de variantes desde ScheduledPost
   *
   * @param experiment - Experimento a actualizar
   */
  private async updateVariantMetrics(
    experiment: ABTestExperimentDocument,
  ): Promise<void> {
    for (const variant of experiment.variants) {
      if (!variant.scheduledPostId) continue;

      const post = await this.scheduledPostModel.findById(
        variant.scheduledPostId,
      );

      if (post && post.engagement) {
        const likes = post.engagement.likes || 0;
        const comments = post.engagement.comments || 0;
        const shares = post.engagement.shares || 0;
        variant.totalEngagement = likes + comments + shares;
        variant.totalReach = post.engagement.reach || 0;
        variant.engagementRate =
          variant.totalReach > 0
            ? (variant.totalEngagement / variant.totalReach) * 100
            : 0;
        variant.clicks = post.engagement.clicks || 0;
      }
    }

    await experiment.save();
  }

  /**
   * 📈 Calcula confianza estadística entre dos variantes
   *
   * Usa test de proporciones Z
   *
   * @param winner - Variante ganadora
   * @param runnerUp - Segunda variante
   * @returns Nivel de confianza (0-100)
   */
  private calculateStatisticalConfidence(
    winner: ABTestVariant,
    runnerUp: ABTestVariant,
  ): number {
    const n1 = winner.totalReach;
    const n2 = runnerUp.totalReach;
    const p1 = n1 > 0 ? winner.totalEngagement / n1 : 0;
    const p2 = n2 > 0 ? runnerUp.totalEngagement / n2 : 0;

    // Si no hay datos suficientes
    if (n1 < 30 || n2 < 30) {
      return 0;
    }

    // Calcular pooled proportion
    const p = (winner.totalEngagement + runnerUp.totalEngagement) / (n1 + n2);

    // Calcular standard error
    const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));

    if (se === 0) return 0;

    // Calcular Z-score
    const z = Math.abs(p1 - p2) / se;

    // Convertir Z-score a confianza (aproximación)
    // Z = 1.96 → 95%, Z = 2.58 → 99%
    let confidence = 0;

    if (z >= 2.58) confidence = 99;
    else if (z >= 1.96) confidence = 95;
    else if (z >= 1.65) confidence = 90;
    else if (z >= 1.28) confidence = 80;
    else confidence = Math.round(z * 40); // Aproximación lineal para z < 1.28

    return Math.min(confidence, 99);
  }

  /**
   * 💡 Genera insights del experimento
   *
   * @param experiment - Experimento completo
   * @param winner - Variante ganadora
   * @param runnerUp - Segunda variante
   * @returns Array de insights
   */
  private generateInsights(
    experiment: ABTestExperimentDocument,
    winner: ABTestVariant,
    runnerUp: ABTestVariant,
  ): string[] {
    const insights: string[] = [];

    // Insight sobre ganador
    insights.push(
      `Variante ${winner.variantId} "${winner.variantName}" ganó con ${winner.engagementRate.toFixed(2)}% de engagement rate`,
    );

    // Insight sobre mejora
    const improvement =
      runnerUp.engagementRate > 0
        ? ((winner.engagementRate - runnerUp.engagementRate) /
            runnerUp.engagementRate) *
          100
        : 0;

    if (improvement > 0) {
      insights.push(
        `Mejora de ${improvement.toFixed(2)}% vs segunda mejor variante`,
      );
    }

    // Insight sobre tipo de test
    if (experiment.testType === 'copy') {
      insights.push(
        'El copy de la variante ganadora resonó mejor con la audiencia',
      );
    } else if (experiment.testType === 'timing') {
      insights.push(
        'El horario de publicación impactó significativamente el engagement',
      );
    } else if (experiment.testType === 'hashtags') {
      insights.push(
        'Los hashtags de la variante ganadora mejoraron el alcance',
      );
    }

    // Insight sobre alcance
    const totalReach = experiment.variants.reduce(
      (sum, v) => sum + v.totalReach,
      0,
    );
    insights.push(
      `Experimento alcanzó ${totalReach} personas en total`,
    );

    return insights;
  }

  /**
   * 🗂️ Obtiene experimentos con filtros
   *
   * @param filters - Filtros de búsqueda
   * @returns Lista de experimentos
   */
  async getExperiments(filters?: {
    status?: 'draft' | 'running' | 'completed' | 'cancelled';
    platform?: 'facebook' | 'twitter';
    limit?: number;
  }): Promise<ABTestExperimentDocument[]> {
    const query: Record<string, any> = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.platform) {
      query.platform = filters.platform;
    }

    return this.abTestExperimentModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filters?.limit || 20)
      .exec();
  }

  /**
   * ❌ Cancela un experimento
   *
   * @param experimentId - ID del experimento
   * @returns Experimento cancelado
   */
  async cancelExperiment(
    experimentId: string,
  ): Promise<ABTestExperimentDocument> {
    const experiment = await this.abTestExperimentModel.findById(experimentId);

    if (!experiment) {
      throw new NotFoundException(`Experimento ${experimentId} no encontrado`);
    }

    if (experiment.status === 'completed') {
      throw new Error('No se puede cancelar un experimento completado');
    }

    experiment.status = 'cancelled';
    await experiment.save();

    this.logger.log(`❌ Experimento ${experimentId} cancelado`);

    return experiment;
  }
}
