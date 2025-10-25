/**
 * Type definitions for Quick Read feature
 * @module types/quickRead.types
 * @version 1.0.0
 */

import { CategoryId } from '@/components/quick/QuickRead.tokens';

/**
 * Category information for an article
 */
export interface QuickReadCategory {
  /**
   * Unique identifier for the category (slug format)
   * @example 'deportes', 'politica', 'economia'
   */
  id: CategoryId;

  /**
   * Display label (uppercase for brutalist design)
   * @example 'DEPORTES', 'POLÍTICA', 'ECONOMÍA'
   */
  label: string;

  /**
   * Color for category badge (hex format)
   * @example '#854836', '#FFB22C', '#FF0000'
   */
  color: string;

  /**
   * Accessibility label for screen readers
   * @example 'Sports', 'Politics', 'Economy'
   */
  voiceLabel?: string;
}

/**
 * Author information for an article
 */
export interface QuickReadAuthor {
  /**
   * Unique identifier for the author
   */
  id: string;

  /**
   * Author's full name
   * @example 'María González'
   */
  name: string;

  /**
   * Author's profile image URL (optional)
   */
  avatarUrl?: string;

  /**
   * Author's title/role (optional)
   * @example 'Corresponsal', 'Editor'
   */
  title?: string;
}

/**
 * Hero image information with optimization data
 */
export interface QuickReadHeroImage {
  /**
   * Image URL (CDN or asset path)
   */
  url: string;

  /**
   * Alt text for accessibility
   * @example 'Gobernador en conferencia de prensa'
   */
  alt: string;

  /**
   * BlurHash string for progressive loading (optional)
   * @see https://blurha.sh/
   */
  blurhash?: string;

  /**
   * Original image width in pixels
   */
  width: number;

  /**
   * Original image height in pixels
   */
  height: number;

  /**
   * Dominant color for placeholder (hex format)
   * @example '#F7F7F7'
   */
  dominantColor?: string;

  /**
   * Focal point for cropping (0-1 normalized coordinates)
   * @example { x: 0.5, y: 0.3 } // Focus on top-center
   */
  focalPoint?: {
    x: number; // 0 (left) to 1 (right)
    y: number; // 0 (top) to 1 (bottom)
  };
}

/**
 * Complete article data for Quick Read cards
 */
export interface QuickReadArticle {
  /**
   * Unique article identifier (UUID or database ID)
   */
  id: string;

  /**
   * URL-friendly slug for routing
   * @example 'gobernador-presenta-plan-economico'
   */
  slug: string;

  /**
   * Hero image data
   */
  heroImage: QuickReadHeroImage;

  /**
   * Article category
   */
  category: QuickReadCategory;

  /**
   * Article headline (should be concise)
   * Max recommended: 120 characters
   * Will be truncated at 3 lines on display
   * @example 'GOBERNADOR PRESENTA NUEVO PLAN ECONÓMICO'
   */
  title: string;

  /**
   * Article author
   */
  author: QuickReadAuthor;

  /**
   * Article summary (plain text)
   * Recommended: 120-180 words
   * Will be truncated at 5 lines on display
   * Should be crafted by editors for clarity
   */
  summary: string;

  /**
   * Publication timestamp (ISO 8601 format)
   * @example '2025-10-25T10:30:00Z'
   */
  publishedAt: string;

  /**
   * Estimated read time in minutes (optional)
   * For full article, not summary
   */
  readTime?: number;

  /**
   * Article priority/urgency (optional)
   * Higher priority articles shown first
   */
  priority?: number;

  /**
   * Breaking news flag (optional)
   * Could trigger special UI treatment
   */
  isBreaking?: boolean;

  /**
   * Tags for filtering/search (optional)
   */
  tags?: string[];

  /**
   * Source/publication name (optional)
   * @example 'Noticias Pachuca', 'AP', 'Reuters'
   */
  source?: string;
}

/**
 * Quick Read screen state
 */
export interface QuickReadState {
  /**
   * Array of articles to display
   */
  articles: QuickReadArticle[];

  /**
   * Currently visible article index
   */
  currentIndex: number;

  /**
   * Whether articles are being loaded
   */
  isLoading: boolean;

  /**
   * Error message if loading failed
   */
  error: string | null;

  /**
   * Whether there are more articles to load
   */
  hasMore: boolean;

