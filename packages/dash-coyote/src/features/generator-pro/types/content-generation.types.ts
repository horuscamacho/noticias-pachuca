export interface SocialMediaCopies {
  facebook: {
    hook: string;
    copy: string;
    emojis: string[];
    hookType: 'Scary' | 'FreeValue' | 'Strange' | 'Sexy' | 'Familiar';
    estimatedEngagement: 'high' | 'medium' | 'low';
  };
  twitter: {
    tweet: string;
    hook: string;
    emojis: string[];
    hookType: string;
    threadIdeas: string[];
  };
}

export interface GeneratedContent {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  tags: string[];
  category: string;
  summary: string;
  socialMediaCopies: SocialMediaCopies;
  generatedAt: string;
  agentId: string;
  extractedContentId: string;
}

export interface ExtractedContentItem {
  id: string;
  title: string;
  content: string;
  url: string;
  websiteId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  extractedAt: string;
  publishedAt?: string;
  author?: string;
  category?: string;
}
