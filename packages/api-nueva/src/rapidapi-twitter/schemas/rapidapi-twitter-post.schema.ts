import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RapidAPITwitterPostDocument = RapidAPITwitterPost & Document;

@Schema({ timestamps: true })
export class RapidAPITwitterPost {
  @Prop({ required: true, trim: true, unique: true })
  tweetId: string; // rest_id from Twitter API

  @Prop({ required: true, trim: true })
  userId: string; // Reference to Twitter user rest_id

  @Prop({ type: Types.ObjectId, ref: 'RapidAPITwitterUser', required: true })
  mongoUserId: Types.ObjectId; // Reference to our MongoDB user document

  @Prop({ required: true, trim: true })
  tweetUrl: string; // https://twitter.com/MrBeast/status/1234567890

  @Prop({ type: Object, required: true })
  content: {
    text?: string;
    type: 'text' | 'photo' | 'video' | 'link' | 'retweet';
    images?: string[];
    videos?: string[];
    links?: string[];
    hashtags?: string[];
    mentions?: string[];
  };

  @Prop({ required: true })
  publishedAt: Date; // Parsed from legacy.created_at

  @Prop({ type: Object, default: {} })
  engagement: {
    likes?: number; // legacy.favorite_count
    retweets?: number; // legacy.retweet_count
    replies?: number; // legacy.reply_count
    quotes?: number; // legacy.quote_count if available
  };

  @Prop({ default: false })
  isRetweet: boolean;

  @Prop({ trim: true })
  originalTweetId?: string; // If it's a retweet

  @Prop({ trim: true })
  inReplyTo?: string; // legacy.in_reply_to_status_id_str

  @Prop({ required: true })
  extractedAt: Date;

  @Prop({ enum: ['raw', 'processed', 'published'], default: 'raw' })
  processingStatus: string;

  @Prop({ type: Object, default: {} })
  rawData: Record<string, unknown>; // Full Twitter API response
}

export const RapidAPITwitterPostSchema = SchemaFactory.createForClass(RapidAPITwitterPost);

// Compound indexes for performance
RapidAPITwitterPostSchema.index({ userId: 1, publishedAt: -1 });
RapidAPITwitterPostSchema.index({ tweetId: 1 });
RapidAPITwitterPostSchema.index({ mongoUserId: 1, publishedAt: -1 });