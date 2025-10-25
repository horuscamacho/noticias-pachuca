import { useRef, useState, useCallback } from 'react';
import {
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';

/**
 * Return type for the useCarousel hook
 */
export interface UseCarouselReturn {
  /**
   * Currently active slide index (0-based)
   */
  activeIndex: number;

  /**
   * Ref to the ScrollView component for programmatic control
   */
  scrollViewRef: React.RefObject<ScrollView | null>;

  /**
   * Scroll event handler to track active slide
   */
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

  /**
   * Programmatically navigate to a specific slide
   * @param index - Target slide index (0-based)
   */
  goToSlide: (index: number) => void;

  /**
   * Current window width for responsive sizing
   */
  width: number;
}

/**
 * Custom hook for carousel logic
 *
 * Manages carousel state, scroll tracking, and programmatic navigation.
 * Separates business logic from presentation for clean architecture.
 *
 * @param totalSlides - Total number of slides in the carousel
 * @returns Object with carousel state and control methods
 *
 * @example
 * ```tsx
 * function MyCarousel() {
 *   const { activeIndex, scrollViewRef, handleScroll, goToSlide, width } = useCarousel(3);
 *
 *   return (
 *     <>
 *       <ScrollView
 *         ref={scrollViewRef}
 *         horizontal
 *         pagingEnabled
 *         onScroll={handleScroll}
 *         scrollEventThrottle={16}
 *       >
 *         {slides.map((slide, index) => (
 *           <View key={index} style={{ width }}>
 *             <Text>{slide.title}</Text>
 *           </View>
 *         ))}
 *       </ScrollView>
 *       <Button onPress={() => goToSlide(1)}>Go to Slide 2</Button>
 *     </>
 *   );
 * }
 * ```
 */
export function useCarousel(totalSlides: number): UseCarouselReturn {
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  /**
   * Handle scroll events to update active slide index
   * Calculates the current slide based on horizontal scroll position
   */
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollPosition = event.nativeEvent.contentOffset.x;
      const index = Math.round(scrollPosition / width);

      // Only update if index changed and is valid
      if (index !== activeIndex && index >= 0 && index < totalSlides) {
        setActiveIndex(index);
      }
    },
    [width, activeIndex, totalSlides]
  );

  /**
   * Programmatically scroll to a specific slide
   * Includes bounds checking and smooth animation
   */
  const goToSlide = useCallback(
    (index: number) => {
      // Validate index bounds
      if (index >= 0 && index < totalSlides) {
        scrollViewRef.current?.scrollTo({
          x: index * width,
          animated: true,
        });
        setActiveIndex(index);
      }
    },
    [width, totalSlides]
  );

  return {
    activeIndex,
    scrollViewRef,
    handleScroll,
    goToSlide,
    width,
  };
}
