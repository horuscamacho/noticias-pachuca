/**
 * 🔑 KeywordSelector Component
 *
 * Selector con búsqueda integrada para filtrar por keywords
 *
 * Features:
 * - Search input con debounce
 * - Lista scrollable de keywords con checkboxes
 * - Count badges para cada keyword
 * - Multi-select
 */

import React, { useState, useMemo } from 'react'
import {
  View,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Search, X } from 'lucide-react-native'
import { ThemedText } from '@/src/components/ThemedText'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useKeywords } from '@/src/hooks/useExtractedNewsFilters'
import { useDebounce } from '@/src/hooks/useDebounce'
import type { App } from '@/src/types/extracted-content-filters.types'

interface KeywordSelectorProps {
  selectedKeywords: string[]
  onSelectKeywords: (keywords: string[]) => void
  maxHeight?: number
}

export function KeywordSelector({
  selectedKeywords,
  onSelectKeywords,
  maxHeight = 400,
}: KeywordSelectorProps) {
  // Search state
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  // Fetch keywords with debounced search
  const { data: keywords, isLoading, error } = useKeywords(debouncedSearch)

  // Filter keywords based on selection
  const keywordsWithSelection = useMemo(() => {
    if (!keywords) return []
    return keywords.map((kw) => ({
      ...kw,
      selected: selectedKeywords.includes(kw.keyword),
    }))
  }, [keywords, selectedKeywords])

  // Handle keyword toggle
  const handleToggleKeyword = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      // Remove
      onSelectKeywords(selectedKeywords.filter((k) => k !== keyword))
    } else {
      // Add
      onSelectKeywords([...selectedKeywords, keyword])
    }
  }

  // Handle clear search
  const handleClearSearch = () => {
    setSearchInput('')
  }

  // Render keyword item
  const renderKeywordItem = ({ item }: { item: App.KeywordItem & { selected?: boolean } }) => (
    <Pressable
      style={({ pressed }) => [styles.keywordItem, pressed && styles.keywordItemPressed]}
      onPress={() => handleToggleKeyword(item.keyword)}
    >
      {/* Checkbox */}
      <Checkbox
        checked={item.selected || false}
        onCheckedChange={() => handleToggleKeyword(item.keyword)}
        aria-labelledby={`keyword-${item.keyword}`}
        className="border-2 border-black shrink-0"
      />

      {/* Badge for keyword name */}
      <Badge variant={item.selected ? 'default' : 'secondary'} style={styles.badge}>
        <ThemedText numberOfLines={1}>
          {item.keyword}
        </ThemedText>
      </Badge>

      {/* Badge for count */}
      <Badge variant="outline" style={styles.badge}>
        <ThemedText>
          {item.count}
        </ThemedText>
      </Badge>
    </Pressable>
  )

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {isLoading ? (
        <>
          <ActivityIndicator size="large" color="#f1ef47" />
          <ThemedText variant="body-medium" style={styles.emptyText}>
            Cargando keywords...
          </ThemedText>
        </>
      ) : error ? (
        <>
          <ThemedText variant="body-medium" style={styles.emptyText}>
            Error al cargar keywords
          </ThemedText>
        </>
      ) : searchInput ? (
        <>
          <ThemedText variant="body-medium" style={styles.emptyText}>
            No se encontraron keywords con "{searchInput}"
          </ThemedText>
        </>
      ) : (
        <>
          <ThemedText variant="body-medium" style={styles.emptyText}>
            No hay keywords disponibles
          </ThemedText>
        </>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Search input */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar keywords..."
          placeholderTextColor="#9CA3AF"
          value={searchInput}
          onChangeText={setSearchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchInput.length > 0 && (
          <Pressable onPress={handleClearSearch} hitSlop={8}>
            <X size={20} color="#6B7280" />
          </Pressable>
        )}
      </View>

      {/* Keywords list */}
      <ScrollView
        style={[styles.list, { maxHeight }]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator
      >
        {keywordsWithSelection.length === 0 ? (
          renderEmpty()
        ) : (
          keywordsWithSelection.map((item) => (
            <View key={item.keyword}>{renderKeywordItem({ item })}</View>
          ))
        )}
      </ScrollView>

      {/* Selection count */}
      {selectedKeywords.length > 0 && (
        <View style={styles.selectionFooter}>
          <ThemedText variant="label-medium" style={styles.selectionText}>
            {selectedKeywords.length} keyword{selectedKeywords.length !== 1 ? 's' : ''}{' '}
            seleccionada{selectedKeywords.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  list: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  keywordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  keywordItemPressed: {
    backgroundColor: '#E5E7EB',
  },
  badge: {
    flexDirection: 'row',
    flexShrink: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  selectionFooter: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f7f6d4',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e33d',
  },
  selectionText: {
    color: '#000000',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 14,
  },
})
