import React from 'react'
import { View, StyleSheet } from 'react-native'
import { ThemedText } from '@/src/components/ThemedText'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { FileQuestion, Filter, Search, Inbox } from 'lucide-react-native'

interface EmptyStateProps {
  type?: 'no-results' | 'no-content' | 'no-filters' | 'search-empty'
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

/**
 * 📭 EmptyState - Estados vacíos para diferentes escenarios
 * Types:
 * - no-results: Sin resultados con filtros activos
 * - no-content: No hay contenido generado en absoluto
 * - no-filters: Vista inicial sin filtros
 * - search-empty: Búsqueda sin resultados
 */
export function EmptyState({
  type = 'no-content',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const getDefaultContent = () => {
    switch (type) {
      case 'no-results':
        return {
          icon: <Filter size={64} color="#9CA3AF" strokeWidth={1.5} />,
          title: title || 'Sin resultados',
          description:
            description ||
            'No encontramos contenido que coincida con tus filtros. Intenta ajustar los criterios de búsqueda.',
          actionLabel: actionLabel || 'Limpiar filtros',
        }
      case 'search-empty':
        return {
          icon: <Search size={64} color="#9CA3AF" strokeWidth={1.5} />,
          title: title || 'Sin resultados',
          description:
            description ||
            'No encontramos contenido que coincida con tu búsqueda. Intenta con otros términos.',
          actionLabel: actionLabel || 'Limpiar búsqueda',
        }
      case 'no-filters':
        return {
          icon: <Inbox size={64} color="#9CA3AF" strokeWidth={1.5} />,
          title: title || 'Explora el contenido',
          description:
            description ||
            'Usa los filtros y ordenamiento para encontrar exactamente lo que necesitas.',
          actionLabel: actionLabel || null,
        }
      case 'no-content':
      default:
        return {
          icon: <FileQuestion size={64} color="#9CA3AF" strokeWidth={1.5} />,
          title: title || 'No hay contenido generado',
          description:
            description ||
            'Aún no se ha generado contenido. Inicia el proceso de generación para ver resultados aquí.',
          actionLabel: actionLabel || 'Ir a generación',
        }
    }
  }

  const content = getDefaultContent()

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{content.icon}</View>

      <ThemedText variant="title-medium" style={styles.title}>
        {content.title}
      </ThemedText>

      <ThemedText variant="body-medium" color="secondary" style={styles.description}>
        {content.description}
      </ThemedText>

      {content.actionLabel && onAction && (
        <Button onPress={onAction} style={styles.button} variant="outline">
          <Text>{content.actionLabel}</Text>
        </Button>
      )}
    </View>
  )
}

/**
 * ⚠️ ErrorState - Estado de error
 */
interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <ThemedText variant="title-large" style={styles.errorEmoji}>
          ⚠️
        </ThemedText>
      </View>

      <ThemedText variant="title-medium" style={styles.title}>
        {title || 'Algo salió mal'}
      </ThemedText>

      <ThemedText variant="body-medium" color="secondary" style={styles.description}>
        {description ||
          'No pudimos cargar el contenido. Por favor, intenta nuevamente.'}
      </ThemedText>

      {onRetry && (
        <Button onPress={onRetry} style={styles.button} variant="default">
          <Text>Reintentar</Text>
        </Button>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  iconContainer: {
    marginBottom: 24,
    opacity: 0.6,
  },
  title: {
    color: '#111827',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: 320,
  },
  button: {
    minWidth: 200,
    minHeight: 48,
  },
  errorEmoji: {
    fontSize: 64,
  },
})
