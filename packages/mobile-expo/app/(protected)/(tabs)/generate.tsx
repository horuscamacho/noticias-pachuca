/**
 * 📰 Generate Screen - Extracted News List with Filters
 *
 * Features:
 * - Infinite scroll with useInfiniteQuery
 * - Pull-to-refresh
 * - Quick search in header
 * - Advanced filters (FilterBottomSheet)
 * - Sort (SortSheet)
 * - Removable filter chips
 * - States: loading, empty, error
 */

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
import { useRouter } from 'expo-router'
import { ThemedText } from '@/src/components/ThemedText'
import { Filter, ArrowUpDown, Search, X } from 'lucide-react-native'
import { useResponsive } from '@/src/features/responsive'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { App } from '@/src/types/extracted-content-filters.types'

// Hooks
import {
  useExtractedNews,
  getAllExtractedNews,
  getTotalItems,
  useKeywords,
  useCategories,
  useAuthors,
  useTags,
  useDomains,
} from '@/src/hooks/useExtractedNewsFilters'

// Components
import {
  FilterBottomSheet,
  FilterChipList,
  EmptyState,
  ErrorState,
} from '@/src/components/extracted-news'
import { SortDropdown } from '@/src/components/extracted-news/SortDropdown'

// Componente para el item de post
function PostCard({ post }: { post: App.ExtractedContent }) {
  const router = useRouter()

  // Preview del contenido (primeros 150 caracteres)
  const contentPreview = post.content?.substring(0, 150) + '...' || 'Sin contenido'

  // Formatear fecha de extracción
  const formatDate = (dateValue: Date | string | undefined) => {
    if (!dateValue) return 'Fecha desconocida'
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return 'Fecha desconocida'
    return date.toLocaleDateString('es-MX')
  }

  return (
    <Pressable
      onPress={() => {
        router.push(`/extracted/${post.id}`)
      }}
      style={styles.cardWrapper}
    >
      <Card>
        <CardHeader>
          <CardTitle>
            <ThemedText variant="title-medium" style={styles.cardTitle} numberOfLines={2}>
              {post.title || 'Sin título'}
            </ThemedText>
          </CardTitle>
          <CardDescription>
            <ThemedText variant="body-small" color="secondary" style={styles.cardSource}>
              {post.domain || 'Fuente desconocida'} •{' '}
              {formatDate(post.extractedAt)}
            </ThemedText>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ThemedText
            variant="body-small"
            color="secondary"
            style={styles.cardPreview}
            numberOfLines={3}
          >
            {contentPreview}
          </ThemedText>

          <View style={styles.cardFooter}>
            <Badge variant="secondary">
              <ThemedText variant="label-small" style={styles.badgeText}>
                📝 Ver contenido
              </ThemedText>
            </Badge>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  )
}

// Skeleton para loading
function PostSkeleton() {
  return (
    <View style={styles.cardWrapper}>
      <Card>
        <CardHeader>
          <View style={[styles.skeleton, styles.skeletonTitle]} />
          <View style={[styles.skeleton, styles.skeletonSubtitle]} />
        </CardHeader>
        <CardContent>
          <View style={[styles.skeleton, styles.skeletonLine]} />
          <View style={[styles.skeleton, styles.skeletonLine, { width: '80%' }]} />
        </CardContent>
      </Card>
    </View>
  )
}

