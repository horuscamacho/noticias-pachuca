/**
 * Compact Header Component
 * Sticky header that appears when main header scrolls out of view
 * Positioned absolutely at the top of the screen
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { Logo } from '@/components/Logo';

interface CompactHeaderProps {
  /**
   * Optional test ID for testing
   */
  testID?: string;
}

/**
 * CompactHeader - Sticky header with logo, time, and weather
 *
 * Design:
 * - Positioned absolutely at top of screen
 * - White background with opacity control from parent
 * - Respects safe area insets for notch/dynamic island
 * - Contains: Logo (left) + Time & Weather (right)
 *
 * @example
 * <Animated.View style={[styles.compact, compactHeaderStyle]}>
 *   <CompactHeader />
 * </Animated.View>
 */
export const CompactHeader: React.FC<CompactHeaderProps> = ({ testID }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container} testID={testID}>
      {/* Header Content */}
      <View style={styles.content}>
        {/* Left: Logo */}
        <View style={[styles.logoContainer, { marginLeft: Math.max(insets.left, 16) }]}>
          <Logo size="small" style={styles.compactLogo} />
        </View>

        {/* Right: Time & Weather */}
        <View style={[styles.rightContainer, { marginRight: Math.max(insets.right, 16) }]}>
          {/* Time */}
          <ThemedText variant="body" style={styles.timeText}>
            {new Date().toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </ThemedText>

          {/* Weather placeholder */}
          <View style={styles.weatherContainer}>
            <ThemedText variant="small" style={styles.weatherText}>
              25°C ☀️
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Subscription Banner (compact version) */}
      <View style={styles.bannerContainer}>
        <View style={styles.banner}>
          <ThemedText variant="caption" style={styles.bannerText} numberOfLines={1}>
            SUSCRÍBETE PARA VIVIR LA NUEVA EXPERIENCIA
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 3,
    borderBottomColor: '#000000',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactLogo: {
    transform: [{ scale: 0.8 }],
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  weatherContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F7F7F7',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#000000',
  },
  weatherText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000000',
  },
  bannerContainer: {
    overflow: 'hidden',
  },
  banner: {
    height: 40,
    backgroundColor: '#854836',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderTopWidth: 3,
    borderTopColor: '#000000',
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
