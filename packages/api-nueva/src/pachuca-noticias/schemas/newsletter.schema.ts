import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NewsletterDocument = Newsletter & Document;

/**
 * 📧 Schema para boletines de noticias
 * Gestión de boletines diarios, semanales y temáticos
 */
@Schema({
  timestamps: true,
})
export class Newsletter {
  // ========================================
  // 📝 INFORMACIÓN BÁSICA
  // ========================================

  @Prop({
    required: true,
    enum: ['manana', 'tarde', 'semanal', 'deportes'],
    index: true
  })
  type: 'manana' | 'tarde' | 'semanal' | 'deportes';

  @Prop({ required: true, index: true })
  publishDate: Date; // Fecha de publicación del boletín

  @Prop({ required: true, trim: true })
  subject: string; // Asunto del email

  // ========================================
  // 📄 CONTENIDO
  // ========================================

  @Prop({ type: Object, required: true })
  content: {
    html: string; // HTML del email
    text: string; // Plain text fallback
  };

  // ========================================
  // 🔗 NOTICIAS INCLUIDAS
  // ========================================

  @Prop({ type: [{ type: Types.ObjectId, ref: 'PublishedNoticia' }], default: [] })
  noticias: Types.ObjectId[]; // Referencias a noticias incluidas

  @Prop({ type: [Object], default: [] })
  noticiasSnapshot: Array<{
    id: Types.ObjectId;
    title: string;
    slug: string;
    category: string;
    featuredImage?: string;
  }>; // Snapshot de noticias (por si se borran)

  // ========================================
  // 📊 ESTADÍSTICAS DE ENVÍO
  // ========================================

  @Prop({ type: Object, default: {} })
  stats: {
    sent?: number; // Total de emails enviados
    delivered?: number; // Total entregados exitosamente
    opened?: number; // Total abiertos (tracking pixel)
    clicked?: number; // Total con clicks
    bounced?: number; // Total rebotados
    complained?: number; // Total que marcaron como spam
    unsubscribed?: number; // Total que se dieron de baja
    openRate?: number; // Tasa de apertura (%)
    clickRate?: number; // Tasa de clicks (%)
  };

  // ========================================
  // 🔄 ESTADO & WORKFLOW
  // ========================================

  @Prop({
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
    default: 'draft',
    index: true
  })
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

  @Prop()
  scheduledAt?: Date; // Cuándo se programó el envío

  @Prop()
  sentAt?: Date; // Cuándo se envió realmente

  @Prop({ type: [String], default: [] })
  errors: string[]; // Errores durante el envío

  // ========================================
  // 🎨 METADATA DE GENERACIÓN
  // ========================================

  @Prop({ type: Object })
  generationMetadata?: {
    generatedBy: 'cron' | 'manual' | 'api'; // Cómo se generó
    generatedAt: Date;
    templateVersion: string; // Versión del template usado
    dynamicContent: Record<string, unknown>; // Contenido dinámico inyectado
  };

  // ========================================
  // 🔧 METADATA
  // ========================================

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const NewsletterSchema = SchemaFactory.createForClass(Newsletter);

// ========================================
// 📇 ÍNDICES
// ========================================

NewsletterSchema.index({ type: 1, publishDate: -1 });
NewsletterSchema.index({ status: 1, scheduledAt: 1 });
NewsletterSchema.index({ publishDate: -1 });

// ========================================
// 🪝 MIDDLEWARES
// ========================================

// Pre-save: Actualizar updatedAt
NewsletterSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
