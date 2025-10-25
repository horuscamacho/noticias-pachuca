/**
 * Main brutalist horizontal tab bar container with dynamic tab widths
 * @module BrutalistTabBar
 * @version 2.0.0
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { COLORS, DIMENSIONS, SCROLL } from './BrutalistTabs.tokens';
import BrutalistTabItem from './BrutalistTabItem';
import type { BrutalistTabBarProps, TabMeasurement } from './BrutalistTabs.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Main horizontal tab bar with scrollable tabs and animated indicator
 *
 * Features:
 * - Dynamic tab widths based on text content
 * - Horizontal scrollable tab list
 * - Animated yellow indicator with morphing width
 * - Auto-scroll to center active tab
 * - Brutalist design tokens
 * - Accessibility support
 * - Haptic feedback
 *
 * @example
 * ```tsx
 * <BrutalistTabBar
 *   categories={NEWS_CATEGORIES}
 *   activeIndex={0}
 *   onTabPress={(index) => setActiveIndex(index)}
 * />
 * ```
 */
const BrutalistTabBar: React.FC<BrutalistTabBarProps> = React.memo(({
  categories,
  activeIndex,
  onTabPress,
  testID = 'brutalist-tab-bar',
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [tabMeasurements, setTabMeasurements] = useState<TabMeasurement[]>([]);

  /**
   * Handle tab layout measurement
   * Calculate cumulative X position for each tab
   */
  const handleTabLayout = useCallback((index: number, width: number) => {
    setTabMeasurements((prevMeasurements) => {
      const newMeasurements = [...prevMeasurements];

      // Calculate cumulative X position
      const x = newMeasurements
        .slice(0, index)
        .reduce((sum, measurement) => sum + (measurement?.width || 0), 0);

      newMeasurements[index] = { width, x };

      return newMeasurements;
    });
  }, []);

  /**
   * Scroll to center the active tab
   */
  const scrollToTab = useCallback((index: number) => {
    if (!tabMeasurements[index]) return;

    const tabMeasurement = tabMeasurements[index];
    const tabCenter = tabMeasurement.x + (tabMeasurement.width / 2);
    const offset = tabCenter - (SCREEN_WIDTH / 2) + DIMENSIONS.firstTabMarginLeft;

    // Calculate total content width
    const totalWidth = tabMeasurements.reduce((sum, m) => sum + (m?.width || 0), 0);
    const maxOffset = totalWidth - SCREEN_WIDTH + DIMENSIONS.firstTabMarginLeft + DIMENSIONS.lastTabMarginRight;

    scrollViewRef.current?.scrollTo({
      x: Math.max(0, Math.min(offset, maxOffset)),
      animated: true,
    });
  }, [tabMeasurements]);

  /**
   * Handle tab press - update active index and scroll
   */
  const handleTabPress = useCallback((index: number) => {
    onTabPress(index);
    scrollToTab(index);
  }, [onTabPress, scrollToTab]);

  /**
   * Auto-scroll when active index changes externally
   */
  useEffect(() => {
    const measurement = tabMeasurements[activeIndex];
    if (!measurement) return;

    const tabCenter = measurement.x + (measurement.width / 2);
    const offset = tabCenter - (SCREEN_WIDTH / 2) + DIMENSIONS.firstTabMarginLeft;

    // Calculate total content width
    const totalWidth = tabMeasurements.reduce((sum, m) => sum + (m?.width || 0), 0);
    const maxOffset = totalWidth - SCREEN_WIDTH + DIMENSIONS.firstTabMarginLeft + DIMENSIONS.lastTabMarginRight;

    scrollViewRef.current?.scrollTo({
      x: Math.max(0, Math.min(offset, maxOffset)),
      animated: true,
    });
  }, [activeIndex]);

  return (
    <View
      style={styles.container}
      testID={testID}
      accessibilityRole="tablist"
      accessibilityLabel="News Categories"
    >
      {/* Horizontal scrollable tab list */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={SCROLL.showsHorizontalScrollIndicator}
        decelerationRate={SCROLL.decelerationRate}
        scrollEventThrottle={SCROLL.scrollEventThrottle}
        contentContainerStyle={styles.scrollContent}
      >
        {/* First tab margin */}
        <View style={{ width: DIMENSIONS.firstTabMarginLeft }} />

        {/* Tab items */}
        {categories.map((category, index) => (
          <BrutalistTabItem
            key={category.id}
            category={category}
            isActive={index === activeIndex}
            onPress={() => handleTabPress(index)}
            index={index}
            onLayout={handleTabLayout}
          />
        ))}

        {/* Last tab margin */}
        <View style={{ width: DIMENSIONS.lastTabMarginRight }} />
      </ScrollView>

    </View>
  );
});

BrutalistTabBar.displayName = 'BrutalistTabBar';

const styles = StyleSheet.create({
  container: {
    height: DIMENSIONS.containerHeight,
    backgroundColor: COLORS.containerBackground,
    borderTopWidth: DIMENSIONS.borderTopWidth,
    borderBottomWidth: DIMENSIONS.borderBottomWidth,
    borderColor: COLORS.borderColor,
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    height: DIMENSIONS.tabHeight,
  },
});

export default BrutalistTabBar;
