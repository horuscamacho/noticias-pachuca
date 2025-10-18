import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CommunityManagerConfigDocument = CommunityManagerConfig & Document;

/**
 * ⚙️ Schema de configuración global del Community Manager
 * Almacena configuraciones de horarios, frecuencias y estrategias
 */
@Schema({ timestamps: true })
export class CommunityManagerConfig {
  // ========================================
  // 🏷️ IDENTIFICACIÓN
  // ========================================

  @Prop({ required: true, unique: true, default: 'global' })
  configName: string; // Nombre de la configuración (default: 'global')

  @Prop({ default: true })
  isActive: boolean;

  // ========================================
  // ⏰ HORARIOS ÓPTIMOS (Basados en investigación 2026)
  // ========================================

  @Prop({ type: Object, required: true })
  optimalTimes: {
    twitter: {
      peak: Array<{
        day: number[]; // [1,2,3,4] = Lunes-Jueves
        hours: number[]; // [9,10,11,12,13,14] = 9am-2pm
      }>;
      moderate: Array<{
        day: number[];
        hours: number[];
      }>;
      low: Array<{
        day: number[];
        hours: number[];
      }>;
    };
    facebook: {
      peak: Array<{
        day: number[];
        hours: number[];
      }>;
      moderate: Array<{
        day: number[];
        hours: number[];
      }>;
      low: Array<{
        day: number[];
        hours: number[];
      }>;
    };
  };

  // ========================================
  // 📊 FRECUENCIAS DE PUBLICACIÓN
  // ========================================

  @Prop({ type: Object, required: true })
  postingFrequency: {
    twitter: {
      minSpacingHours: number; // 2 horas
      maxPostsPerHour: number; // 3 posts máximo
      maxPostsPerDay: number; // 30 posts máximo
    };
    facebook: {
      minSpacingHours: number; // 3 horas
      maxPostsPerHour: number; // 2 posts máximo
      maxPostsPerDay: number; // 15 posts máximo
    };
  };

  // ========================================
  // 🔄 CONFIGURACIÓN DE RECICLAJE
  // ========================================

  @Prop({ type: Object, required: true })
  recyclingSettings: {
    defaultFrequencyDays: number; // 90 días por defecto
    maxRecyclesPerContent: number; // 3 reciclajes máximo
    minDaysBetweenRecycles: number; // 60 días mínimo
    maxEvergreenPostsPerDay: number; // 2 máximo
    maxEvergreenPostsPerWeek: number; // 5 máximo
    preferredDaysOfWeek: number[]; // [6,0] = Sábado, Domingo
    preferredTimeSlots: string[]; // ['06:00-08:00', '14:00-16:00', '21:00-23:00']
  };

  // ========================================
  // 🚨 REGLAS DE PAUSA (Breaking News)
  // ========================================

  @Prop({ type: Object, required: true })
  breakingNewsRules: {
    pauseEvergreenDuringBreaking: boolean; // true
    breakingNewsWindowHours: number; // 2 horas
    minTimeBetweenBreakingPosts: number; // 30 minutos
  };

  // ========================================
  // 🎯 PRIORIDADES POR TIPO DE CONTENIDO
  // ========================================

  @Prop({ type: Object, required: true })
  contentPriorities: {
    breaking_news: number; // 10
    normal_news: number; // 5
    blog: number; // 3
    evergreen: number; // 1
    recycled: number; // 1
  };

  // ========================================
  // 🌐 CONFIGURACIÓN POR PLATAFORMA
  // ========================================

  @Prop({ type: Object })
  platformSettings?: {
    twitter: {
      maxCharacters: number; // 280
      urlCharacterCount: number; // 23 (t.co)
      maxHashtags: number; // 3
      maxEmojis: number; // 2
    };
    facebook: {
      maxCharacters: number; // 400 (recomendado)
      maxHashtags: number; // 5
      maxEmojis: number; // 3
    };
  };

  // ========================================
  // 📈 CONFIGURACIÓN DE ANALYTICS
  // ========================================

  @Prop({ type: Object })
  analyticsSettings?: {
    trackEngagementEveryHours: number; // 6 horas
    minEngagementRateThreshold: number; // 0.7 (70%)
    enableAutoOptimization: boolean; // true = ajustar horarios según datos reales
  };

  // ========================================
  // 📝 METADATA
  // ========================================

  @Prop()
  lastModifiedBy?: string; // User ID que modificó la config

  @Prop()
  notes?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const CommunityManagerConfigSchema = SchemaFactory.createForClass(CommunityManagerConfig);

// ========================================
// 📇 ÍNDICES
// ========================================

CommunityManagerConfigSchema.index({ configName: 1 }, { unique: true });
CommunityManagerConfigSchema.index({ isActive: 1 });
