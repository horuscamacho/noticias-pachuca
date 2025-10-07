import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContactMessageDocument = ContactMessage & Document;

/**
 * 💬 Schema para mensajes de contacto
 * Almacena mensajes enviados desde el formulario de contacto
 */
@Schema({
  timestamps: true,
})
export class ContactMessage {
  // ========================================
  // 📝 INFORMACIÓN DEL REMITENTE
  // ========================================

  @Prop({ required: true, trim: true })
  name: string; // Nombre del remitente

  @Prop({ required: true, lowercase: true, trim: true, index: true })
  email: string; // Email del remitente

  @Prop({ required: true, trim: true })
  subject: string; // Asunto del mensaje

  @Prop({ required: true })
  message: string; // Cuerpo del mensaje

  // ========================================
  // 🔄 ESTADO & WORKFLOW
  // ========================================

  @Prop({
    enum: ['pending', 'read', 'replied', 'archived', 'spam'],
    default: 'pending',
    index: true
  })
  status: 'pending' | 'read' | 'replied' | 'archived' | 'spam';

  @Prop()
  readAt?: Date; // Cuándo se leyó

  @Prop()
  repliedAt?: Date; // Cuándo se respondió

  @Prop({ trim: true })
  replyMessage?: string; // Respuesta enviada (si aplica)

  @Prop({ trim: true })
  notes?: string; // Notas internas

  // ========================================
  // 🌐 METADATA DE ORIGEN
  // ========================================

  @Prop({ type: Object })
  metadata: {
    ipAddress?: string; // IP del remitente (anonimizada)
    userAgent?: string; // User agent
    referrer?: string; // URL de referencia
    country?: string; // País detectado
    language?: string; // Idioma del navegador
  };

  // ========================================
  // 🔒 ANTI-SPAM
  // ========================================

  @Prop({ default: false })
  isSpam: boolean; // Marcado como spam

  @Prop()
  spamScore?: number; // Score de spam (0-100)

  @Prop({ type: [String], default: [] })
  spamReasons: string[]; // Razones de spam detection

  // ========================================
  // 📊 TRACKING
  // ========================================

  @Prop({ default: 1 })
  attemptCount: number; // Número de intentos de envío

  @Prop({ type: [String], default: [] })
  errors: string[]; // Errores al procesar

  // ========================================
  // 🔧 METADATA
  // ========================================

  @Prop({ default: Date.now, index: true })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ContactMessageSchema = SchemaFactory.createForClass(ContactMessage);

// ========================================
// 📇 ÍNDICES
// ========================================

ContactMessageSchema.index({ email: 1, createdAt: -1 });
ContactMessageSchema.index({ status: 1, createdAt: -1 });
ContactMessageSchema.index({ isSpam: 1 });
ContactMessageSchema.index({ createdAt: -1 });

// ========================================
// 🪝 MIDDLEWARES
// ========================================

// Pre-save: Actualizar updatedAt
ContactMessageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
