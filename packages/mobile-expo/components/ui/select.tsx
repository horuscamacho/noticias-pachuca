import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet, ViewStyle } from 'react-native';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

export function Select({ value, onValueChange, options, placeholder = 'Seleccionar...', style, disabled }: SelectProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <>
      <Pressable
        style={[styles.select, disabled && styles.selectDisabled, style]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[styles.selectText, !selectedOption && styles.selectPlaceholder]}>
          {selectedOption?.label || placeholder}
        </Text>
        <Text style={styles.selectIcon}>▼</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.option,
                    item.value === value && styles.optionSelected
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    item.value === value && styles.optionTextSelected
                  ]}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 48
  },
  selectDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6
  },
  selectText: {
    fontSize: 16,
    color: '#111827',
    flex: 1
  },
  selectPlaceholder: {
    color: '#9CA3AF'
  },
  selectIcon: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: '70%',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  optionSelected: {
    backgroundColor: '#EFF6FF'
  },
  optionText: {
    fontSize: 16,
    color: '#111827'
  },
  optionTextSelected: {
    color: '#2563EB',
    fontWeight: '600'
  }
});
