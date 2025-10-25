import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { ThemedText } from '@/src/components/ThemedText'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Sparkles, TrendingUp } from 'lucide-react-native'
import type { App } from '@/src/types/generated-content-filters.types'

interface ContentCardProps {
  content: App.GeneratedContent
  onPress: () => void
}

/**
 * 🎨 ContentCard - Card optimizado para lista de contenido generado
 * Features:
 * - Muestra fecha de publicación original (híbrida)
 * - Estado visual con badges
 * - Preview de contenido
 * - Metadata compacta (agente, template, provider)
 * - Touch-friendly (56px min height)
 */
export function ContentCard({ content, onPress }: ContentCardProps) {
  // Fecha híbrida: originalPublishedAt > generatedAt
  const displayDate = content.originalPublishedAt || content.generatedAt
  const formattedDate = new Date(displayDate).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Preview del contenido (primeros 150 caracteres)
  const contentPreview = content.generatedContent.substring(0, 150) + '...'

  // Badge variant por estado
  const getStatusBadgeVariant = (
    status: App.GenerationStatus
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'default'
      case 'failed':
      case 'rejected':
        return 'destructive'
      case 'generating':
      case 'reviewing':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  // Label para estado en español
  const getStatusLabel = (status: App.GenerationStatus): string => {
    const labels: Record<App.GenerationStatus, string> = {
      pending: 'Pendiente',
      generating: 'Generando',
      completed: 'Completado',
      failed: 'Fallido',
      reviewing: 'Revisando',
      approved: 'Aprobado',
      rejected: 'Rechazado',
    }
    return labels[status] || status
  }

  // Calidad del contenido (si existe)
  const qualityScore =
    content.qualityMetrics?.humanReviewScore ?? content.generationMetadata.contentQuality

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <Card>
        <CardHeader>
          <View style={styles.headerRow}>
            <View style={styles.headerContent}>
              <CardTitle>
                <ThemedText variant="title-small" style={styles.title} numberOfLines={2}>
                  {content.generatedTitle}
                </ThemedText>
              </CardTitle>
              <CardDescription>
                <View style={styles.metadata}>
                  <Clock size={12} color="#6B7280" />
                  <ThemedText variant="body-small" color="secondary">
                    {formattedDate}
                  </ThemedText>
                  {content.originalPublishedAt && (
                    <Badge variant="outline" style={styles.originalBadge}>
                      <TrendingUp size={10} color="#3B82F6" />
                      <ThemedText variant="label-small" style={styles.originalText}>
                        Original
                      </ThemedText>
                    </Badge>
                  )}
                </View>
              </CardDescription>
            </View>
            <Badge variant={getStatusBadgeVariant(content.status)} style={styles.statusBadge}>
              <ThemedText variant="label-small" style={styles.statusText}>
                {getStatusLabel(content.status)}
              </ThemedText>
            </Badge>
          </View>
        </CardHeader>

        <CardContent>
          {/* Preview del contenido */}
          <ThemedText variant="body-small" color="secondary" style={styles.preview} numberOfLines={3}>
            {contentPreview}
          </ThemedText>

          {/* Metadata row: Agente + Template + Provider */}
          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <Sparkles size={12} color="#8B5CF6" />
              <ThemedText variant="label-small" color="secondary" numberOfLines={1}>
                {content.agent.name}
              </ThemedText>
            </View>
            <ThemedText variant="label-small" color="secondary">
              •
            </ThemedText>
            <ThemedText variant="label-small" color="secondary" numberOfLines={1}>
              {content.template.name}
            </ThemedText>
          </View>

          {/* Badges row: Category + Tags + Quality */}
          <View style={styles.badges}>
            {content.generatedCategory && (
              <Badge variant="secondary">
                <ThemedText variant="label-small">{content.generatedCategory}</ThemedText>
              </Badge>
            )}

            {qualityScore && (
              <Badge variant="outline" style={styles.qualityBadge}>
                <ThemedText variant="label-small" style={styles.qualityText}>
                  ⭐ {qualityScore}/10
                </ThemedText>
              </Badge>
            )}

            {content.generatedTags.length > 0 && (
              <Badge variant="outline">
                <ThemedText variant="label-small">
                  🏷️ {content.generatedTags.length} tags
                </ThemedText>
              </Badge>
            )}
          </View>

          {/* Call to action */}
          <View style={styles.cta}>
            <ThemedText variant="label-small" style={styles.ctaText}>
              Toca para ver completo →
            </ThemedText>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    color: '#111827',
    lineHeight: 20,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  originalBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  originalText: {
    color: '#1E40AF',
    fontSize: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '50%',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  qualityBadge: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  qualityText: {
    color: '#D97706',
  },
  cta: {
    alignItems: 'flex-end',
  },
  ctaText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
})
