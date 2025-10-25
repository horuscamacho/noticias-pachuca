/**
 * 🎛️ FilterBottomSheet Component
 *
 * Bottom sheet modal con todos los filtros para extracted news
 *
 * Features:
 * - Status multi-select
 * - Category single-select
 * - Author single-select
 * - Tags multi-select
 * - Keywords multi-select (con KeywordSelector)
 * - Date range picker
 * - Has images toggle
 * - Clear all button
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native'
import { X, Check } from 'lucide-react-native'
import { ThemedText } from '@/src/components/ThemedText'
import { KeywordSelector } from './KeywordSelector'
import type { App } from '@/src/types/extracted-content-filters.types'
import { getStatusLabel } from '@/src/mappers/extracted-content-filters.mappers'

interface FilterBottomSheetProps {
  visible: boolean
  onClose: () => void
  filters: App.ExtractedContentFilters
  onApply: (filters: App.ExtractedContentFilters) => void
  // Filter options
  categories?: App.FilterOption[]
  authors?: App.FilterOption[]
  tags?: App.FilterOption[]
}

export function FilterBottomSheet({
  visible,
  onClose,
  filters,
  onApply,
  categories = [],
  authors = [],
  tags = [],
}: FilterBottomSheetProps) {
  // Local state for filters (before applying)
  const [localFilters, setLocalFilters] = useState<App.ExtractedContentFilters>(filters)

  // Sync local filters when modal opens
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters)
    }
  }, [visible, filters])

  // Handle apply
  const handleApply = () => {
    onApply(localFilters)
    onClose()
  }

  // Handle clear all
  const handleClearAll = () => {
    setLocalFilters({
      status: [],
      tags: [],
      keywords: [],
      sortBy: 'extractedAt',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
    })
  }

  // Toggle status
  const handleToggleStatus = (status: App.StatusFilter) => {
    const current = localFilters.status || []
    if (current.includes(status)) {
      setLocalFilters({
        ...localFilters,
        status: current.filter((s) => s !== status),
      })
    } else {
      setLocalFilters({
        ...localFilters,
        status: [...current, status],
      })
    }
  }

  // Status options
  const statusOptions: App.StatusFilter[] = ['extracted', 'pending', 'processing', 'failed']

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="title-medium" style={styles.title}>
            Filtros
          </ThemedText>
          <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <X size={24} color="#6B7280" />
          </Pressable>
        </View>

        {/* Filters content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status section */}
          <View style={styles.section}>
            <ThemedText variant="title-small" style={styles.sectionTitle}>
              Estado
            </ThemedText>
            <View style={styles.optionsGrid}>
              {statusOptions.map((status) => {
                const selected = localFilters.status?.includes(status) || false
                return (
                  <Pressable
                    key={status}
                    style={[styles.optionChip, selected && styles.optionChipSelected]}
                    onPress={() => handleToggleStatus(status)}
                  >
                    {selected && <Check size={16} color="#000000" strokeWidth={3} />}
                    <ThemedText
                      variant="label-medium"
                      style={[styles.optionText, selected && styles.optionTextSelected]}
                    >
                      {getStatusLabel(status)}
                    </ThemedText>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Category section */}
          {categories.length > 0 && (
            <View style={styles.section}>
              <ThemedText variant="title-small" style={styles.sectionTitle}>
                Categoría
              </ThemedText>
              <View style={styles.optionsGrid}>
                {categories.map((cat) => {
                  const selected = localFilters.category === cat.value
                  return (
                    <Pressable
                      key={cat.value}
                      style={[styles.optionChip, selected && styles.optionChipSelected]}
                      onPress={() =>
                        setLocalFilters({
                          ...localFilters,
                          category: selected ? undefined : cat.value,
                        })
                      }
                    >
                      {selected && <Check size={16} color="#000000" strokeWidth={3} />}
                      <ThemedText
                        variant="label-medium"
                        style={[styles.optionText, selected && styles.optionTextSelected]}
                      >
                        {cat.label} ({cat.count})
                      </ThemedText>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )}

          {/* Author section */}
          {authors.length > 0 && (
            <View style={styles.section}>
              <ThemedText variant="title-small" style={styles.sectionTitle}>
                Autor
              </ThemedText>
              <View style={styles.optionsGrid}>
                {authors.map((author) => {
                  const selected = localFilters.author === author.value
                  return (
                    <Pressable
                      key={author.value}
                      style={[styles.optionChip, selected && styles.optionChipSelected]}
                      onPress={() =>
                        setLocalFilters({
                          ...localFilters,
                          author: selected ? undefined : author.value,
                        })
                      }
                    >
                      {selected && <Check size={16} color="#000000" strokeWidth={3} />}
                      <ThemedText
                        variant="label-medium"
                        style={[styles.optionText, selected && styles.optionTextSelected]}
                      >
                        {author.label} ({author.count})
                      </ThemedText>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )}

          {/* Tags section */}
          {tags.length > 0 && (
            <View style={styles.section}>
              <ThemedText variant="title-small" style={styles.sectionTitle}>
                Tags
              </ThemedText>
              <View style={styles.optionsGrid}>
                {tags.map((tag) => {
                  const selected = localFilters.tags?.includes(tag.value) || false
                  return (
                    <Pressable
                      key={tag.value}
                      style={[styles.optionChip, selected && styles.optionChipSelected]}
                      onPress={() => {
                        const current = localFilters.tags || []
                        setLocalFilters({
                          ...localFilters,
                          tags: selected
                            ? current.filter((t) => t !== tag.value)
                            : [...current, tag.value],
                        })
                      }}
                    >
                      {selected && <Check size={16} color="#000000" strokeWidth={3} />}
                      <ThemedText
                        variant="label-medium"
                        style={[styles.optionText, selected && styles.optionTextSelected]}
                      >
                        {tag.label} ({tag.count})
                      </ThemedText>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )}

          {/* Keywords section with KeywordSelector */}
          <View style={styles.section}>
            <ThemedText variant="title-small" style={styles.sectionTitle}>
              Keywords
            </ThemedText>
            <KeywordSelector
              selectedKeywords={localFilters.keywords || []}
              onSelectKeywords={(keywords) =>
                setLocalFilters({ ...localFilters, keywords })
              }
              maxHeight={300}
            />
          </View>

          {/* Has images toggle */}
          <View style={styles.section}>
            <ThemedText variant="title-small" style={styles.sectionTitle}>
              Con imágenes
            </ThemedText>
            <Pressable
              style={[
                styles.toggleOption,
                localFilters.hasImages && styles.toggleOptionSelected,
              ]}
              onPress={() =>
                setLocalFilters({
                  ...localFilters,
                  hasImages: localFilters.hasImages ? undefined : true,
                })
              }
            >
              {localFilters.hasImages && <Check size={20} color="#000000" strokeWidth={3} />}
              <ThemedText
                variant="body-medium"
                style={[
                  styles.toggleText,
                  localFilters.hasImages && styles.toggleTextSelected,
                ]}
              >
                Solo noticias con imágenes
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>

        {/* Footer actions */}
        <View style={styles.footer}>
          <Pressable style={styles.clearButton} onPress={handleClearAll}>
            <ThemedText variant="label-large" style={styles.clearButtonText}>
              Limpiar todo
            </ThemedText>
          </Pressable>

          <Pressable style={styles.applyButton} onPress={handleApply}>
            <ThemedText variant="label-large" style={styles.applyButtonText}>
              Aplicar
            </ThemedText>
          </Pressable>
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
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#111827',
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionChipSelected: {
    backgroundColor: '#f1ef47',
    borderColor: '#e5e33d',
  },
  optionText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  toggleOptionSelected: {
    backgroundColor: '#f1ef47',
    borderColor: '#e5e33d',
  },
  toggleText: {
    color: '#6B7280',
    fontSize: 16,
  },
  toggleTextSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 16,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 16,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#f1ef47',
    borderWidth: 2,
    borderColor: '#e5e33d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 16,
  },
})
