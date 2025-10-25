import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Pressable,
  ViewStyle,
  TextStyle,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '../ThemedText';
import {
  BRUTALIST_BANNER_TOKENS,
  BannerBackgroundColor,
} from './BrutalistBanner.tokens';

/**
 * Props interface for BrutalistBanner component
 */
export interface BrutalistBannerProps {
  /**
   * Banner title text
   */
  title: string;

  /**
   * Call-to-action button text
   */
  ctaText: string;

  /**
   * Callback when CTA button is pressed
   */
  onCtaPress: () => void;

  /**
   * Background color variant
   * @default 'default'
   */
  backgroundColor?: BannerBackgroundColor;

  /**
   * Disable CTA button interaction
   * @default false
   */
  disabled?: boolean;

  /**
   * NativeWind/Tailwind className for additional styling
   */
  className?: string;

  /**
   * Test ID for automated testing
   */
  testID?: string;

  /**
   * Accessibility label for banner
   */
  accessibilityLabel?: string;

  /**
   * Accessibility label for CTA button
   */
  ctaAccessibilityLabel?: string;

  /**
   * Enable haptic feedback on press
   * @default true
   */
  enableHaptics?: boolean;
}

/**
 * Tablet breakpoint
 */
const TABLET_BREAKPOINT = 768;

/**
 * BrutalistBanner - Reusable promotional banner component
 *
 * A fully-typed banner component following brutalist design principles:
 * - Brown background (#854836) by default
 * - Yellow CTA button (#FFB22C)
 * - 4px black borders
 * - White text on brown background
 * - Centered layout with responsive padding
 * - Haptic feedback on CTA press
 * - WCAG compliant 44pt minimum touch target for CTA
 *
 * @example
 * ```tsx
 * // Default brown banner
 * <BrutalistBanner
 *   title="SUSCRÍBETE PARA VIVIR LA NUEVA EXPERIENCIA DE LAS NOTICIAS EN HIDALGO"
 *   ctaText="Registrarse"
 *   onCtaPress={handleRegister}
 *   ctaAccessibilityLabel="Abrir formulario de registro"
 * />
 *
 * // Custom background color
 * <BrutalistBanner
 *   title="OFERTA ESPECIAL"
 *   ctaText="Ver más"
 *   onCtaPress={handleViewMore}
 *   backgroundColor="yellow"
 * />
 *
 * // Disabled state
 * <BrutalistBanner
 *   title="PRÓXIMAMENTE"
 *   ctaText="Suscribirse"
 *   onCtaPress={() => {}}
 *   disabled={true}
 * />
 * ```
 */
