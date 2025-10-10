import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ContentAgentDocument = HydratedDocument<ContentAgent>;

/**
 * 👤 Schema para Content Agents - Perfiles Editoriales
 * Sistema de agentes con personalidades únicas para generación de contenido
 */
@Schema({ timestamps: true })
export class ContentAgent {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({
    required: true,
    type: String,
    enum: ['reportero', 'columnista', 'trascendido', 'seo-specialist'],
  })
  agentType: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, trim: true, minlength: 50 })
  personality: string;

  @Prop({ required: true, type: [String] })
  specializations: string[];

  @Prop({
    required: true,
    type: String,
    enum: [
      'conservative',
      'progressive',
      'neutral',
      'humor',
      'critical',
      'analytical',
    ],
  })
  editorialLean: string;

  @Prop({ required: true, type: Object })
  writingStyle: {
    tone: 'formal' | 'informal' | 'humor' | 'academic' | 'conversational';
    vocabulary: 'simple' | 'intermediate' | 'advanced' | 'technical';
    length: 'short' | 'medium' | 'long' | 'variable';
    structure: 'linear' | 'narrative' | 'analytical' | 'opinion';
    audience: 'general' | 'specialized' | 'academic' | 'youth' | 'senior';
  };

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'PromptTemplate' }],
    default: [],
  })
  defaultTemplates?: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object, default: {} })
  configuration?: {
    maxArticlesPerDay?: number;
    preferredProviders?: string[];
    qualityThreshold?: number;
    autoPublish?: boolean;
    priority?: number;
  };

  @Prop({ type: Object, default: {} })
  performanceMetrics?: {
    totalArticles?: number;
    averageQuality?: number;
    averageTime?: number;
    successRate?: number;
    userRatings?: number;
    lastActive?: Date;
  };

  @Prop({ type: Object, default: {} })
  constraints?: {
    bannedTopics?: string[];
    requiredKeywords?: string[];
    maxWordCount?: number;
    minWordCount?: number;
    contentGuidelines?: string[];
  };

  @Prop({ type: [String], default: [] })
  sampleOutputs: string[];

  @Prop({ type: Object, default: {} })
  workflow?: {
    requiresFactCheck?: boolean;
    requiresHumanReview?: boolean;
    autoCategories?: boolean;
    generateSEO?: boolean;
    steps?: string[];
  };

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ContentAgentSchema = SchemaFactory.createForClass(ContentAgent);

// 🔍 ÍNDICES PARA PERFORMANCE
ContentAgentSchema.index({ name: 1 });
ContentAgentSchema.index({ agentType: 1 });
ContentAgentSchema.index({ isActive: 1 });
ContentAgentSchema.index({ editorialLean: 1 });
ContentAgentSchema.index({ specializations: 1 });
ContentAgentSchema.index({ 'performanceMetrics.averageQuality': -1 });

// Índices compuestos para queries complejas
ContentAgentSchema.index({ agentType: 1, isActive: 1 });
ContentAgentSchema.index({ editorialLean: 1, agentType: 1, isActive: 1 });
