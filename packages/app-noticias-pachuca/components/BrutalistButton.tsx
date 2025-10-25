import React, { useMemo, useState, useCallback } from 'react';
import {
  Pressable,
  PressableProps,
  ViewStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from './ThemedText';

/**
 * Button variant definitions with brutalist design tokens
 */
const BUTTON_VARIANTS = {
  primary: {
    backgroundColor: '#854836', // Brown
    borderColor: '#000000', // Black
    borderWidth: 4,
    textColor: '#FFFFFF', // White
    pressedBackgroundColor: '#FF0000', // Red
    pressedTextColor: '#FFFFFF',
    pressedOpacity: 1,
  },
  secondary: {
    backgroundColor: '#FFFFFF', // White
    borderColor: '#000000', // Black
    borderWidth: 4,
    textColor: '#000000', // Black
    pressedBackgroundColor: '#F7F7F7', // Light gray
    pressedTextColor: '#000000',
    pressedOpacity: 1,
  },
  tertiary: {
    backgroundColor: 'transparent',
    borderLeftColor: '#FFB22C', // Yellow left accent
    borderLeftWidth: 4,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    textColor: '#000000', // Black
    pressedBackgroundColor: '#FFB22C', // Yellow fill on press
    pressedBorderLeftColor: '#000000', // Black border when pressed
    pressedTextColor: '#000000',
    pressedOpacity: 1,
  },
} as const;

/**
 * Disabled state styling
 */
const DISABLED_STYLE = {
  backgroundColor: '#E5E7EB', // Gray-200
  borderColor: '#9CA3AF', // Gray-400
  opacity: 0.6,
} as const;

/**
 * Button size configuration
 */
const BUTTON_SIZING = {
  minHeight: 44, // iOS minimum touch target
  paddingVertical: 16,
  paddingHorizontal: 24,
} as const;

/**
 * Props interface for BrutalistButton component
 */
export interface BrutalistButtonProps
  extends Omit<PressableProps, 'children' | 'style'> {
  /**
   * Visual style variant of the button
   */
  variant: 'primary' | 'secondary' | 'tertiary';

  /**
   * Callback fired when button is pressed
   */
  onPress: () => void;

  /**
   * Button label text or React node
   */
  children: React.ReactNode;

  /**
   * Disable button interaction
   * @default false
   */
  disabled?: boolean;

  /**
   * Show loading spinner and disable interaction
   * @default false
   */
  loading?: boolean;

  /**
   * NativeWind/Tailwind className for additional styling
   */
  className?: string;

  /**
   * Custom inline styles (merged with variant styles)
   */
  style?: ViewStyle | ViewStyle[];

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;

  /**
   * Accessibility hint describing what happens when pressed
   */
  accessibilityHint?: string;

  /**
   * Test ID for automated testing
   */
  testID?: string;

  /**
   * Enable haptic feedback on press
   * @default true
   */
  enableHaptics?: boolean;

  /**
   * Full width button (width: 100%)
   * @default false
   */
  fullWidth?: boolean;
}

/**
 * BrutalistButton - Production-ready button component
 *
 * A fully-typed, accessible button component following brutalist design principles:
 * - Thick black borders (4px primary/secondary, 2px tertiary)
 * - Uppercase text with bold weight
 * - No rounded corners (sharp edges)
 * - Three semantic variants (primary, secondary, tertiary)
 * - Haptic feedback on press
 * - Loading and disabled states
 * - WCAG compliant 44pt minimum touch target
 *
 * @example
 * ```tsx
 * // Primary CTA button
 * <BrutalistButton
 *   variant="primary"
 *   onPress={handleCreateAccount}
 *   accessibilityLabel="Crear una cuenta nueva"
 * >
 *   Crear cuenta
 * </BrutalistButton>
 *
 * // Secondary button with loading state
 * <BrutalistButton
 *   variant="secondary"
 *   onPress={handleSignIn}
 *   loading={isLoading}
 *   disabled={isLoading}
 * >
 *   Iniciar sesión
 * </BrutalistButton>
 *
 * // Tertiary minimal button
 * <BrutalistButton
 *   variant="tertiary"
 *   onPress={handleSkip}
 *   fullWidth
 * >
 *   Continuar sin cuenta
 * </BrutalistButton>
 *
 * // Disabled button
 * <BrutalistButton
 *   variant="primary"
 *   onPress={() => {}}
 *   disabled={!isFormValid}
 * >
 *   Enviar
 * </BrutalistButton>
 * ```
 */
export const BrutalistButton = React.memo<BrutalistButtonProps>(
  ({
    variant,
    onPress,
    children,
    disabled = false,
    loading = false,
    className,
    style: customStyle,
    accessibilityLabel,
    accessibilityHint,
    testID,
    enableHaptics = true,
    fullWidth = false,
    ...pressableProps
  }) => {
    // Track pressed state for visual feedback
    const [isPressed, setIsPressed] = useState(false);

    // Get variant configuration
    const variantConfig = BUTTON_VARIANTS[variant];

    // Determine if button is interactive
    const isDisabled = disabled || loading;

    // Compute button container styles
    const containerStyle = useMemo<ViewStyle>(() => {
      const baseStyle: ViewStyle = {
        minHeight: BUTTON_SIZING.minHeight,
        paddingVertical: BUTTON_SIZING.paddingVertical,
        paddingHorizontal: BUTTON_SIZING.paddingHorizontal,
        borderRadius: 0, // Sharp corners (brutalist)
        backgroundColor: isPressed
          ? variantConfig.pressedBackgroundColor
          : variantConfig.backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        // Press animation
        transform: [{ scale: isPressed && !isDisabled ? 0.98 : 1 }],
        ...(fullWidth && { width: '100%' }),
      };

      // Handle different border configurations per variant
      if (variant === 'tertiary') {
        // Tertiary: Yellow left border only
        baseStyle.borderLeftWidth = variantConfig.borderLeftWidth;
        baseStyle.borderLeftColor = isPressed
          ? variantConfig.pressedBorderLeftColor
          : variantConfig.borderLeftColor;
        baseStyle.borderRightWidth = variantConfig.borderRightWidth;
        baseStyle.borderTopWidth = variantConfig.borderTopWidth;
        baseStyle.borderBottomWidth = variantConfig.borderBottomWidth;
        // Adjust left padding to account for border
        baseStyle.paddingLeft = 20;
      } else {
        // Primary and Secondary: All sides bordered
        baseStyle.borderWidth = variantConfig.borderWidth;
        baseStyle.borderColor = variantConfig.borderColor;
      }

      // Apply disabled styling
      if (isDisabled) {
        return {
          ...baseStyle,
          backgroundColor: DISABLED_STYLE.backgroundColor,
          borderColor: DISABLED_STYLE.borderColor,
          opacity: DISABLED_STYLE.opacity,
        };
      }

      return baseStyle;
    }, [variant, isPressed, isDisabled, fullWidth, variantConfig]);

    // Compute text color based on state
    const textColor = useMemo(() => {
      if (isDisabled) {
        return '#6B7280'; // Gray-500
      }
      return isPressed
        ? variantConfig.pressedTextColor
        : variantConfig.textColor;
    }, [isPressed, isDisabled, variantConfig]);

    // Handle press with haptics
    const handlePress = useCallback(() => {
      if (isDisabled) return;

      // Trigger haptic feedback
      if (enableHaptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
          // Silently fail if haptics not supported
        });
      }

      // Call user's onPress handler
      onPress();
    }, [isDisabled, enableHaptics, onPress]);

    // Handle press in
    const handlePressIn = useCallback(() => {
      if (!isDisabled) {
        setIsPressed(true);
      }
    }, [isDisabled]);

    // Handle press out
    const handlePressOut = useCallback(() => {
      setIsPressed(false);
    }, []);

    // Merge custom styles
    const mergedStyle = useMemo<ViewStyle | ViewStyle[]>(() => {
      if (Array.isArray(customStyle)) {
        return [containerStyle, ...customStyle];
      }
      return customStyle ? [containerStyle, customStyle] : containerStyle;
    }, [containerStyle, customStyle]);

    // Generate accessibility label
    const finalAccessibilityLabel =
      accessibilityLabel || (typeof children === 'string' ? children : undefined);

    return (
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={mergedStyle}
        className={className}
        accessibilityRole="button"
        accessibilityLabel={finalAccessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          disabled: isDisabled,
          busy: loading,
        }}
        testID={testID}
        {...pressableProps}
      >
        {/* Loading spinner */}
        {loading && (
          <ActivityIndicator
            size="small"
            color={textColor}
            style={{ marginRight: 8 }}
            accessibilityElementsHidden={true}
          />
        )}

        {/* Button text */}
        <ThemedText
          variant="button"
          style={{ color: textColor }}
          numberOfLines={1}
          accessibilityElementsHidden={true} // Parent Pressable has label
          importantForAccessibility="no"
        >
          {children}
        </ThemedText>
      </Pressable>
    );
  }
);

// Display name for debugging
BrutalistButton.displayName = 'BrutalistButton';

/**
 * Type-safe helper to get button variant configuration
 * Useful for computing styles in related components
 *
 * @example
 * ```tsx
 * const primaryConfig = getButtonVariantConfig('primary');
 * console.log(primaryConfig.backgroundColor); // '#854836'
 * ```
 */
export const getButtonVariantConfig = (
  variant: 'primary' | 'secondary' | 'tertiary'
) => {
  return BUTTON_VARIANTS[variant];
};

/**
 * Available button variants for external use
 */
export const BUTTON_VARIANT_OPTIONS = Object.keys(BUTTON_VARIANTS) as Array<
  keyof typeof BUTTON_VARIANTS
>;
