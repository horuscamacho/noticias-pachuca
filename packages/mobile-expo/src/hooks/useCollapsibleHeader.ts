import { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';

interface UseCollapsibleHeaderProps {
  headerHeight: number;
  logoHeight: number;
}

export const useCollapsibleHeader = ({ headerHeight, logoHeight }: UseCollapsibleHeaderProps) => {
  // Shared value for scroll offset
  const scrollY = useSharedValue(0);

  // Scroll handler for tab ScrollViews
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Logo opacity animation (fades out as user scrolls)
  const logoAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, logoHeight],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  // Banner opacity animation (also fades out)
  const bannerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, headerHeight - logoHeight],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  return {
    scrollY,
    scrollHandler,
    logoAnimatedStyle,
    bannerAnimatedStyle,
  };
};
