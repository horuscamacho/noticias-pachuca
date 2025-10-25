/**
 * AuthorInfo Component
 * Displays author name with optional timestamp
 */

import React from 'react';
import { View, StyleSheet, TextStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { COLORS, SPACING, TYPOGRAPHY } from '../cards/NewsCard.tokens';
import type { AuthorInfoProps } from '../cards/NewsCard.types';

/**
 * Author information display component
 * Shows "Por [Author Name]" with optional date
 *
 * @example
 * ```tsx
 * <AuthorInfo author="María González" />
 * <AuthorInfo author="Carlos Ramírez" publishedAt="2025-10-24" />
 * ```
 */
export const AuthorInfo = React.memo<AuthorInfoProps>(({ author, publishedAt }) => {
  const textStyle: TextStyle = {
    fontSize: TYPOGRAPHY.authorText.fontSize,
    lineHeight: TYPOGRAPHY.authorText.lineHeight,
    fontWeight: TYPOGRAPHY.authorText.fontWeight,
    letterSpacing: TYPOGRAPHY.authorText.letterSpacing,
    color: COLORS.textSecondary,
  };

  return (
    <View style={styles.container}>
      <ThemedText variant="small" style={textStyle} numberOfLines={1}>
        Por {author}
      </ThemedText>
      {publishedAt && (
        <>
          <View style={styles.separator} />
          <ThemedText variant="small" style={textStyle} numberOfLines={1}>
            {publishedAt}
          </ThemedText>
        </>
      )}
    </View>
  );
});

AuthorInfo.displayName = 'AuthorInfo';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  separator: {
    width: 3,
    height: 3,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 1.5,
  },
});
