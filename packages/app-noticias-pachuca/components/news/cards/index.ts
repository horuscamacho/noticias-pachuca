/**
 * Brutalist News Cards
 * Three card variants for React Native news app
 */

// Card Components
export { HorizontalNewsCard } from './HorizontalNewsCard';
export { HorizontalImageRightCard } from './HorizontalImageRightCard';
export { VerticalNewsCard } from './VerticalNewsCard';
export { TextOnlyNewsCard } from './TextOnlyNewsCard';

// Type Definitions
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
} from './NewsCard.types';

// Design Tokens
export {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDERS,
  DIMENSIONS,
  LAYOUT,
} from './NewsCard.tokens';
