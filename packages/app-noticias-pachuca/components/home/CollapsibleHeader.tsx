/**
 * Collapsible Header Component
 * Main header that fades out on scroll
 * Contains logo, edition dropdown, and subscription banner
 */

import React, { useMemo } from 'react';
import { View, ViewStyle, LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../Logo';
import { EditionDropdown } from './EditionDropdown';
import { BrutalistBanner } from './BrutalistBanner';

/**
 * Design tokens for CollapsibleHeader
 */
const COLLAPSIBLE_HEADER_TOKENS = {
  // Colors
  logoSectionBackground: '#FFFFFF', // White

  // Borders
  logoSectionBottomBorder: {
    width: 4,
    color: '#000000', // Black
  },

  // Spacing
  logoSectionPaddingHorizontal: 16,
  logoSectionPaddingVertical: 12,
  logoToDropdownGap: 20,

  // Default banner content
  defaultBannerTitle:
    'SUSCRÍBETE PARA VIVIR LA NUEVA EXPERIENCIA DE LAS NOTICIAS EN HIDALGO',
  defaultBannerCtaText: 'Registrarse',
} as const;

/**
 * Props interface for CollapsibleHeader component
 */
export interface CollapsibleHeaderProps {
  /**
   * Callback when edition dropdown is pressed
   */
  onEditionPress: () => void;

  /**
   * Current edition text to display in dropdown
   */
  currentEdition?: string;

  /**
   * Callback when banner CTA is pressed
   */
  onBannerCtaPress: () => void;

  /**
   * Custom banner title (overrides default)
   */
  bannerTitle?: string;

  /**
   * Custom banner CTA text (overrides default)
   */
  bannerCtaText?: string;

  /**
   * Hide the banner section
   * @default false
   */
  hideBanner?: boolean;

  /**
   * Callback when logo section layout is measured
   * Used to determine when to show compact header
   */
  onLogoLayout?: (event: LayoutChangeEvent) => void;

  /**
   * Test ID for automated testing
   */
  testID?: string;
}

/**
 * CollapsibleHeader - Main animated header that fades on scroll
 *
 * Features:
 * - Logo section: Logo + EditionDropdown
 * - Promotional banner: Subscription CTA
 * - Safe area aware (respects device notches/islands)
 * - Measures logo height for scroll-based animations
 * - Fades out when scrolled 50% of logo height
 *
 * @example
 * ```tsx
 * <Animated.View style={mainHeaderStyle}>
 *   <CollapsibleHeader
 *     onEditionPress={handleOpenEditionPicker}
 *     onBannerCtaPress={handleRegister}
 *     onLogoLayout={(e) => setLogoHeight(e.nativeEvent.layout.height)}
 *   />
 * </Animated.View>
 * ```
 */
export const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({
  onEditionPress,
  currentEdition,
  onBannerCtaPress,
  bannerTitle,
  bannerCtaText,
  hideBanner = false,
  onLogoLayout,
  testID = 'collapsible-header',
}) => {
  // Get safe area insets
  const insets = useSafeAreaInsets();

  // Compute logo section styles
  const logoSectionStyle = useMemo<ViewStyle>(() => {
    return {
      backgroundColor: COLLAPSIBLE_HEADER_TOKENS.logoSectionBackground,
      borderBottomWidth: COLLAPSIBLE_HEADER_TOKENS.logoSectionBottomBorder.width,
      borderBottomColor: COLLAPSIBLE_HEADER_TOKENS.logoSectionBottomBorder.color,
      paddingTop: insets.top + COLLAPSIBLE_HEADER_TOKENS.logoSectionPaddingVertical,
      paddingHorizontal: COLLAPSIBLE_HEADER_TOKENS.logoSectionPaddingHorizontal,
      paddingBottom: COLLAPSIBLE_HEADER_TOKENS.logoSectionPaddingVertical,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: COLLAPSIBLE_HEADER_TOKENS.logoToDropdownGap,
    };
  }, [insets.top]);

  // Banner content
  const finalBannerTitle =
    bannerTitle || COLLAPSIBLE_HEADER_TOKENS.defaultBannerTitle;
  const finalBannerCtaText =
    bannerCtaText || COLLAPSIBLE_HEADER_TOKENS.defaultBannerCtaText;

  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityLabel="Encabezado principal"
      accessibilityRole="header"
      onLayout={onLogoLayout}
    >
      {/* Logo Section */}
      <View
        style={logoSectionStyle}
        testID={`${testID}-logo-section`}
        accessibilityElementsHidden={true} // Children have their own labels
      >
        {/* Logo */}
        <Logo
          size="small"
          accessibilityLabel="Noticias Pachuca - Ir a inicio"
        />

        {/* Edition Dropdown */}
        <EditionDropdown
          onPress={onEditionPress}
          currentEdition={currentEdition}
          accessibilityHint="Abrir selector de edición de noticias"
        />
      </View>

      {/* Banner Section */}
      {!hideBanner && (
        <BrutalistBanner
          title={finalBannerTitle}
          ctaText={finalBannerCtaText}
          onCtaPress={onBannerCtaPress}
          backgroundColor="default"
          testID={`${testID}-banner`}
          ctaAccessibilityLabel="Abrir registro de usuario"
        />
      )}
    </View>
  );
};

/**
 * Export design tokens for external use
 */
export { COLLAPSIBLE_HEADER_TOKENS };
