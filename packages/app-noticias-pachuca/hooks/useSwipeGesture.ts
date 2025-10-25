/**
 * useSwipeGesture Hook
 * Manages Pan gesture configuration for swipeable cards with unidirectional progression
 *
 * Features:
 * - Modern Gesture.Pan() API (not deprecated useAnimatedGestureHandler)
 * - 40% screen width OR 800px/s velocity threshold
 * - UNIDIRECTIONAL: Both left and right swipes advance to next article
 * - Direction parameter passed for dot indicator animation only
 * - Organic spring animation for cancellation
 * - All animations run on UI thread for 60fps
 *
 * Technical Details:
 * - translateX: SharedValue tracking horizontal translation
 * - isActive: SharedValue for gesture state
 * - Threshold: 40% screen width OR 800px/s velocity
 * - Complete: withTiming (300ms, cubic easing)
 * - Cancel: withSpring (damping: 18, stiffness: 120)
 * - Callbacks via runOnJS for thread safety
 *
 * @module hooks/useSwipeGesture
 * @version 2.0.0
 */

import { useCallback } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';

/**
 * Swipe direction type
 */
export type SwipeDirection = 'left' | 'right';

/**
 * Options for useSwipeGesture hook
 */
export interface UseSwipeGestureOptions {
  /**
   * Callback when swipe completes (always advances to next article)
   * Direction parameter indicates visual swipe direction for dot indicator animation
   */
  onSwipeComplete: (direction: SwipeDirection) => void;

  /**
   * Screen width for threshold calculation
   */
  screenWidth: number;

  /**
   * Whether gesture detection is enabled
   * @default true
   */
  enabled?: boolean;
}

/**
 * Return value from useSwipeGesture hook
 */
export interface UseSwipeGestureReturn {
  /**
   * Configured Pan gesture for GestureDetector
   */
  gesture: ReturnType<typeof Gesture.Pan>;

  /**
   * Shared value tracking horizontal translation
   * Range: [-screenWidth, screenWidth]
   */
  translateX: ReturnType<typeof useSharedValue<number>>;

  /**
   * Shared value tracking gesture active state
   */
  isActive: ReturnType<typeof useSharedValue<boolean>>;
}

/**
 * Gesture thresholds
 */
const SWIPE_THRESHOLD_RATIO = 0.4; // 40% of screen width
const VELOCITY_THRESHOLD = 800; // pixels per second

/**
 * Animation configuration
 */
const COMPLETE_ANIMATION_DURATION = 300; // milliseconds
const COMPLETE_ANIMATION_EASING = Easing.out(Easing.cubic);

const CANCEL_SPRING_CONFIG = {
  damping: 18,
  stiffness: 120,
};

/**
 * useSwipeGesture - Manages Pan gesture for swipeable cards
 *
 * UNIDIRECTIONAL PROGRESSION: Both swipe left and swipe right advance to the next article.
 * The direction parameter is only used for dot indicator animation.
 *
 * Provides a configured Pan gesture that:
 * 1. Tracks horizontal translation
 * 2. Detects swipe completion (threshold or velocity)
 * 3. Animates completion (withTiming) or cancellation (withSpring)
 * 4. Invokes callback on JS thread after animation with direction info
 *
 * @example
 * ```tsx
 * const { gesture, translateX, isActive } = useSwipeGesture({
 *   onSwipeComplete: (direction) => {
 *     // Always advance to next article
 *     advanceToNext();
 *     // Animate dots based on direction
 *     animateDots(direction);
 *   },
 *   screenWidth: width,
 *   enabled: true,
 * });
 *
 * return (
 *   <GestureDetector gesture={gesture}>
 *     <Animated.View style={[{ translateX }]}>
 *       {content}
 *     </Animated.View>
 *   </GestureDetector>
 * );
 * ```
 */
export function useSwipeGesture({
  onSwipeComplete,
  screenWidth,
  enabled = true,
}: UseSwipeGestureOptions): UseSwipeGestureReturn {
  // Shared values for gesture state
  const translateX = useSharedValue(0);
  const isActive = useSharedValue(false);

  // Calculate swipe threshold
  const swipeThreshold = screenWidth * SWIPE_THRESHOLD_RATIO;

  // Memoize callback to prevent gesture recreation
  const handleSwipeComplete = useCallback(onSwipeComplete, [onSwipeComplete]);

  // Configure Pan gesture
  const gesture = Gesture.Pan()
    .enabled(enabled)
    .onBegin(() => {
      'worklet';
      isActive.value = true;
    })
    .onChange((event) => {
      'worklet';
      if (!enabled) return;

      // Update translation on UI thread
      translateX.value = event.translationX;
    })
    .onFinalize((event) => {
      'worklet';
      isActive.value = false;

      // Determine if swipe should complete
      const distance = Math.abs(event.translationX);
      const velocity = Math.abs(event.velocityX);

      const shouldComplete =
        distance > swipeThreshold || velocity > VELOCITY_THRESHOLD;

      if (shouldComplete) {
        // Determine swipe direction (for visual animation only)
        const direction: SwipeDirection = event.translationX > 0 ? 'right' : 'left';
        const targetX = direction === 'left' ? -screenWidth : screenWidth;

        // Animate to completion
        // Callback fires AFTER animation finishes, not during
        translateX.value = withTiming(
          targetX,
          {
            duration: COMPLETE_ANIMATION_DURATION,
            easing: COMPLETE_ANIMATION_EASING,
          },
          (finished) => {
            'worklet';
            if (finished) {
              // Animation COMPLETE - card is fully off-screen with opacity 0
              // Now trigger state update - this will cause React to remount new card
              runOnJS(handleSwipeComplete)(direction);
            }
          }
        );
      } else {
        // Cancel swipe with spring animation
        translateX.value = withSpring(0, CANCEL_SPRING_CONFIG);
      }
    });

  return {
    gesture,
    translateX,
    isActive,
  };
}

/**
 * Export animation constants for testing
 */
export const SwipeGestureConstants = {
  SWIPE_THRESHOLD_RATIO,
  VELOCITY_THRESHOLD,
  COMPLETE_ANIMATION_DURATION,
  CANCEL_SPRING_CONFIG,
};
