import React, { useMemo } from 'react';
import { View, ViewStyle, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../Logo';
import { EditionDropdown } from './EditionDropdown';
import { BrutalistBanner } from './BrutalistBanner';

/**
 * Design tokens for HomeHeader
 */
const HOME_HEADER_TOKENS = {
  // Dimensions
  logoSectionHeight: 80,

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
 * Props interface for HomeHeader component
 */
export interface HomeHeaderProps extends Omit<ViewProps, 'children'> {
  /**
   * Callback when edition dropdown is pressed
   */
  onEditionPress: () => void;

  /**
   * Current edition text to display in dropdown
   * @default "EDICIÓN"
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
   * NativeWind/Tailwind className for additional styling
   */
  className?: string;

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
 * HomeHeader - Main header component for home screen
 *
 * Combines logo, edition dropdown, and promotional banner:
 * - Logo section: Logo + EditionDropdown (80px height)
 * - Promotional banner: Subscription CTA
 * - Safe area aware (respects device notches/islands)
 * - 4px black borders for brutalist style
 * - Fully responsive and accessible
 *
 * @example
 * ```tsx
 * // Basic usage
 * <HomeHeader
 *   onEditionPress={handleOpenEditionPicker}
 *   onBannerCtaPress={handleRegister}
 * />
 *
 * // With current edition
 * <HomeHeader
 *   onEditionPress={handleOpenEditionPicker}
 *   currentEdition="PACHUCA"
 *   onBannerCtaPress={handleRegister}
 * />
 *
 * // Custom banner content
 * <HomeHeader
 *   onEditionPress={handleOpenEditionPicker}
 *   onBannerCtaPress={handlePromotion}
 *   bannerTitle="OFERTA ESPECIAL: 3 MESES GRATIS"
 *   bannerCtaText="Obtener ahora"
 * />
 *
 * // Without banner
 * <HomeHeader
 *   onEditionPress={handleOpenEditionPicker}
 *   onBannerCtaPress={() => {}}
 *   hideBanner={true}
 * />
 * ```
 */
export const HomeHeader = React.memo<HomeHeaderProps>(
  ({
    onEditionPress,
    currentEdition,
    onBannerCtaPress,
    bannerTitle,
    bannerCtaText,
    hideBanner = false,
    className,
    testID = 'home-header',
    accessibilityLabel = 'Encabezado de página principal',
    style,
    ...viewProps
  }) => {
    // Get safe area insets
    const insets = useSafeAreaInsets();

    // Compute logo section styles
    const logoSectionStyle = useMemo<ViewStyle>(() => {
      return {
        backgroundColor: HOME_HEADER_TOKENS.logoSectionBackground,
        borderBottomWidth: HOME_HEADER_TOKENS.logoSectionBottomBorder.width,
        borderBottomColor: HOME_HEADER_TOKENS.logoSectionBottomBorder.color,
        paddingTop: insets.top + HOME_HEADER_TOKENS.logoSectionPaddingVertical,
        paddingHorizontal: HOME_HEADER_TOKENS.logoSectionPaddingHorizontal,
        paddingBottom: HOME_HEADER_TOKENS.logoSectionPaddingVertical,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: HOME_HEADER_TOKENS.logoToDropdownGap,
      };
    }, [insets.top]);

    // Banner content
    const finalBannerTitle =
      bannerTitle || HOME_HEADER_TOKENS.defaultBannerTitle;
    const finalBannerCtaText =
      bannerCtaText || HOME_HEADER_TOKENS.defaultBannerCtaText;

    return (
      <View
        className={className}
        style={style}
        testID={testID}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="header"
        {...viewProps}
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
  }
);

// Display name for debugging
HomeHeader.displayName = 'HomeHeader';

/**
 * Export design tokens for external use
 */
export const HOME_HEADER_DESIGN_TOKENS = HOME_HEADER_TOKENS;
