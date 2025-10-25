/**
 * 🔀 SortSheet Component
 *
 * Bottom sheet para seleccionar ordenamiento
 */

import React from 'react'
import { View, Pressable, StyleSheet, Modal, SafeAreaView } from 'react-native'
import { X, Check, ArrowUp, ArrowDown } from 'lucide-react-native'
import { ThemedText } from '@/src/components/ThemedText'
import type { App } from '@/src/types/extracted-content-filters.types'
import { getAllSortOptions } from '@/src/mappers/extracted-content-filters.mappers'

interface SortSheetProps {
  visible: boolean
  onClose: () => void
  currentSortBy: App.SortBy
  currentSortOrder: App.SortOrder
  onSort: (sortBy: App.SortBy, sortOrder: App.SortOrder) => void
}

export function SortSheet({
  visible,
  onClose,
  currentSortBy,
  currentSortOrder,
  onSort,
}: SortSheetProps) {
  const sortOptions = getAllSortOptions()

  const handleSelectSort = (sortBy: App.SortBy) => {
    // If same field, toggle order
    if (sortBy === currentSortBy) {
      const newOrder = currentSortOrder === 'asc' ? 'desc' : 'asc'
      onSort(sortBy, newOrder)
    } else {
      // New field, use desc by default
      onSort(sortBy, 'desc')
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="title-medium" style={styles.title}>
            Ordenar por
          </ThemedText>
          <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={24} color="#6B7280" />
          </Pressable>
        </View>

        {/* Sort options */}
        <View style={styles.content}>
          {sortOptions.map((option) => {
            const isSelected = currentSortBy === option.value
            const isAsc = currentSortOrder === 'asc'

            return (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
                onPress={() => handleSelectSort(option.value)}
              >
                <View style={styles.optionLeft}>
                  {isSelected && <Check size={20} color="#3B82F6" strokeWidth={3} />}
                  <ThemedText
                    variant="body-large"
                    style={[styles.optionText, isSelected && styles.optionTextSelected]}
                  >
                    {option.label}
                  </ThemedText>
                </View>

                {isSelected && (
                  <View style={styles.orderIndicator}>
                    {isAsc ? (
                      <ArrowUp size={20} color="#3B82F6" strokeWidth={2.5} />
                    ) : (
                      <ArrowDown size={20} color="#3B82F6" strokeWidth={2.5} />
                    )}
                    <ThemedText variant="label-small" style={styles.orderText}>
                      {isAsc ? 'Ascendente' : 'Descendente'}
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            )
          })}
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  title: {
    color: '#111827',
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
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
  optionText: {
    color: '#374151',
  },
  optionTextSelected: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  orderIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
})
