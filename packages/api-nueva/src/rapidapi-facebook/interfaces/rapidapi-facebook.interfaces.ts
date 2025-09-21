export interface SocialMediaScraperProvider {
  getPageId(url: string): Promise<string>;
  getPageDetails(identifier: string): Promise<PageDetails>;
  getPagePosts(identifier: string, options: PostOptions): Promise<Post[]>;
}

export interface PageDetails {
  id: string;
  name: string;
  category?: string;
  followers?: number;
  likes?: number;
  about?: string;
  website?: string;
  location?: string;
  verified?: boolean;
  profilePicture?: string;
  coverPhoto?: string;
  rawData?: Record<string, unknown>;
}

export interface Post {
  id: string;
  url: string;
  content: {
    text?: string;
    type: 'text' | 'photo' | 'video' | 'link' | 'event';
    images?: string[];
    videos?: string[];
    links?: string[];
    hashtags?: string[];
    mentions?: string[];
  };
  publishedAt: Date;
  engagement?: {
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
  comments?: Array<{
    commentId: string;
    text: string;
    author: string;
    publishedAt: Date;
    likes: number;
    replies: number;
  }>;
  rawData?: Record<string, unknown>;
}

export interface PostOptions {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  cursor?: string;
  includeComments?: boolean;
  includeReactions?: boolean;
}

export interface RapidAPIResponse<T = Record<string, unknown>> {
  data: T;
  success: boolean;
  message?: string;
  cursor?: string;
  hasMore?: boolean;
}

export interface RapidAPIRequestConfig {
  host: string;
  apiKey: string;
  baseUrl: string;
  endpoint: string;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}