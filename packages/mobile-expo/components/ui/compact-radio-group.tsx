import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface CompactRadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: RadioOption[];
  style?: ViewStyle;
  disabled?: boolean;
}

/**
 * 📱 CompactRadioGroup Component
 *
 * Permite seleccionar una opción de una lista con radio buttons.
 * Solo se puede seleccionar una opción a la vez.
 * Versión compacta con array de options (diferente al RadioGroup primitivo).
 */
export function CompactRadioGroup({
  value,
  onValueChange,
  options,
  style,
  disabled
}: CompactRadioGroupProps) {
  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const isSelected = value === option.value;
        const isDisabled = disabled || option.disabled;

        return (
          <Pressable
            key={option.value}
            style={[
              styles.radioOption,
              isSelected && styles.radioOptionSelected,
              isDisabled && styles.radioOptionDisabled
            ]}
            onPress={() => !isDisabled && onValueChange(option.value)}
            disabled={isDisabled}
          >
            <View style={[
              styles.radioCircle,
              isSelected && styles.radioCircleSelected,
              isDisabled && styles.radioCircleDisabled
            ]}>
              {isSelected && (
                <View style={[
                  styles.radioDot,
                  isDisabled && styles.radioDotDisabled
                ]} />
              )}
            </View>

            <View style={styles.radioLabelContainer}>
              <Text style={[
                styles.radioLabel,
                isSelected && styles.radioLabelSelected,
                isDisabled && styles.radioLabelDisabled
              ]}>
                {option.label}
              </Text>
              {option.description && (
                <Text style={[
                  styles.radioDescription,
                  isDisabled && styles.radioDescriptionDisabled
                ]}>
                  {option.description}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF'
  },
  radioOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF'
  },
  radioOptionDisabled: {
    opacity: 0.5,
    backgroundColor: '#F9FAFB'
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2
  },
  radioCircleSelected: {
    borderColor: '#3B82F6'
  },
  radioCircleDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6'
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6'
  },
  radioDotDisabled: {
    backgroundColor: '#9CA3AF'
  },
  radioLabelContainer: {
    marginLeft: 12,
    flex: 1
  },
  radioLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    lineHeight: 20
  },
  radioLabelSelected: {
    color: '#1E40AF',
    fontWeight: '600'
  },
  radioLabelDisabled: {
    color: '#9CA3AF'
  },
  radioDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18
  },
  radioDescriptionDisabled: {
    color: '#D1D5DB'
  }
});
