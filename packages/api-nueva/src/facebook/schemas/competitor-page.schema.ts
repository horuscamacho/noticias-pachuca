import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 🎯 SCHEMA COMPETITOR PAGE
 * Configuración de páginas de competidores para monitoreo
 */

export type CompetitorPageDocument = CompetitorPage & Document;

@Schema({
  timestamps: true,
  collection: 'competitor_pages',
  versionKey: false
})
export class CompetitorPage {
  @Prop({
    required: true,
    unique: true,
    index: true,
    trim: true
  })
  pageId: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 200
  })
  name: string;

  @Prop({
    required: false,
    trim: true,
    maxlength: 100
  })
  category?: string;

  @Prop({
    default: true,
    index: true
  })
  isActive: boolean;

  @Prop({
    type: String,
    enum: ['hourly', 'daily', 'weekly'],
    default: 'daily'
  })
  monitoringFrequency: 'hourly' | 'daily' | 'weekly';

  @Prop({
    type: Object,
    default: {
      viralEngagementScore: 1000,
      followerGrowthRate: 5.0,
      postFrequencyChange: 50.0,
      engagementDropPercentage: 25.0
    }
  })
  alertThresholds: {
    viralEngagementScore: number;
    followerGrowthRate: number;
    postFrequencyChange: number;
    engagementDropPercentage: number;
  };

  @Prop({
    type: Date,
    index: true
  })
  lastMonitored?: Date;

  @Prop({
    type: Object,
    default: {}
  })
  lastAnalysis?: {
    followers?: number;
    engagement?: {
      totalLikes: number;
      totalComments: number;
      totalShares: number;
      engagementRate: number;
    };
    postsLast30d?: number;
    timestamp?: Date;
  };

  @Prop({
    type: Object,
    default: {}
  })
  metadata?: {
    website?: string;
    about?: string;
    description?: string;
    pictureUrl?: string;
    verificationStatus?: boolean;
    addedBy?: string;
    notes?: string;
  };

  // Timestamps automáticos de Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const CompetitorPageSchema = SchemaFactory.createForClass(CompetitorPage);

// Índices adicionales para optimización
CompetitorPageSchema.index({ isActive: 1, monitoringFrequency: 1 });
CompetitorPageSchema.index({ lastMonitored: 1 });
CompetitorPageSchema.index({ 'lastAnalysis.timestamp': 1 });
CompetitorPageSchema.index({ category: 1, isActive: 1 });

// Middleware pre-save para validaciones
CompetitorPageSchema.pre('save', function(next) {
  // Validar que pageId sea un número válido de Facebook
  if (!/^\d+$/.test(this.pageId)) {
    next(new Error('Invalid Facebook Page ID format'));
  } else {
    next();
  }
});

// Métodos de instancia
CompetitorPageSchema.methods.shouldMonitor = function(): boolean {
  if (!this.isActive) return false;

  const now = new Date();
  if (!this.lastMonitored) return true;

  const hoursSinceLastMonitor = (now.getTime() - this.lastMonitored.getTime()) / (1000 * 60 * 60);

  switch (this.monitoringFrequency) {
    case 'hourly':
      return hoursSinceLastMonitor >= 1;
    case 'daily':
      return hoursSinceLastMonitor >= 24;
    case 'weekly':
      return hoursSinceLastMonitor >= 168; // 24 * 7
    default:
      return false;
  }
};

CompetitorPageSchema.methods.updateLastMonitored = function(): void {
  this.lastMonitored = new Date();
};

// Métodos estáticos
CompetitorPageSchema.statics.findActiveCompetitors = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

CompetitorPageSchema.statics.findCompetitorsToMonitor = function() {
  return this.find({ isActive: true });
};