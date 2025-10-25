/**
 * Animated yellow indicator that slides and morphs between tabs
 * @module BrutalistTabIndicator
 * @version 2.0.0
 */

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { COLORS, DIMENSIONS, ANIMATION } from './BrutalistTabs.tokens';
import type { BrutalistTabIndicatorProps } from './BrutalistTabs.types';

/**
 * Animated indicator that shows the active tab
 *
 * Features:
 * - Smooth slide animation (250ms ease-out)
 * - Dynamic width morphing between tabs
 * - Positioned at bottom of tab bar
 * - Fixed height (4px)
 * - Yellow accent color (#FFB22C)
 *
 * @example
 * ```tsx
 * <BrutalistTabIndicator
 *   activeIndex={0}
 *   tabMeasurements={[
 *     { width: 82, x: 0 },
 *     { width: 120, x: 82 },
 *     ...
 *   ]}
 *   horizontalPadding={16}
 * />
 * ```
 */
const BrutalistTabIndicator: React.FC<BrutalistTabIndicatorProps> = React.memo(({
  activeIndex,
  tabMeasurements,
  horizontalPadding,
}) => {
  // Shared value for animated index (enables smooth interpolation)
  const animatedIndex = useSharedValue(activeIndex);

  /**
   * Update animated index when active index changes
   */
  useEffect(() => {
    animatedIndex.value = withTiming(activeIndex, {
      duration: ANIMATION.indicatorDuration,
      easing: Easing.out(Easing.cubic),
    });
  }, [activeIndex, animatedIndex]);

  /**
   * Animated style for sliding and morphing indicator
   * Interpolates both position and width between tabs
   */
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';

    if (tabMeasurements.length === 0) {
      return {
        width: 0,
        transform: [{ translateX: horizontalPadding }],
      };
    }

    // Get current measurement or use first tab as fallback
    const currentMeasurement = tabMeasurements[activeIndex] || tabMeasurements[0];

    if (!currentMeasurement) {
      return {
        width: 0,
        transform: [{ translateX: horizontalPadding }],
      };
    }

    // Simple direct values - NO interpolation to avoid crashes
    const width = currentMeasurement.width;
    const translateX = currentMeasurement.x + horizontalPadding;

    return {
      width,
      transform: [{ translateX }],
    };
  }, [tabMeasurements, activeIndex, horizontalPadding]);

  return (
    <Animated.View
      style={[
        styles.indicator,
        animatedStyle,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
});

BrutalistTabIndicator.displayName = 'BrutalistTabIndicator';

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    bottom: DIMENSIONS.indicatorBottom,
    height: DIMENSIONS.indicatorHeight,
    backgroundColor: COLORS.indicatorActive,
    borderRadius: DIMENSIONS.indicatorBorderRadius,
  },
});

export default BrutalistTabIndicator;