export const BrutalistBanner = React.memo<BrutalistBannerProps>(
  ({
    title,
    ctaText,
    onCtaPress,
    backgroundColor = 'default',
    disabled = false,
    className,
    testID = 'brutalist-banner',
    accessibilityLabel,
    ctaAccessibilityLabel,
    enableHaptics = true,
  }) => {
    const { width } = useWindowDimensions();
    const isTablet = width >= TABLET_BREAKPOINT;

    // Track CTA button pressed state
    const [isPressed, setIsPressed] = useState(false);

    // Compute banner container styles
    const bannerStyle = useMemo<ViewStyle>(() => {
      const bgColor = BRUTALIST_BANNER_TOKENS.background[backgroundColor];

      return {
        backgroundColor: bgColor,
        borderTopWidth: BRUTALIST_BANNER_TOKENS.border.width,
        borderBottomWidth: BRUTALIST_BANNER_TOKENS.border.width,
        borderColor: BRUTALIST_BANNER_TOKENS.border.color,
        paddingVertical: BRUTALIST_BANNER_TOKENS.spacing.paddingVertical,
        paddingHorizontal: BRUTALIST_BANNER_TOKENS.spacing.paddingHorizontal,
        minHeight: BRUTALIST_BANNER_TOKENS.minHeight,
        alignItems: 'center',
        justifyContent: 'center',
      };
    }, [backgroundColor]);

    // Compute title text styles
    const titleStyle = useMemo<TextStyle>(() => {
      const token = BRUTALIST_BANNER_TOKENS.title;
      const fontSize = isTablet ? token.fontSize.tablet : token.fontSize.phone;

      // Determine text color based on background
      let textColor = BRUTALIST_BANNER_TOKENS.text.onBrown;
      if (backgroundColor === 'yellow') {
        textColor = BRUTALIST_BANNER_TOKENS.text.onYellow;
      } else if (backgroundColor === 'black') {
        textColor = BRUTALIST_BANNER_TOKENS.text.onBlack;
      }

      return {
        fontSize,
        fontWeight: token.fontWeight,
        lineHeight: fontSize * token.lineHeight,
        letterSpacing: token.letterSpacing,
        textTransform: token.textTransform,
        color: textColor,
        textAlign: 'center',
        marginBottom: BRUTALIST_BANNER_TOKENS.spacing.titleToButton,
      };
    }, [isTablet, backgroundColor]);

    // Compute CTA button styles
    const ctaButtonStyle = useMemo<ViewStyle>(() => {
      const token = BRUTALIST_BANNER_TOKENS.ctaButton;

      return {
        backgroundColor: isPressed
          ? token.pressedBackground
          : disabled
          ? '#9CA3AF' // Gray for disabled
          : token.background,
        borderWidth: token.borderWidth,
        borderColor: disabled ? '#6B7280' : token.borderColor,
        paddingVertical: BRUTALIST_BANNER_TOKENS.ctaButtonPaddingVertical,
        paddingHorizontal: BRUTALIST_BANNER_TOKENS.ctaButtonPaddingHorizontal,
        minHeight: BRUTALIST_BANNER_TOKENS.ctaButtonMinHeight,
        borderRadius: 0, // Sharp corners (brutalist)
        alignItems: 'center',
        justifyContent: 'center',
        // Press animation
        transform: [{ scale: isPressed && !disabled ? 0.98 : 1 }],
        opacity: disabled ? 0.6 : 1,
      };
    }, [isPressed, disabled]);

    // Compute CTA text styles
    const ctaTextStyle = useMemo<TextStyle>(() => {
      const token = BRUTALIST_BANNER_TOKENS.ctaButtonText;
      const fontSize = isTablet ? token.fontSize.tablet : token.fontSize.phone;

      return {
        fontSize,
        fontWeight: token.fontWeight,
        lineHeight: fontSize * token.lineHeight,
        letterSpacing: token.letterSpacing,
        textTransform: token.textTransform,
        color: isPressed
          ? BRUTALIST_BANNER_TOKENS.ctaButton.pressedTextColor
          : disabled
          ? '#4B5563' // Dark gray for disabled
          : BRUTALIST_BANNER_TOKENS.ctaButton.textColor,
      };
    }, [isTablet, isPressed, disabled]);

    // Handle CTA press
    const handleCtaPress = useCallback(() => {
      if (disabled) return;

      // Trigger haptic feedback
      if (enableHaptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
          // Silently fail if haptics not supported
        });
      }

      onCtaPress();
    }, [disabled, enableHaptics, onCtaPress]);

    // Handle press in
    const handlePressIn = useCallback(() => {
      if (!disabled) {
        setIsPressed(true);
      }
    }, [disabled]);

    // Handle press out
    const handlePressOut = useCallback(() => {
      setIsPressed(false);
    }, []);

    return (
      <View
        style={bannerStyle}
        className={className}
        testID={testID}
        accessible={true}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityRole="text"
      >
        {/* Banner title */}
        <ThemedText
          variant="body"
          style={titleStyle}
          accessibilityElementsHidden={true} // Parent has label
          importantForAccessibility="no"
        >
          {title}
        </ThemedText>

        {/* CTA Button */}
        <Pressable
          onPress={handleCtaPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={ctaButtonStyle}
          accessibilityRole="button"
          accessibilityLabel={ctaAccessibilityLabel || ctaText}
          accessibilityState={{
            disabled,
          }}
          testID={`${testID}-cta`}
        >
          <ThemedText
            variant="body"
            style={ctaTextStyle}
            numberOfLines={1}
            accessibilityElementsHidden={true} // Parent Pressable has label
            importantForAccessibility="no"
          >
            {ctaText}
          </ThemedText>
        </Pressable>
      </View>
    );
  }
);

// Display name for debugging
BrutalistBanner.displayName = 'BrutalistBanner';
