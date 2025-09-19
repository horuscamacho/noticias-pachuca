import React, { forwardRef, useCallback, useMemo, useImperativeHandle, useRef } from 'react'
import { RefreshControl, useColorScheme, ActivityIndicator, View, Text, StyleSheet } from 'react-native'
import { LegendList } from '@legendapp/list'
import type {
  ThemedListProps,
  ThemedListRef,
  ThemedListTheme,
  ThemeVariant
} from './types'

const defaultLightTheme: ThemedListTheme = {
  background: '#ffffff',
  text: '#000000',
  border: '#e0e0e0',
  accent: '#007AFF',
  placeholder: '#8E8E93'
}

const defaultDarkTheme: ThemedListTheme = {
  background: '#000000',
  text: '#ffffff',
  border: '#333333',
  accent: '#0A84FF',
  placeholder: '#8E8E93'
}

function ThemedListComponent<T>(
  props: ThemedListProps<T>,
  ref: React.Ref<ThemedListRef>
) {
  const {
    data,
    renderItem,
    keyExtractor,
    mode = 'default',
    onRefresh,
    refreshing = false,
    onLoadMore,
    hasNextPage = false,
    loading = false,
    maintainScrollPosition = false,
    alignToBottom = false,
    theme = 'auto',
    backgroundColor,
    customTheme,
    estimatedItemSize = 50,
    recycleItems = true,
    drawDistance = 250,
    horizontal = false,
    numColumns = 1,
    onEndReached,
    onEndReachedThreshold = 0.1,
    onScroll,
    ListEmptyComponent,
    ListHeaderComponent,
    ListFooterComponent,
    LoadingComponent,
    LoadMoreComponent,
    accessibilityLabel,
    testID,
    refreshControlProps,
    initialScrollIndex,
    maintainVisibleContentPosition,
    ...restProps
  } = props

  const legendListRef = useRef<any>(null)
  const systemColorScheme = useColorScheme()

  // Theme calculation
  const currentTheme = useMemo((): ThemedListTheme => {
    const isDark = theme === 'dark' || (theme === 'auto' && systemColorScheme === 'dark')
    const baseTheme = isDark ? defaultDarkTheme : defaultLightTheme

    return {
      ...baseTheme,
      ...customTheme,
      ...(backgroundColor && { background: backgroundColor })
    }
  }, [theme, systemColorScheme, customTheme, backgroundColor])

  // Mode-specific configurations
  const modeConfig = useMemo(() => {
    const isChatMode = mode.includes('chat')
    const isInfiniteMode = mode.includes('infinite')

    return {
      isChatMode,
      isInfiniteMode,
      maintainVisibleContentPosition: isChatMode && (maintainVisibleContentPosition || {
        minIndexForVisible: 1,
        autoscrollToTopThreshold: 100
      })
    }
  }, [mode, maintainVisibleContentPosition])

  // Refresh Control
  const refreshControl = useMemo(() => {
    if (!onRefresh || !modeConfig.isInfiniteMode) return undefined

    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={currentTheme.accent}
        title="Actualizando..."
        titleColor={currentTheme.text}
        colors={[currentTheme.accent]}
        progressBackgroundColor={currentTheme.background}
        {...refreshControlProps}
      />
    )
  }, [onRefresh, refreshing, currentTheme, modeConfig.isInfiniteMode, refreshControlProps])

  // Infinite scroll handler
  const handleEndReached = useCallback(() => {
    if (modeConfig.isInfiniteMode && hasNextPage && !loading && onLoadMore) {
      onLoadMore()
    }
    onEndReached?.()
  }, [modeConfig.isInfiniteMode, hasNextPage, loading, onLoadMore, onEndReached])

  // Loading More Component
  const renderLoadMoreComponent = useCallback(() => {
    if (!modeConfig.isInfiniteMode || !loading) return null

    if (LoadMoreComponent) {
      return <LoadMoreComponent />
    }

    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator color={currentTheme.accent} size="small" />
        <Text style={[styles.loadingText, { color: currentTheme.placeholder }]}>
          Cargando más...
        </Text>
      </View>
    )
  }, [modeConfig.isInfiniteMode, loading, LoadMoreComponent, currentTheme])

  // Empty Component
  const renderEmptyComponent = useCallback(() => {
    if (ListEmptyComponent) {
      return typeof ListEmptyComponent === 'function' ? <ListEmptyComponent /> : ListEmptyComponent
    }

    return (
      <View style={[styles.emptyContainer, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.emptyText, { color: currentTheme.placeholder }]}>
          No hay elementos para mostrar
        </Text>
      </View>
    )
  }, [ListEmptyComponent, currentTheme])

  // Header Component
  const renderHeaderComponent = useCallback(() => {
    if (!ListHeaderComponent) return null
    return typeof ListHeaderComponent === 'function' ? <ListHeaderComponent /> : ListHeaderComponent
  }, [ListHeaderComponent])

  // Footer Component with LoadMore
  const renderFooterComponent = useCallback(() => {
    const footerContent = ListFooterComponent ? (
      typeof ListFooterComponent === 'function' ? <ListFooterComponent /> : ListFooterComponent
    ) : null

    const loadMoreContent = renderLoadMoreComponent()

    if (!footerContent && !loadMoreContent) return null

    return (
      <View>
        {footerContent}
        {loadMoreContent}
      </View>
    )
  }, [ListFooterComponent, renderLoadMoreComponent])

  // Ref forwarding
  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number, animated = true) => {
      legendListRef.current?.scrollToIndex(index, animated)
    },
    scrollToOffset: (offset: number, animated = true) => {
      legendListRef.current?.scrollToOffset(offset, animated)
    },
    scrollToItem: (item: unknown, animated = true) => {
      legendListRef.current?.scrollToItem(item, animated)
    },
    scrollToEnd: (animated = true) => {
      legendListRef.current?.scrollToEnd(animated)
    }
  }), [])

  return (
    <LegendList
      ref={legendListRef}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      recycleItems={recycleItems}
      estimatedItemSize={estimatedItemSize}
      drawDistance={drawDistance}
      horizontal={horizontal}
      numColumns={numColumns}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      onScroll={onScroll}
      refreshControl={refreshControl}
      maintainVisibleContentPosition={modeConfig.maintainVisibleContentPosition}
      initialScrollIndex={initialScrollIndex}
      ListEmptyComponent={renderEmptyComponent}
      ListHeaderComponent={renderHeaderComponent}
      ListFooterComponent={renderFooterComponent}
      style={[{ backgroundColor: currentTheme.background }, restProps.style]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      {...restProps}
    />
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center'
  }
})

export const ThemedList = forwardRef(ThemedListComponent) as <T>(
  props: ThemedListProps<T> & { ref?: React.Ref<ThemedListRef> }
) => React.ReactElement