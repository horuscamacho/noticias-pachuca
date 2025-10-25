/**
 * DecorativeCorner Component
 * Decorative diamond shapes for brutalist design corners
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

export type CornerVariant = 'yellow' | 'red' | 'orange';
export type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type CornerSize = 'small' | 'medium' | 'large';

interface DecorativeCornerProps {
  variant: CornerVariant;
  position: CornerPosition;
  size?: CornerSize;
  style?: ViewStyle;
  testID?: string;
}

const VARIANT_COLORS: Record<CornerVariant, string> = {
  yellow: '#FFB22C',
  red: '#FF0000',
  orange: '#FFA500',
};

const SIZE_DIMENSIONS: Record<CornerSize, { container: number; diamond: number }> = {
  small: { container: 12, diamond: 8 },
  medium: { container: 16, diamond: 12 },
  large: { container: 20, diamond: 16 },
};

const POSITION_STYLES: Record<CornerPosition, ViewStyle> = {
  'top-left': { top: -8, left: -8 },
  'top-right': { top: -8, right: -8 },
  'bottom-left': { bottom: -8, left: -8 },
  'bottom-right': { bottom: -8, right: -8 },
};

/**
 * Decorative diamond corner element for brutalist design
 *
 * @example
 * ```tsx
 * <DecorativeCorner variant="yellow" position="top-left" size="medium" />
 * ```
 */
export const DecorativeCorner = React.memo<DecorativeCornerProps>(
  ({ variant, position, size = 'medium', style, testID = 'decorative-corner' }) => {
    const dimensions = SIZE_DIMENSIONS[size];
    const color = VARIANT_COLORS[variant];
    const positionStyle = POSITION_STYLES[position];

    const containerStyle: ViewStyle = {
      position: 'absolute',
      width: dimensions.container,
      height: dimensions.container,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      ...positionStyle,
    };

    const diamondStyle: ViewStyle = {
      width: dimensions.diamond,
      height: dimensions.diamond,
      backgroundColor: color,
      borderWidth: 2,
      borderColor: '#000000',
      transform: [{ rotate: '45deg' }],
    };

    return (
      <View
        style={[containerStyle, style]}
        testID={testID}
        accessible={false}
        importantForAccessibility="no"
      >
        <View style={diamondStyle} />
      </View>
    );
  }
);

DecorativeCorner.displayName = 'DecorativeCorner';
