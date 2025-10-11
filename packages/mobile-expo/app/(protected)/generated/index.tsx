import React, { useState, useMemo, useCallback } from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
} from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { ThemedText } from '@/src/components/ThemedText'
import { Filter, ArrowUpDown, Search, X } from 'lucide-react-native'
import { useResponsive } from '@/src/features/responsive'
import type { App } from '@/src/types/generated-content-filters.types'

// Hooks
import {
  useGeneratedContent,
  getAllGeneratedContent,
  getTotalItems,
  useAgents,
  useTemplates,
  useProviders,
  useCategories,
  useTags,
} from '@/src/hooks/useGeneratedContentFilters'

// Components
import {
  ContentCard,
  FilterChipList,
  SortSheet,
  EmptyState,
  ErrorState,
  LoadingState,
  ContentListSkeleton,
  LoadingMoreState,
  FilterBottomSheet,
} from '@/src/components/generated-content'

/**
 * 🎯 GeneratedContentListScreen - Listado principal con filtros
 * Features:
 * - Infinite scroll con useInfiniteQuery
 * - Pull-to-refresh
 * - Búsqueda rápida en header
 * - Filtros avanzados (FilterBottomSheet)
 * - Ordenamiento (SortSheet)
 * - FilterChips removibles
 * - Estados: loading, empty, error
 */
