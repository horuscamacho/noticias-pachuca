import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RapidAPIFacebookPageDocument = RapidAPIFacebookPage & Document;

@Schema({ timestamps: true })
export class RapidAPIFacebookPage {
  @Prop({ required: true, trim: true })
  pageId: string;

  @Prop({ required: true, trim: true })
  pageName: string;

  @Prop({ required: true, trim: true })
  pageUrl: string;

  @Prop({ type: Types.ObjectId, ref: 'RapidAPIConfig', required: true })
  configId: Types.ObjectId;

  @Prop({ type: Object })
  pageDetails: {
    name?: string;
    category?: string;
    followers?: number;
    likes?: number;
    about?: string;
    website?: string;
    location?: string;
    verified?: boolean;
    profilePicture?: string;
    coverPhoto?: string;
    rawData?: Record<string, any>;
  };

  @Prop({ type: Object, required: true })
  extractionConfig: {
    isActive: boolean;
    frequency: 'manual' | 'daily' | 'weekly';
    lastExtraction?: Date;
    nextScheduledExtraction?: Date;
    maxPostsPerExtraction: number;
    extractionFilters: {
      startDate?: Date;
      endDate?: Date;
      includeComments: boolean;
      includeReactions: boolean;
    };
  };

  @Prop({ type: Object, default: {} })
  stats: {
    totalPostsExtracted?: number;
    lastSuccessfulExtraction?: Date;
    extractionErrors?: number;
    avgPostsPerDay?: number;
  };
}

export const RapidAPIFacebookPageSchema = SchemaFactory.createForClass(RapidAPIFacebookPage);