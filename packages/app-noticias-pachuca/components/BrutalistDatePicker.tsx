import React from 'react';
import { View, Pressable, StyleSheet, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from './ThemedText';

/**
 * Brutalist design tokens for date picker
 */
const DATE_PICKER_TOKENS = {
  colors: {
    background: '#F7F7F7',
    border: '#000000',
    borderError: '#FF0000',
    text: '#000000',
    placeholder: '#6B7280',
  },
  borders: {
    width: 4,
  },
  sizing: {
    height: 56,
  },
} as const;

/**
 * Props for BrutalistDatePicker component
 */
export interface BrutalistDatePickerProps {
  /**
   * Label text displayed above the picker
   */
  label: string;

  /**
   * Currently selected date (null if not selected)
   */
  value: Date | null;

  /**
   * Callback fired when date is selected
   */
  onChange: (date: Date) => void;

  /**
   * Minimum age requirement (restricts maximum selectable date)
   * @default 0
   */
  minimumAge?: number;

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
 * Format date to DD/MM/YYYY string
 */
const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Calculate maximum date based on minimum age requirement
 */
const calculateMaximumDate = (minimumAge: number): Date => {
  const today = new Date();
  const maxDate = new Date(
    today.getFullYear() - minimumAge,
    today.getMonth(),
    today.getDate()
  );
  return maxDate;
};

/**
 * BrutalistDatePicker - Production-ready brutalist date picker component
 *
 * A fully-typed, accessible date picker with brutalist styling using
 * react-native-date-picker. Shows formatted date or placeholder text
 * in a trigger button, opens modal picker on press.
 *
 * Features:
 * - 56px touch target for accessibility
 * - DD/MM/YYYY date format
 * - Age restriction support (minimumAge prop)
 * - Modal date picker with native feel
 * - Error state with red border + error message
 * - ThemedText for consistent typography
 *
 * @example
 * ```tsx
 * // Basic date picker
 * <BrutalistDatePicker
 *   label="Fecha de Nacimiento"
 *   value={birthdate}
 *   onChange={setBirthdate}
 * />
 *
 * // With 18+ age restriction
 * <BrutalistDatePicker
 *   label="Fecha de Nacimiento"
 *   value={birthdate}
 *   onChange={setBirthdate}
 *   minimumAge={18}
 *   error={errors.birthdate}
 * />
 *
 * // With validation
 * <BrutalistDatePicker
 *   label="Fecha del evento"
 *   value={eventDate}
 *   onChange={setEventDate}
 *   error={errors.eventDate}
 * />
 * ```
 */
export const BrutalistDatePicker = React.memo<BrutalistDatePickerProps>(
  ({ label, value, onChange, minimumAge = 0, error, testID }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    // Calculate maximum date based on minimum age
    const maximumDate = React.useMemo(() => {
      return calculateMaximumDate(minimumAge);
    }, [minimumAge]);

    // Default date to show in picker (today or max date if age restricted)
    const defaultDate = React.useMemo(() => {
      return minimumAge > 0 ? maximumDate : new Date();
    }, [minimumAge, maximumDate]);

    // Handle date confirmation
    const handleConfirm = React.useCallback(
      (selectedDate: Date) => {
        setIsOpen(false);
        onChange(selectedDate);
      },
      [onChange]
    );

    // Handle date picker cancel
    const handleCancel = React.useCallback(() => {
      setIsOpen(false);
    }, []);

    // Handle trigger press
    const handlePress = React.useCallback(() => {
      setIsOpen(true);
    }, []);

    // Display text (formatted date or placeholder)
    const displayText = value ? formatDate(value) : 'DD/MM/YYYY';
    const isPlaceholder = !value;

    // Determine border color based on error state
    const borderColor = error
      ? DATE_PICKER_TOKENS.colors.borderError
      : DATE_PICKER_TOKENS.colors.border;

    return (
      <View
        style={styles.container}
        testID={testID}
        accessibilityLabel={`${label} date picker`}
      >
        {/* Label */}
        <ThemedText
          variant="caption"
          style={styles.label}
          accessibilityRole="text"
        >
          {label}
        </ThemedText>

        {/* Trigger Button */}
        <Pressable
          style={[styles.trigger, { borderColor }]}
          onPress={handlePress}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${value ? formatDate(value) : 'not selected'}`}
          accessibilityHint="Opens date picker"
          accessibilityState={{
            disabled: false,
          }}
          testID={testID ? `${testID}-trigger` : undefined}
        >
          <ThemedText
            variant="bodyEmphasis"
            style={[
              styles.triggerText,
              isPlaceholder && styles.triggerTextPlaceholder,
            ]}
          >
            {displayText}
          </ThemedText>
        </Pressable>

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

        {/* Date Picker Modal */}
        {isOpen && (
          <>
            {Platform.OS === 'ios' ? (
              <Modal
                transparent={true}
                animationType="slide"
                visible={isOpen}
                onRequestClose={handleCancel}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Pressable onPress={handleCancel} style={styles.modalButton}>
                        <ThemedText variant="button" className="text-brutalist-brown">
                          Cancelar
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => handleConfirm(value || defaultDate)}
                        style={styles.modalButton}
                      >
                        <ThemedText variant="button" className="text-brutalist-brown">
                          Confirmar
                        </ThemedText>
                      </Pressable>
                    </View>
                    <DateTimePicker
                      value={value || defaultDate}
                      mode="date"
                      display="spinner"
                      maximumDate={maximumDate}
                      onChange={(event, selectedDate) => {
                        if (event.type === 'set' && selectedDate) {
                          onChange(selectedDate);
                        }
                      }}
                      locale="es-MX"
                      testID={testID ? `${testID}-picker` : undefined}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={value || defaultDate}
                mode="date"
                display="default"
                maximumDate={maximumDate}
                onChange={(event, selectedDate) => {
                  setIsOpen(false);
                  if (event.type === 'set' && selectedDate) {
                    onChange(selectedDate);
                  }
                }}
                testID={testID ? `${testID}-picker` : undefined}
              />
            )}
          </>
        )}
      </View>
    );
  }
);

// Display name for debugging
BrutalistDatePicker.displayName = 'BrutalistDatePicker';

/**
 * Styles for BrutalistDatePicker component
 */
const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 4,
    color: DATE_PICKER_TOKENS.colors.text,
  },
  trigger: {
    backgroundColor: DATE_PICKER_TOKENS.colors.background,
    borderWidth: DATE_PICKER_TOKENS.borders.width,
    borderRadius: 0, // Sharp corners for brutalist style
    minHeight: DATE_PICKER_TOKENS.sizing.height,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  triggerText: {
    color: DATE_PICKER_TOKENS.colors.text,
  },
  triggerTextPlaceholder: {
    color: DATE_PICKER_TOKENS.colors.placeholder,
  },
  errorText: {
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 4,
    borderTopColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
  },
  modalButton: {
    padding: 8,
  },
});

/**
 * Export tokens for use in other components
 */
export const DATE_PICKER_DESIGN_TOKENS = DATE_PICKER_TOKENS;

/**
 * Export utility functions for use in other components
 */
export const datePickerUtils = {
  formatDate,
  calculateMaximumDate,
};
