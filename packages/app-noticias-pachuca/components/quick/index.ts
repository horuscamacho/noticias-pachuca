/**
 * Quick Read Components
 * Export all Quick Read visual components
 *
 * @module components/quick
 * @version 1.0.0
 */

export { QuickReadCard, QuickReadCardStyles } from './QuickReadCard';
export type { QuickReadCardProps, QuickReadArticleData } from './QuickReadCard';

export { SwipeIndicator, SwipeIndicatorStyles } from './SwipeIndicator';
export type { SwipeIndicatorProps } from './SwipeIndicator';

export { RotatingDotIndicator, RotatingDotIndicatorStyles, RotatingDotIndicatorTokens } from './RotatingDotIndicator';
export type { RotatingDotIndicatorProps } from './RotatingDotIndicator';

export { SwipeableCard, SwipeableCardStyles } from './SwipeableCard';
export type { SwipeableCardProps } from './SwipeableCard';

export {
  QUICK_READ_COLORS,
  QUICK_READ_DIMENSIONS,
  QUICK_READ_TYPOGRAPHY,
  QUICK_READ_ANIMATION,
  QUICK_READ_GESTURE,
  QUICK_READ_ACCESSIBILITY,
  QUICK_READ_ZINDEX,
  QUICK_READ_IMAGE,
  QUICK_READ_TOKENS,
  CATEGORY_COLOR_MAP,
} from './QuickRead.tokens';

export type {
  QuickReadColors,
  QuickReadDimensions,
  QuickReadTypography,
  QuickReadAnimation,
  CategoryId,
} from './QuickRead.tokens';
