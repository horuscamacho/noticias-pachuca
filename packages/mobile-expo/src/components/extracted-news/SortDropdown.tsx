/**
 * 📊 Sort Dropdown Component
 *
 * Compact dropdown for sorting extracted news using RadioGroup
 * - Absolutely positioned below trigger button
 * - RadioGroup for sort field selection
 * - Switch for asc/desc order
 * - Closes on selection or backdrop press
 */

import React, { useState } from 'react'
import { View, StyleSheet, Pressable, Text } from 'react-native'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ThemedText } from '@/src/components/ThemedText'
import type { App } from '@/src/types/extracted-content-filters.types'

interface SortDropdownProps {
  visible: boolean
  onClose: () => void
  sortBy: App.SortBy
  sortOrder: App.SortOrder
  onSortChange: (sortBy: App.SortBy, sortOrder: App.SortOrder) => void
  triggerLayout?: { x: number; y: number; width: number; height: number }
}

export function SortDropdown({
  visible,
  onClose,
  sortBy,
  sortOrder,
  onSortChange,
  triggerLayout,
}: SortDropdownProps) {
  const [localSortBy, setLocalSortBy] = useState<App.SortBy>(sortBy)
  const [localSortOrder, setLocalSortOrder] = useState<App.SortOrder>(sortOrder)

  if (!visible) return null

  const handleApply = () => {
    onSortChange(localSortBy, localSortOrder)
    onClose()
  }

  const toggleSortOrder = () => {
    setLocalSortOrder(localSortOrder === 'asc' ? 'desc' : 'asc')
  }

  // Calculate dropdown position
  const dropdownTop = triggerLayout ? triggerLayout.y + triggerLayout.height + 4 : 60
  const dropdownRight = 16

  return (
    <>
      {/* Backdrop */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessible={false}
      />

      {/* Dropdown */}
      <View
        style={[
          styles.dropdown,
          {
            top: dropdownTop,
            right: dropdownRight,
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="label-large" style={styles.title}>
            Ordenar por
          </ThemedText>
        </View>

        {/* Sort Field RadioGroup */}
        <RadioGroup
          value={localSortBy}
          onValueChange={(value) => setLocalSortBy(value as App.SortBy)}
          style={styles.radioGroup}
        >
          <View style={styles.radioItem}>
            <RadioGroupItem value="extractedAt" aria-labelledby="radio-extractedAt" />
            <Label nativeID="radio-extractedAt" onPress={() => setLocalSortBy('extractedAt')}>
              <ThemedText variant="body-medium">Fecha de extracción</ThemedText>
            </Label>
          </View>

          <View style={styles.radioItem}>
            <RadioGroupItem value="publishedAt" aria-labelledby="radio-publishedAt" />
            <Label nativeID="radio-publishedAt" onPress={() => setLocalSortBy('publishedAt')}>
              <ThemedText variant="body-medium">Fecha de publicación</ThemedText>
            </Label>
          </View>

          <View style={styles.radioItem}>
            <RadioGroupItem value="title" aria-labelledby="radio-title" />
            <Label nativeID="radio-title" onPress={() => setLocalSortBy('title')}>
              <ThemedText variant="body-medium">Título</ThemedText>
            </Label>
          </View>

          <View style={styles.radioItem}>
            <RadioGroupItem value="category" aria-labelledby="radio-category" />
            <Label nativeID="radio-category" onPress={() => setLocalSortBy('category')}>
              <ThemedText variant="body-medium">Categoría</ThemedText>
            </Label>
          </View>

          <View style={styles.radioItem}>
            <RadioGroupItem value="author" aria-labelledby="radio-author" />
            <Label nativeID="radio-author" onPress={() => setLocalSortBy('author')}>
              <ThemedText variant="body-medium">Autor</ThemedText>
            </Label>
          </View>
        </RadioGroup>

        {/* Sort Order Toggle */}
        <View style={styles.orderSection}>
          <View style={styles.orderRow}>
            <ThemedText variant="label-medium" style={styles.orderLabel}>
              Orden
            </ThemedText>
            <View style={styles.orderToggle}>
              <ThemedText
                variant="body-small"
                color={localSortOrder === 'asc' ? 'primary' : 'secondary'}
              >
                ASC
              </ThemedText>
              <Switch
                checked={localSortOrder === 'desc'}
                onCheckedChange={toggleSortOrder}
                nativeID="sort-order-switch"
              />
              <ThemedText
                variant="body-small"
                color={localSortOrder === 'desc' ? 'primary' : 'secondary'}
              >
                DESC
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Apply Button */}
        <Pressable
          style={styles.applyButton}
          onPress={handleApply}
        >
          <ThemedText variant="label-medium" style={styles.applyButtonText}>
            Aplicar
          </ThemedText>
        </Pressable>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    color: '#111827',
    fontWeight: '600',
  },
  radioGroup: {
    gap: 12,
    marginBottom: 16,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44, // Touch target
    paddingVertical: 4,
  },
  orderSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 16,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44, // Touch target
  },
  orderLabel: {
    color: '#111827',
    fontWeight: '600',
  },
  orderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applyButton: {
    backgroundColor: '#f1ef47',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    minHeight: 44, // Touch target
  },
  applyButtonText: {
    color: '#000000',
    fontWeight: '600',
  },
})
