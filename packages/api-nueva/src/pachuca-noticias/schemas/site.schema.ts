import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SiteDocument = Site & Document;

/**
 * 🌐 Schema SIMPLIFICADO para sitios/plataformas multi-tenant
 *
 * ⚠️ PROPÓSITO: Este schema define DÓNDE se publica contenido (destinos de publicación)
 *
 * Sites = Destinos donde publicamos nuestro contenido generado
 * Ejemplos: noticiaspachuca.com, tuzona.noticiaspachuca.com, mitoteo.noticiaspachuca.com
 *
 * IMPORTANTE:
 * - Cada frontend maneja su propio SEO, CDN, branding en su código
 * - Este schema solo indica el destino y las redes sociales asignadas
 * - NO confundir con NewsWebsiteConfig (sitios de extracción/scraping)
 */
@Schema({ timestamps: true })
export class Site {
  // ========================================
  // 🔑 IDENTIFICACIÓN (REQUERIDO)
  // ========================================

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  domain: string; // "noticiaspachuca.com", "tuzona.noticiaspachuca.com"

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string; // "noticiaspachuca", "tuzona", "mitoteo"

  @Prop({ required: true, trim: true })
  name: string; // "Noticias Pachuca", "Tu Zona", "Mitoteo"

  @Prop({ required: true, trim: true, maxlength: 500 })
  description: string;

  // ========================================
  // 📱 REDES SOCIALES (GetLate.dev) - NÚCLEO DEL SCHEMA
  // ========================================

  @Prop({ type: Object, default: {} })
  socialMedia: {
    // Facebook Pages asignadas a este sitio
    facebookPages?: Array<{
      pageId: string; // ✅ FIX: accountId de GetLate (account._id = ObjectId MongoDB)
      pageName: string;
      publishingConfigId?: Types.ObjectId; // Ref a FacebookPublishingConfig
      isActive: boolean;
      priority: number; // Orden de publicación (si hay varias)
    }>;

    // Twitter Accounts asignadas a este sitio
    twitterAccounts?: Array<{
      accountId: string; // ✅ FIX: accountId de GetLate (account._id = ObjectId MongoDB)
      username: string; // @noticiaspachuca
      displayName: string;
      publishingConfigId?: Types.ObjectId; // Ref a TwitterPublishingConfig
      isActive: boolean;
      priority: number;
    }>;

    // GetLate API Key (opcional - puede ser global en env vars)
    getLateApiKey?: string; // Encriptada si es por sitio
  };

  // ========================================
  // ⚙️ STATUS
  // ========================================

  @Prop({ default: true })
  isActive: boolean; // Sitio activo/inactivo

  @Prop({ default: false })
  isMainSite: boolean; // ¿Es el sitio principal?

  // ========================================
  // 📊 ESTADÍSTICAS
  // ========================================

  @Prop({ default: 0 })
  totalNoticias: number;

  @Prop({ default: 0 })
  totalViews: number;

  @Prop({ default: 0 })
  totalSocialPosts: number; // 🔧 NUEVO: Total posts en redes sociales

  // ========================================
  // 🔧 METADATA
  // ========================================

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

// ========================================
// 📇 ÍNDICES
// ========================================

SiteSchema.index({ domain: 1 }, { unique: true });
SiteSchema.index({ slug: 1 }, { unique: true });
SiteSchema.index({ isActive: 1 });
SiteSchema.index({ isMainSite: 1 });
