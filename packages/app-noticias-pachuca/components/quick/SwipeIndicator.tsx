/**
 * SwipeIndicator Component
 * Pagination dots for Quick Read card navigation
 *
 * Features:
 * - 8px dots with 8px gap
 * - Active: Brown (#854836)
 * - Inactive: Light gray (#D1D5DB)
 * - Bottom center positioning
 * - Accessible progress indicator
 *
 * @module components/quick/SwipeIndicator
 * @version 1.0.0
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { QUICK_READ_COLORS, QUICK_READ_ACCESSIBILITY } from './QuickRead.tokens';

/**
 * Props for SwipeIndicator component
 */
export interface SwipeIndicatorProps {
  /**
   * Total number of articles/cards
   */
  total: number;

  /**
   * Current active index (0-based)
   */
  currentIndex: number;

  /**
   * Additional container styles
   */
  style?: ViewStyle;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * SwipeIndicator - Pagination dots for Quick Read
 *
 * Displays a row of dots indicating the current position in the card stack.
 * Active dot is brown, inactive dots are gray. Positioned at bottom center.
 *
 * Design Specifications:
 * - Dot size: 8px × 8px circle
 * - Dot gap: 8px between dots
 * - Active color: #854836 (brown)
 * - Inactive color: #D1D5DB (light gray)
 * - Position: Bottom center, 24px from safe area bottom
 * - Accessibility: Acts as progress indicator
 *
 * @example
 * ```tsx
 * // Basic usage
 * <SwipeIndicator total={5} currentIndex={2} />
 *
 * // With custom positioning
 * <SwipeIndicator
 *   total={10}
 *   currentIndex={0}
 *   style={{ bottom: 40 }}
 * />
 *
 * // In Quick Read screen
 * <SafeAreaView style={{ flex: 1 }}>
 *   <QuickReadCard {...} />
 *   <SwipeIndicator
 *     total={articles.length}
 *     currentIndex={currentIndex}
 *   />
 * </SafeAreaView>
 * ```
 */
export const SwipeIndicator = React.memo<SwipeIndicatorProps>(
  ({ total, currentIndex, style, testID = 'swipe-indicator' }) => {
    // Validate props
    if (total < 1) {
      console.warn('SwipeIndicator: total must be >= 1');
      return null;
    }

    if (currentIndex < 0 || currentIndex >= total) {
      console.warn(`SwipeIndicator: currentIndex (${currentIndex}) out of bounds [0, ${total - 1}]`);
      return null;
    }

    // Generate accessibility label
    const accessibilityLabel = QUICK_READ_ACCESSIBILITY.labels.indicators
      .replace('{current}', (currentIndex + 1).toString())
      .replace('{total}', total.toString());

    return (
      <View
        style={[styles.container, style]}
        accessibilityRole="progressbar"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{
          now: currentIndex + 1,
          min: 1,
          max: total,
        }}
        testID={testID}
      >
        {Array.from({ length: total }).map((_, index) => {
          const isActive = index === currentIndex;

          return (
            <View
              key={index}
              style={[
                styles.dot,
                isActive ? styles.dotActive : styles.dotInactive,
              ]}
              accessibilityElementsHidden={true} // Parent has accessibility
              importantForAccessibility="no"
            />
          );
        })}
      </View>
    );
  }
);

// Display name for debugging
SwipeIndicator.displayName = 'SwipeIndicator';

/**
 * Styles for SwipeIndicator
 */
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24, // 24px from bottom (will be adjusted with safe area)
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8, // 8px gap between dots
    paddingHorizontal: 20, // Prevent overflow on small screens
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4, // Makes it a circle (half of width/height)
  },
  dotActive: {
    backgroundColor: QUICK_READ_COLORS.category.deportes, // Brown #854836
  },
  dotInactive: {
    backgroundColor: '#D1D5DB', // Light gray
  },
});

/**
 * Export styles for testing
 */
export const SwipeIndicatorStyles = styles;
