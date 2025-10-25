import React, { useCallback, useEffect } from 'react';
import { ScrollView, View, ViewProps } from 'react-native';
import { useCarousel } from '../hooks/useCarousel';
import { CarouselSlide } from './CarouselSlide';

/**
 * Data structure for a single onboarding slide
 */
export interface OnboardingSlide {
  /**
   * Unique identifier for the slide
   */
  id: number;

  /**
   * Slide title (hero text)
   */
  title: string;

  /**
   * Slide description (body text)
   */
  description: string;
}

/**
 * Props for the OnboardingCarousel component
 */
export interface OnboardingCarouselProps {
  /**
   * Array of slide data to display
   */
  slides: OnboardingSlide[];

  /**
   * Callback fired when the active slide changes
   * @param index - New active slide index (0-based)
   */
  onSlideChange?: (index: number) => void;

  /**
   * NativeWind/Tailwind className for additional styling
   */
  className?: string;

  /**
   * Accessibility label for the carousel
   */
  accessibilityLabel?: string;
}

/**
 * OnboardingCarousel - Container component for onboarding slides
 *
 * Manages carousel state and logic using the useCarousel hook.
 * Renders slides in a horizontally scrollable view with paging enabled.
 * Provides separation of concerns by delegating presentation to CarouselSlide.
 *
 * Features:
 * - Horizontal scroll with snap-to-page behavior
 * - Automatic active slide tracking
 * - Callback on slide change
 * - Responsive to window dimensions
 * - Smooth scroll event handling (16fps throttle)
 * - Programmatic navigation support via ref
 * - Full accessibility support
 *
 * Architecture:
 * - Logic: useCarousel hook (state management)
 * - Presentation: CarouselSlide component (UI)
 * - Container: This component (composition)
 *
 * @example
 * ```tsx
 * // Basic usage
 * const slides = [
 *   { id: 1, title: 'Breaking news', description: 'Follow stories...' },
 *   { id: 2, title: 'Stay informed', description: 'Get updates...' },
 *   { id: 3, title: 'Trusted sources', description: 'Read verified...' },
 * ];
 *
 * <OnboardingCarousel
 *   slides={slides}
 *   onSlideChange={(index) => console.log('Now on slide:', index)}
 * />
 *
 * // With pagination dots
 * function OnboardingScreen() {
 *   const [activeSlide, setActiveSlide] = useState(0);
 *
 *   return (
 *     <View>
 *       <OnboardingCarousel
 *         slides={slides}
 *         onSlideChange={setActiveSlide}
 *       />
 *       <PaginationDots total={slides.length} activeIndex={activeSlide} />
 *     </View>
 *   );
 * }
 * ```
 */
export const OnboardingCarousel = React.memo<OnboardingCarouselProps>(
  ({ slides, onSlideChange, className, accessibilityLabel }) => {
    // Use custom hook for carousel logic
    const { activeIndex, scrollViewRef, handleScroll, width } = useCarousel(
      slides.length
    );

    // Notify parent when active slide changes
    useEffect(() => {
      onSlideChange?.(activeIndex);
    }, [activeIndex, onSlideChange]);

    // Default accessibility label
    const defaultA11yLabel = `Onboarding carousel with ${slides.length} slides`;

    return (
      <View
        className={className}
        accessible={false} // Let ScrollView handle accessibility
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16} // Update every ~60fps frame
          decelerationRate="fast"
          snapToInterval={width} // Ensure snapping to full width
          snapToAlignment="start"
          contentContainerStyle={{
            // Ensure proper layout
            flexDirection: 'row',
          }}
          accessibilityLabel={accessibilityLabel || defaultA11yLabel}
          accessibilityRole="none"
        >
          {slides.map((slide, index) => (
            <CarouselSlide
              key={slide.id}
              width={width}
              title={slide.title}
              description={slide.description}
              imagePlaceholder
              accessibilityLabel={`Slide ${index + 1} of ${slides.length}: ${slide.title}. ${slide.description}`}
            />
          ))}
        </ScrollView>
      </View>
    );
  }
);

OnboardingCarousel.displayName = 'OnboardingCarousel';
