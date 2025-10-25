/**
 * QuoteBox Component
 * Highlighted quote box with brutalist design
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ThemedText } from './ThemedText';
import { DecorativeCorner } from './DecorativeCorner';

export type QuoteBoxVariant = 'default' | 'highlighted';

interface QuoteBoxProps {
  children: string | React.ReactNode;
  variant?: QuoteBoxVariant;
  showDiamonds?: boolean;
  author?: string;
  className?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Quote box component with brutalist design
 * Black background, yellow/red border, decorative corners
 *
 * @example
 * ```tsx
 * <QuoteBox variant="default" showDiamonds={true}>
 *   Este certificado de cumplimiento con la calificación más alta...
 * </QuoteBox>
 * ```
 */
export const QuoteBox = React.memo<QuoteBoxProps>(
  ({
    children,
    variant = 'default',
    showDiamonds = true,
    author,
    style,
    testID = 'quote-box',
  }) => {
    const borderColor = variant === 'highlighted' ? '#FF0000' : '#FFB22C';
    const textContent = typeof children === 'string' ? children : '';

    return (
      <View
        style={[styles.container, { borderColor }, style]}
        testID={testID}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`Cita destacada: ${textContent}${author ? ` por ${author}` : ''}`}
        accessibilityHint="Fragmento destacado del artículo"
      >
        {/* Quote Text */}
        <ThemedText variant="quote" style={styles.quoteText}>
          {children}
        </ThemedText>

        {/* Author (optional) */}
        {author && (
          <ThemedText variant="small" style={styles.authorText}>
            — {author}
          </ThemedText>
        )}
      </View>
    );
  }
);

QuoteBox.displayName = 'QuoteBox';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#854836',
    borderRadius: 0,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginVertical: 24,
    marginHorizontal: 16,
    position: 'relative',
  } as ViewStyle,
  quoteText: {
    color: '#000000',
    fontStyle: 'italic',
    lineHeight: 26,
  } as TextStyle,
  authorText: {
    color: '#4B5563',
    marginTop: 12,
    fontStyle: 'italic',
    fontSize: 14,
  } as TextStyle,
});
