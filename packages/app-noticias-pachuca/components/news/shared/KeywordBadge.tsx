/**
 * KeywordBadge Component
 * Displays article keywords with brutalist styling
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface KeywordBadgeProps {
  keyword: string;
  className?: string;
}

/**
 * Keyword badge component with brutalist design
 * Shows uppercase keyword text with border
 *
 * @example
 * ```tsx
 * <KeywordBadge keyword="política" />
 * <KeywordBadge keyword="hidalgo" />
 * ```
 */
export const KeywordBadge = React.memo<KeywordBadgeProps>(({ keyword }) => {
  return (
    <View style={styles.container}>
      <ThemedText variant="overline" style={styles.text} numberOfLines={1}>
        {keyword}
      </ThemedText>
    </View>
  );
});

KeywordBadge.displayName = 'KeywordBadge';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F7F7F7',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
  } as ViewStyle,
  text: {
    color: '#000000',
  } as TextStyle,
});
