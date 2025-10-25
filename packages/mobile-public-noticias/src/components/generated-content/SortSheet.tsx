import React from 'react'
import { View, Modal, StyleSheet, Pressable, ScrollView } from 'react-native'
import { ThemedText } from '@/src/components/ThemedText'
import { X, Check, ArrowUp, ArrowDown } from 'lucide-react-native'
import type { App } from '@/src/types/generated-content-filters.types'

interface SortSheetProps {
  visible: boolean
  onClose: () => void
  currentSortBy: App.SortBy
  currentSortOrder: App.SortOrder
  onSort: (sortBy: App.SortBy, sortOrder: App.SortOrder) => void
}

/**
 * 📊 SortSheet - Bottom Sheet para seleccionar ordenamiento
 * Features:
 * - 5 opciones de ordenamiento (generatedAt, publishedAt, title, qualityScore, category)
 * - Toggle asc/desc por opción
 * - Indicador visual de selección actual
 * - Touch-friendly (56px min height)
 * - Animación nativa
 */
export function SortSheet({
  visible,
  onClose,
  currentSortBy,
  currentSortOrder,
  onSort,
}: SortSheetProps) {
  const sortOptions: App.SortOption[] = [
    {
      value: 'publishedAt',
      label: 'Fecha de publicación',
      icon: '📅',
    },
    {
      value: 'generatedAt',
      label: 'Fecha de generación',
      icon: '🤖',
    },
    {
      value: 'title',
      label: 'Título',
      icon: '🔤',
    },
    {
      value: 'qualityScore',
      label: 'Calidad',
      icon: '⭐',
    },
    {
      value: 'category',
      label: 'Categoría',
      icon: '📁',
    },
  ]

  const handleOptionPress = (sortBy: App.SortBy) => {
    // Si ya está seleccionado, cambiar orden
    if (sortBy === currentSortBy) {
      const newOrder = currentSortOrder === 'asc' ? 'desc' : 'asc'
      onSort(sortBy, newOrder)
    } else {
      // Si es nuevo, usar desc por defecto (más reciente primero)
      onSort(sortBy, 'desc')
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerContent}>
              <ThemedText variant="title-medium" style={styles.title}>
                Ordenar por
              </ThemedText>
              <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}>
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>
          </View>

          {/* Options */}
          <ScrollView style={styles.content} bounces={false}>
            {sortOptions.map((option) => {
              const isSelected = option.value === currentSortBy
              const currentOrder = isSelected ? currentSortOrder : 'desc'

              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleOptionPress(option.value)}
                  style={({ pressed }) => [
                    styles.option,
                    isSelected && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <View style={styles.optionLeft}>
                    <ThemedText variant="title-small" style={styles.optionEmoji}>
                      {option.icon}
                    </ThemedText>
                    <ThemedText
                      variant="body-medium"
                      style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                    >
                      {option.label}
                    </ThemedText>
                  </View>

                  <View style={styles.optionRight}>
                    {isSelected && (
                      <>
                        {currentOrder === 'asc' ? (
                          <ArrowUp size={18} color="#3B82F6" strokeWidth={2.5} />
                        ) : (
                          <ArrowDown size={18} color="#3B82F6" strokeWidth={2.5} />
                        )}
                        <Check size={20} color="#3B82F6" strokeWidth={3} />
                      </>
                    )}
                  </View>
                </Pressable>
              )
            })}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <ThemedText variant="label-small" color="secondary" style={styles.footerText}>
              💡 Toca nuevamente para cambiar orden (↑↓)
            </ThemedText>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#111827',
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 450,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionSelected: {
    backgroundColor: '#EFF6FF',
  },
  optionPressed: {
    backgroundColor: '#F3F4F6',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionLabel: {
    color: '#374151',
    fontSize: 16,
  },
  optionLabelSelected: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
  },
})
