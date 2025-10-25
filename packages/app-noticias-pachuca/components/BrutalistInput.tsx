import React from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  Pressable,
  StyleSheet,
} from 'react-native';
import { ThemedText } from './ThemedText';

/**
 * Brutalist design tokens for form inputs
 */
const INPUT_TOKENS = {
  colors: {
    background: '#F7F7F7',
    border: '#000000',
    borderFocus: '#854836',
    borderError: '#FF0000',
    text: '#000000',
    placeholder: '#6B7280',
  },
  borders: {
    default: 4,
    focus: 6,
  },
  spacing: {
    padding: 16,
    labelMargin: 4,
    errorMargin: 4,
  },
  sizing: {
    height: 56,
    fontSize: 16,
  },
} as const;

/**
 * Props for BrutalistInput component
 */
export interface BrutalistInputProps {
  /**
   * Label text displayed above the input
   */
  label: string;

  /**
   * Current input value
   */
  value: string;

  /**
   * Callback fired when text changes
   */
  onChangeText: (text: string) => void;

  /**
   * Callback fired when input loses focus
   */
  onBlur?: () => void;

  /**
   * Error message to display (shows red border and error text)
   */
  error?: string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Hide text input for passwords
   */
  secureTextEntry?: boolean;

  /**
   * Keyboard type for input
   */
  keyboardType?: KeyboardTypeOptions;

  /**
   * Auto-capitalization behavior
   */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';

  /**
   * Return key type
   */
  returnKeyType?: ReturnKeyTypeOptions;

  /**
   * Callback fired when return key is pressed
   */
  onSubmitEditing?: () => void;

  /**
   * Whether the input is editable
   */
  editable?: boolean;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * BrutalistInput - Production-ready brutalist text input component
 *
 * A fully-typed, accessible text input with brutalist styling including
 * sharp borders, bold typography, and clear focus/error states.
 *
 * Features:
 * - 56px touch target for accessibility
 * - Focus state with 6px brown border
 * - Error state with 4px red border + error message
 * - Full keyboard configuration support
 * - ThemedText for consistent typography
 *
 * @example
 * ```tsx
 * // Basic text input
 * <BrutalistInput
 *   label="Nombre"
 *   value={name}
 *   onChangeText={setName}
 *   placeholder="Ingresa tu nombre"
 *   autoCapitalize="words"
 * />
 *
 * // Email input with validation
 * <BrutalistInput
 *   label="Email"
 *   value={email}
 *   onChangeText={setEmail}
 *   error={errors.email}
 *   keyboardType="email-address"
 *   autoCapitalize="none"
 * />
 *
 * // Password input
 * <BrutalistInput
 *   label="Contraseña"
 *   value={password}
 *   onChangeText={setPassword}
 *   secureTextEntry
 *   error={errors.password}
 * />
 * ```
 */
export const BrutalistInput = React.memo<BrutalistInputProps>(
  ({
    label,
    value,
    onChangeText,
    onBlur,
    error,
    placeholder,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'none',
    returnKeyType = 'done',
    onSubmitEditing,
    editable = true,
    testID,
  }) => {
    const [isFocused, setIsFocused] = React.useState(false);

    const handleFocus = React.useCallback(() => {
      setIsFocused(true);
    }, []);

    const handleBlur = React.useCallback(() => {
      setIsFocused(false);
      onBlur?.();
    }, [onBlur]);

    // Determine border style based on state
    const borderStyle = React.useMemo(() => {
      if (error) {
        return {
          borderWidth: INPUT_TOKENS.borders.default,
          borderColor: INPUT_TOKENS.colors.borderError,
        };
      }
      if (isFocused) {
        return {
          borderWidth: INPUT_TOKENS.borders.focus,
          borderColor: INPUT_TOKENS.colors.borderFocus,
        };
      }
      return {
        borderWidth: INPUT_TOKENS.borders.default,
        borderColor: INPUT_TOKENS.colors.border,
      };
    }, [error, isFocused]);

    return (
      <View
        style={styles.container}
        testID={testID}
        accessibilityLabel={`${label} input field`}
      >
        {/* Label */}
        <ThemedText
          variant="caption"
          style={styles.label}
          accessibilityRole="text"
        >
          {label}
        </ThemedText>

        {/* Input Container */}
        <View style={[styles.inputContainer, borderStyle]}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor={INPUT_TOKENS.colors.placeholder}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            editable={editable}
            style={styles.input}
            accessible={true}
            accessibilityLabel={label}
            accessibilityHint={error ? `Error: ${error}` : undefined}
            accessibilityState={{
              disabled: !editable,
            }}
            testID={testID ? `${testID}-input` : undefined}
          />
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
BrutalistInput.displayName = 'BrutalistInput';

/**
 * Styles for BrutalistInput component
 */
const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: INPUT_TOKENS.spacing.labelMargin,
    color: INPUT_TOKENS.colors.text,
  },
  inputContainer: {
    backgroundColor: INPUT_TOKENS.colors.background,
    minHeight: INPUT_TOKENS.sizing.height,
    borderRadius: 0, // Sharp corners for brutalist style
  },
  input: {
    fontSize: INPUT_TOKENS.sizing.fontSize,
    fontWeight: '600',
    color: INPUT_TOKENS.colors.text,
    padding: INPUT_TOKENS.spacing.padding,
    minHeight: INPUT_TOKENS.sizing.height,
    // Ensure no default border radius
    borderRadius: 0,
  },
  errorText: {
    marginTop: INPUT_TOKENS.spacing.errorMargin,
  },
});

/**
 * Export tokens for use in other components
 */
export const INPUT_DESIGN_TOKENS = INPUT_TOKENS;
