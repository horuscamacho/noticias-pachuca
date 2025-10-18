import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContentRecyclingScheduleDocument = ContentRecyclingSchedule & Document;

/**
 * 🔄 Schema para programación de reciclaje de contenido evergreen
 * Gestiona el ciclo de vida del reciclaje: detección, programación, tracking
 */
@Schema({ timestamps: true })
export class ContentRecyclingSchedule {
  // ========================================
  // 🔗 RELACIÓN CON NOTICIA
  // ========================================

  @Prop({ type: Types.ObjectId, ref: 'PublishedNoticia', required: true, unique: true })
  noticiaId: Types.ObjectId; // Referencia a la noticia publicada

  // ========================================
  // 🏷️ TIPO DE CONTENIDO RECICLABLE
  // ========================================

  @Prop({
    enum: ['pure_evergreen', 'seasonal_evergreen', 'durable', 'not_recyclable'],
    required: true,
  })
  recycleType: string;

  /**
   * pure_evergreen: Reciclaje infinito (guías, explicadores)
   * seasonal_evergreen: Reciclaje anual (impuestos, eventos anuales)
   * durable: Reciclaje limitado 1-2 veces (análisis de tendencias)
   * not_recyclable: No apto para reciclaje (breaking news, eventos pasados)
   */

  // ========================================
  // ⏰ PROGRAMACIÓN DE RECICLAJE
  // ========================================

  @Prop()
  lastRecycledAt?: Date; // Última vez que se recicló

  @Prop()
  nextScheduledRecycle?: Date; // Próxima fecha programada

  @Prop({ default: 90 })
  recycleFrequencyDays: number; // Frecuencia en días (90 por defecto)

  @Prop({ default: 0 })
  totalRecycles: number; // Contador de reciclajes realizados

  @Prop({ default: 3 })
  maxRecyclesAllowed: number; // Máximo de reciclajes permitidos

  // ========================================
  // 📊 HISTORIAL DE PERFORMANCE
  // ========================================

  @Prop({ type: Array, default: [] })
  performanceHistory: Array<{
    recycleDate: Date;
    recycleNumber: number; // Número del reciclaje (1, 2, 3...)

    // Engagement por plataforma
    facebookEngagement?: {
      likes: number;
      comments: number;
      shares: number;
      reach: number;
    };

    twitterEngagement?: {
      likes: number;
      retweets: number;
      replies: number;
      impressions: number;
    };

    // Métricas agregadas
    totalEngagement: number;
    totalReach: number;
    engagementRate: number;

    // Comparación con original
    performanceVsOriginal: number; // % de performance vs publicación original
  }>;

  // ========================================
  // 🔒 ELEGIBILIDAD Y VALIDACIONES
  // ========================================

  @Prop({ default: true })
  isEligibleForRecycle: boolean; // Si es elegible para reciclaje

  @Prop({ type: Array, default: [] })
  ineligibilityReasons: string[]; // Razones de no elegibilidad

  @Prop()
  lastEligibilityCheck?: Date; // Última verificación de elegibilidad

  @Prop()
  lastCheckedAt?: Date; // Última vez que se verificó el schedule

  // ========================================
  // 🎯 CONFIGURACIÓN DE RECICLAJE
  // ========================================

  @Prop({ type: Object })
  recyclingConfig?: {
    preferredDaysOfWeek: number[]; // [0=Domingo, 1=Lunes, ..., 6=Sábado]
    preferredTimeSlots: string[]; // ['07:00-09:00', '19:00-21:00']
    regenerateSocialCopy: boolean; // Si regenerar copys con IA
    platforms: ('facebook' | 'twitter')[]; // Plataformas donde reciclar
  };

  // ========================================
  // 📝 METADATA
  // ========================================

  @Prop({ type: String })
  notes?: string; // Notas internas

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ContentRecyclingScheduleSchema = SchemaFactory.createForClass(
  ContentRecyclingSchedule,
);

// ========================================
// 📇 ÍNDICES
// ========================================

ContentRecyclingScheduleSchema.index({ noticiaId: 1 }, { unique: true });
ContentRecyclingScheduleSchema.index({ recycleType: 1 });
ContentRecyclingScheduleSchema.index({ nextScheduledRecycle: 1, isEligibleForRecycle: 1 });
ContentRecyclingScheduleSchema.index({ isEligibleForRecycle: 1, totalRecycles: 1 });
