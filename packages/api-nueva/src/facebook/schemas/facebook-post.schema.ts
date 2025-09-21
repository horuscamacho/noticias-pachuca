import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 🎯 SCHEMA FACEBOOK POST
 * Almacenamiento de posts monitoreados de Facebook
 */

export type FacebookPostDocument = FacebookPost & Document;

@Schema({
  timestamps: true,
  collection: 'facebook_posts',
  versionKey: false
})
export class FacebookPost {
  @Prop({
    required: true,
    unique: true,
    index: true,
    trim: true
  })
  postId: string;

  @Prop({
    required: true,
    index: true,
    trim: true
  })
  pageId: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 200
  })
  pageName: string;

  @Prop({
    required: true,
    type: Date,
    index: true
  })
  publishedAt: Date;

  @Prop({
    type: String,
    enum: ['status', 'photo', 'video', 'link', 'event', 'offer'],
    default: 'status',
    index: true
  })
  postType: 'status' | 'photo' | 'video' | 'link' | 'event' | 'offer';

  @Prop({
    type: String,
    maxlength: 10000,
    default: ''
  })
  content: string;

  @Prop({
    type: String,
    maxlength: 500,
    default: ''
  })
  story?: string;

  @Prop({
    type: Object,
    required: true,
    default: {
      likes: 0,
      comments: 0,
      shares: 0,
      reactions: 0,
      engagementRate: 0
    }
  })
  engagementData: {
    likes: number;
    comments: number;
    shares: number;
    reactions: number;
    engagementRate: number;
    reach?: number;
    impressions?: number;
  };

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    index: true
  })
  viralScore: number;

  @Prop({
    type: String,
    enum: ['viral', 'high', 'average', 'low'],
    default: 'average',
    index: true
  })
  performanceLevel: 'viral' | 'high' | 'average' | 'low';

  @Prop({
    default: false,
    index: true
  })
  isViralContent: boolean;

  @Prop({
    type: Date,
    index: true
  })
  detectedAsViralAt?: Date;

  @Prop({
    type: [String],
    default: []
  })
  hashtags: string[];

  @Prop({
    type: [String],
    default: []
  })
  mentions: string[];

  @Prop({
    type: Object,
    default: {}
  })
  attachments?: {
    type: string;
    url?: string;
    description?: string;
    media?: {
      imageUrl?: string;
      videoUrl?: string;
    };
  }[];

  @Prop({
    type: Object,
    default: {}
  })
  analytics?: {
    shareVelocity?: number; // Shares per hour
    commentSentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
    topComments?: string[];
    hourlyEngagement?: Array<{
      hour: number;
      engagement: number;
    }>;
  };

  @Prop({
    type: Object,
    default: {}
  })
  monitoring?: {
    alertSent?: boolean;
    alertSentAt?: Date;
    monitoringEnabled?: boolean;
    lastAnalyzed?: Date;
  };

  @Prop({
    type: Object,
    default: {}
  })
  metadata?: {
    permalink?: string;
    sourceType?: string;
    link?: string;
    linkDescription?: string;
    linkCaption?: string;
    location?: {
      name: string;
      id: string;
    };
  };

  // Timestamps automáticos de Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const FacebookPostSchema = SchemaFactory.createForClass(FacebookPost);

// Índices compuestos para consultas optimizadas
FacebookPostSchema.index({ pageId: 1, publishedAt: -1 });
FacebookPostSchema.index({ pageId: 1, postType: 1, publishedAt: -1 });
FacebookPostSchema.index({ pageId: 1, viralScore: -1 });
FacebookPostSchema.index({ pageId: 1, performanceLevel: 1 });
FacebookPostSchema.index({ isViralContent: 1, detectedAsViralAt: -1 });
FacebookPostSchema.index({ publishedAt: 1, viralScore: -1 });
FacebookPostSchema.index({ 'engagementData.engagementRate': -1 });

// Índices de texto para búsqueda
FacebookPostSchema.index({
  content: 'text',
  pageName: 'text',
  hashtags: 'text'
});

// Middleware pre-save para cálculos automáticos
FacebookPostSchema.pre('save', function(next) {
  // Calcular viral score basado en engagement
  const totalEngagement =
    this.engagementData.likes +
    this.engagementData.comments +
    this.engagementData.shares;

  // Score básico basado en engagement total
  let score = Math.min(totalEngagement / 100, 100); // Max 100

  // Bonus por shares (más peso)
  score += (this.engagementData.shares * 2);

  // Bonus por comments (indica engagement real)
  score += (this.engagementData.comments * 1.5);

  // Normalizarlo entre 0-100
  this.viralScore = Math.min(Math.round(score), 100);

  // Determinar nivel de performance
  if (this.viralScore >= 80) {
    this.performanceLevel = 'viral';
    this.isViralContent = true;
    if (!this.detectedAsViralAt) {
      this.detectedAsViralAt = new Date();
    }
  } else if (this.viralScore >= 60) {
    this.performanceLevel = 'high';
  } else if (this.viralScore >= 30) {
    this.performanceLevel = 'average';
  } else {
    this.performanceLevel = 'low';
  }

  // Extraer hashtags del contenido
  if (this.content) {
    const hashtagMatch = this.content.match(/#[\w\u00c0-\u024f\u1e00-\u1eff]+/gi);
    this.hashtags = hashtagMatch ? hashtagMatch.map(tag => tag.toLowerCase()) : [];
  }

  // Extraer mentions del contenido
  if (this.content) {
    const mentionMatch = this.content.match(/@[\w\u00c0-\u024f\u1e00-\u1eff]+/gi);
    this.mentions = mentionMatch ? mentionMatch.map(mention => mention.toLowerCase()) : [];
  }

  next();
});

// Métodos de instancia
FacebookPostSchema.methods.isViral = function(): boolean {
  return this.isViralContent || this.viralScore >= 80;
};

FacebookPostSchema.methods.calculateEngagementRate = function(followerCount: number): number {
  const totalEngagement =
    this.engagementData.likes +
    this.engagementData.comments +
    this.engagementData.shares;

  return followerCount > 0 ? (totalEngagement / followerCount) * 100 : 0;
};

FacebookPostSchema.methods.getEngagementVelocity = function(): number {
  const hoursSincePublished = (new Date().getTime() - this.publishedAt.getTime()) / (1000 * 60 * 60);
  const totalEngagement =
    this.engagementData.likes +
    this.engagementData.comments +
    this.engagementData.shares;

  return hoursSincePublished > 0 ? totalEngagement / hoursSincePublished : 0;
};

// Métodos estáticos
FacebookPostSchema.statics.findViralContent = function(pageId?: string) {
  const query = { isViralContent: true };
  if (pageId) query['pageId'] = pageId;

  return this.find(query)
    .sort({ detectedAsViralAt: -1 })
    .limit(50);
};

FacebookPostSchema.statics.findTopPerforming = function(pageId: string, limit = 10) {
  return this.find({ pageId })
    .sort({ viralScore: -1, publishedAt: -1 })
    .limit(limit);
};

FacebookPostSchema.statics.getEngagementStats = function(pageId: string, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        pageId: pageId,
        publishedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        avgLikes: { $avg: '$engagementData.likes' },
        avgComments: { $avg: '$engagementData.comments' },
        avgShares: { $avg: '$engagementData.shares' },
        avgViralScore: { $avg: '$viralScore' },
        viralPosts: {
          $sum: { $cond: ['$isViralContent', 1, 0] }
        }
      }
    }
  ]);
};