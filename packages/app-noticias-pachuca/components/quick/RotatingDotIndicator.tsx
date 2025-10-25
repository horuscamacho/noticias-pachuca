/**
 * RotatingDotIndicator Component
 * Walkman-style rotating dot indicator with synchronized animations
 *
 * Features:
 * - 5 visible dots, center dot (index 2) always active
 * - Smooth translateX animation synchronized with swipe
 * - First dot fades out, 6th dot fades in simultaneously
 * - Active dot changes during translation
 * - All animations interpolated from single translateX value
 *
 * @module components/quick/RotatingDotIndicator
 * @version 2.0.0
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

/**
 * Swipe direction type
 */
export type SwipeDirection = 'left' | 'right';

/**
 * Props for RotatingDotIndicator component
 */
export interface RotatingDotIndicatorProps {
  /**
   * Last swipe direction (triggers rotation animation)
   */
  lastSwipeDirection: SwipeDirection | null;

  /**
   * Callback when rotation animation completes
   */
  onAnimationComplete?: () => void;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Design tokens
 */
const TOKENS = {
  colors: {
    active: '#854836', // Brown - active dot
    inactive: '#D1D5DB', // Gray - inactive dots
  },
  dot: {
    size: 8,
    activeSize: 12,
    spacing: 12,
  },
  animation: {
    duration: 400,
    easing: Easing.out(Easing.cubic),
  },
} as const;

/**
 * AnimatedDot - Single dot with color transition animation
 */
interface AnimatedDotProps {
  dotIndex: number;
  isActive: boolean;
  lastSwipeDirection: SwipeDirection | null;
  testID: string;
}

const AnimatedDot = React.memo<AnimatedDotProps>(
  ({ dotIndex, isActive, lastSwipeDirection, testID }) => {
    // Shared value for dot opacity (for color transition animation)
    const dotOpacity = useSharedValue(1);

    // Calculate styles based on isActive prop (doesn't change during animation)
    const size = isActive ? TOKENS.dot.activeSize : TOKENS.dot.size;
    const backgroundColor = isActive ? TOKENS.colors.active : TOKENS.colors.inactive;

    // Animated style - only opacity animates, styles stay constant
    const dotAnimatedStyle = useAnimatedStyle(() => {
      'worklet';

      return {
        opacity: dotOpacity.value,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
      };
    });

    // Listen to swipe direction changes and animate ONLY opacity (not styles)
    useEffect(() => {
      if (!lastSwipeDirection) {
        // Reset opacity when animation is complete
        dotOpacity.value = 1;
        return;
      }

      // Animate TWO dots during translation:
      // 1. Dot 3 (currently active, will move out of center visually)
      // 2. Adjacent dot that will move into center (dot 4 for left, dot 2 for right)
      const shouldAnimate =
        dotIndex === 3 || // Always animate the active dot
        (lastSwipeDirection === 'left' && dotIndex === 4) || // Dot entering from right
        (lastSwipeDirection === 'right' && dotIndex === 2); // Dot entering from left

      if (shouldAnimate) {
        // Fade out to 0, then fade in to 1
        // Keep styles unchanged - let container position do the visual work
        dotOpacity.value = withTiming(
          0,
          {
            duration: TOKENS.animation.duration / 2, // 200ms
            easing: TOKENS.animation.easing,
          },
          () => {
            'worklet';
            // Fade back in with SAME styles
            // Styles don't change, position changes instead
            dotOpacity.value = withTiming(1, {
              duration: TOKENS.animation.duration / 2, // 200ms
              easing: TOKENS.animation.easing,
            });
          }
        );
      }
    }, [lastSwipeDirection, dotIndex, dotOpacity]);

    return (
      <Animated.View
        style={dotAnimatedStyle}
        testID={`${testID}-dot-${dotIndex}`}
      />
    );
  }
);

AnimatedDot.displayName = 'AnimatedDot';

// Calculate dimensions
// Each dot cell: activeSize + spacing = 24px
const DOT_CELL_SIZE = TOKENS.dot.activeSize + TOKENS.dot.spacing;
// Visible container: 5 dots
const VISIBLE_WIDTH = DOT_CELL_SIZE * 5;
// Inner container: 7 dots (2 hidden on sides)
const INNER_WIDTH = DOT_CELL_SIZE * 7;

/**
 * RotatingDotIndicator - Synchronized rotation animation
 *
 * Creates a smooth rotation effect where:
 * - All dots translate in X simultaneously
 * - First/last dot fades out/in based on direction
 * - Active dot switches during animation
 * - Everything interpolated from single translateX value
 */
export const RotatingDotIndicator = React.memo<RotatingDotIndicatorProps>(
  ({ lastSwipeDirection, onAnimationComplete, testID = 'rotating-dot-indicator' }) => {
    // State for dynamically calculated wrapper width and dot offset
    const [wrapperWidth, setWrapperWidth] = React.useState<number>(0);
    const [dotOffset, setDotOffset] = React.useState<number>(0);

    // Shared value for container translateX
    const containerTranslateX = useSharedValue(0);

    /**
     * Handle layout of inner container to calculate wrapper width dynamically
     * Total width / 7 dots = width per dot
     * Wrapper shows 5 dots, so wrapper width = (total / 7) * 5
     * Offset per dot = total width / 7
     */
    const handleInnerLayout = React.useCallback((event: any) => {
      const { width } = event.nativeEvent.layout;
      // Width of container with 7 dots
      // Calculate wrapper width to show only 5 dots
      const calculatedWrapperWidth = (width / 7) * 5;
      // Calculate exact offset for one dot (1/7 of total width)
      const calculatedDotOffset = width / 7;

      setWrapperWidth(calculatedWrapperWidth);
      setDotOffset(calculatedDotOffset);
    }, []);

    /**
     * Trigger animation when swipe direction changes
     */
    useEffect(() => {
      if (!lastSwipeDirection || dotOffset === 0) return;

      // Calculate target position using dynamically calculated offset
      // Swipe RIGHT: move container to the right (+dotOffset)
      // Swipe LEFT: move container to the left (-dotOffset)
      const offset = lastSwipeDirection === 'right' ? dotOffset : -dotOffset;
      const targetX = containerTranslateX.value + offset;

      // Animate to target position
      containerTranslateX.value = withTiming(
        targetX,
        {
          duration: TOKENS.animation.duration,
          easing: TOKENS.animation.easing,
        },
        (finished) => {
          'worklet';
          if (finished) {
            // Reset to initial position WITHOUT animation
            containerTranslateX.value = 0;

            // Notify parent
            if (onAnimationComplete) {
              runOnJS(onAnimationComplete)();
            }
          }
        }
      );
    }, [lastSwipeDirection, dotOffset, onAnimationComplete, containerTranslateX]);

    /**
     * Animated style for the inner container
     */
    const containerAnimatedStyle = useAnimatedStyle(() => {
      'worklet';

      return {
        transform: [{ translateX: containerTranslateX.value }],
      };
    });

    /**
     * Render a single dot with animated opacity during state transitions
     */
    const renderDot = (dotIndex: number) => {
      const isActive = dotIndex === 3; // Middle dot is always active

      return (
        <AnimatedDot
          key={dotIndex}
          dotIndex={dotIndex}
          isActive={isActive}
          lastSwipeDirection={lastSwipeDirection}
          testID={testID}
        />
      );
    };

    return (
      <View
        style={styles.container}
        accessibilityRole="group"
        accessibilityLabel="Indicador de progreso"
        testID={testID}
      >
        {/* Outer wrapper: overflow hidden, shows 5 dots, centered */}
        <View
          style={[
            styles.dotsWrapper,
            wrapperWidth > 0 && { width: wrapperWidth },
          ]}
        >
          {/* Inner container: contains 7 dots, translates on X axis */}
          <Animated.View
            style={[styles.dotsContainer, containerAnimatedStyle]}
            onLayout={handleInnerLayout}
          >
            {/* Render 7 dots, middle dot (index 3) is always active */}
            {[0, 1, 2, 3, 4, 5, 6].map((index) => renderDot(index))}
          </Animated.View>
        </View>
      </View>
    );
  }
);

// Display name for debugging
RotatingDotIndicator.displayName = 'RotatingDotIndicator';

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  dotsWrapper: {
    overflow: 'hidden',
    // Width calculated dynamically via onLayout
    height: TOKENS.dot.activeSize + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: TOKENS.dot.spacing,
    // Container has 7 dots and will translate on X axis
  } as ViewStyle,
});

/**
 * Export styles for testing
 */
export const RotatingDotIndicatorStyles = styles;

/**
 * Export tokens for testing
 */
export const RotatingDotIndicatorTokens = TOKENS;