  /**
   * Total number of articles available
   */
  totalCount?: number;
}

/**
 * Props for QuickReadScreen component
 */
export interface QuickReadScreenProps {
  /**
   * Initial articles to display (optional)
   * If not provided, screen will load from API
   */
  initialArticles?: QuickReadArticle[];

  /**
   * Callback when user navigates to article detail
   */
  onArticlePress?: (article: QuickReadArticle) => void;

  /**
   * Callback when user reaches end of articles
   * Can be used to load more articles
   */
  onEndReached?: () => void;

  /**
   * Callback when current article changes
   * Useful for analytics tracking
   */
  onArticleChange?: (article: QuickReadArticle, index: number) => void;
}

/**
 * Props for QuickReadCard component
 */
export interface QuickReadCardProps {
  /**
   * Article data to display
   */
  article: QuickReadArticle;

  /**
   * Card index in the stack
   */
  index: number;

  /**
   * Total number of cards
   */
  total: number;

  /**
   * Whether this card is currently active
   */
  isActive: boolean;

  /**
   * Animated opacity value (from gesture)
   */
  opacity: any; // Reanimated.SharedValue<number>

  /**
   * Z-index for card layering
   */
  zIndex: number;

  /**
   * Callback when image is pressed
   */
  onImagePress: () => void;

  /**
   * Callback when title is pressed
   */
  onTitlePress: () => void;
}

/**
 * Props for QuickReadHeroImage component
 */
export interface QuickReadHeroImageProps {
  /**
   * Hero image data
   */
  image: QuickReadHeroImage;

  /**
   * Category for badge overlay
   */
  category: QuickReadCategory;

  /**
   * Whether image is tappable
   */
  pressable?: boolean;

  /**
   * Callback when image is pressed
   */
  onPress?: () => void;

  /**
   * Accessibility label override
   */
  accessibilityLabel?: string;
}

/**
 * Props for QuickReadContent component
 */
export interface QuickReadContentProps {
  /**
   * Article title
   */
  title: string;

  /**
   * Article author
   */
  author: QuickReadAuthor;

  /**
   * Article summary
   */
  summary: string;

  /**
   * Current article index
   */
  currentIndex: number;

  /**
   * Total number of articles
   */
  totalArticles: number;

  /**
   * Whether title is tappable
   */
  titlePressable?: boolean;

  /**
   * Callback when title is pressed
   */
  onTitlePress?: () => void;
}

/**
 * Gesture event data for swipe detection
 */
export interface QuickReadGestureEvent {
  /**
   * Horizontal translation in pixels
   */
  translationX: number;

  /**
   * Vertical translation in pixels
   */
  translationY: number;

  /**
   * Horizontal velocity in px/s
   */
  velocityX: number;

  /**
   * Vertical velocity in px/s
   */
  velocityY: number;

  /**
   * Gesture state (e.g., ACTIVE, END)
   */
  state: number;
}

/**
 * Animation interpolation config for card transitions
 */
export interface CardAnimationConfig {
  /**
   * Input range for interpolation
   */
  inputRange: number[];

  /**
   * Output range for interpolation
   */
  outputRange: number[];

  /**
   * Extrapolation mode
   */
  extrapolate?: 'clamp' | 'extend' | 'identity';
}

/**
 * Mock data generator return type
 */
export interface QuickReadMockData {
  /**
   * Array of mock articles
   */
  articles: QuickReadArticle[];

  /**
   * Available categories
   */
  categories: QuickReadCategory[];

  /**
   * Available authors
   */
  authors: QuickReadAuthor[];
}

/**
 * API response type for fetching Quick Read articles
 */
export interface QuickReadApiResponse {
  /**
   * Response status
   */
  success: boolean;

  /**
   * Array of articles
   */
  data: QuickReadArticle[];

  /**
   * Pagination metadata
   */
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
  };

  /**
   * Error message if success is false
   */
  error?: string;
}

/**
 * Analytics event data for tracking
 */
export interface QuickReadAnalyticsEvent {
  /**
   * Event name
   */
  event: 'article_viewed' | 'article_swiped' | 'article_opened' | 'share_pressed';

  /**
   * Article ID
   */
  articleId: string;

  /**
   * Article index in feed
   */
  index: number;

  /**
   * Swipe direction (if applicable)
   */
  direction?: 'left' | 'right';

  /**
   * Timestamp
   */
  timestamp: number;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}
