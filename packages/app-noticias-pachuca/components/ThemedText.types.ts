/**
 * Type definitions for ThemedText component
 * Exported separately for use in other components
 */

import type { TextProps as RNTextProps, TextStyle } from 'react-native';

/**
 * All available text variants in the typography system
 */
export type TextVariant =
  // Display & Headlines
  | 'hero'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  // Body Text
  | 'lead'
  | 'body'
  | 'bodyEmphasis'
  | 'small'
  // Labels & UI
  | 'caption'
  | 'overline'
  | 'button'
  | 'link'
  // Special
  | 'breakingNews'
  | 'breakingNewsBadge'
  | 'mono'
  | 'quote'
  | 'error';

/**
 * Typography token structure for a single variant
 */
export interface TypographyToken {
  fontSize: {
    phone: number;
    tablet: number;
  };
  fontWeight: '400' | '500' | '600' | '700' | '800' | '900';
  lineHeight: number;
  letterSpacing: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  color: string;
}

/**
 * All typography tokens mapped by variant
 */
export type TypographyTokens = Record<TextVariant, TypographyToken>;

/**
 * Props for the ThemedText component
 */
export interface ThemedTextProps extends Omit<RNTextProps, 'style'> {
  /**
   * Typography variant to apply
   * @example 'hero' | 'h1' | 'body' | 'caption'
   */
  variant: TextVariant;

  /**
   * Text content to display
   */
  children: React.ReactNode;

  /**
   * NativeWind/Tailwind className for additional styling
   * @example "mb-4 text-center bg-gray-100"
   */
  className?: string;

  /**
   * Inline styles (merged with variant styles, overrides variant)
   * Supports single style object or array of style objects
   */
  style?: TextStyle | TextStyle[];

  /**
   * Maximum number of lines before truncation with ellipsis
   * @example 2 for card titles, 3 for previews
   */
  numberOfLines?: number;

  /**
   * Callback for interactive text (makes text pressable)
   * @example () => navigation.navigate('Article')
   */
  onPress?: () => void;

  /**
   * Accessibility label override for screen readers
   */
  accessibilityLabel?: string;

  /**
   * Accessibility role override
   * @default Automatically set based on variant (e.g., 'header' for h1-h4)
   */
  accessibilityRole?: RNTextProps['accessibilityRole'];
}
