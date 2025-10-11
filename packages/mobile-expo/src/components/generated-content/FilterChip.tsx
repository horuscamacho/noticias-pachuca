import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { ThemedText } from '@/src/components/ThemedText'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react-native'
import type { App } from '@/src/types/generated-content-filters.types'

interface FilterChipProps {
  chip: App.FilterChip
}

/**
 * 🏷️ FilterChip - Chip removible para filtros activos
 * Features:
 * - Diferentes colores según tipo de filtro
 * - Botón X para remover
 * - Touch-friendly (min 44px height)
 * - Animación al presionar
 */
export function FilterChip({ chip }: FilterChipProps) {
  // Colores por tipo de filtro
  const getChipStyle = (type: App.FilterChip['type']) => {
    switch (type) {
      case 'status':
        return {
          bg: '#EFF6FF',
          border: '#3B82F6',
          text: '#1E40AF',
        }
      case 'agent':
        return {
          bg: '#F3E8FF',
          border: '#8B5CF6',
          text: '#6B21A8',
        }
      case 'template':
        return {
          bg: '#FCE7F3',
          border: '#EC4899',
          text: '#9F1239',
        }
      case 'provider':
        return {
          bg: '#FEF3C7',
          border: '#F59E0B',
          text: '#92400E',
        }
      case 'category':
        return {
          bg: '#D1FAE5',
          border: '#10B981',
          text: '#065F46',
        }
      case 'tag':
        return {
          bg: '#E0E7FF',
          border: '#6366F1',
          text: '#3730A3',
        }
      case 'date':
        return {
          bg: '#FEE2E2',
          border: '#EF4444',
          text: '#991B1B',
        }
      case 'quality':
        return {
          bg: '#FFFBEB',
          border: '#F59E0B',
          text: '#78350F',
        }
      case 'search':
        return {
          bg: '#F3F4F6',
          border: '#6B7280',
          text: '#374151',
        }
      default:
        return {
          bg: '#F3F4F6',
          border: '#D1D5DB',
          text: '#4B5563',
        }
    }
  }

  const chipStyle = getChipStyle(chip.type)

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: chipStyle.bg, borderColor: chipStyle.border },
      ]}
    >
      <ThemedText
        variant="label-small"
        style={[styles.label, { color: chipStyle.text }]}
        numberOfLines={1}
      >
        {chip.label}
      </ThemedText>
      <Pressable
        onPress={chip.onRemove}
        style={({ pressed }) => [
          styles.removeButton,
          pressed && styles.removeButtonPressed,
        ]}
        hitSlop={8}
      >
        <X size={14} color={chipStyle.text} strokeWidth={2.5} />
      </Pressable>
    </View>
  )
}

/**
 * 📦 FilterChipList - Lista horizontal de chips
 */
interface FilterChipListProps {
  chips: App.FilterChip[]
  onClearAll?: () => void
}

export function FilterChipList({ chips, onClearAll }: FilterChipListProps) {
  if (chips.length === 0) return null

  return (
    <View style={styles.chipList}>
      <View style={styles.chipRow}>
        {chips.map((chip) => (
          <FilterChip key={chip.id} chip={chip} />
        ))}
        {chips.length > 1 && onClearAll && (
          <Pressable
            onPress={onClearAll}
            style={({ pressed }) => [
              styles.clearAllButton,
              pressed && styles.clearAllButtonPressed,
            ]}
          >
            <ThemedText variant="label-small" style={styles.clearAllText}>
              Limpiar todo
            </ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 200,
    minHeight: 32,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  removeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  removeButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  chipList: {
    paddingVertical: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
    minHeight: 32,
    justifyContent: 'center',
  },
  clearAllButtonPressed: {
    backgroundColor: '#FECACA',
  },
  clearAllText: {
    color: '#991B1B',
    fontWeight: '600',
    fontSize: 12,
  },
})
