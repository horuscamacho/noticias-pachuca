import React, { useMemo, useState, useCallback } from 'react';
import { Pressable, ViewStyle, TextStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '../ThemedText';

/**
 * Design tokens for EditionDropdown
 */
const EDITION_DROPDOWN_TOKENS = {
  // Dimensions
  width: 28,
  height: 28,
  minHeight: 44, // iOS minimum touch target (for accessibility)

  // Borders
  borderWidth: 2,
  borderColor: '#000000', // Black

  // Colors
  background: '#FFFFFF', // White
  iconColor: '#000000', // Black
  pressedBackground: '#FFB22C', // Yellow on press
  pressedIconColor: '#000000', // Black icon on yellow

  // Icon
  iconSize: 16,
} as const;

/**
 * Props interface for EditionDropdown component
 */
export interface EditionDropdownProps {
  /**
   * Callback when dropdown is pressed
   */
  onPress: () => void;

  /**
   * Current edition text to display
   * @default "EDICIÓN"
   */
  currentEdition?: string;

  /**
   * Disable dropdown interaction
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
   * Accessibility label
   */
  accessibilityLabel?: string;

  /**
   * Accessibility hint
   */
  accessibilityHint?: string;

  /**
   * Enable haptic feedback on press
   * @default true
   */
  enableHaptics?: boolean;
}

/**
 * EditionDropdown - Brutalist dropdown button component
 *
 * A compact dropdown button for edition selection:
 * - Fixed 28px × 28px size
 * - White background with 2px black border
 * - Chevron-down icon from Ionicons
 * - Yellow background on press
 * - Haptic feedback
 * - WCAG compliant touch target
 *
 * @example
 * ```tsx
 * // Default edition dropdown
 * <EditionDropdown
 *   onPress={handleOpenEditionPicker}
 *   accessibilityHint="Seleccionar edición de noticias"
 * />
 *
 * // With current edition
 * <EditionDropdown
 *   onPress={handleOpenEditionPicker}
 *   currentEdition="PACHUCA"
 * />
 *
 * // Disabled state
 * <EditionDropdown
 *   onPress={() => {}}
 *   currentEdition="NACIONAL"
 *   disabled={true}
 * />
 * ```
 */
export const EditionDropdown = React.memo<EditionDropdownProps>(
  ({
    onPress,
    currentEdition = 'EDICIÓN',
    disabled = false,
    className,
    testID = 'edition-dropdown',
    accessibilityLabel,
    accessibilityHint = 'Seleccionar edición de noticias',
    enableHaptics = true,
  }) => {
    // Track pressed state
    const [isPressed, setIsPressed] = useState(false);

    // Compute button container styles
    const buttonStyle = useMemo<ViewStyle>(() => {
      return {
        width: EDITION_DROPDOWN_TOKENS.width,
        height: EDITION_DROPDOWN_TOKENS.height,
        backgroundColor: isPressed
          ? EDITION_DROPDOWN_TOKENS.pressedBackground
          : EDITION_DROPDOWN_TOKENS.background,
        borderWidth: EDITION_DROPDOWN_TOKENS.borderWidth,
        borderColor: EDITION_DROPDOWN_TOKENS.borderColor,
        borderRadius: 0, // Sharp corners (brutalist)
        alignItems: 'center',
        justifyContent: 'center',
        // Press animation
        transform: [{ scale: isPressed && !disabled ? 0.98 : 1 }],
        opacity: disabled ? 0.6 : 1,
      };
    }, [isPressed, disabled]);

    // Compute icon color
    const iconColor = useMemo(() => {
      return isPressed
        ? EDITION_DROPDOWN_TOKENS.pressedIconColor
        : EDITION_DROPDOWN_TOKENS.iconColor;
    }, [isPressed]);

    // Handle press
    const handlePress = useCallback(() => {
      if (disabled) return;

      // Trigger haptic feedback
      if (enableHaptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
          // Silently fail if haptics not supported
        });
      }

      onPress();
    }, [disabled, enableHaptics, onPress]);

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
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={buttonStyle}
        className={className}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || `Edición: ${currentEdition}`}
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          disabled,
        }}
        testID={testID}
      >
        {/* Chevron-down icon only */}
        <Ionicons
          name="chevron-down"
          size={EDITION_DROPDOWN_TOKENS.iconSize}
          color={iconColor}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        />
      </Pressable>
    );
  }
);

// Display name for debugging
EditionDropdown.displayName = 'EditionDropdown';

/**
 * Export design tokens for external use
 */
export const EDITION_DROPDOWN_DESIGN_TOKENS = EDITION_DROPDOWN_TOKENS;
