/**
 * Type definitions for Brutalist News Cards
 * @module components/news/cards
 */

/**
 * Related article in the news feed
 */
export interface RelatedArticle {
  /** Unique identifier for the related article */
  id: string;
  /** Title of the related article */
  title: string;
  /** Category of the related article (optional, shown in vertical variant) */
  category?: string;
  /** URL slug for navigation */
  slug: string;
}

/**
 * Main news article data structure
 */
export interface NewsArticle {
  /** Unique identifier for the article */
  id: string;
  /** Main headline */
  title: string;
  /** Brief description/subtitle */
  subtitle: string;
  /** Article category (e.g., "POLÍTICA", "ECONOMÍA") */
  category: string;
  /** Author name */
  author: string;
  /** Image URL (optional for text-only cards) */
  imageUrl?: string;
  /** Related articles to display */
  relatedArticles: RelatedArticle[];
  /** Publication timestamp */
  publishedAt: string;
  /** URL slug for navigation */
  slug: string;
}

/**
 * Base props shared across all card variants
 */
export interface BaseNewsCardProps {
  /** Article data to display */
  article: NewsArticle;
  /** Callback when card is pressed */
  onPress: (slug: string) => void;
  /** Callback when related article is pressed */
  onRelatedPress: (slug: string) => void;
  /** Test identifier for automated testing */
  testID?: string;
}

/**
 * Props for HorizontalNewsCard component
 */
export interface HorizontalNewsCardProps extends BaseNewsCardProps {
  /** Category badge color variant */
  categoryColor?: 'brown' | 'yellow';
}

/**
 * Props for VerticalNewsCard component
 */
export interface VerticalNewsCardProps extends BaseNewsCardProps {
  /** Category badge color variant */
  categoryColor?: 'brown' | 'yellow';
}

/**
 * Props for TextOnlyNewsCard component
 */
export interface TextOnlyNewsCardProps extends BaseNewsCardProps {
  /** Category badge color variant (defaults to 'brown') */
  categoryColor?: 'brown' | 'yellow';
}

/**
 * Props for CategoryBadge component
 */
export interface CategoryBadgeProps {
  /** Category text to display */
  category: string;
  /** Color variant */
  variant: 'brown' | 'yellow';
  /** Size variant */
  size?: 'default' | 'large';
}

/**
 * Props for AuthorInfo component
 */
export interface AuthorInfoProps {
  /** Author name */
  author: string;
  /** Published date/time */
  publishedAt?: string;
}

/**
 * Props for RelatedArticles component
 */
export interface RelatedArticlesProps {
  /** List of related articles */
  articles: RelatedArticle[];
  /** Callback when related article is pressed */
  onPress: (slug: string) => void;
  /** Show category badges for each article */
  showCategories?: boolean;
  /** Section title (defaults to "NOTICIAS RELACIONADAS") */
  sectionTitle?: string;
}
