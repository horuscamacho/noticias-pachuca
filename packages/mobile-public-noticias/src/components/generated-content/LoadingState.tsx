import React from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { ThemedText } from '@/src/components/ThemedText'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * ⏳ LoadingState - Loader principal con texto
 */
interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Cargando contenido...' }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <ThemedText variant="body-medium" color="secondary" style={styles.message}>
        {message}
      </ThemedText>
    </View>
  )
}

/**
 * 🦴 ContentCardSkeleton - Skeleton para ContentCard
 * Usa react-native-reusables Skeleton
 */
export function ContentCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-3 w-32" />
        </View>
        <Skeleton className="h-6 w-20 rounded-full" />
      </View>

      {/* Content preview */}
      <View style={styles.cardContent}>
        <Skeleton className="h-3 w-full mb-2" />
        <Skeleton className="h-3 w-full mb-2" />
        <Skeleton className="h-3 w-3/4 mb-4" />

        {/* Metadata */}
        <View style={styles.metadata}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-24" />
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </View>
      </View>
    </View>
  )
}

/**
 * 📋 ContentListSkeleton - Múltiples skeletons de cards
 */
interface ContentListSkeletonProps {
  count?: number
}

export function ContentListSkeleton({ count = 3 }: ContentListSkeletonProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <ContentCardSkeleton key={index} />
      ))}
    </View>
  )
}

/**
 * 🔄 RefreshingState - Indicador pequeño para pull-to-refresh
 */
export function RefreshingState() {
  return (
    <View style={styles.refreshing}>
      <ActivityIndicator size="small" color="#3B82F6" />
      <ThemedText variant="label-small" color="secondary" style={styles.refreshingText}>
        Actualizando...
      </ThemedText>
    </View>
  )
}

/**
 * ⬇️ LoadingMoreState - Indicador para scroll infinito
 */
export function LoadingMoreState() {
  return (
    <View style={styles.loadingMore}>
      <ActivityIndicator size="small" color="#3B82F6" />
      <ThemedText variant="label-small" color="secondary" style={styles.loadingMoreText}>
        Cargando más...
      </ThemedText>
    </View>
  )
}

const styles = StyleSheet.create({
  // LoadingState
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  message: {
    marginTop: 16,
    fontSize: 15,
  },

  // ContentCardSkeleton
  cardSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardContent: {
    gap: 0,
  },
  metadata: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },

  // RefreshingState
  refreshing: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  refreshingText: {
    fontSize: 13,
  },

  // LoadingMoreState
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  loadingMoreText: {
    fontSize: 13,
  },
})
