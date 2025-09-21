import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FacebookApiUsageMetricsDocument = FacebookApiUsageMetrics & Document;

export interface PageUsageStats {
  pageId: string;
  pageName: string;
  calls: number;
  errors: number;
  avgResponseTime: number;
}

export interface HourlyBreakdown {
  hour: number; // 0-23
  calls: number;
  errors: number;
  avgResponseTime: number;
}

export interface ApiErrorBreakdown {
  errorType: string;
  count: number;
  percentage: number;
}

@Schema({
  timestamps: true,
  collection: 'facebook_api_usage_metrics'
})
export class FacebookApiUsageMetrics {
  @Prop({
    type: Date,
    required: true,
    unique: true,
    index: true
  })
  date: Date;

  @Prop({
    type: Number,
    required: true,
    default: 0,
    min: 0
  })
  totalCalls: number;

  @Prop({
    type: Number,
    required: true,
    default: 200,
    min: 0
  })
  callsRemaining: number;

  @Prop({
    type: Number,
    required: true,
    default: 0,
    min: 0
  })
  averageResponseTime: number;

  @Prop({
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100
  })
  errorRate: number;

  @Prop({
    type: [{
      pageId: {
        type: String,
        required: true
      },
      pageName: {
        type: String,
        required: true
      },
      calls: {
        type: Number,
        required: true,
        min: 0
      },
      errors: {
        type: Number,
        default: 0,
        min: 0
      },
      avgResponseTime: {
        type: Number,
        default: 0,
        min: 0
      }
    }],
    default: []
  })
  topPages: PageUsageStats[];

  @Prop({
    type: [{
      hour: {
        type: Number,
        required: true,
        min: 0,
        max: 23
      },
      calls: {
        type: Number,
        required: true,
        min: 0
      },
      errors: {
        type: Number,
        default: 0,
        min: 0
      },
      avgResponseTime: {
        type: Number,
        default: 0,
        min: 0
      }
    }],
    default: []
  })
  hourlyBreakdown: HourlyBreakdown[];

  @Prop({
    type: [{
      errorType: {
        type: String,
        required: true
      },
      count: {
        type: Number,
        required: true,
        min: 0
      },
      percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      }
    }],
    default: []
  })
  errorBreakdown: ApiErrorBreakdown[];

  @Prop({
    type: Number,
    required: true,
    default: 0,
    min: 0
  })
  totalErrors: number;

  @Prop({
    type: Number,
    required: true,
    default: 0,
    min: 0
  })
  successfulCalls: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0
  })
  rateLimitHits: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0
  })
  timeoutErrors: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0
  })
  authErrors: number;

  @Prop({
    type: Object,
    default: {}
  })
  additionalMetrics: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

export const FacebookApiUsageMetricsSchema = SchemaFactory.createForClass(FacebookApiUsageMetrics);

// Índices para optimización
FacebookApiUsageMetricsSchema.index({ date: 1 }, { unique: true });
FacebookApiUsageMetricsSchema.index({ date: -1 }); // Para consultas recientes
FacebookApiUsageMetricsSchema.index({ totalCalls: -1 });
FacebookApiUsageMetricsSchema.index({ errorRate: -1 });

// TTL index para métricas antiguas (mantener por 6 meses)
FacebookApiUsageMetricsSchema.index({ date: 1 }, { expireAfterSeconds: 15552000 }); // 6 meses

// Métodos de instancia
FacebookApiUsageMetricsSchema.methods.addApiCall = function(
  pageId: string,
  pageName: string,
  responseTime: number,
  isError: boolean = false,
  errorType?: string
): void {
  this.totalCalls += 1;
  this.callsRemaining = Math.max(0, this.callsRemaining - 1);

  if (isError) {
    this.totalErrors += 1;

    // Actualizar breakdown de errores
    if (errorType) {
      const existingError = this.errorBreakdown.find(e => e.errorType === errorType);
      if (existingError) {
        existingError.count += 1;
      } else {
        this.errorBreakdown.push({
          errorType,
          count: 1,
          percentage: 0 // Se calculará después
        });
      }
    }
  } else {
    this.successfulCalls += 1;
  }

  // Actualizar estadísticas de página
  const existingPage = this.topPages.find(p => p.pageId === pageId);
  if (existingPage) {
    existingPage.calls += 1;
    if (isError) existingPage.errors += 1;

    // Calcular nuevo promedio de tiempo de respuesta
    const totalResponseTime = existingPage.avgResponseTime * (existingPage.calls - 1) + responseTime;
    existingPage.avgResponseTime = totalResponseTime / existingPage.calls;
  } else {
    this.topPages.push({
      pageId,
      pageName,
      calls: 1,
      errors: isError ? 1 : 0,
      avgResponseTime: responseTime
    });
  }

  // Actualizar breakdown por hora
  const currentHour = new Date().getHours();
  const existingHour = this.hourlyBreakdown.find(h => h.hour === currentHour);
  if (existingHour) {
    existingHour.calls += 1;
    if (isError) existingHour.errors += 1;

    // Calcular nuevo promedio
    const totalResponseTime = existingHour.avgResponseTime * (existingHour.calls - 1) + responseTime;
    existingHour.avgResponseTime = totalResponseTime / existingHour.calls;
  } else {
    this.hourlyBreakdown.push({
      hour: currentHour,
      calls: 1,
      errors: isError ? 1 : 0,
      avgResponseTime: responseTime
    });
  }

  // Recalcular métricas
  this.recalculateMetrics();
};

FacebookApiUsageMetricsSchema.methods.recalculateMetrics = function(): void {
  // Recalcular error rate
  if (this.totalCalls > 0) {
    this.errorRate = (this.totalErrors / this.totalCalls) * 100;
  }

  // Recalcular tiempo promedio de respuesta
  if (this.topPages.length > 0) {
    const totalResponseTime = this.topPages.reduce((sum, page) =>
      sum + (page.avgResponseTime * page.calls), 0
    );
    this.averageResponseTime = totalResponseTime / this.totalCalls;
  }

  // Recalcular porcentajes de errores
  if (this.totalErrors > 0) {
    this.errorBreakdown.forEach(error => {
      error.percentage = (error.count / this.totalErrors) * 100;
    });
  }

  // Ordenar páginas por número de calls
  this.topPages.sort((a, b) => b.calls - a.calls);

  // Mantener solo top 10 páginas
  if (this.topPages.length > 10) {
    this.topPages = this.topPages.slice(0, 10);
  }
};

FacebookApiUsageMetricsSchema.methods.getUsagePercentage = function(): number {
  const dailyLimit = 200; // Límite diario de Facebook API
  return (this.totalCalls / dailyLimit) * 100;
};

FacebookApiUsageMetricsSchema.methods.canMakeMoreCalls = function(buffer: number = 25): boolean {
  const usagePercentage = this.getUsagePercentage();
  return usagePercentage < (100 - buffer);
};

FacebookApiUsageMetricsSchema.methods.getTopPagesByUsage = function(limit: number = 5): PageUsageStats[] {
  return this.topPages
    .sort((a, b) => b.calls - a.calls)
    .slice(0, limit);
};

FacebookApiUsageMetricsSchema.methods.getPeakHours = function(): HourlyBreakdown[] {
  return this.hourlyBreakdown
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 3);
};