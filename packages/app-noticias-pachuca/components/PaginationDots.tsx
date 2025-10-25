import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewProps } from 'react-native';

/**
 * Props for the PaginationDots component
 */
export interface PaginationDotsProps {
  /**
   * Total number of dots to display
   */
  total: number;

  /**
   * Index of the currently active dot (0-based)
   */
  activeIndex: number;

  /**
   * NativeWind/Tailwind className for additional styling
   */
  className?: string;

  /**
   * Accessibility label for the pagination indicator
   */
  accessibilityLabel?: string;
}

/**
 * Design tokens for brutalist pagination dots
 */
const DOT_TOKENS = {
  // Inactive dot dimensions
  inactive: {
    width: 8,
    height: 8,
    backgroundColor: '#F7F7F7',
  },
  // Active dot dimensions
  active: {
    width: 32,
    height: 8,
    backgroundColor: '#FFFFFF',
  },
  // Shared properties
  borderWidth: 2,
  borderColor: '#000000',
  borderRadius: 0, // Sharp corners for brutalist aesthetic
  gap: 8, // Space between dots
} as const;

/**
 * Single animated pagination dot component
 */
interface DotProps {
  isActive: boolean;
  index: number;
}

const Dot = React.memo<DotProps>(({ isActive, index }) => {
  // Animated value for width transition
  const widthAnim = useRef(
    new Animated.Value(
      isActive ? DOT_TOKENS.active.width : DOT_TOKENS.inactive.width
    )
  ).current;

  // Animate width when active state changes
  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: isActive ? DOT_TOKENS.active.width : DOT_TOKENS.inactive.width,
      useNativeDriver: false, // Width can't use native driver
      friction: 7,
      tension: 40,
    }).start();
  }, [isActive, widthAnim]);

  return (
    <Animated.View
      style={{
        width: widthAnim,
        height: DOT_TOKENS.active.height,
        backgroundColor: isActive
          ? DOT_TOKENS.active.backgroundColor
          : DOT_TOKENS.inactive.backgroundColor,
        borderWidth: DOT_TOKENS.borderWidth,
        borderColor: DOT_TOKENS.borderColor,
        borderRadius: DOT_TOKENS.borderRadius,
      }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
});

Dot.displayName = 'PaginationDot';

/**
 * PaginationDots - Brutalist carousel pagination indicator
 *
 * Displays square dots with animated transitions for carousel navigation.
 * Active dot expands to 32px wide while inactive dots remain 8x8px.
 * Uses spring animation for smooth, natural transitions.
 *
 * Design Features:
 * - Square dots (borderRadius: 0) for brutalist aesthetic
 * - Active: 32px x 8px, white background, black border
 * - Inactive: 8px x 8px, light gray background, black border
 * - 2px black borders on all dots
 * - 8px gap between dots
 * - Spring animation for width transitions
 *
 * @example
 * ```tsx
 * // Basic usage with carousel
 * <PaginationDots total={3} activeIndex={currentSlide} />
 *
 * // With custom styling
 * <PaginationDots
 *   total={5}
 *   activeIndex={2}
 *   className="mt-4"
 *   accessibilityLabel="Onboarding progress: slide 3 of 5"
 * />
 * ```
 */
export const PaginationDots = React.memo<PaginationDotsProps>(
  ({ total, activeIndex, className, accessibilityLabel }) => {
    // Generate array of dot indices
    const dots = Array.from({ length: total }, (_, i) => i);

    // Default accessibility label
    const defaultA11yLabel = `Page ${activeIndex + 1} of ${total}`;

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: DOT_TOKENS.gap,
        }}
        className={className}
        accessible
        accessibilityRole="none"
        accessibilityLabel={accessibilityLabel || defaultA11yLabel}
      >
        {dots.map((index) => (
          <Dot key={index} isActive={index === activeIndex} index={index} />
        ))}
      </View>
    );
  }
);

PaginationDots.displayName = 'PaginationDots';

/**
 * Export design tokens for use in other components
 */
export const PAGINATION_DOT_TOKENS = DOT_TOKENS;
