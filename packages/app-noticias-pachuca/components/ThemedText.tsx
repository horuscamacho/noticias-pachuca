import React, { useMemo } from 'react';
import {
  Text,
  TextProps as RNTextProps,
  TextStyle,
  useWindowDimensions,
} from 'react-native';

/**
 * Typography token definitions with responsive sizing
 * Font sizes scale from phone (base) to tablet (768px+)
 */
const TYPOGRAPHY_TOKENS = {
  hero: {
    fontSize: { phone: 32, tablet: 40 },
    fontWeight: '900' as const,
    lineHeight: 1.1,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: '#000000',
  },
  h1: {
    fontSize: { phone: 28, tablet: 36 },
    fontWeight: '900' as const,
    lineHeight: 1.2,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: '#000000',
  },
  h2: {
    fontSize: { phone: 24, tablet: 32 },
    fontWeight: '800' as const,
    lineHeight: 1.3,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: '#000000',
  },
  h3: {
    fontSize: { phone: 20, tablet: 24 },
    fontWeight: '700' as const,
    lineHeight: 1.4,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: '#000000',
  },
  h4: {
    fontSize: { phone: 18, tablet: 20 },
    fontWeight: '700' as const,
    lineHeight: 1.4,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: '#000000',
  },
  subtitle: {
    fontSize: { phone: 16, tablet: 18 },
    fontWeight: '700' as const,
    lineHeight: 1.25,
    letterSpacing: 0,
    textTransform: 'none' as const,
    color: '#000000',
  },
  lead: {
    fontSize: { phone: 20, tablet: 24 },
    fontWeight: '500' as const,
    lineHeight: 1.5,
    letterSpacing: 0,
    textTransform: 'none' as const,
    color: '#1F1F1F',
  },
  body: {
    fontSize: { phone: 16, tablet: 18 },
    fontWeight: '400' as const,
    lineHeight: 1.6,
    letterSpacing: 0,
    textTransform: 'none' as const,
    color: '#1F1F1F',
  },
  bodyEmphasis: {
    fontSize: { phone: 16, tablet: 18 },
    fontWeight: '600' as const,
    lineHeight: 1.6,
    letterSpacing: 0,
    textTransform: 'none' as const,
    color: '#000000',
  },
  small: {
    fontSize: { phone: 14, tablet: 16 },
    fontWeight: '400' as const,
    lineHeight: 1.5,
    letterSpacing: 0,
    textTransform: 'none' as const,
    color: '#4B5563',
  },
  caption: {
    fontSize: { phone: 12, tablet: 14 },
    fontWeight: '700' as const,
    lineHeight: 1.4,
    letterSpacing: 1.0,
    textTransform: 'uppercase' as const,
    color: '#000000',
  },
  overline: {
    fontSize: { phone: 10, tablet: 12 },
    fontWeight: '700' as const,
    lineHeight: 1.6,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: '#6B7280',
  },
  button: {
    fontSize: { phone: 16, tablet: 18 },
    fontWeight: '700' as const,
    lineHeight: 1.2,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: '#FFFFFF',
  },
  link: {
    fontSize: { phone: 16, tablet: 18 },
    fontWeight: '600' as const,
    lineHeight: 1.5,
    letterSpacing: 0,
    textTransform: 'none' as const,
    color: '#854836',
  },
  breakingNews: {
    fontSize: { phone: 14, tablet: 16 },
    fontWeight: '700' as const,
    lineHeight: 1.3,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
    color: '#FFFFFF',
  },
  breakingNewsBadge: {
    fontSize: { phone: 11, tablet: 12 },
    fontWeight: '900' as const,
    lineHeight: 1.2,
    letterSpacing: 1.0,
    textTransform: 'uppercase' as const,
    color: '#FFFFFF',
  },
  mono: {
    fontSize: { phone: 14, tablet: 16 },
    fontWeight: '400' as const,
    lineHeight: 1.5,
    letterSpacing: 0,
    textTransform: 'none' as const,
    color: '#1F1F1F',
  },
  quote: {
    fontSize: { phone: 18, tablet: 22 },
    fontWeight: '500' as const,
    lineHeight: 1.6,
    letterSpacing: 0,
    textTransform: 'none' as const,
    color: '#4B5563',
  },
  error: {
    fontSize: { phone: 14, tablet: 16 },
    fontWeight: '600' as const,
    lineHeight: 1.5,
    letterSpacing: 0,
    textTransform: 'none' as const,
    color: '#FF0000',
  },
} as const;

/**
 * Union type of all available text variants
 */
export type TextVariant = keyof typeof TYPOGRAPHY_TOKENS;

/**
 * Props for the ThemedText component
 */
export interface ThemedTextProps extends Omit<RNTextProps, 'style'> {
  /**
   * Typography variant to apply
   */
  variant: TextVariant;

  /**
   * Text content to display
   */
  children: React.ReactNode;

