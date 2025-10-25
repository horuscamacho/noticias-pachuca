/**
 * ArticleHeaderEnhanced Component
 * Premium header for individual article screens with date, logo, and back button
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './ThemedText';
import { Logo } from './Logo';
import { DecorativeCorner } from './DecorativeCorner';
import { BrutalistButton } from './BrutalistButton';

interface ArticleHeaderEnhancedProps {
  date: Date | string;
  onBackPress: () => void;
  sticky?: boolean;
  showDiamonds?: boolean;
  className?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Formats date to short Spanish format
 * Example: "VIE, 24 DE OCT DE 2025"
 */
function formatShortDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
  const months = [
    'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
    'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
  ];

  const dayName = days[dateObj.getDay()];
  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  return `${dayName}, ${day} DE ${month} DE ${year}`;
}

/**
 * Enhanced article header with premium brutalist design
 *
 * @example
 * ```tsx
 * <ArticleHeaderEnhanced
 *   date={new Date()}
 *   onBackPress={() => router.back()}
 *   showDiamonds={true}
 * />
 * ```
 */
export const ArticleHeaderEnhanced = React.memo<ArticleHeaderEnhancedProps>(
  ({
    date,
    onBackPress,
    sticky = false,
    showDiamonds = true,
    style,
    testID = 'article-header-enhanced',
  }) => {
    const insets = useSafeAreaInsets();
    const formattedDate = useMemo(() => formatShortDate(date), [date]);

    const containerStyle = useMemo<ViewStyle>(
      () => ({
        ...styles.container,
        paddingTop: insets.top + 16,
        ...(sticky && styles.sticky),
      }),
      [insets.top, sticky]
    );

    return (
      <View
        style={[containerStyle, style]}
        testID={testID}
        accessible={true}
        accessibilityRole="header"
      >
        {/* Top Bar: Date + Edition */}
        <View style={styles.topBar}>
          <ThemedText variant="overline" style={styles.dateText}>
            {formattedDate}
          </ThemedText>
          <ThemedText variant="overline" style={styles.editionText}>
            EDICIÓN DE HOY
          </ThemedText>
        </View>

        {/* Logo Section */}
        <View style={styles.logoContainer}>
          {showDiamonds && (
            <>
              <DecorativeCorner
                variant="red"
                position="top-left"
                size="small"
              />
              <DecorativeCorner
                variant="red"
                position="top-right"
                size="small"
              />
            </>
          )}
          <Logo
            size="medium"
            accessibilityLabel="Noticias Pachuca"
          />
        </View>

        {/* Back Button Bar */}
        <BrutalistButton
          variant="primary"
          onPress={onBackPress}
          fullWidth
          accessibilityLabel="Volver al inicio"
          accessibilityHint="Regresa a la lista de noticias"
          testID={`${testID}-back-button`}
        >
          ← VOLVER AL INICIO
        </BrutalistButton>
      </View>
    );
  }
);

ArticleHeaderEnhanced.displayName = 'ArticleHeaderEnhanced';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 16,
    paddingBottom: 16,
  } as ViewStyle,
  sticky: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,
  dateText: {
    color: '#000000',
    fontSize: 11,
  } as TextStyle,
  editionText: {
    color: '#854836',
    fontSize: 11,
  } as TextStyle,
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  } as ViewStyle,
});
