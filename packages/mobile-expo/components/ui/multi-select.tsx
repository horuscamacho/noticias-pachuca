import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet, ViewStyle, ScrollView } from 'react-native';
import { Checkbox } from './checkbox';

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
}

export interface MultiSelectProps {
  value: string[]; // Array de valores seleccionados
  onValueChange: (values: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  style?: ViewStyle;
  disabled?: boolean;
  maxHeight?: number;
}

/**
 * 📱 MultiSelect Component
 *
 * Permite seleccionar múltiples opciones de una lista con checkboxes.
 * Se abre en un modal con lista scrolleable.
 *
 * @example
 * ```tsx
 * const [selectedSites, setSelectedSites] = useState<string[]>([]);
 *
 * <MultiSelect
 *   value={selectedSites}
 *   onValueChange={setSelectedSites}
 *   options={[
 *     { label: 'Noticias Pachuca', value: 'site1' },
 *     { label: 'Tu Zona', value: 'site2' },
 *   ]}
 *   placeholder="Seleccionar sitios..."
 * />
 * ```
 */
export function MultiSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Seleccionar...',
  style,
  disabled,
  maxHeight = 400
}: MultiSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOptions = options.filter(opt => value.includes(opt.value));

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      // Remover
      onValueChange(value.filter(v => v !== optionValue));
    } else {
      // Agregar
      onValueChange([...value, optionValue]);
    }
  };

  const handleSelectAll = () => {
    if (value.length === options.length) {
      // Deseleccionar todos
      onValueChange([]);
    } else {
      // Seleccionar todos
      onValueChange(options.map(opt => opt.value));
    }
  };

  return (
    <>
      <Pressable
        style={[styles.select, disabled && styles.selectDisabled, style]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <View style={styles.selectContent}>
          {value.length === 0 ? (
            <Text style={styles.selectPlaceholder}>{placeholder}</Text>
          ) : value.length === 1 ? (
            <Text style={styles.selectText}>{selectedOptions[0]?.label}</Text>
          ) : (
            <Text style={styles.selectText}>
              {value.length} seleccionados
            </Text>
          )}
        </View>
        <Text style={styles.selectIcon}>▼</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header con botón "Seleccionar todos" y contador */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Seleccionar opciones ({value.length}/{options.length})
              </Text>
              <Pressable
                onPress={handleSelectAll}
                style={styles.selectAllButton}
              >
                <Text style={styles.selectAllText}>
                  {value.length === options.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </Text>
              </Pressable>
            </View>

            {/* Lista de opciones con scroll */}
            <ScrollView
              style={[styles.optionsList, { maxHeight }]}
              showsVerticalScrollIndicator={true}
            >
              {options.map((option) => {
                const isChecked = value.includes(option.value);

                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.option,
                      isChecked && styles.optionSelected
                    ]}
                    onPress={() => handleToggle(option.value)}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleToggle(option.value)}
                    />
                    <View style={styles.optionLabelContainer}>
                      <Text style={[
                        styles.optionLabel,
                        isChecked && styles.optionLabelSelected
                      ]}>
                        {option.label}
                      </Text>
                      {option.description && (
                        <Text style={styles.optionDescription}>
                          {option.description}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Footer con botón "Listo" */}
            <View style={styles.modalFooter}>
              <Pressable
                style={styles.doneButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.doneButtonText}>Listo</Text>
              </Pressable>
            </View>
          </Pressable>
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
  selectContent: {
    flex: 1,
    marginRight: 8
  },
  selectText: {
    fontSize: 16,
    color: '#111827'
  },
  selectPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF'
  },
  selectIcon: {
    fontSize: 12,
    color: '#6B7280'
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
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8
  },
  selectAllButton: {
    paddingVertical: 4
  },
  selectAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500'
  },
  optionsList: {
    maxHeight: 400
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  optionSelected: {
    backgroundColor: '#EFF6FF'
  },
  optionLabelContainer: {
    marginLeft: 12,
    flex: 1
  },
  optionLabel: {
    fontSize: 16,
    color: '#111827'
  },
  optionLabelSelected: {
    color: '#2563EB',
    fontWeight: '500'
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  doneButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center'
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  }
});
