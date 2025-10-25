/**
 * 📱 Types para sistema de publicación de contenido generado
 */

export interface PublishContentRequest {
  contentId: string;
  siteIds: string[];
  publicationType: 'breaking' | 'news' | 'blog';
  publishToSocialMedia: boolean;
  socialMediaPlatforms: ('facebook' | 'twitter')[];
  improveCopy: boolean;
  useOriginalImage: boolean;
  customImageUrl?: string;
  imageBankId?: string; // ID de imagen del banco (alternativa a customImageUrl)
}

export interface PublishContentResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    slug: string;
    sites: string[];
    publishedAt?: string;
    scheduledAt?: string;
    socialMediaPublishing?: {
      facebook: Array<{
        pageId: string;
        pageName?: string;
        postId?: string;
        postUrl?: string;
        status: 'pending' | 'published' | 'failed';
        errorMessage?: string;
      }>;
      twitter: Array<{
        accountId: string;
        username?: string;
        tweetId?: string;
        tweetUrl?: string;
        status: 'pending' | 'published' | 'failed';
        errorMessage?: string;
      }>;
    };
  };
}

export interface ImproveCopyRequest {
  contentId: string;
  canonicalUrl?: string;
}

export interface ImproveCopyResponse {
  success: boolean;
  message: string;
  data: {
    facebook?: {
      hook: string;
      copy: string;
      emojis: string[];
      hookType: string;
      estimatedEngagement: 'high' | 'medium' | 'low';
    };
    twitter?: {
      tweet: string;
      hook: string;
      emojis: string[];
      hookType: string;
      threadIdeas: string[];
    };
  };
}
