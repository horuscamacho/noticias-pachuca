/**
 * Custom hook for collapsible header animations with FAKE SCROLL effect
 * Uses React Native Reanimated v4.1.1 for smooth 60fps animations
 *
 * Architecture:
 * - CollapsibleHeader is absolutely positioned (doesn't scroll)
 * - Each tab has ScrollView with "dead space" at top (height = header height)
 * - As dead space scrolls away, header opacity animates to simulate scrolling
 * - CompactHeader fades in as CollapsibleHeader fades out
 */

import { useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, interpolate, Extrapolation } from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';

interface UseCollapsibleHeaderReturn {
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  scrollY: ReturnType<typeof useSharedValue<number>>;
  headerHeight: ReturnType<typeof useSharedValue<number>>;
  mainHeaderStyle: ViewStyle;
  compactHeaderStyle: ViewStyle;
  tabBarStyle: ViewStyle;
  setHeaderHeight: (height: number) => void;
}

/**
 * Hook for managing fake scroll collapsible header animations
 *
 * @returns Object containing scroll handler, animated styles, and header height setter
 *
 * @example
 * const { scrollHandler, mainHeaderStyle, compactHeaderStyle, setHeaderHeight, headerHeight } = useCollapsibleHeader();
 *
 * <Animated.View style={[styles.absolute, mainHeaderStyle]} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
 *   <CollapsibleHeader />
 * </Animated.View>
 *
 * <BrutalistTabs headerHeight={headerHeight.value} scrollHandler={scrollHandler} />
 */
export const useCollapsibleHeader = (initialScrollY = 0): UseCollapsibleHeaderReturn => {
  // Shared values for scroll position and header height
  const scrollY = useSharedValue(initialScrollY);
  const headerHeight = useSharedValue(0);

  // Scroll handler - runs on UI thread for 60fps performance
  // This will be passed to each tab's ScrollView
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Main header opacity animation
  // Fades out as dead space scrolls away (creating fake scroll illusion)
  const mainHeaderStyle = useAnimatedStyle(() => {
    'worklet';

    // Guard: Don't animate until header height is measured
    if (headerHeight.value === 0) {
      return { opacity: 1 };
    }

    // Fade out as user scrolls through the dead space
    return {
      opacity: interpolate(
        scrollY.value,
        [0, headerHeight.value],
        [1, 0],
        Extrapolation.CLAMP
      ),
    };
  });

  // Compact header opacity animation
  // Fades in as main header fades out (inverse animation)
  const compactHeaderStyle = useAnimatedStyle(() => {
    'worklet';

    // Guard: Don't animate until header height is measured
    if (headerHeight.value === 0) {
      return { opacity: 0 };
    }

    // Fade in as user scrolls through dead space
    return {
      opacity: interpolate(
        scrollY.value,
        [0, headerHeight.value],
        [0, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  // Tab bar animation
  // Fades out with main header (same opacity animation)
  const tabBarStyle = useAnimatedStyle(() => {
    'worklet';

    // Guard: Don't animate until header height is measured
    if (headerHeight.value === 0) {
      return { opacity: 1 };
    }

    // Same fade out as main header
    return {
      opacity: interpolate(
        scrollY.value,
        [0, headerHeight.value],
        [1, 0],
        Extrapolation.CLAMP
      ),
    };
  });

  // Helper function to update header height from onLayout
  const setHeaderHeight = (height: number) => {
    headerHeight.value = height;
  };

  return {
    scrollHandler,
    scrollY,
    headerHeight,
    mainHeaderStyle,
    compactHeaderStyle,
    tabBarStyle,
    setHeaderHeight,
  };
};
