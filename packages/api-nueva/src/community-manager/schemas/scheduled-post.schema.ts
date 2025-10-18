import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ScheduledPostDocument = ScheduledPost & Document;

/**
 * 📅 Schema para posts programados en redes sociales
 * Gestiona la cola de publicaciones con scheduling inteligente
 */
@Schema({ timestamps: true })
export class ScheduledPost {
  // ========================================
  // 🔗 RELACIÓN CON NOTICIA
  // ========================================

  @Prop({ type: Types.ObjectId, ref: 'PublishedNoticia', required: true })
  noticiaId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Site' })
  siteId?: Types.ObjectId; // Opcional para ahora, se agregará en integración con sitios

  // ========================================
  // 🏷️ TIPO DE POST
  // ========================================

  @Prop({
    enum: ['breaking_news', 'normal_news', 'blog', 'evergreen', 'recycled'],
    required: true,
  })
  contentType: string;

  @Prop({ default: false })
  isRecycled: boolean; // Si es un contenido reciclado

  // ========================================
  // 📱 PLATAFORMA Y CONFIGURACIÓN
  // ========================================

  @Prop({ enum: ['facebook', 'twitter', 'instagram'], required: true })
  platform: string;

  @Prop({ type: Types.ObjectId })
  platformConfigId?: Types.ObjectId; // FacebookPublishingConfig o TwitterPublishingConfig

  // ========================================
  // 📝 CONTENIDO DEL POST
  // ========================================

  @Prop({ required: true })
  postContent: string; // Copy final (con URL incluida)

  @Prop()
  originalCopy?: string; // Copy original (antes de actualizar con URL)

  @Prop({ type: Array, default: [] })
  mediaUrls: string[];

  @Prop({ type: Array, default: [] })
  hashtags: string[];

  @Prop({ type: Array, default: [] })
  emojis: string[];

  // ========================================
  // 🎯 OPTIMIZACIÓN
  // ========================================

  @Prop({ type: Object })
  optimizationData?: {
    aiGeneratedEmojis?: string[];
    aiGeneratedHashtags?: string[];
    engagementPrediction?: number;
    optimalPostTime?: Date;
  };

  // ========================================
  // ⏰ SCHEDULING
  // ========================================

  @Prop({ required: true })
  scheduledAt: Date; // Horario programado calculado por scheduler

  @Prop()
  calculatedAt?: Date; // Cuándo se calculó el horario óptimo

  @Prop({ type: String })
  schedulingReason?: string; // Explicación del horario elegido

  @Prop({ type: Object })
  schedulingMetadata?: {
    requestedAt: Date; // Cuándo se solicitó la publicación
    calculationMethod: string; // 'optimal_time' | 'immediate' | 'manual'
    timeWindow: string; // 'peak' | 'moderate' | 'low'
    isOptimalTime: boolean;
    alternativeTimesConsidered: Date[];
  };

  // ========================================
  // 📊 ESTADO Y EJECUCIÓN
  // ========================================

  @Prop({
    enum: ['pending', 'scheduled', 'processing', 'published', 'failed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop()
  publishedAt?: Date; // Cuándo se publicó realmente

  @Prop({ type: String })
  platformPostId?: string; // ID en la plataforma (Facebook post ID o Tweet ID)

  @Prop({ type: String })
  platformPostUrl?: string; // URL del post publicado

  @Prop({ type: String })
  failureReason?: string;

  @Prop({ type: Object })
  publishingAttempts?: {
    count: number;
    lastAttempt?: Date;
    errors?: Array<{
      timestamp: Date;
      error: string;
      httpStatus?: number;
    }>;
  };

  // ========================================
  // 🎯 PRIORIDAD Y ORDEN
  // ========================================

  @Prop({ default: 5 })
  priority: number; // 1-10, donde 10 es máxima prioridad

  /**
   * Breaking news: priority 10 (publicar INMEDIATAMENTE)
   * Normal news: priority 5 (respetar horario óptimo)
   * Blog: priority 3 (puede esperar días)
   * Evergreen: priority 1 (menor prioridad)
   */

  // ========================================
  // 📈 ENGAGEMENT TRACKING
  // ========================================

  @Prop({ type: Object })
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
    clicks?: number;
    impressions?: number;
    reach?: number;
    engagementRate?: number;
    lastUpdated?: Date;
  };

  // ========================================
  // 🔄 RECICLAJE (si aplica)
  // ========================================

  @Prop({ type: Types.ObjectId, ref: 'ContentRecyclingSchedule' })
  recyclingScheduleId?: Types.ObjectId;

  @Prop({ default: 0 })
  recycleNumber?: number; // Número de reciclaje (0 = original, 1+ = reciclado)

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ScheduledPostSchema = SchemaFactory.createForClass(ScheduledPost);

// ========================================
// 📇 ÍNDICES
// ========================================

ScheduledPostSchema.index({ scheduledAt: 1, status: 1 });
ScheduledPostSchema.index({ noticiaId: 1, platform: 1 });
ScheduledPostSchema.index({ siteId: 1, scheduledAt: 1 });
ScheduledPostSchema.index({ status: 1, priority: -1, scheduledAt: 1 });
ScheduledPostSchema.index({ contentType: 1, platform: 1, status: 1 });
