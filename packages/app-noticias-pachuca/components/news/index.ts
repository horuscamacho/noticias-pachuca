/**
 * News Components
 * Main export file for all news-related components
 */

// Card Components
export {
  HorizontalNewsCard,
  HorizontalImageRightCard,
  VerticalNewsCard,
  TextOnlyNewsCard,
} from './cards';

// Shared Components
export { CategoryBadge, AuthorInfo, RelatedArticles } from './shared';

// Types
export type {
  NewsArticle,
  RelatedArticle,
  BaseNewsCardProps,
  HorizontalNewsCardProps,
  VerticalNewsCardProps,
  TextOnlyNewsCardProps,
  CategoryBadgeProps,
  AuthorInfoProps,
  RelatedArticlesProps,
} from './cards/NewsCard.types';

// Tokens
export {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDERS,
  DIMENSIONS,
  LAYOUT,
} from './cards/NewsCard.tokens';