export default function GenerateScreen() {
  const router = useRouter()
  const { isTablet } = useResponsive()

  // Ref to prevent multiple onEndReached calls
  const onEndReachedCalledDuringMomentum = React.useRef(false)

  // Estado de filtros (sin page y limit - los maneja useInfiniteQuery)
  const [filters, setFilters] = useState<Omit<App.ExtractedContentFilters, 'page' | 'limit'>>({
    status: ['extracted'], // Solo mostrar noticias extraídas por defecto
    tags: [],
    keywords: [],
    sortBy: 'extractedAt',
    sortOrder: 'desc',
  })

  // Estado UI
  const [searchText, setSearchText] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [sortButtonLayout, setSortButtonLayout] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | undefined>()

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
  } = useExtractedNews(filters)

  // Queries para opciones de filtros
  const { data: keywords } = useKeywords()
  const { data: categories } = useCategories()
  const { data: authors } = useAuthors()
  const { data: tags } = useTags()
  const { data: domains } = useDomains()

  // Datos procesados
  const allNews = useMemo(() => {
    const news = getAllExtractedNews(data)
    console.log('[COMPONENT] allNews updated', {
      newsCount: news.length,
      pagesCount: data?.pages?.length,
    })
    return news
  }, [data])

  const totalItems = useMemo(() => getTotalItems(data), [data])

  // Debug useEffect to log state changes
  React.useEffect(() => {
    console.log('[COMPONENT] State changed', {
      hasNextPage,
      isFetchingNextPage,
      isLoading,
      error: !!error,
      dataLength: allNews.length,
      totalItems,
      pagesLoaded: data?.pages?.length,
    })
  }, [hasNextPage, isFetchingNextPage, isLoading, error, allNews.length, totalItems, data?.pages?.length])

  // Handlers
  const handleApplyFilters = useCallback((newFilters: Omit<App.ExtractedContentFilters, 'page' | 'limit'>) => {
    setFilters(newFilters) // useInfiniteQuery resetea automáticamente al cambiar queryKey
  }, [])

  const handleSort = useCallback((sortBy: App.SortBy, sortOrder: App.SortOrder) => {
    setFilters((prev) => ({ ...prev, sortBy, sortOrder }))
  }, [])

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchText }))
  }, [searchText])

  const handleClearSearch = useCallback(() => {
    setSearchText('')
    setFilters((prev) => {
      const { search, ...rest } = prev
      return rest
    })
  }, [])

  const handleCardPress = useCallback(
    (id: string) => {
      router.push(`/extracted/${id}`)
    },
    [router]
  )

  const handleLoadMore = useCallback(() => {
    console.log('[INFINITE_SCROLL] onEndReached called', {
      hasNextPage,
      isFetchingNextPage,
      currentDataLength: allNews.length,
      totalItems,
      onEndReachedCalledDuringMomentum: onEndReachedCalledDuringMomentum.current,
    })

    // Prevent multiple calls during momentum scrolling
    if (onEndReachedCalledDuringMomentum.current) {
      console.log('[INFINITE_SCROLL] Blocked: Called during momentum')
      return
    }

    if (hasNextPage && !isFetchingNextPage) {
      console.log('[INFINITE_SCROLL] Fetching next page...')
      onEndReachedCalledDuringMomentum.current = true
      fetchNextPage()
    } else {
      console.log('[INFINITE_SCROLL] Blocked:', {
        reason: !hasNextPage ? 'No more pages' : 'Already fetching',
      })
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, allNews.length, totalItems])

  // Crear filter chips
  const filterChips: App.FilterChip[] = useMemo(() => {
    const chips: App.FilterChip[] = []

    // Status chips (solo si NO es el default 'extracted')
    if (filters.status && filters.status.length > 0) {
      // Omitir status chip si solo es ['extracted'] (default)
      if (!(filters.status.length === 1 && filters.status[0] === 'extracted')) {
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

    // Author chip
    if (filters.author) {
      chips.push({
        id: 'author',
        label: filters.author,
        type: 'author',
        value: filters.author,
        onRemove: () => {
          setFilters((prev) => {
            const { author, ...rest } = prev
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

    // Keywords chips
    if (filters.keywords && filters.keywords.length > 0) {
      filters.keywords.forEach((keyword) => {
        chips.push({
          id: `keyword-${keyword}`,
          label: keyword,
          type: 'keyword',
          value: keyword,
          onRemove: () => {
            setFilters((prev) => ({
              ...prev,
              keywords: prev.keywords?.filter((k) => k !== keyword) || [],
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
  }, [filters, handleClearSearch])

  const handleClearAllFilters = useCallback(() => {
    setFilters({
      status: ['extracted'], // Reset al default
      tags: [],
      keywords: [],
      sortBy: 'extractedAt',
      sortOrder: 'desc',
    })
    setSearchText('')
  }, [])

  // Render header fijo
  const renderHeader = () => (
    <View style={styles.header}>
      {/* Title + Counter */}
      <View style={styles.titleRow}>
        <ThemedText variant="title-large" style={styles.title}>
          Contenido Extraído
        </ThemedText>
        {totalItems > 0 && (
          <View style={styles.counterBadge}>
            <ThemedText variant="label-small" style={styles.counterText}>
              {totalItems}
            </ThemedText>
          </View>
        )}
      </View>

      <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
        Selecciona un post para generar contenido con agentes de IA
      </ThemedText>

      {/* Search bar - ALWAYS VISIBLE */}
      <View style={styles.searchBar}>
        <Search size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar en contenido..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <Pressable onPress={handleClearSearch} hitSlop={8}>
            <X size={20} color="#6B7280" />
          </Pressable>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable onPress={() => setShowFilters(true)} style={styles.actionButton}>
          <Filter size={20} color="#374151" />
          {filterChips.length > 0 && <View style={styles.actionBadge} />}
        </Pressable>

        <Pressable
          onPress={() => setShowSort(true)}
          onLayout={(event) => {
            const layout = event.nativeEvent.layout
            event.target.measure((x, y, width, height, pageX, pageY) => {
              setSortButtonLayout({ x: pageX, y: pageY, width, height })
            })
          }}
          style={styles.actionButton}
        >
          <ArrowUpDown size={20} color="#374151" />
        </Pressable>
      </View>

      {/* Filter chips */}
      {filterChips.length > 0 && (
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
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    )
  }

  // Render loading inicial
  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <FlatList
          data={Array(3).fill(null)}
          renderItem={() => <PostSkeleton />}
          keyExtractor={(_, index) => `skeleton-${index}`}
          contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Lista con header integrado */}
      <FlatList
        data={allNews}
        renderItem={({ item }) => (
          <View style={[styles.content, isTablet && styles.contentTablet]}>
            <PostCard post={item} />
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader()}
        contentContainerStyle={[
          styles.listContainer,
          allNews.length === 0 && styles.contentEmpty,
        ]}
        ListEmptyComponent={
          <View style={[styles.content, isTablet && styles.contentTablet]}>
            {renderEmpty()}
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ThemedText variant="body-small" color="secondary">
                Cargando más...
              </ThemedText>
            </View>
          ) : hasNextPage ? (
            <View style={styles.footer}>
              <ThemedText variant="body-small" color="secondary">
                Scroll para cargar más...
              </ThemedText>
            </View>
          ) : allNews.length > 0 ? (
            <View style={styles.footer}>
              <ThemedText variant="body-small" color="secondary">
                No hay más contenido
              </ThemedText>
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        onMomentumScrollBegin={() => {
          onEndReachedCalledDuringMomentum.current = false
          console.log('[FLATLIST] Momentum scroll began - onEndReached now allowed')
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor="#f1ef47"
          />
        }
        onScrollBeginDrag={() => {
          console.log('[FLATLIST] User started scrolling')
        }}
        onMomentumScrollEnd={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
          const paddingToBottom = 20
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom

          console.log('[FLATLIST] Scroll ended', {
            isCloseToBottom,
            height: layoutMeasurement.height,
            offset: contentOffset.y,
            contentHeight: contentSize.height,
          })
        }}
      />

      {/* Modals */}
      <FilterBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleApplyFilters}
        categories={categories}
        authors={authors}
        tags={tags}
      />

      {/* Sort Dropdown */}
      <SortDropdown
        visible={showSort}
        onClose={() => setShowSort(false)}
        sortBy={filters.sortBy || 'extractedAt'}
        sortOrder={filters.sortOrder || 'desc'}
        onSortChange={handleSort}
        triggerLayout={sortButtonLayout}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  listContainer: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  contentTablet: {
    paddingHorizontal: 80,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  contentEmpty: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#F3F4F6',
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
  subtitle: {
    color: '#6B7280',
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
    borderColor: '#D1D5DB',
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  cardWrapper: {
    marginBottom: 16,
  },
  cardTitle: {
    color: '#111827',
  },
  cardSource: {
    fontSize: 12,
    marginTop: 4,
  },
  cardPreview: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  // Skeleton styles
  skeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonTitle: {
    height: 20,
    width: '80%',
    marginBottom: 8,
  },
  skeletonSubtitle: {
    height: 14,
    width: '50%',
    marginBottom: 12,
  },
  skeletonLine: {
    height: 14,
    width: '100%',
    marginBottom: 6,
  },
})
