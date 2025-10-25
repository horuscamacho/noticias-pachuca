/**
 * 🏷️ TagArrayInput Component
 *
 * Input para agregar tags con botón "+" (NO comma-separated)
 *
 * Features:
 * - Input de texto con botón "+" para agregar
 * - Lista de tags con botón "X" para eliminar
 * - Validación de duplicados
 * - Visual feedback con badges
 * - Auto-trim y lowercase
 */

import React, { useState } from 'react'
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { Plus, X } from 'lucide-react-native'
import { ThemedText } from '@/src/components/ThemedText'
import { Badge } from '@/components/ui/badge'

interface TagArrayInputProps {
  label: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  variant?: 'default' | 'categories' | 'keywords'
}

export function TagArrayInput({
  label,
  value,
  onChange,
  placeholder = 'Escribe y presiona +',
  maxTags = 20,
  variant = 'default',
}: TagArrayInputProps) {
  const [inputText, setInputText] = useState('')

  // Handle add tag
  const handleAddTag = () => {
    const trimmedText = inputText.trim()

    // Validaciones
    if (!trimmedText) return
    if (value.length >= maxTags) return
    if (value.includes(trimmedText)) {
      // Ya existe, solo limpiar input
      setInputText('')
      return
    }

    // Agregar tag
    onChange([...value, trimmedText])
    setInputText('')
  }

  // Handle remove tag
  const handleRemoveTag = (index: number) => {
    const newTags = value.filter((_, i) => i !== index)
    onChange(newTags)
  }

  // Handle key press (Enter key)
  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  // Get badge variant based on input variant
  const getBadgeVariant = () => {
    switch (variant) {
      case 'categories':
        return 'default' // Yellow/black
      case 'keywords':
        return 'secondary' // Gray
      default:
        return 'outline'
    }
  }

  return (
    <View style={styles.container}>
      {/* Label */}
      <ThemedText variant="label-medium" style={styles.label}>
        {label}
        {value.length > 0 && (
          <ThemedText variant="label-small" style={styles.counter}>
            {' '}
            ({value.length}/{maxTags})
          </ThemedText>
        )}
      </ThemedText>

      {/* Input row con botón + */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleAddTag}
          onKeyPress={handleKeyPress}
          autoCapitalize="none"
          autoCorrect={false}
          editable={value.length < maxTags}
        />

        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
            value.length >= maxTags && styles.addButtonDisabled,
          ]}
          onPress={handleAddTag}
          disabled={value.length >= maxTags || !inputText.trim()}
        >
          <Plus
            size={20}
            color={value.length >= maxTags || !inputText.trim() ? '#9CA3AF' : '#000000'}
          />
        </Pressable>
      </View>

      {/* Tags list */}
      {value.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsContainer}
        >
          {value.map((tag, index) => (
            <Badge key={index} variant={getBadgeVariant()} style={styles.tagBadge}>
              <View style={styles.tagContent}>
                <ThemedText numberOfLines={1} style={styles.tagText}>
                  {tag}
                </ThemedText>
                <Pressable
                  onPress={() => handleRemoveTag(index)}
                  hitSlop={8}
                  style={styles.removeButton}
                >
                  <X size={14} color="#000000" />
                </Pressable>
              </View>
            </Badge>
          ))}
        </ScrollView>
      )}

      {/* Help text */}
      {value.length === 0 && (
        <ThemedText variant="body-small" style={styles.helpText}>
          💡 Escribe un {variant === 'categories' ? 'categoría' : variant === 'keywords' ? 'keyword' : 'tag'} y presiona el botón + para agregar
        </ThemedText>
      )}

      {value.length >= maxTags && (
        <ThemedText variant="body-small" style={styles.warningText}>
          ⚠️ Máximo {maxTags} {variant === 'categories' ? 'categorías' : variant === 'keywords' ? 'keywords' : 'tags'} alcanzado
        </ThemedText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    color: '#111827',
    fontWeight: '700',
  },
  counter: {
    color: '#6B7280',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#f1ef47',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    backgroundColor: '#e5e33d',
  },
  addButtonDisabled: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  tagBadge: {
    flexDirection: 'row',
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    maxWidth: 120,
  },
  removeButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
  warningText: {
    color: '#DC2626',
    fontWeight: '600',
  },
})
