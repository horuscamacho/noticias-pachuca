/**
 * CategoryBadge Component
 * Displays article category with brutalist styling
 */

import React from 'react';
import { View, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../cards/NewsCard.tokens';
import type { CategoryBadgeProps } from '../cards/NewsCard.types';

/**
 * Category badge component with brutalist design
 * Shows uppercase category text with thick border
 *
 * @example
 * ```tsx
 * <CategoryBadge category="POLÍTICA" variant="brown" />
 * <CategoryBadge category="CULTURA" variant="yellow" size="large" />
 * ```
 */
export const CategoryBadge = React.memo<CategoryBadgeProps>(
  ({ category, variant, size = 'default' }) => {
    const isLarge = size === 'large';
    const isBrown = variant === 'brown';

    const containerStyle: ViewStyle = {
      backgroundColor: isBrown ? COLORS.primaryBrown : COLORS.accentYellow,
      paddingHorizontal: isLarge ? SPACING.md : SPACING.sm,
      paddingVertical: isLarge ? SPACING.sm : SPACING.xs,
      borderWidth: isLarge ? BORDERS.thick : BORDERS.medium,
      borderColor: COLORS.black,
      borderRadius: BORDERS.radius,
    };

    const textStyle: TextStyle = {
      fontSize: isLarge ? TYPOGRAPHY.categoryLabelLarge.fontSize : TYPOGRAPHY.categoryLabel.fontSize,
      lineHeight: isLarge ? TYPOGRAPHY.categoryLabelLarge.lineHeight : TYPOGRAPHY.categoryLabel.lineHeight,
      fontWeight: TYPOGRAPHY.categoryLabel.fontWeight,
      letterSpacing: TYPOGRAPHY.categoryLabel.letterSpacing,
      textTransform: 'uppercase',
      color: isBrown ? COLORS.white : COLORS.black,
    };

    return (
      <View style={containerStyle} accessible={false}>
        <ThemedText variant="caption" style={textStyle} numberOfLines={1}>
          {category}
        </ThemedText>
      </View>
    );
  }
);

CategoryBadge.displayName = 'CategoryBadge';
