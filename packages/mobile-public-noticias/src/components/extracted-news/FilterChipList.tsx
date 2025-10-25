/**
 * 🏷️ FilterChipList Component
 *
 * Shows active filters as removable chips
 */

import React from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { X } from 'lucide-react-native'
import { ThemedText } from '@/src/components/ThemedText'
import type { App } from '@/src/types/extracted-content-filters.types'

interface FilterChipListProps {
  chips: App.FilterChip[]
  onClearAll: () => void
}

export function FilterChipList({ chips, onClearAll }: FilterChipListProps) {
  if (chips.length === 0) return null

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {chips.map((chip) => (
          <Pressable
            key={chip.id}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            onPress={chip.onRemove}
          >
            <ThemedText variant="label-medium" style={styles.chipText} numberOfLines={1}>
              {chip.label}
            </ThemedText>
            <X size={14} color="#6B7280" strokeWidth={2.5} />
          </Pressable>
        ))}

        {/* Clear all button */}
        <Pressable
          style={({ pressed }) => [styles.clearAllChip, pressed && styles.clearAllChipPressed]}
          onPress={onClearAll}
        >
          <ThemedText variant="label-medium" style={styles.clearAllText}>
            Limpiar todo
          </ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  chipsContainer: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    maxWidth: 200,
  },
  chipPressed: {
    backgroundColor: '#DBEAFE',
  },
  chipText: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  clearAllChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearAllChipPressed: {
    backgroundColor: '#FEE2E2',
  },
  clearAllText: {
    color: '#DC2626',
    fontWeight: '600',
  },
})
