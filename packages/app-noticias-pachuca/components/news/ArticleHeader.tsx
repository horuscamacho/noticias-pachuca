/**
 * ArticleHeader Component
 * Compact header for individual article screen with back button and logo
 */

import React, { useMemo } from 'react';
import { View, Pressable, ViewStyle, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '../Logo';

/**
 * Design tokens for ArticleHeader
 */
const ARTICLE_HEADER_TOKENS = {
  // Dimensions
  height: 60,
  backButtonSize: 32,
  backButtonTouchTarget: 44,

  // Colors
  background: '#FFFFFF',
  borderColor: '#000000',
  backButtonColor: '#000000',

  // Borders
  borderBottomWidth: 4,

  // Spacing
  paddingHorizontal: 12,
  paddingVertical: 8,
  backButtonLeft: 12,
} as const;

/**
 * Props interface for ArticleHeader component
 */
export interface ArticleHeaderProps extends Omit<ViewProps, 'children'> {
  /**
   * Callback when back button is pressed
   */
  onBackPress: () => void;

  /**
   * Test ID for automated testing
   */
  testID?: string;

  /**
   * Accessibility label for header
   */
  accessibilityLabel?: string;
}

/**
 * ArticleHeader - Compact header for individual article screens
 *
 * Features:
 * - Back button with haptic feedback
 * - Small logo centered
 * - Safe area aware
 * - 4px black border bottom (brutalist)
 * - Fixed positioning ready
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ArticleHeader onBackPress={handleBack} />
 *
 * // With custom accessibility
 * <ArticleHeader
 *   onBackPress={handleBack}
 *   accessibilityLabel="Encabezado de artículo"
 * />
 * ```
 */
export const ArticleHeader = React.memo<ArticleHeaderProps>(
  ({
    onBackPress,
    testID = 'article-header',
    accessibilityLabel = 'Encabezado de artículo',
    style,
    ...viewProps
  }) => {
    // Get safe area insets
    const insets = useSafeAreaInsets();

    // Compute container styles
    const containerStyle = useMemo<ViewStyle>(() => {
      return {
        backgroundColor: ARTICLE_HEADER_TOKENS.background,
        borderBottomWidth: ARTICLE_HEADER_TOKENS.borderBottomWidth,
        borderBottomColor: ARTICLE_HEADER_TOKENS.borderColor,
        paddingTop: insets.top + ARTICLE_HEADER_TOKENS.paddingVertical,
        paddingHorizontal: ARTICLE_HEADER_TOKENS.paddingHorizontal,
        paddingBottom: ARTICLE_HEADER_TOKENS.paddingVertical,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: ARTICLE_HEADER_TOKENS.height + insets.top,
      };
    }, [insets.top]);

    // Back button container style
    const backButtonContainerStyle = useMemo<ViewStyle>(() => {
      return {
        position: 'absolute',
        left: ARTICLE_HEADER_TOKENS.backButtonLeft,
        top: insets.top + ARTICLE_HEADER_TOKENS.paddingVertical,
        width: ARTICLE_HEADER_TOKENS.backButtonTouchTarget,
        height: ARTICLE_HEADER_TOKENS.backButtonTouchTarget,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      };
    }, [insets.top]);

    return (
      <View
        style={[containerStyle, style]}
        testID={testID}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="header"
        {...viewProps}
      >
        {/* Back Button */}
        <Pressable
          style={backButtonContainerStyle}
          onPress={onBackPress}
          testID={`${testID}-back-button`}
          accessible={true}
          accessibilityLabel="Regresar"
          accessibilityHint="Volver a la pantalla anterior"
          accessibilityRole="button"
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          {({ pressed }) => (
            <Ionicons
              name="arrow-back"
              size={ARTICLE_HEADER_TOKENS.backButtonSize}
              color={ARTICLE_HEADER_TOKENS.backButtonColor}
              style={{
                opacity: pressed ? 0.6 : 1.0,
              }}
            />
          )}
        </Pressable>

        {/* Logo (centered) */}
        <Logo
          size="small"
          accessibilityLabel="Noticias Pachuca"
          testID={`${testID}-logo`}
        />
      </View>
    );
  }
);

// Display name for debugging
ArticleHeader.displayName = 'ArticleHeader';

/**
 * Export design tokens for external use
 */
export const ARTICLE_HEADER_DESIGN_TOKENS = ARTICLE_HEADER_TOKENS;
