import React from 'react';
import { View, ViewProps } from 'react-native';
import { ThemedText } from './ThemedText';

/**
 * Props for the CarouselSlide component
 */
export interface CarouselSlideProps {
  /**
   * Slide title (displayed with hero variant)
   */
  title: string;

  /**
   * Slide description (displayed with body variant)
   */
  description: string;

  /**
   * Window width for proper slide sizing
   */
  width: number;

  /**
   * Show image placeholder (temporary until real images are added)
   */
  imagePlaceholder?: boolean;

  /**
   * NativeWind/Tailwind className for additional styling
   */
  className?: string;

  /**
   * Accessibility label for the slide
   */
  accessibilityLabel?: string;
}

/**
 * Design tokens for carousel slide layout
 */
const SLIDE_TOKENS = {
  image: {
    height: 280, // Reduced height to make room for text
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#000000',
    marginHorizontal: 16,
    marginBottom: 24, // Space between image and text
  },
  content: {
    paddingHorizontal: 24,
    gap: 16,
  },
  colors: {
    title: '#000000', // Black for maximum contrast
    description: '#1F1F1F', // Slightly softer black for body text
    placeholder: '#854836', // Brown for placeholder text
  },
} as const;

/**
 * CarouselSlide - Individual slide component for onboarding carousel
 *
 * Displays a brutalist-styled slide with image placeholder, title, and description.
 * Uses ThemedText variants for consistent typography and responsive sizing.
 *
 * Layout Structure:
 * ┌─────────────────────────┐
 * │   IMAGE PLACEHOLDER     │
 * │   (400px height)        │
 * │   Border: 4px black     │
 * ├─────────────────────────┤
 * │   TITLE TEXT            │
 * │   (hero variant)        │
 * ├─────────────────────────┤
 * │   Description text      │
 * │   (body variant)        │
 * └─────────────────────────┘
 *
 * Design Features:
 * - Fixed slide width matching screen width
 * - 400px image placeholder with 4px black border
 * - 16px horizontal margin on image
 * - 24px horizontal padding on text content
 * - 16px vertical gap between elements
 * - Sharp corners (borderRadius: 0)
 * - Light gray background (#F7F7F7) for placeholder
 *
 * @example
 * ```tsx
 * // Basic usage
 * <CarouselSlide
 *   width={windowWidth}
 *   title="Breaking news"
 *   description="Follow stories as they unfold"
 *   imagePlaceholder
 * />
 *
 * // With custom styling
 * <CarouselSlide
 *   width={375}
 *   title="Stay informed"
 *   description="Get real-time updates"
 *   className="bg-white"
 *   accessibilityLabel="Onboarding slide 2: Stay informed with real-time updates"
 * />
 * ```
 */
export const CarouselSlide = React.memo<CarouselSlideProps>(
  ({
    title,
    description,
    width,
    imagePlaceholder = true,
    className,
    accessibilityLabel,
  }) => {
    // Default accessibility label
    const defaultA11yLabel = `${title}. ${description}`;

    return (
      <View
        style={{
          width,
          paddingVertical: 20, // Add vertical padding to entire slide
        }}
        className={className}
        accessible
        accessibilityRole="none"
        accessibilityLabel={accessibilityLabel || defaultA11yLabel}
      >
        {/* Image Placeholder Section */}
        {imagePlaceholder && (
          <View
            style={{
              height: SLIDE_TOKENS.image.height,
              backgroundColor: SLIDE_TOKENS.image.backgroundColor,
              borderWidth: SLIDE_TOKENS.image.borderWidth,
              borderColor: SLIDE_TOKENS.image.borderColor,
              marginHorizontal: SLIDE_TOKENS.image.marginHorizontal,
              marginBottom: SLIDE_TOKENS.image.marginBottom,
              borderRadius: 0, // Sharp corners
              justifyContent: 'center',
              alignItems: 'center',
            }}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            <ThemedText
              variant="caption"
              style={{ color: SLIDE_TOKENS.colors.placeholder }}
            >
              IMAGE PLACEHOLDER
            </ThemedText>
          </View>
        )}

        {/* Content Section */}
        <View
          style={{
            paddingHorizontal: SLIDE_TOKENS.content.paddingHorizontal,
            gap: SLIDE_TOKENS.content.gap,
          }}
        >
          {/* Title - Bold, uppercase, high contrast */}
          <ThemedText
            variant="h2"
            numberOfLines={2}
            style={{
              color: SLIDE_TOKENS.colors.title,
              textAlign: 'left',
            }}
          >
            {title}
          </ThemedText>

          {/* Description - Readable body text */}
          <ThemedText
            variant="body"
            numberOfLines={3}
            style={{
              color: SLIDE_TOKENS.colors.description,
              textAlign: 'left',
            }}
          >
            {description}
          </ThemedText>
        </View>
      </View>
    );
  }
);

CarouselSlide.displayName = 'CarouselSlide';

/**
 * Export design tokens for use in other components
 */
export const CAROUSEL_SLIDE_TOKENS = SLIDE_TOKENS;
