/**
 * ArticleCollapsibleHeader - Collapsible header for article screens
 *
 * A brutalist-design header component that animates in/out based on scroll position.
 * Features:
 * - Logo and date/weather information
 * - Back button to return to home
 * - Animated opacity with shared value
 * - Safe area insets handling
 * - Responsive brutalist styling
 *
 * Usage:
 * ```tsx
 * const scrollY = useSharedValue(0);
 * const animatedOpacity = useDerivedValue(() => {
 *   return scrollY.value > 100 ? withTiming(1) : withTiming(0);
 * });
 *
 * <ArticleCollapsibleHeader
 *   onBackPress={() => router.back()}
 *   animatedOpacity={animatedOpacity}
 * />
 * ```
 */

import React, { useMemo } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/Logo';
import { BrutalistButton } from '@/components/BrutalistButton';
import { ThemedText } from '@/components/ThemedText';

/**
 * Estimated height of the header including safe area top
 * Export for use in scroll calculations
 */
export const ARTICLE_COLLAPSIBLE_HEADER_HEIGHT = 192;

/**
 * Props interface for ArticleCollapsibleHeader
 */
export interface ArticleCollapsibleHeaderProps {
  /**
   * Callback when back button is pressed
   */
  onBackPress: () => void;

  /**
   * Animated shared value controlling opacity (0-1)
   * Use useDerivedValue with scroll position to control visibility
   */
  animatedOpacity: SharedValue<number>;

  /**
   * Test ID for automated testing
   * @default 'article-collapsible-header'
   */
  testID?: string;
}

/**
 * Spanish day names for date formatting
 */
const SPANISH_DAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

/**
 * Spanish month abbreviations
 */
const SPANISH_MONTHS = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC',
];

/**
 * Format current date in Spanish brutalist style
 * @example "VIE, 24 DE OCT DE 2025"
 */
const formatDate = (): string => {
  const now = new Date();
  const day = SPANISH_DAYS[now.getDay()];
  const date = now.getDate();
  const month = SPANISH_MONTHS[now.getMonth()];
  const year = now.getFullYear();
  return `${day}, ${date} DE ${month} DE ${year}`;
};

/**
 * Get current weather info (mock for now)
 * In production, this would come from a weather API
 */
const getWeatherInfo = (): string => {
  return '23°C PACHUCA';
};

/**
 * ArticleCollapsibleHeader Component
 *
 * Animated header that appears/disappears based on scroll position.
 * Provides navigation and contextual information for article screens.
 */
export const ArticleCollapsibleHeader = React.memo<ArticleCollapsibleHeaderProps>(
  ({ onBackPress, animatedOpacity, testID = 'article-collapsible-header' }) => {
    // Get safe area insets for proper positioning
    const insets = useSafeAreaInsets();

    // Memoize date and weather to prevent unnecessary recalculations
    const currentDate = useMemo(() => formatDate(), []);
    const currentWeather = useMemo(() => getWeatherInfo(), []);

    // Animated style for opacity-based visibility
    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: animatedOpacity.value,
        // Disable pointer events when invisible to prevent touch interception
        pointerEvents: animatedOpacity.value > 0.5 ? 'auto' : 'none',
      } as ViewStyle;
    });

    // Container style with safe area top padding
    const containerStyle = useMemo<ViewStyle>(
      () => ({
        paddingTop: insets.top,
      }),
      [insets.top]
    );

    return (
      <Animated.View
        style={[styles.container, containerStyle, animatedStyle]}
        testID={testID}
        accessibilityLabel="Cabecera colapsable del artículo"
        accessibilityRole="header"
      >
        {/* Top Row: Logo + Date/Weather */}
        <View style={styles.topRow}>
          {/* Logo Container (Left) */}
          <View style={styles.logoContainer}>
            <Logo
              size="small"
              accessibilityLabel="Logo Noticias Pachuca"
              testID={`${testID}-logo`}
            />
          </View>

          {/* Date/Weather Container (Right) */}
          <View style={styles.infoContainer}>
            {/* Date */}
            <ThemedText
              variant="overline"
              style={styles.dateText}
              numberOfLines={1}
              testID={`${testID}-date`}
              accessibilityLabel={`Fecha: ${currentDate}`}
            >
              {currentDate}
            </ThemedText>

            {/* Weather */}
            <View style={styles.weatherRow}>
              <Ionicons
                name="cloud-outline"
                size={14}
                color="#4B5563"
                accessibilityElementsHidden={true}
              />
              <ThemedText
                variant="small"
                style={styles.weatherText}
                numberOfLines={1}
                testID={`${testID}-weather`}
                accessibilityLabel={`Clima: ${currentWeather}`}
              >
                {currentWeather}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Back Button */}
        <BrutalistButton
          variant="primary"
          onPress={onBackPress}
          style={styles.backButton}
          testID={`${testID}-back-button`}
          accessibilityLabel="Volver"
          accessibilityHint="Navegar de regreso a la pantalla principal"
        >
          ← VOLVER
        </BrutalistButton>
      </Animated.View>
    );
  }
);

// Display name for debugging
ArticleCollapsibleHeader.displayName = 'ArticleCollapsibleHeader';

/**
 * Styles
 */
const styles = StyleSheet.create({
  // Container
  container: {
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
  } as ViewStyle,

  // Top Row (Logo + Info)
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,

  // Logo Container
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 16,
  } as ViewStyle,

  // Date/Weather Container
  infoContainer: {
    alignItems: 'flex-end',
    gap: 4,
  } as ViewStyle,

  // Date Text
  dateText: {
    color: '#000000',
    fontSize: 11,
  },

  // Weather Row
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,

  // Weather Text
  weatherText: {
    color: '#4B5563',
    fontSize: 12,
  },

  // Back Button
  backButton: {
    marginTop: 12,
    maxWidth: 180,
    alignSelf: 'flex-start',
  } as ViewStyle,
});

/**
 * Accessibility Checklist:
 * - [x] Proper accessibilityRole="header" on container
 * - [x] Descriptive accessibilityLabel for all interactive elements
 * - [x] accessibilityHint on back button explains action
 * - [x] Decorative icons hidden from screen readers
 * - [x] Date/weather formatted for screen reader announcement
 * - [x] Button has proper accessibility state
 * - [x] Text meets minimum size requirements (11px+)
 * - [x] Touch targets meet 44pt minimum (BrutalistButton handles this)
 *
 * Performance Considerations:
 * - [x] React.memo prevents unnecessary re-renders
 * - [x] useMemo for date/weather computation
 * - [x] useMemo for containerStyle with insets
 * - [x] useAnimatedStyle for smooth 60fps animations
 * - [x] Reanimated for native-thread animations
 * - [x] Pointer events disabled when invisible
 */
