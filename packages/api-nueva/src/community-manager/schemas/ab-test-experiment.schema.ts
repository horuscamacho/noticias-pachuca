import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * 🧪 A/B Test Experiment Schema
 *
 * FASE 9: A/B Testing
 *
 * Schema para experimentos A/B de contenido en redes sociales
 */

export type ABTestExperimentDocument = ABTestExperiment & Document;

/**
 * Variante de un experimento A/B
 */
@Schema({ _id: false })
export class ABTestVariant {
  @Prop({ required: true })
  variantId: string; // 'A', 'B', 'C', etc.

  @Prop({ required: true })
  variantName: string;

  @Prop({ required: true })
  postContent: string;

  @Prop({ type: Types.ObjectId, ref: 'ScheduledPost' })
  scheduledPostId?: Types.ObjectId;

  @Prop({ default: 0 })
  totalEngagement: number;

  @Prop({ default: 0 })
  totalReach: number;

  @Prop({ default: 0 })
  engagementRate: number;

  @Prop({ default: 0 })
  clicks: number;

  @Prop({ default: 0 })
  conversions: number;
}

export const ABTestVariantSchema = SchemaFactory.createForClass(ABTestVariant);

/**
 * Resultados de un experimento A/B
 */
@Schema({ _id: false })
export class ABTestResults {
  @Prop({ required: true })
  winnerVariantId: string;

  @Prop({ required: true })
  confidenceLevel: number; // 0-100%

  @Prop({ required: true })
  improvementPercentage: number;

  @Prop({ type: [String] })
  insights: string[];

  @Prop()
  completedAt: Date;
}

export const ABTestResultsSchema = SchemaFactory.createForClass(ABTestResults);

@Schema({ collection: 'ab_test_experiments', timestamps: true })
export class ABTestExperiment {
  _id: Types.ObjectId;

  @Prop({ required: true })
  experimentName: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'PublishedNoticia' })
  noticiaId: Types.ObjectId;

  @Prop({ required: true, enum: ['facebook', 'twitter'] })
  platform: 'facebook' | 'twitter';

  @Prop({ required: true, enum: ['copy', 'timing', 'hashtags', 'media'] })
  testType: 'copy' | 'timing' | 'hashtags' | 'media';

  @Prop({ type: [ABTestVariantSchema], required: true })
  variants: ABTestVariant[];

  @Prop({
    required: true,
    enum: ['draft', 'running', 'completed', 'cancelled'],
    default: 'draft',
  })
  status: 'draft' | 'running' | 'completed' | 'cancelled';

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: ABTestResultsSchema })
  results?: ABTestResults;

  @Prop({ default: 95 })
  requiredConfidence: number; // % mínimo para declarar ganador

  @Prop({ default: 100 })
  minimumSampleSize: number; // Alcance mínimo para validez estadística

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ABTestExperimentSchema =
  SchemaFactory.createForClass(ABTestExperiment);

// Índices para búsquedas eficientes
ABTestExperimentSchema.index({ noticiaId: 1 });
ABTestExperimentSchema.index({ platform: 1, status: 1 });
ABTestExperimentSchema.index({ startDate: 1, endDate: 1 });
ABTestExperimentSchema.index({ status: 1, endDate: 1 });
