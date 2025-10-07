import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RapidAPITwitterUserDocument = RapidAPITwitterUser & Document;

@Schema({ timestamps: true })
export class RapidAPITwitterUser {
  @Prop({ required: true, trim: true, unique: true })
  userId: string; // rest_id "2455740283"

  @Prop({ required: true, trim: true })
  username: string; // screen_name "MrBeast"

  @Prop({ required: true, trim: true })
  displayName: string; // core.name "MrBeast"

  @Prop({ required: true, trim: true })
  userUrl: string; // "https://twitter.com/MrBeast"

  @Prop({ type: Types.ObjectId, ref: 'RapidAPITwitterConfig', required: true })
  configId: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  userDetails: {
    bio?: string;
    followers?: number;
    following?: number;
    tweetsCount?: number;
    verified?: boolean;
    isBlueVerified?: boolean;
    profilePicture?: string;
    location?: string;
    website?: string;
    rawData?: Record<string, unknown>;
  };

  @Prop({ type: Object, default: { isActive: false, frequency: 'manual', maxPostsPerExtraction: 20 } })
  extractionConfig: {
    isActive: boolean;
    frequency: 'manual' | 'daily' | 'weekly';
    maxPostsPerExtraction: number;
    extractionFilters: {
      includeReplies?: boolean;
      includeRetweets?: boolean;
    };
  };

  @Prop({ type: Object, default: {} })
  stats: {
    lastSuccessfulExtraction?: Date;
    totalPostsExtracted?: number;
    lastError?: string;
  };

  @Prop({ enum: ['active', 'paused', 'error'], default: 'active' })
  status: string;
}

export const RapidAPITwitterUserSchema = SchemaFactory.createForClass(RapidAPITwitterUser);

// Index for performance
RapidAPITwitterUserSchema.index({ userId: 1 });
RapidAPITwitterUserSchema.index({ username: 1 });
RapidAPITwitterUserSchema.index({ configId: 1 });