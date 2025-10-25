import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserGeneratedContentDocument = UserGeneratedContent & Document;

/**
 * 📝 Schema para contenido generado manualmente por usuarios
 * Permite crear contenido original en modo URGENT (breaking news) o NORMAL
 * Sistema de noticias de última hora con auto-cierre después de 2 horas
 */
@Schema({ timestamps: true })
export class UserGeneratedContent {
  // ========================================
  // 📄 CONTENIDO ORIGINAL (INPUT DEL USUARIO)
  // ========================================

  @Prop({ required: true, trim: true })
  originalTitle: string; // Título original proporcionado por usuario

  @Prop({ required: true })
  originalContent: string; // Contenido original proporcionado por usuario

  @Prop({ type: [String], default: [] })
  uploadedImageUrls: string[]; // URLs de imágenes subidas por el usuario

  @Prop({ type: [String], default: [] })
  uploadedVideoUrls: string[]; // URLs de videos subidos por el usuario

  // ========================================
  // 🎯 MODO DE PUBLICACIÓN
  // ========================================

  @Prop({
    required: true,
    type: String,
    enum: ['urgent', 'normal'],
    index: true,
  })
  mode: 'urgent' | 'normal'; // Modo de publicación

  @Prop({
    type: String,
    enum: ['breaking', 'noticia', 'blog'],
  })
  publicationType?: 'breaking' | 'noticia' | 'blog'; // Tipo de publicación (solo para mode='normal')

  // ========================================
  // 🚨 GESTIÓN DE CONTENIDO URGENT
  // ========================================

  @Prop({ default: false, index: true })
  isUrgent: boolean; // Flag rápido para queries (denormalizado de mode)

  @Prop({ type: Date })
  urgentCreatedAt?: Date; // Timestamp cuando se creó el contenido urgent

  @Prop({ type: Date, index: true })
  urgentAutoCloseAt?: Date; // urgentCreatedAt + 2 horas (para cron job)

  @Prop({ default: false })
  urgentClosed: boolean; // Flag que indica si el contenido urgent fue cerrado

  @Prop({ type: Date })
  urgentClosedAt?: Date; // Timestamp cuando se cerró

  @Prop({
    type: String,
    enum: ['user', 'system'],
  })
  urgentClosedBy?: 'user' | 'system'; // Quién cerró el contenido (usuario o cron job)

  // ========================================
  // 🔗 RELACIONES CON CONTENIDO GENERADO
  // ========================================

  @Prop({ type: Types.ObjectId, ref: 'ContentAgent', required: true })
  agentId: Types.ObjectId; // Agente editorial que genera el contenido

  @Prop({ type: Types.ObjectId, ref: 'AIContentGeneration' })
  generatedContentId?: Types.ObjectId; // Referencia al contenido generado por IA

  @Prop({ type: Types.ObjectId, ref: 'PublishedNoticia' })
  publishedNoticiaId?: Types.ObjectId; // Referencia a la noticia publicada

  // ========================================
  // 👤 METADATA DEL USUARIO
  // ========================================

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId; // Usuario que creó el contenido

  @Prop({
    required: true,
    type: String,
    enum: ['draft', 'processing', 'published', 'closed', 'failed'],
    default: 'draft',
    index: true,
  })
  status: 'draft' | 'processing' | 'published' | 'closed' | 'failed'; // Estado del contenido

  // ========================================
  // 📊 METADATA ADICIONAL
  // ========================================

  @Prop({ type: Object })
  processingMetadata?: {
    startedAt?: Date; // Cuando comenzó el procesamiento con IA
    completedAt?: Date; // Cuando terminó el procesamiento
    processingTime?: number; // Tiempo de procesamiento en ms
    retries?: number; // Número de reintentos
    errors?: string[]; // Errores durante el procesamiento
  };

  @Prop({ type: Object })
  urgentMetrics?: {
    viewsDuringActive?: number; // Visualizaciones mientras estuvo activo
    updatesCount?: number; // Número de actualizaciones recibidas
    timeActive?: number; // Tiempo que estuvo activo en ms
    closureReason?: string; // Razón del cierre (timeout | manual | updated)
  };

  // Timestamps automáticos
  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const UserGeneratedContentSchema = SchemaFactory.createForClass(UserGeneratedContent);

// ========================================
// 📇 ÍNDICES PARA PERFORMANCE
// ========================================

// Índice compuesto para queries de contenido urgent activo (usado por cron job)
UserGeneratedContentSchema.index({
  isUrgent: 1,
  urgentClosed: 1,
  urgentAutoCloseAt: 1,
  status: 1,
});

// Índice para queries por usuario
UserGeneratedContentSchema.index({ createdBy: 1, createdAt: -1 });

// Índice para queries por modo y estado
UserGeneratedContentSchema.index({ mode: 1, status: 1, createdAt: -1 });

// Índice para el cron job de auto-cierre (query específico en FASE 4)
UserGeneratedContentSchema.index({
  isUrgent: 1,
  urgentClosed: 1,
  urgentAutoCloseAt: 1,
});
