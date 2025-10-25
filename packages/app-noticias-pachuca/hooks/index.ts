/**
 * Hooks exports
 * Barrel file for easy imports
 */

export { useCarousel } from './useCarousel';
export type { UseCarouselReturn } from './useCarousel';

export { useArticleDetails } from './useArticleDetails';
export type { ArticleDetailsData, UseArticleDetailsReturn } from './useArticleDetails';

export { useSwipeGesture, SwipeGestureConstants } from './useSwipeGesture';
export type { UseSwipeGestureOptions, UseSwipeGestureReturn } from './useSwipeGesture';

export { useSwipeFadeAnimation, SwipeFadeAnimationConstants } from './useSwipeFadeAnimation';
export type {
  UseSwipeFadeAnimationOptions,
  UseSwipeFadeAnimationReturn,
  SwipeDirection,
} from './useSwipeFadeAnimation';
