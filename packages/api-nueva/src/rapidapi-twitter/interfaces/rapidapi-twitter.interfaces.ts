export interface TwitterScraperProvider {
  getUserProfile(username: string): Promise<TwitterUserDetails>;
  getUserTweets(userId: string, options: TwitterPostOptions): Promise<TwitterPost[]>;
}

export interface TwitterUserDetails {
  id: string; // rest_id
  username: string; // screen_name
  displayName: string; // core.name
  bio?: string; // legacy.description
  followers?: number; // legacy.followers_count
  following?: number; // legacy.friends_count
  tweetsCount?: number; // legacy.statuses_count
  verified?: boolean; // legacy.verified
  isBlueVerified?: boolean; // is_blue_verified
  profilePicture?: string; // avatar.image_url
  location?: string; // legacy.location
  website?: string; // legacy.url
  rawData?: Record<string, unknown>;
}

export interface TwitterPost {
  id: string; // rest_id
  url: string; // Constructed
  content: {
    text?: string; // legacy.full_text
    type: 'text' | 'photo' | 'video' | 'link' | 'retweet';
    images?: string[];
    videos?: string[];
    links?: string[];
    hashtags?: string[];
    mentions?: string[];
  };
  publishedAt: Date; // legacy.created_at parsed
  engagement?: {
    likes?: number; // legacy.favorite_count
    retweets?: number; // legacy.retweet_count
    replies?: number; // legacy.reply_count
    quotes?: number; // legacy.quote_count
  };
  isRetweet?: boolean;
  originalTweetId?: string;
  inReplyTo?: string;
  rawData?: Record<string, unknown>;
}

export interface TwitterPostOptions {
  count?: number; // Default 20
  includeReplies?: boolean;
  includeRetweets?: boolean;
  cursor?: string;
}

export interface RapidAPITwitterResponse<T = Record<string, unknown>> {
  data: T;
  success: boolean;
  message?: string;
}

export interface RapidAPITwitterRequestConfig {
  host: string; // "twitter241.p.rapidapi.com"
  apiKey: string;
  baseUrl: string; // "https://twitter241.p.rapidapi.com"
  endpoint: string; // "/user" or "/user-tweets"
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}