  /**
   * NativeWind/Tailwind className for additional styling
   */
  className?: string;

  /**
   * Inline styles (merged with variant styles, overrides variant)
   */
  style?: TextStyle | TextStyle[];

  /**
   * Maximum number of lines before truncation
   */
  numberOfLines?: number;

  /**
   * Callback for interactive text (makes text pressable)
   */
  onPress?: () => void;

  /**
   * Accessibility label override
   */
  accessibilityLabel?: string;

  /**
   * Accessibility role override
   */
  accessibilityRole?: RNTextProps['accessibilityRole'];
}

/**
 * Tablet breakpoint in pixels
 */
const TABLET_BREAKPOINT = 768;

/**
 * Maximum font size multiplier for accessibility
 * Caps dynamic type scaling at 1.5x to prevent layout breaks
 */
const MAX_FONT_SIZE_MULTIPLIER = 1.5;

/**
 * Maps text variants to semantic accessibility roles
 */
const ACCESSIBILITY_ROLE_MAP: Partial<Record<TextVariant, RNTextProps['accessibilityRole']>> = {
  hero: 'header',
  h1: 'header',
  h2: 'header',
  h3: 'header',
  h4: 'header',
  link: 'link',
  button: 'button',
};

/**
 * ThemedText - Production-ready typography component
 *
 * A fully-typed, responsive text component that implements a brutalist design system
 * with 18 semantic variants. Supports NativeWind, accessibility, and responsive scaling.
 *
 * @example
 * ```tsx
 * // Hero headline
 * <ThemedText variant="hero" numberOfLines={2}>
 *   Breaking News Story
 * </ThemedText>
 *
 * // Body text with custom styling
 * <ThemedText variant="body" className="mb-4">
 *   Article content here...
 * </ThemedText>
 *
 * // Interactive link
 * <ThemedText variant="link" onPress={() => navigate('Article')}>
 *   Read more
 * </ThemedText>
 *
 * // Category badge with background
 * <ThemedText variant="caption" className="bg-brutalist-brown text-white px-3 py-1">
 *   POLITICS
 * </ThemedText>
 * ```
 */
export const ThemedText = React.memo<ThemedTextProps>(
  ({
    variant,
    children,
    className,
    style: customStyle,
    numberOfLines,
    onPress,
    accessibilityLabel,
    accessibilityRole,
    ...textProps
  }) => {
    const { width } = useWindowDimensions();

    // Determine if we're on a tablet
    const isTablet = width >= TABLET_BREAKPOINT;

    // Compute styles based on variant and screen size
    const computedStyle = useMemo<TextStyle>(() => {
      const token = TYPOGRAPHY_TOKENS[variant];

      // Select appropriate font size for device
      const fontSize = isTablet ? token.fontSize.tablet : token.fontSize.phone;

      // Calculate line height from multiplier
      const lineHeight = fontSize * token.lineHeight;

      return {
        fontSize,
        fontWeight: token.fontWeight,
        lineHeight,
        letterSpacing: token.letterSpacing,
        textTransform: token.textTransform,
        color: token.color,
        // Apply mono font family for mono variant
        ...(variant === 'mono' && {
          fontFamily: 'Menlo, Monaco, Consolas, Courier New, monospace',
        }),
        // Apply italic for quote variant
        ...(variant === 'quote' && {
          fontStyle: 'italic' as const,
        }),
        // Underline for link variant
        ...(variant === 'link' && {
          textDecorationLine: 'underline' as const,
        }),
      };
    }, [variant, isTablet]);

    // Merge all styles (computed → className → custom)
    const mergedStyle = useMemo<TextStyle | TextStyle[]>(() => {
      if (Array.isArray(customStyle)) {
        return [computedStyle, ...customStyle];
      }
      return customStyle ? [computedStyle, customStyle] : computedStyle;
    }, [computedStyle, customStyle]);

    // Determine accessibility role from variant if not explicitly set
    const finalAccessibilityRole = accessibilityRole ?? ACCESSIBILITY_ROLE_MAP[variant];

    return (
      <Text
        style={mergedStyle}
        className={className}
        numberOfLines={numberOfLines}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={finalAccessibilityRole}
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        {...textProps}
      >
        {children}
      </Text>
    );
  }
);

// Display name for debugging
ThemedText.displayName = 'ThemedText';

/**
 * Type-safe helper to get typography token for a variant
 * Useful for computing styles in other components
 *
 * @example
 * ```tsx
 * const heroToken = getTypographyToken('hero');
 * console.log(heroToken.fontSize.phone); // 32
 * ```
 */
export const getTypographyToken = (variant: TextVariant) => {
  return TYPOGRAPHY_TOKENS[variant];
};

/**
 * All available text variants for use in other components
 */
export const TEXT_VARIANTS = Object.keys(TYPOGRAPHY_TOKENS) as TextVariant[];
