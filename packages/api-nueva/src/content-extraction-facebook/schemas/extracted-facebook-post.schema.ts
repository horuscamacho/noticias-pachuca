import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExtractedFacebookPostDocument = ExtractedFacebookPost & Document;

export interface FacebookPostMetrics {
  likes: number;
  shares: number;
  comments: number;
  reactions: Record<string, number>;
}

export interface FacebookMediaItem {
  type: 'photo' | 'video' | 'link';
  url: string;
  description?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

@Schema({
  timestamps: true,
  collection: 'extracted_facebook_posts'
})
export class ExtractedFacebookPost {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  })
  facebookPostId: string;

  @Prop({
    type: String,
    required: true,
    index: true,
    trim: true
  })
  pageId: string;

  @Prop({
    type: String,
    required: true,
    maxlength: 10000
  })
  content: string;

  @Prop({
    type: Date,
    required: true,
    index: true
  })
  createdTime: Date;

  @Prop({
    type: Date,
    required: true,
    default: Date.now,
    index: true
  })
  extractedAt: Date;

  @Prop({
    type: {
      likes: {
        type: Number,
        required: true,
        default: 0,
        min: 0
      },
      shares: {
        type: Number,
        required: true,
        default: 0,
        min: 0
      },
      comments: {
        type: Number,
        required: true,
        default: 0,
        min: 0
      },
      reactions: {
        type: Object,
        default: {}
      }
    },
    required: true,
    _id: false
  })
  metrics: FacebookPostMetrics;

  @Prop({
    type: [{
      type: {
        type: String,
        required: true,
        enum: ['photo', 'video', 'link']
      },
      url: {
        type: String,
        required: true
      },
      description: {
        type: String,
        maxlength: 500
      },
      thumbnailUrl: {
        type: String
      },
      width: {
        type: Number,
        min: 0
      },
      height: {
        type: Number,
        min: 0
      }
    }],
    default: []
  })
  media: FacebookMediaItem[];

  @Prop({
    type: [String],
    default: [],
    index: true
  })
  hashtags: string[];

  @Prop({
    type: [String],
    default: []
  })
  mentions: string[];

  @Prop({
    type: Boolean,
    required: true,
    default: true,
    index: true
  })
  isActive: boolean;

  @Prop({
    type: String,
    trim: true,
    maxlength: 500
  })
  postType: string;

  @Prop({
    type: String,
    trim: true,
    maxlength: 2000
  })
  link: string;

  @Prop({
    type: Number,
    default: 0,
    min: 0
  })
  engagementScore: number;

  createdAt: Date;
  updatedAt: Date;
}

export const ExtractedFacebookPostSchema = SchemaFactory.createForClass(ExtractedFacebookPost);

// Índices para optimización
ExtractedFacebookPostSchema.index({ facebookPostId: 1 }, { unique: true });
ExtractedFacebookPostSchema.index({ pageId: 1, createdTime: -1 });
ExtractedFacebookPostSchema.index({ pageId: 1, extractedAt: -1 });
ExtractedFacebookPostSchema.index({ hashtags: 1 });
ExtractedFacebookPostSchema.index({ isActive: 1, createdTime: -1 });
ExtractedFacebookPostSchema.index({ engagementScore: -1 });
ExtractedFacebookPostSchema.index({ createdAt: -1 });

// Índice compuesto para búsquedas frecuentes
ExtractedFacebookPostSchema.index({ pageId: 1, isActive: 1, createdTime: -1 });

// TTL index para posts antiguos (opcional, después de 1 año)
// ExtractedFacebookPostSchema.index({ createdTime: 1 }, { expireAfterSeconds: 31536000 }); // 1 año

// Métodos de instancia
ExtractedFacebookPostSchema.methods.calculateEngagementScore = function(): number {
  const { likes, shares, comments } = this.metrics;

  // Fórmula simple de engagement: likes + (shares * 2) + (comments * 3)
  const score = likes + (shares * 2) + (comments * 3);
  this.engagementScore = score;

  return score;
};

ExtractedFacebookPostSchema.methods.extractHashtags = function(): string[] {
  const hashtags: string[] = [];
  const regex = /#(\w+)/g;
  let match;

  while ((match = regex.exec(this.content)) !== null) {
    hashtags.push(match[1].toLowerCase());
  }

  this.hashtags = [...new Set(hashtags)]; // Remover duplicados
  return this.hashtags;
};

ExtractedFacebookPostSchema.methods.extractMentions = function(): string[] {
  const mentions: string[] = [];
  const regex = /@(\w+)/g;
  let match;

  while ((match = regex.exec(this.content)) !== null) {
    mentions.push(match[1].toLowerCase());
  }

  this.mentions = [...new Set(mentions)]; // Remover duplicados
  return this.mentions;
};

ExtractedFacebookPostSchema.methods.hasMedia = function(): boolean {
  return this.media && this.media.length > 0;
};

ExtractedFacebookPostSchema.methods.getTotalEngagement = function(): number {
  const { likes, shares, comments } = this.metrics;
  return likes + shares + comments;
};

// Pre-save middleware para calcular engagement y extraer hashtags/mentions
ExtractedFacebookPostSchema.pre('save', function(next) {
  // Calcular engagement score
  const { likes, shares, comments } = this.metrics;
  this.engagementScore = likes + (shares * 2) + (comments * 3);

  // Extraer hashtags
  const hashtags: string[] = [];
  const hashtagRegex = /#(\w+)/g;
  let hashtagMatch;
  while ((hashtagMatch = hashtagRegex.exec(this.content)) !== null) {
    hashtags.push(hashtagMatch[1].toLowerCase());
  }
  this.hashtags = [...new Set(hashtags)];

  // Extraer mentions
  const mentions: string[] = [];
  const mentionRegex = /@(\w+)/g;
  let mentionMatch;
  while ((mentionMatch = mentionRegex.exec(this.content)) !== null) {
    mentions.push(mentionMatch[1].toLowerCase());
  }
  this.mentions = [...new Set(mentions)];

  next();
});