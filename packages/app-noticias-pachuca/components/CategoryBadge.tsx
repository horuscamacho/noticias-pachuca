/**
 * CategoryBadge Component
 * Brutalist category indicator for articles
 * Reusable across Quick Read, Home, and Article screens
 *
 * @module components/CategoryBadge
 * @version 1.0.0
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from './ThemedText';

/**
 * Category color mapping
 * Based on brutalist design system
 */
const CATEGORY_COLORS: Record<string, string> = {
  deportes: '#854836', // Brown
  politica: '#FFB22C', // Yellow
  economia: '#FF0000', // Red
  salud: '#000000', // Black
  seguridad: '#854836', // Brown
  estado: '#FFB22C', // Yellow
  todas: '#000000', // Black (fallback)
};

/**
 * Props for CategoryBadge component
 */
export interface CategoryBadgeProps {
  /**
   * Category ID (slug format)
   * @example 'deportes', 'politica', 'economia'
   */
  categoryId: string;

  /**
   * Display label (uppercase recommended)
   * @example 'DEPORTES', 'POLÍTICA'
   */
  label: string;

  /**
   * Custom background color (overrides default)
   * @example '#854836'
   */
  backgroundColor?: string;

  /**
   * Custom text color (default: white)
   * @example '#000000'
   */
  textColor?: string;

  /**
   * Badge size variant
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Additional inline styles
   */
  style?: ViewStyle;

  /**
   * NativeWind/Tailwind className
   */
  className?: string;

  /**
   * Accessibility label override
   */
  accessibilityLabel?: string;
}

/**
 * Size configuration for badge variants
 */
const BADGE_SIZES = {
  small: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    fontSize: { phone: 10, tablet: 11 },
    borderWidth: 3,
  },
  medium: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: { phone: 11, tablet: 12 },
    borderWidth: 4,
  },
  large: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    fontSize: { phone: 12, tablet: 14 },
    borderWidth: 4,
  },
} as const;

/**
 * CategoryBadge - Brutalist category indicator
 *
 * A reusable category badge component with brutalist styling:
 * - Thick black borders (3-4px)
 * - Sharp corners (no border-radius)
 * - Category-specific background colors
 * - White uppercase text
 * - Three size variants
 *
 * Design Features:
 * - Background color based on category (brown, yellow, red, black)
 * - 4px black border (3px for small variant)
 * - Sharp corners (borderRadius: 0)
 * - Uppercase bold text
 * - White text color (high contrast)
 * - Padding: 8px vertical × 16px horizontal (medium)
 *
 * @example
 * ```tsx
 * // Default usage
 * <CategoryBadge
 *   categoryId="deportes"
 *   label="DEPORTES"
 * />
 *
 * // Small variant
 * <CategoryBadge
 *   categoryId="politica"
 *   label="POLÍTICA"
 *   size="small"
 * />
 *
 * // Custom color
 * <CategoryBadge
 *   categoryId="custom"
 *   label="ESPECIAL"
 *   backgroundColor="#FF0000"
 * />
 *
 * // Overlaid on image (Quick Read)
 * <View style={{ position: 'relative' }}>
 *   <Image ... />
 *   <CategoryBadge
 *     categoryId="deportes"
 *     label="DEPORTES"
 *     style={{
 *       position: 'absolute',
 *       bottom: 16,
 *       left: 16,
 *     }}
 *   />
 * </View>
 * ```
 */
export const CategoryBadge = React.memo<CategoryBadgeProps>(
  ({
    categoryId,
    label,
    backgroundColor,
    textColor = '#FFFFFF',
    size = 'medium',
    style,
    className,
    accessibilityLabel,
  }) => {
    // Get background color (custom or from map)
    const bgColor = backgroundColor || CATEGORY_COLORS[categoryId] || CATEGORY_COLORS.todas;

    // Get size configuration
    const sizeConfig = BADGE_SIZES[size];

    // Compute container style
    const containerStyle: ViewStyle = {
      backgroundColor: bgColor,
      paddingVertical: sizeConfig.paddingVertical,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      borderWidth: sizeConfig.borderWidth,
      borderColor: '#000000', // Always black border
      borderRadius: 0, // Sharp corners (brutalist)
      alignSelf: 'flex-start', // Shrink to content width
    };

    // Default accessibility label
    const a11yLabel = accessibilityLabel || `Categoría: ${label}`;

    return (
      <View
        style={[containerStyle, style]}
        className={className}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={a11yLabel}
      >
        <ThemedText
          variant="breakingNewsBadge"
          style={{
            color: textColor,
            fontSize: sizeConfig.fontSize.phone, // Will be responsive via ThemedText
          }}
          numberOfLines={1}
          accessibilityElementsHidden={true} // Parent has label
        >
          {label.toUpperCase()}
        </ThemedText>
      </View>
    );
  }
);

// Display name for debugging
CategoryBadge.displayName = 'CategoryBadge';

/**
 * Helper function to get category color
 * Useful for other components that need category colors
 *
 * @example
 * ```tsx
 * const badgeColor = getCategoryColor('deportes'); // '#854836'
 * ```
 */
export const getCategoryColor = (categoryId: string): string => {
  return CATEGORY_COLORS[categoryId] || CATEGORY_COLORS.todas;
};

/**
 * Export category color map for external use
 */
export const CATEGORY_COLOR_MAP = CATEGORY_COLORS;

/**
 * Available category IDs
 */
export type CategoryId = keyof typeof CATEGORY_COLORS;

/**
 * Available badge sizes
 */
export type BadgeSize = keyof typeof BADGE_SIZES;