export default function GeneratedContentListScreen() {
  const router = useRouter()
  const { isTablet } = useResponsive()

  // Estado de filtros
  const [filters, setFilters] = useState<App.GeneratedContentFilters>({
    status: [],
    tags: [],
    sortBy: 'publishedAt', // Por defecto: fecha de publicación (híbrida)
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  })

  // Estado UI
  const [searchText, setSearchText] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)

  // Query principal con filtros
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useGeneratedContent(filters)

  // Queries para opciones de filtros
  const { data: agents } = useAgents()
  const { data: templates } = useTemplates()
  const { data: providers } = useProviders()
  const { data: categories } = useCategories()
  const { data: tags } = useTags()

  // Datos procesados
  const allContent = useMemo(() => getAllGeneratedContent(data), [data])
  const totalItems = useMemo(() => getTotalItems(data), [data])

  // Handlers
  const handleApplyFilters = useCallback((newFilters: App.GeneratedContentFilters) => {
    setFilters({ ...newFilters, page: 1 }) // Reset page cuando cambian filtros
  }, [])

  const handleSort = useCallback((sortBy: App.SortBy, sortOrder: App.SortOrder) => {
    setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }))
    setShowSort(false)
  }, [])

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchText, page: 1 }))
    setShowSearch(false)
  }, [searchText])

  const handleClearSearch = useCallback(() => {
    setSearchText('')
    setFilters((prev) => {
      const { search, ...rest } = prev
      return { ...rest, page: 1 }
    })
  }, [])

  const handleCardPress = useCallback(
    (id: string) => {
      router.push(`/generated/${id}`)
    },
    [router]
  )

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Crear filter chips
  const filterChips: App.FilterChip[] = useMemo(() => {
    const chips: App.FilterChip[] = []

    // Status chips
    if (filters.status && filters.status.length > 0) {
      filters.status.forEach((status) => {
        chips.push({
          id: `status-${status}`,
          label: status,
          type: 'status',
          value: status,
          onRemove: () => {
            setFilters((prev) => ({
              ...prev,
              status: prev.status?.filter((s) => s !== status) || [],
            }))
          },
        })
      })
    }

    // Agent chip
    if (filters.agentId) {
      const agent = agents?.find((a) => a.id === filters.agentId)
      chips.push({
        id: 'agent',
        label: agent?.name || 'Agente',
        type: 'agent',
        value: filters.agentId,
        onRemove: () => {
          setFilters((prev) => {
            const { agentId, ...rest } = prev
            return rest
          })
        },
      })
    }

    // Template chip
    if (filters.templateId) {
      const template = templates?.find((t) => t.id === filters.templateId)
      chips.push({
        id: 'template',
        label: template?.name || 'Template',
        type: 'template',
        value: filters.templateId,
        onRemove: () => {
          setFilters((prev) => {
            const { templateId, ...rest } = prev
            return rest
          })
        },
      })
    }

    // Provider chip
    if (filters.providerId) {
      const provider = providers?.find((p) => p.id === filters.providerId)
      chips.push({
        id: 'provider',
        label: provider?.name || 'Proveedor',
        type: 'provider',
        value: filters.providerId,
        onRemove: () => {
          setFilters((prev) => {
            const { providerId, ...rest } = prev
            return rest
          })
        },
      })
    }

    // Category chip
    if (filters.category) {
      chips.push({
        id: 'category',
        label: filters.category,
        type: 'category',
        value: filters.category,
        onRemove: () => {
          setFilters((prev) => {
            const { category, ...rest } = prev
            return rest
          })
        },
      })
    }

    // Tags chips
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach((tag) => {
        chips.push({
          id: `tag-${tag}`,
          label: tag,
          type: 'tag',
          value: tag,
          onRemove: () => {
            setFilters((prev) => ({
              ...prev,
              tags: prev.tags?.filter((t) => t !== tag) || [],
            }))
          },
        })
      })
    }

    // Search chip
    if (filters.search) {
      chips.push({
        id: 'search',
        label: `"${filters.search}"`,
        type: 'search',
        value: filters.search,
        onRemove: handleClearSearch,
      })
    }

    return chips
  }, [filters, agents, templates, providers, handleClearSearch])

  const handleClearAllFilters = useCallback(() => {
    setFilters({
      status: [],
      tags: [],
      sortBy: 'publishedAt',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
    })
    setSearchText('')
  }, [])

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search bar (toggle) */}
      {showSearch ? (
        <View style={styles.searchBar}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar en contenido..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            autoFocus
            returnKeyType="search"
          />
          <Pressable onPress={() => setShowSearch(false)} hitSlop={8}>
            <X size={20} color="#6B7280" />
          </Pressable>
        </View>
      ) : (
        <>
          {/* Title + Counter */}
          <View style={styles.titleRow}>
            <ThemedText variant="title-large" style={styles.title}>
              Contenido Generado
            </ThemedText>
            {totalItems > 0 && (
              <View style={styles.counterBadge}>
                <ThemedText variant="label-small" style={styles.counterText}>
                  {totalItems}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Pressable onPress={() => setShowSearch(true)} style={styles.actionButton}>
              <Search size={20} color="#374151" />
            </Pressable>

            <Pressable onPress={() => setShowFilters(true)} style={styles.actionButton}>
              <Filter size={20} color="#374151" />
              {filterChips.length > 0 && <View style={styles.actionBadge} />}
            </Pressable>

            <Pressable onPress={() => setShowSort(true)} style={styles.actionButton}>
              <ArrowUpDown size={20} color="#374151" />
            </Pressable>
          </View>
        </>
      )}

      {/* Filter chips */}
      {filterChips.length > 0 && !showSearch && (
        <FilterChipList chips={filterChips} onClearAll={handleClearAllFilters} />
      )}
    </View>
  )

  // Render empty
  const renderEmpty = () => {
    if (isLoading) return null

    if (filterChips.length > 0) {
      return <EmptyState type="no-results" onAction={handleClearAllFilters} />
    }

    return <EmptyState type="no-content" />
  }

  // Render error
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Contenido Generado', headerShown: false }} />
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    )
  }

  // Render loading inicial
  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Contenido Generado', headerShown: false }} />
        {renderHeader()}
        <ContentListSkeleton count={5} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Contenido Generado', headerShown: false }} />

      {/* Header fijo arriba */}
      {renderHeader()}

      {/* Lista con contenido */}
      <FlatList
        data={allContent}
        renderItem={({ item }) => (
          <ContentCard content={item} onPress={() => handleCardPress(item.id)} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          isTablet && styles.listContentTablet,
          allContent.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={
          isFetchingNextPage ? <LoadingMoreState /> : hasNextPage ? <View style={{ height: 20 }} /> : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor="#3B82F6"
          />
        }
      />

      {/* Modals */}
      <FilterBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleApplyFilters}
        agents={agents}
        templates={templates}
        providers={providers}
        categories={categories}
        tags={tags}
      />

      <SortSheet
        visible={showSort}
        onClose={() => setShowSort(false)}
        currentSortBy={filters.sortBy || 'publishedAt'}
        currentSortOrder={filters.sortOrder || 'desc'}
        onSort={handleSort}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listContentTablet: {
    paddingHorizontal: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: '#111827',
    fontWeight: '700',
  },
  counterBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  counterText: {
    color: '#1E40AF',
    fontWeight: '700',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
})
