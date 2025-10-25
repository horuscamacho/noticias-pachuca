/**
 * useSwipeFadeAnimation Hook
 * Converts translateX to cross-fade opacity animations
 *
 * Features:
 * - Current card fades out (1 → 0) as user swipes
 * - Next/previous cards fade in (0 → 1) simultaneously
 * - Interpolation with Extrapolation.CLAMP for bounds safety
 * - Subtle parallax effect on current card (0.5x translation)
 * - All computations on UI thread for 60fps
 *
 * Technical Details:
 * - interpolate: Maps translateX to opacity [0, 1]
 * - Extrapolation.CLAMP: Prevents opacity outside [0, 1]
 * - useAnimatedStyle: Reactive style objects
 * - Parallax: current card moves 50% of gesture distance
 *
 * @module hooks/useSwipeFadeAnimation
 * @version 1.0.0
 */

import {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * Animation direction options
 */
export type SwipeDirection = 'left' | 'right' | 'both' | 'unidirectional';

/**
 * Options for useSwipeFadeAnimation hook
 */
export interface UseSwipeFadeAnimationOptions {
  /**
   * Shared value tracking horizontal translation
   */
  translateX: SharedValue<number>;

  /**
   * Screen width for interpolation range
   */
  screenWidth: number;

  /**
   * Shared value tracking gesture active state
   * Used to conditionally apply transforms only during active gestures
   */
  isActive: SharedValue<boolean>;

  /**
   * Which directions to enable animations for
   * - 'left': Only animate next card (swipe left)
   * - 'right': Only animate previous card (swipe right)
   * - 'both': Animate both directions (bidirectional carousel)
   * - 'unidirectional': Next card fades in from EITHER direction (for unidirectional progression)
   *
   * @default 'both'
   */
  direction?: SwipeDirection;
}

/**
 * Return value from useSwipeFadeAnimation hook
 */
export interface UseSwipeFadeAnimationReturn {
  /**
   * Animated style for current card
   * - Fades out as user swipes
   * - Parallax translation (0.5x)
   */
  currentCardStyle: ReturnType<typeof useAnimatedStyle>;

  /**
   * Animated style for next card (swipe left)
   * - Fades in from 0 to 1
   * - Positioned behind current card
   */
  nextCardStyle: ReturnType<typeof useAnimatedStyle>;

  /**
   * Animated style for previous card (swipe right)
   * - Fades in from 0 to 1
   * - Positioned behind current card
   */
  previousCardStyle: ReturnType<typeof useAnimatedStyle>;
}

/**
 * Parallax factor for current card movement
 * 0.5 = moves 50% of gesture distance
 */
const PARALLAX_FACTOR = 0.5;

/**
 * useSwipeFadeAnimation - Converts translateX to cross-fade animations
 *
 * Creates animated style objects that:
 * 1. Fade current card out as user swipes
 * 2. Fade next/previous card in simultaneously
 * 3. Apply subtle parallax to current card ONLY during active gestures
 * 4. Clamp values to prevent invalid opacity
 *
 * The animation creates a smooth cross-fade effect where:
 * - Swipe left: Current fades out, next fades in
 * - Swipe right: Current fades out, previous fades in
 * - Cancel: Everything springs back to original state
 *
 * Key optimization: Transform only applies during active gesture.
 * This prevents flash/offset issues when resetting translateX after state changes.
 *
 * @example
 * ```tsx
 * const { translateX, isActive } = useSwipeGesture({...});
 * const { currentCardStyle, nextCardStyle, previousCardStyle } =
 *   useSwipeFadeAnimation({
 *     translateX,
 *     isActive,
 *     screenWidth: width,
 *     direction: 'both',
 *   });
 *
 * return (
 *   <>
 *     <Animated.View style={[styles.card, previousCardStyle, { zIndex: 1 }]}>
 *       <PreviousCard />
 *     </Animated.View>
 *     <Animated.View style={[styles.card, currentCardStyle, { zIndex: 2 }]}>
 *       <CurrentCard />
 *     </Animated.View>
 *     <Animated.View style={[styles.card, nextCardStyle, { zIndex: 1 }]}>
 *       <NextCard />
 *     </Animated.View>
 *   </>
 * );
 * ```
 */
export function useSwipeFadeAnimation({
  translateX,
  screenWidth,
  isActive,
  direction = 'both',
}: UseSwipeFadeAnimationOptions): UseSwipeFadeAnimationReturn {
  /**
   * Current card style
   * - Opacity: 1 at center, fades to 0 at edges
   * - Transform: Parallax effect ONLY during active gesture
   */
  const currentCardStyle = useAnimatedStyle(() => {
    'worklet';

    const opacity = interpolate(
      translateX.value,
      [-screenWidth, 0, screenWidth],
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    // Apply transform only during active gesture
    const translateXValue = isActive.value ? translateX.value * PARALLAX_FACTOR : 0;

    return {
      opacity,
      transform: [{ translateX: translateXValue }],
    };
  });

  /**
   * Next card style (appears when swiping left, or both directions in unidirectional mode)
   * - Opacity: 0 at center, fades to 1 when swiped
   * - No transform (stays fixed)
   * - In 'unidirectional' mode: fades in from EITHER direction
   */
  const nextCardStyle = useAnimatedStyle(() => {
    'worklet';

    // Only animate if direction allows left swipes
    if (direction === 'right') {
      return { opacity: 0 };
    }

    // Unidirectional mode: fade in from either direction
    if (direction === 'unidirectional') {
      const opacity = interpolate(
        Math.abs(translateX.value), // Use absolute value for both directions
        [0, screenWidth],
        [0, 1],
        Extrapolation.CLAMP
      );

      return {
        opacity,
      };
    }

    // Standard left-only mode
    const opacity = interpolate(
      translateX.value,
      [0, -screenWidth],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  /**
   * Previous card style (appears when swiping right)
   * - Opacity: 0 at center, fades to 1 when swiped right
   * - No transform (stays fixed)
   */
  const previousCardStyle = useAnimatedStyle(() => {
    'worklet';

    // Only animate if direction allows right swipes
    if (direction === 'left') {
      return { opacity: 0 };
    }

    const opacity = interpolate(
      translateX.value,
      [0, screenWidth],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  return {
    currentCardStyle,
    nextCardStyle,
    previousCardStyle,
  };
}

/**
 * Export animation constants for testing
 */
export const SwipeFadeAnimationConstants = {
  PARALLAX_FACTOR,
};
