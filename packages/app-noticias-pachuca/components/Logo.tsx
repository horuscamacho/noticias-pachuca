import React, { useMemo } from 'react';
import { View, ViewProps } from 'react-native';
import { ThemedText } from './ThemedText';

/**
 * Logo size variants with responsive scaling
 */
const LOGO_SIZES = {
  small: {
    fontSize: 20,
    underlineHeight: 3,
    spacing: 4,
    letterSpacing: 1.5,
  },
  medium: {
    fontSize: 28,
    underlineHeight: 4,
    spacing: 6,
    letterSpacing: 2,
  },
  large: {
    fontSize: 36,
    underlineHeight: 5,
    spacing: 8,
    letterSpacing: 2.5,
  },
} as const;

/**
 * Brutalist color palette for logo
 */
const LOGO_COLORS = {
  noticias: '#000000', // Black
  pachuca: '#854836', // Brown
  underline: '#FFB22C', // Yellow
} as const;

/**
 * Props interface for Logo component
 */
export interface LogoProps extends Omit<ViewProps, 'children'> {
  /**
   * Size variant for the logo
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * NativeWind/Tailwind className for additional styling
   */
  className?: string;

  /**
   * Test ID for automated testing
   */
  testID?: string;

  /**
   * Accessibility label override
   * @default 'Noticias Pachuca Logo'
   */
  accessibilityLabel?: string;
}

/**
 * Logo - Production-ready brutalist logo component
 *
 * Displays the "NOTICIAS PACHUCA" brand logo with brutalist design:
 * - Two-line stacked uppercase text
 * - "NOTICIAS" in black
 * - "PACHUCA" in brown (#854836)
 * - Yellow underline bar below "PACHUCA"
 * - Three size variants (small, medium, large)
 * - Fully accessible with proper ARIA labels
 *
 * @example
 * ```tsx
 * // Default medium size
 * <Logo />
 *
 * // Large logo for hero sections
 * <Logo size="large" className="mb-8" />
 *
 * // Small logo for headers
 * <Logo size="small" className="my-4" />
 *
 * // With custom accessibility
 * <Logo
 *   size="medium"
 *   accessibilityLabel="Ir a página principal de Noticias Pachuca"
 * />
 * ```
 */
export const Logo = React.memo<LogoProps>(
  ({
    size = 'medium',
    className,
    testID = 'logo',
    accessibilityLabel = 'Noticias Pachuca Logo',
    style,
    ...viewProps
  }) => {
    // Get size configuration
    const sizeConfig = LOGO_SIZES[size];

    // Compute text styles based on size
    const textStyle = useMemo(
      () => ({
        fontSize: sizeConfig.fontSize,
        letterSpacing: sizeConfig.letterSpacing,
        lineHeight: sizeConfig.fontSize * 1.1, // Tight line height for brutalist style
      }),
      [sizeConfig]
    );

    // Compute underline bar dimensions
    const underlineStyle = useMemo(
      () => ({
        height: sizeConfig.underlineHeight,
        backgroundColor: LOGO_COLORS.underline,
        marginTop: sizeConfig.spacing,
      }),
      [sizeConfig]
    );

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
        {/* NOTICIAS - Black text */}
        <ThemedText
          variant="h1"
          style={[
            textStyle,
            {
              color: LOGO_COLORS.noticias,
              textAlign: 'center',
            },
          ]}
          accessibilityElementsHidden={true} // Hide from screen readers, parent has label
          importantForAccessibility="no"
        >
          NOTICIAS
        </ThemedText>

        {/* PACHUCA - Brown text */}
        <ThemedText
          variant="h1"
          style={[
            textStyle,
            {
              color: LOGO_COLORS.pachuca,
              textAlign: 'center',
            },
          ]}
          accessibilityElementsHidden={true} // Hide from screen readers, parent has label
          importantForAccessibility="no"
        >
          PACHUCA
        </ThemedText>

        {/* Yellow underline bar */}
        <View
          style={underlineStyle}
          accessibilityElementsHidden={true} // Decorative element
          importantForAccessibility="no"
        />
      </View>
    );
  }
);

// Display name for debugging
Logo.displayName = 'Logo';

/**
 * Type-safe helper to get logo size configuration
 * Useful for computing dimensions in parent components
 *
 * @example
 * ```tsx
 * const mediumConfig = getLogoSizeConfig('medium');
 * console.log(mediumConfig.fontSize); // 28
 * ```
 */
export const getLogoSizeConfig = (size: 'small' | 'medium' | 'large') => {
  return LOGO_SIZES[size];
};

/**
 * Available logo sizes for external use
 */
export const LOGO_SIZE_VARIANTS = Object.keys(LOGO_SIZES) as Array<
  keyof typeof LOGO_SIZES
>;
