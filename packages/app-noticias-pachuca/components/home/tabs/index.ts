/**
 * Brutalist Tab Navigation System - Main exports
 * @module components/home/tabs
 * @version 1.0.0
 */

// Main components
export { default as BrutalistTabs } from './BrutalistTabs';
export { default as BrutalistTabBar } from './BrutalistTabBar';
export { default as BrutalistTabContent } from './BrutalistTabContent';
export { default as BrutalistTabItem } from './BrutalistTabItem';
export { default as BrutalistTabIndicator } from './BrutalistTabIndicator';

// Types
export type {
  NewsCategory,
  TabMeasurement,
  BrutalistTabBarProps,
  BrutalistTabItemProps,
  BrutalistTabIndicatorProps,
  BrutalistTabContentProps,
  TabAnimationState,
  ScrollEventData,
} from './BrutalistTabs.types';

// Design tokens
export {
  COLORS,
  DIMENSIONS,
  TYPOGRAPHY,
  ANIMATION,
  OPACITY,
  SCROLL,
  TEST_CONTENT_COLORS,
  NEWS_CATEGORIES,
} from './BrutalistTabs.tokens';
