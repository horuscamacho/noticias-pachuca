/**
 * Complete brutalist tab navigation system with bar and content
 * @module BrutalistTabs
 * @version 2.0.0 - Fake Scroll Architecture
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import type { useAnimatedScrollHandler } from 'react-native-reanimated';
import BrutalistTabBar from './BrutalistTabBar';
import BrutalistTabContent from './BrutalistTabContent';
import { NEWS_CATEGORIES } from './BrutalistTabs.tokens';
import type { NewsCategory } from './BrutalistTabs.types';

/**
 * Props for the complete tab system
 */
export interface BrutalistTabsProps {
  /** Array of categories (defaults to NEWS_CATEGORIES) */
  categories?: readonly NewsCategory[];
  /** Initial active index (default: 0) */
  initialIndex?: number;
  /** Optional custom content renderer */
  renderContent?: (category: NewsCategory, index: number) => React.ReactNode;
  /** Callback when category changes */
  onCategoryChange?: (category: NewsCategory, index: number) => void;
  /** Height of the collapsible header (for dead space) */
  headerHeight: number;
  /** Reanimated scroll handler from parent hook */
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
}

/**
 * Complete brutalist tab navigation system
 *
 * Combines:
 * - BrutalistTabBar (horizontal scrollable tabs)
 * - BrutalistTabContent (swipeable content area)
 * - Bidirectional sync (tab press <-> swipe)
 *
 * Features:
 * - 7 news categories
 * - Smooth animations
 * - Haptic feedback
 * - Accessibility support
 * - Responsive design
 * - Custom content rendering
 *
 * @example
 * ```tsx
 * // Basic usage
 * <BrutalistTabs />
 *
 * // With custom content
 * <BrutalistTabs
 *   renderContent={(category) => (
 *     <NewsFeed category={category.slug} />
 *   )}
 * />
 *
 * // With change handler
 * <BrutalistTabs
 *   onCategoryChange={(category, index) => {
 *     console.log('Category changed:', category.label);
 *   }}
 * />
 * ```
 */
const BrutalistTabs: React.FC<BrutalistTabsProps> = ({
  categories = NEWS_CATEGORIES,
  initialIndex = 0,
  renderContent,
  onCategoryChange,
  headerHeight,
  scrollHandler,
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  /**
   * Handle index change from both tab press and swipe
   */
  const handleIndexChange = useCallback((newIndex: number) => {
    setActiveIndex(newIndex);
    onCategoryChange?.(categories[newIndex], newIndex);
  }, [categories, onCategoryChange]);

  return (
    <View style={styles.container}>
      {/* Tab bar - positioned below dead space */}
      <BrutalistTabBar
        categories={categories}
        activeIndex={activeIndex}
        onTabPress={handleIndexChange}
      />

      {/* Swipeable content with ScrollViews */}
      <BrutalistTabContent
        categories={categories}
        activeIndex={activeIndex}
        onIndexChange={handleIndexChange}
        renderContent={renderContent}
        headerHeight={headerHeight}
        scrollHandler={scrollHandler}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default BrutalistTabs;
