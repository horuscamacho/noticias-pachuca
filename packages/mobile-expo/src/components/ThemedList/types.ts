import { type ReactElement, type ComponentType } from 'react'
import { type NativeSyntheticEvent, type NativeScrollEvent, type RefreshControlProps } from 'react-native'

export type ThemedListMode = 'default' | 'chat' | 'infinite' | 'chat-infinite'

export type ThemeVariant = 'light' | 'dark' | 'auto'

export interface ThemedListTheme {
  background: string
  text: string
  border: string
  accent: string
  placeholder: string
}

export interface ThemedListRenderItemInfo<T> {
  item: T
  index: number
}

export interface ThemedListProps<T> {
  // DATOS
  data: T[]
  renderItem: ({ item, index }: ThemedListRenderItemInfo<T>) => ReactElement
  keyExtractor?: (item: T, index: number) => string

  // CARACTERÍSTICAS PRINCIPALES
  mode?: ThemedListMode

  // PULL TO REFRESH
  onRefresh?: () => Promise<void>
  refreshing?: boolean

  // INFINITE SCROLL
  onLoadMore?: () => Promise<void>
  hasNextPage?: boolean
  loading?: boolean

  // CHAT ESPECÍFICO
  maintainScrollPosition?: boolean
  alignToBottom?: boolean

  // THEMING
  theme?: ThemeVariant
  backgroundColor?: string
  customTheme?: Partial<ThemedListTheme>

  // PERFORMANCE
  estimatedItemSize?: number
  recycleItems?: boolean
  drawDistance?: number

  // LAYOUT
  horizontal?: boolean
  numColumns?: number

  // EVENTOS
  onEndReached?: () => void
  onEndReachedThreshold?: number
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void

  // CONTENIDO VACÍO
  ListEmptyComponent?: ComponentType | ReactElement
  ListHeaderComponent?: ComponentType | ReactElement
  ListFooterComponent?: ComponentType | ReactElement

  // LOADING STATES
  LoadingComponent?: ComponentType
  LoadMoreComponent?: ComponentType

  // ACCESIBILIDAD
  accessibilityLabel?: string
  testID?: string

  // REFRESH CONTROL CUSTOMIZATION
  refreshControlProps?: Partial<RefreshControlProps>

  // SCROLL CONFIGURATION
  initialScrollIndex?: number
  maintainVisibleContentPosition?: {
    minIndexForVisible: number
    autoscrollToTopThreshold?: number
  }
}

export interface ThemedListRef {
  scrollToIndex: (index: number, animated?: boolean) => void
  scrollToOffset: (offset: number, animated?: boolean) => void
  scrollToItem: (item: unknown, animated?: boolean) => void
  scrollToEnd: (animated?: boolean) => void
}

export interface ThemedListState {
  isRefreshing: boolean
  isLoadingMore: boolean
  hasError: boolean
  errorMessage?: string
}