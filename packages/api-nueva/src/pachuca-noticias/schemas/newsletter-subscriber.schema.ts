import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomBytes } from 'crypto';

export type NewsletterSubscriberDocument = NewsletterSubscriber & Document;

/**
 * 👤 Schema para suscriptores de boletines
 * Gestión de preferencias y estado de suscripción
 */
@Schema({
  timestamps: true,
})
export class NewsletterSubscriber {
  // ========================================
  // 📝 INFORMACIÓN BÁSICA
  // ========================================

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string; // Email del suscriptor

  @Prop({ trim: true })
  name?: string; // Nombre opcional

  // ========================================
  // ⚙️ PREFERENCIAS DE SUSCRIPCIÓN
  // ========================================

  @Prop({ type: Object, required: true })
  preferences: {
    manana: boolean; // Boletín de la mañana (6:00 AM)
    tarde: boolean; // Boletín de la tarde (6:00 PM)
    semanal: boolean; // Resumen semanal (Domingo 8:00 AM)
    deportes: boolean; // Deportes (condicional)
  };

  // ========================================
  // 🔄 ESTADO DE SUSCRIPCIÓN
  // ========================================

  @Prop({ default: true })
  isActive: boolean; // Activo/Desactivado

  @Prop({ default: false })
  isConfirmed: boolean; // Email confirmado (double opt-in)

  @Prop()
  confirmedAt?: Date; // Cuándo confirmó

  @Prop({ default: Date.now })
  subscribedAt: Date; // Cuándo se suscribió

  @Prop()
  unsubscribedAt?: Date; // Cuándo se dio de baja

  @Prop({ trim: true })
  unsubscribeReason?: string; // Razón de baja (opcional)

  // ========================================
  // 🔑 TOKENS DE SEGURIDAD
  // ========================================

  @Prop({ required: true, unique: true })
  unsubscribeToken: string; // Token único para darse de baja

  @Prop()
  confirmationToken?: string; // Token para confirmar email (double opt-in)

  @Prop()
  confirmationTokenExpires?: Date; // Expiración del token (24h)

  // ========================================
  // 📊 ESTADÍSTICAS DE ENGAGEMENT
  // ========================================

  @Prop({ type: Object, default: {} })
  stats: {
    emailsSent?: number; // Total de emails enviados
    emailsOpened?: number; // Total abiertos
    emailsClicked?: number; // Total con clicks
    lastEmailSentAt?: Date; // Último email enviado
    lastEmailOpenedAt?: Date; // Último email abierto
    lastEmailClickedAt?: Date; // Último click
    avgOpenRate?: number; // Tasa promedio de apertura
    avgClickRate?: number; // Tasa promedio de clicks
  };

  // ========================================
  // 🌐 METADATA DE ORIGEN
  // ========================================

  @Prop({ type: Object })
  metadata: {
    source?: string; // De dónde se suscribió: 'footer' | 'popup' | 'article' | 'api'
    referrer?: string; // URL de referencia
    userAgent?: string; // User agent del navegador
    ipAddress?: string; // IP de suscripción (anonimizada)
    country?: string; // País de origen
  };

  // ========================================
  // 🔧 METADATA
  // ========================================

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const NewsletterSubscriberSchema = SchemaFactory.createForClass(NewsletterSubscriber);

// ========================================
// 📇 ÍNDICES
// ========================================

NewsletterSubscriberSchema.index({ email: 1 }, { unique: true });
NewsletterSubscriberSchema.index({ isActive: 1, isConfirmed: 1 });
NewsletterSubscriberSchema.index({ unsubscribeToken: 1 }, { unique: true });
NewsletterSubscriberSchema.index({ confirmationToken: 1 });

// ========================================
// 🪝 MIDDLEWARES
// ========================================

// Pre-save: Actualizar updatedAt
NewsletterSubscriberSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save: Generar unsubscribeToken si no existe
NewsletterSubscriberSchema.pre('save', function(next) {
  if (!this.unsubscribeToken) {
    this.unsubscribeToken = randomBytes(32).toString('hex');
  }
  next();
});

// Pre-save: Generar confirmationToken si no existe y no está confirmado
NewsletterSubscriberSchema.pre('save', function(next) {
  if (!this.isConfirmed && !this.confirmationToken) {
    this.confirmationToken = randomBytes(32).toString('hex');
    this.confirmationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
  }
  next();
});
