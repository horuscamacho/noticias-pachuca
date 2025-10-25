import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';

/**
 * Brutalist design tokens for segmented control
 */
const SEGMENTED_CONTROL_TOKENS = {
  colors: {
    border: '#000000',
    activeBackground: '#854836',
    activeText: '#FFB22C',
    inactiveBackground: '#FFFFFF',
    inactiveText: '#000000',
    errorBorder: '#FF0000',
  },
  borders: {
    width: 4,
  },
  sizing: {
    height: 48,
  },
} as const;

/**
 * Option type for segmented control
 */
export interface SegmentedControlOption {
  /**
   * Display label for the option
   */
  label: string;

  /**
   * Value of the option
   */
  value: string;
}

/**
 * Props for BrutalistSegmentedControl component
 */
export interface BrutalistSegmentedControlProps {
  /**
   * Label text displayed above the control
   */
  label: string;

  /**
   * Array of options to display
   */
  options: SegmentedControlOption[];

  /**
   * Currently selected value
   */
  value: string;

  /**
   * Callback fired when selection changes
   */
  onChange: (value: string) => void;

  /**
   * Error message to display (shows red border and error text)
   */
  error?: string;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * BrutalistSegmentedControl - Production-ready brutalist segmented control
 *
 * A fully-typed, accessible segmented control with brutalist styling.
 * Displays options in equal-width segments with sharp borders and
 * bold active states.
 *
 * Features:
 * - 48px height segments with equal width distribution
 * - Active state: brown background with yellow text
 * - Inactive state: white background with black text
 * - 4px black borders separating segments
 * - Full keyboard and screen reader support
 * - ThemedText for consistent typography
 *
 * @example
 * ```tsx
 * // Gender selector
 * <BrutalistSegmentedControl
 *   label="Género"
 *   options={[
 *     { label: 'Hombre', value: 'male' },
 *     { label: 'Mujer', value: 'female' },
 *     { label: 'Otro', value: 'other' },
 *   ]}
 *   value={gender}
 *   onChange={setGender}
 * />
 *
 * // With validation error
 * <BrutalistSegmentedControl
 *   label="Tipo de cuenta"
 *   options={[
 *     { label: 'Personal', value: 'personal' },
 *     { label: 'Empresa', value: 'business' },
 *   ]}
 *   value={accountType}
 *   onChange={setAccountType}
 *   error={errors.accountType}
 * />
 * ```
 */
export const BrutalistSegmentedControl = React.memo<BrutalistSegmentedControlProps>(
  ({ label, options, value, onChange, error, testID }) => {
    // Handle segment press
    const handlePress = React.useCallback(
      (optionValue: string) => {
        if (optionValue !== value) {
          onChange(optionValue);
        }
      },
      [value, onChange]
    );

    // Container border color based on error state
    const containerBorderColor = error
      ? SEGMENTED_CONTROL_TOKENS.colors.errorBorder
      : SEGMENTED_CONTROL_TOKENS.colors.border;

    return (
      <View
        style={styles.container}
        testID={testID}
        accessibilityLabel={`${label} segmented control`}
      >
        {/* Label */}
        <ThemedText
          variant="caption"
          style={styles.label}
          accessibilityRole="text"
        >
          {label}
        </ThemedText>

        {/* Segments Container */}
        <View
          style={[
            styles.segmentsContainer,
            { borderColor: containerBorderColor },
          ]}
          accessibilityRole="radiogroup"
        >
          {options.map((option, index) => {
            const isActive = option.value === value;
            const isFirst = index === 0;
            const isLast = index === options.length - 1;

            return (
              <Pressable
                key={option.value}
                style={[
                  styles.segment,
                  isActive && styles.segmentActive,
                  !isFirst && styles.segmentWithLeftBorder,
                ]}
                onPress={() => handlePress(option.value)}
                accessible={true}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: isActive,
                  selected: isActive,
                }}
                accessibilityLabel={option.label}
                accessibilityHint={`Select ${option.label}`}
                testID={testID ? `${testID}-option-${option.value}` : undefined}
              >
                <ThemedText
                  variant="bodyEmphasis"
                  style={[
                    styles.segmentText,
                    isActive && styles.segmentTextActive,
                  ]}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* Error Message */}
        {error ? (
          <ThemedText
            variant="error"
            style={styles.errorText}
            accessibilityRole="alert"
            accessibilityLive="polite"
          >
            {error}
          </ThemedText>
        ) : null}
      </View>
    );
  }
);

// Display name for debugging
BrutalistSegmentedControl.displayName = 'BrutalistSegmentedControl';

/**
 * Styles for BrutalistSegmentedControl component
 */
const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 4,
    color: SEGMENTED_CONTROL_TOKENS.colors.border,
  },
  segmentsContainer: {
    flexDirection: 'row',
    height: SEGMENTED_CONTROL_TOKENS.sizing.height,
    borderWidth: SEGMENTED_CONTROL_TOKENS.borders.width,
    borderRadius: 0, // Sharp corners for brutalist style
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SEGMENTED_CONTROL_TOKENS.colors.inactiveBackground,
    paddingHorizontal: 8,
  },
  segmentActive: {
    backgroundColor: SEGMENTED_CONTROL_TOKENS.colors.activeBackground,
  },
  segmentWithLeftBorder: {
    borderLeftWidth: SEGMENTED_CONTROL_TOKENS.borders.width,
    borderLeftColor: SEGMENTED_CONTROL_TOKENS.colors.border,
  },
  segmentText: {
    color: SEGMENTED_CONTROL_TOKENS.colors.inactiveText,
    textAlign: 'center',
  },
  segmentTextActive: {
    color: SEGMENTED_CONTROL_TOKENS.colors.activeText,
  },
  errorText: {
    marginTop: 4,
  },
});

/**
 * Export tokens for use in other components
 */
export const SEGMENTED_CONTROL_DESIGN_TOKENS = SEGMENTED_CONTROL_TOKENS;
