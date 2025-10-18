import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

/**
 * 🏷️ Schema para categorías de noticias
 * Gestión dinámica de categorías con metadata SEO
 *
 * FASE 0: Agregado soporte multi-sitio
 */
@Schema({
  timestamps: true,
})
export class Category {
  // ========================================
  // 🌐 MULTI-SITIO (FASE 0)
  // ========================================

  @Prop({ type: [Types.ObjectId], ref: 'Site', default: [], index: true })
  sites: Types.ObjectId[]; // Array de sitios donde está disponible esta categoría

  // ========================================
  // 📝 INFORMACIÓN BÁSICA
  // ========================================

  @Prop({ required: true, lowercase: true, trim: true })
  slug: string; // "politica", "deportes", "cultura"
  // ⚠️ FASE 5: Uniqueness ahora se garantiza con índice compuesto { sites: 1, slug: 1 }

  @Prop({ required: true, trim: true })
  name: string; // "Política", "Deportes", "Cultura"

  @Prop({ required: true, trim: true, maxlength: 500 })
  description: string; // Descripción de la categoría

  // ========================================
  // 🎨 PERSONALIZACIÓN UI
  // ========================================

  @Prop({ required: true })
  color: string; // Color hex para UI: "#FF0000"

  @Prop({ required: true })
  icon: string; // Nombre del ícono de Tabler: "IconNews", "IconSoccer"

  @Prop({ default: true })
  isActive: boolean; // Categoría activa/visible

  @Prop({ default: 0 })
  order: number; // Para ordenamiento en UI (menor primero)

  // ========================================
  // 🔍 SEO
  // ========================================

  @Prop({ required: true, trim: true, maxlength: 60 })
  seoTitle: string; // Título SEO (60 chars max)

  @Prop({ required: true, trim: true, maxlength: 160 })
  seoDescription: string; // Meta description (160 chars max)

  @Prop({ trim: true })
  seoKeywords?: string; // Keywords separadas por comas

  // ========================================
  // 📊 ESTADÍSTICAS
  // ========================================

  @Prop({ default: 0 })
  count: number; // Contador de noticias (auto-calculado)

  @Prop({ default: 0 })
  totalViews: number; // Vistas totales de todas las noticias

  @Prop()
  lastPublishedAt?: Date; // Última noticia publicada en esta categoría

  // ========================================
  // 🔧 METADATA
  // ========================================

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// ========================================
// 📇 ÍNDICES
// ========================================

// 🌐 FASE 5: Índice único compuesto (misma categoría puede existir en diferentes sitios)
CategorySchema.index({ sites: 1, slug: 1 }, { unique: true });

// Índices para multi-sitio (FASE 0)
CategorySchema.index({ sites: 1 });
CategorySchema.index({ sites: 1, isActive: 1, order: 1 });

CategorySchema.index({ isActive: 1, order: 1 });
CategorySchema.index({ order: 1 });

// ========================================
// 🪝 MIDDLEWARES
// ========================================

// Pre-save: Actualizar updatedAt
CategorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save: Validar slug
CategorySchema.pre('save', function(next) {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(this.slug)) {
    next(new Error('Slug debe ser URL-friendly (lowercase, guiones, sin espacios)'));
    return;
  }
  next();
});
