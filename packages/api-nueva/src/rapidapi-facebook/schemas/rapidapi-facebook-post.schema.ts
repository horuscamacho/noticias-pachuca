import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RapidAPIFacebookPostDocument = RapidAPIFacebookPost & Document;

@Schema({ timestamps: true })
export class RapidAPIFacebookPost {
  @Prop({ required: true, trim: true })
  pageId: string;

  @Prop({ required: true, trim: true })
  facebookPostId: string;

  @Prop({ required: true, trim: true })
  postUrl: string;

  @Prop({ type: Object, required: true })
  content: {
    text?: string;
    type: 'text' | 'photo' | 'video' | 'link' | 'event';
    images?: string[];
    videos?: string[];
    links?: string[];
    hashtags?: string[];
    mentions?: string[];
  };

  @Prop({ required: true })
  publishedAt: Date;

  @Prop({ required: true })
  extractedAt: Date;

  @Prop({ type: Object, default: {} })
  engagement: {
    likes?: number;
    comments?: number;
    shares?: number;
    reactions?: {
      love?: number;
      wow?: number;
      haha?: number;
      sad?: number;
      angry?: number;
    };
  };

  @Prop({ type: [Object], default: [] })
  comments: Array<{
    commentId: string;
    text: string;
    author: string;
    publishedAt: Date;
    likes: number;
    replies: number;
  }>;

  @Prop({ enum: ['raw', 'processed', 'error'], default: 'raw' })
  processingStatus: 'raw' | 'processed' | 'error';

  @Prop({ type: Object })
  rawData: Record<string, any>;
}

export const RapidAPIFacebookPostSchema = SchemaFactory.createForClass(RapidAPIFacebookPost);