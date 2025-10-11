import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { useResponsive } from '@/src/features/responsive';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useGeneratedContentById } from '@/src/hooks/useGeneratedContent';

// Mapeo de tipos de agente a emojis
const AGENT_TYPE_EMOJI: Record<string, string> = {
  reportero: '📰',
  columnista: '✍️',
  trascendido: '🔍',
  'seo-specialist': '🎯'
};

// Mapeo de hook types a emojis
const HOOK_TYPE_EMOJI: Record<string, string> = {
  Scary: '😱',
  FreeValue: '🎁',
  Strange: '🤔',
  Sexy: '🔥',
  Familiar: '👨‍👩‍👧‍👦'
};

export default function GeneratedContentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isTablet } = useResponsive();

  // Obtener contenido generado
  const { data: content, isLoading, error, refetch } = useGeneratedContentById(id!);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Cargando...' }} />
        <ScrollView contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}>
          <Skeleton style={styles.skeletonTitle} />
          <Skeleton style={styles.skeletonText} />
          <Skeleton style={styles.skeletonText} />
          <Skeleton style={styles.skeletonCard} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !content) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Error' }} />
        <View style={styles.errorContainer}>
          <ThemedText variant="title-medium" style={styles.errorTitle}>
            Error al cargar el contenido
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary" style={styles.errorMessage}>
            {error instanceof Error ? error.message : 'Contenido no encontrado'}
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Determinar emoji del agente
  const agentEmoji = content.agentName
    ? AGENT_TYPE_EMOJI[content.agentName.toLowerCase()] || '🤖'
    : '🤖';

  // Fecha de generación formateada
  const generatedDate = new Date(content.createdAt).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: content.generatedTitle }} />

      <ScrollView contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}>

        {/* Sección 1: Header con Título y Metadata */}
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <ThemedText variant="title-large" style={styles.title}>
                {content.generatedTitle}
              </ThemedText>
            </CardTitle>
            <CardDescription>
              <View style={styles.metadata}>
                <ThemedText variant="body-small" color="secondary">
                  {agentEmoji} {content.agentName || 'Agente desconocido'}
                </ThemedText>
                <ThemedText variant="body-small" color="secondary">
                  • {generatedDate}
                </ThemedText>
              </View>
            </CardDescription>
          </CardHeader>

          {/* Badges de metadata */}
          {content.generationMetadata && (
            <CardContent>
              <View style={styles.badges}>
                {content.generationMetadata.model && (
                  <Badge variant="secondary">
                    <ThemedText variant="label-small">
                      🤖 {content.generationMetadata.model}
                    </ThemedText>
                  </Badge>
                )}

                {content.generationMetadata.totalTokens && (
                  <Badge variant="outline">
                    <ThemedText variant="label-small">
                      {content.generationMetadata.totalTokens.toLocaleString()} tokens
                    </ThemedText>
                  </Badge>
                )}

                {content.generationMetadata.processingTime && (
                  <Badge variant="outline">
                    <ThemedText variant="label-small">
                      ⏱️ {(content.generationMetadata.processingTime / 1000).toFixed(2)}s
                    </ThemedText>
                  </Badge>
                )}

                {content.generationMetadata.costEstimate && (
                  <Badge variant="outline">
                    <ThemedText variant="label-small">
                      💰 ${content.generationMetadata.costEstimate.toFixed(4)}
                    </ThemedText>
                  </Badge>
                )}
              </View>
            </CardContent>
          )}
        </Card>

        {/* Sección 2: Resumen (si existe) */}
        {content.generatedSummary && (
          <Card style={styles.section}>
            <CardHeader>
              <CardTitle>
                <ThemedText variant="title-medium">📝 Resumen</ThemedText>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.summaryBox}>
                <ThemedText variant="body-medium" style={styles.summaryText}>
                  {content.generatedSummary}
                </ThemedText>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Sección 3: Contenido Completo */}
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <ThemedText variant="title-medium">📄 Contenido Completo</ThemedText>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.contentBox}>
              <ThemedText variant="body-medium" style={styles.contentText}>
                {content.generatedContent}
              </ThemedText>
            </View>
          </CardContent>
        </Card>

        {/* Sección 4: Copy de Facebook */}
        {content.socialMediaCopies?.facebook && (
          <Card style={styles.section}>
            <CardHeader>
              <CardTitle>
                <ThemedText variant="title-medium">📱 Copy de Facebook</ThemedText>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Hook */}
              <View style={styles.hookSection}>
                <View style={styles.hookHeader}>
                  <Badge variant="default" style={styles.hookBadge}>
                    <ThemedText variant="label-small" style={styles.hookBadgeText}>
                      {HOOK_TYPE_EMOJI[content.socialMediaCopies.facebook.hookType] || '🎣'}{' '}
                      {content.socialMediaCopies.facebook.hookType}
                    </ThemedText>
                  </Badge>

                  {content.socialMediaCopies.facebook.estimatedEngagement && (
                    <Badge
                      variant="outline"
                      style={[
                        styles.engagementBadge,
                        content.socialMediaCopies.facebook.estimatedEngagement === 'high' && styles.engagementHigh,
                        content.socialMediaCopies.facebook.estimatedEngagement === 'medium' && styles.engagementMedium,
                        content.socialMediaCopies.facebook.estimatedEngagement === 'low' && styles.engagementLow
                      ]}
                    >
                      <ThemedText
                        variant="label-small"
                        style={
                          content.socialMediaCopies.facebook.estimatedEngagement === 'high'
                            ? styles.engagementHighText
                            : content.socialMediaCopies.facebook.estimatedEngagement === 'medium'
                            ? styles.engagementMediumText
                            : styles.engagementLowText
                        }
                      >
                        Engagement: {content.socialMediaCopies.facebook.estimatedEngagement}
                      </ThemedText>
                    </Badge>
                  )}
                </View>

                <ThemedText variant="body-medium" style={styles.hookText}>
                  {content.socialMediaCopies.facebook.hook}
                </ThemedText>
              </View>

              <Separator style={styles.separator} />

              {/* Copy */}
              <View style={styles.copySection}>
                <ThemedText variant="label-medium" color="secondary" style={styles.copyLabel}>
                  Copy:
                </ThemedText>
                <ThemedText variant="body-medium" style={styles.copyText}>
                  {content.socialMediaCopies.facebook.copy}
                </ThemedText>
              </View>

              {/* Emojis */}
              {content.socialMediaCopies.facebook.emojis && content.socialMediaCopies.facebook.emojis.length > 0 && (
                <View style={styles.emojiSection}>
                  <ThemedText variant="label-small" color="secondary">
                    Emojis sugeridos:
                  </ThemedText>
                  <ThemedText variant="body-large" style={styles.emojiText}>
                    {content.socialMediaCopies.facebook.emojis.join(' ')}
                  </ThemedText>
                </View>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sección 5: Copy de Twitter */}
        {content.socialMediaCopies?.twitter && (
          <Card style={styles.section}>
            <CardHeader>
              <CardTitle>
                <ThemedText variant="title-medium">🐦 Copy de Twitter</ThemedText>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Hook */}
              <View style={styles.hookSection}>
                <Badge variant="default" style={styles.twitterBadge}>
                  <ThemedText variant="label-small" style={styles.twitterBadgeText}>
                    {HOOK_TYPE_EMOJI[content.socialMediaCopies.twitter.hookType] || '🎣'}{' '}
                    {content.socialMediaCopies.twitter.hookType}
                  </ThemedText>
                </Badge>
                <ThemedText variant="body-medium" style={styles.hookText}>
                  {content.socialMediaCopies.twitter.hook}
                </ThemedText>
              </View>

              <Separator style={styles.separator} />

              {/* Tweet */}
              <View style={styles.copySection}>
                <ThemedText variant="label-medium" color="secondary" style={styles.copyLabel}>
                  Tweet:
                </ThemedText>
                <ThemedText variant="body-medium" style={styles.copyText}>
                  {content.socialMediaCopies.twitter.tweet}
                </ThemedText>
              </View>

              {/* Emojis */}
              {content.socialMediaCopies.twitter.emojis && content.socialMediaCopies.twitter.emojis.length > 0 && (
                <View style={styles.emojiSection}>
                  <ThemedText variant="label-small" color="secondary">
                    Emojis sugeridos:
                  </ThemedText>
                  <ThemedText variant="body-large" style={styles.emojiText}>
                    {content.socialMediaCopies.twitter.emojis.join(' ')}
                  </ThemedText>
                </View>
              )}

              {/* Thread Ideas */}
              {content.socialMediaCopies.twitter.threadIdeas && content.socialMediaCopies.twitter.threadIdeas.length > 0 && (
                <View style={styles.threadSection}>
                  <Separator style={styles.separator} />
                  <ThemedText variant="label-medium" color="secondary" style={styles.threadLabel}>
                    💡 Ideas para Thread:
                  </ThemedText>
                  {content.socialMediaCopies.twitter.threadIdeas.map((idea, index) => (
                    <View key={index} style={styles.threadItem}>
                      <ThemedText variant="body-small" color="secondary" style={styles.threadNumber}>
                        {index + 1}.
                      </ThemedText>
                      <ThemedText variant="body-small" style={styles.threadText}>
                        {idea}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sección 6: Keywords y Tags */}
        {(content.generatedKeywords || content.generatedTags) && (
          <Card style={styles.section}>
            <CardHeader>
              <CardTitle>
                <ThemedText variant="title-medium">🏷️ Keywords y Tags</ThemedText>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Keywords */}
              {content.generatedKeywords && content.generatedKeywords.length > 0 && (
                <View style={styles.tagsSection}>
                  <ThemedText variant="label-medium" color="secondary" style={styles.tagsLabel}>
                    Keywords SEO:
                  </ThemedText>
                  <View style={styles.tagsContainer}>
                    {content.generatedKeywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" style={styles.tag}>
                        <ThemedText variant="label-small">{keyword}</ThemedText>
                      </Badge>
                    ))}
                  </View>
                </View>
              )}

              {/* Tags */}
              {content.generatedTags && content.generatedTags.length > 0 && (
                <View style={[styles.tagsSection, content.generatedKeywords && { marginTop: 16 }]}>
                  <ThemedText variant="label-medium" color="secondary" style={styles.tagsLabel}>
                    Tags:
                  </ThemedText>
                  <View style={styles.tagsContainer}>
                    {content.generatedTags.map((tag, index) => (
                      <Badge key={index} variant="outline" style={styles.tag}>
                        <ThemedText variant="label-small">#{tag}</ThemedText>
                      </Badge>
                    ))}
                  </View>
                </View>
              )}

              {/* Categoría */}
              {content.generatedCategory && (
                <View style={[styles.tagsSection, { marginTop: 16 }]}>
                  <ThemedText variant="label-medium" color="secondary" style={styles.tagsLabel}>
                    Categoría:
                  </ThemedText>
                  <Badge variant="default" style={styles.categoryBadge}>
                    <ThemedText variant="label-medium" style={styles.categoryText}>
                      {content.generatedCategory}
                    </ThemedText>
                  </Badge>
                </View>
              )}
            </CardContent>
          </Card>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  contentTablet: {
    paddingHorizontal: 80,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%'
  },
  section: {
    marginBottom: 16
  },
  title: {
    color: '#111827',
    lineHeight: 32
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap'
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  summaryBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  summaryText: {
    color: '#1E40AF',
    lineHeight: 22,
    fontStyle: 'italic'
  },
  contentBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8
  },
  contentText: {
    color: '#374151',
    lineHeight: 24
  },
  hookSection: {
    marginBottom: 12
  },
  hookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap'
  },
  hookBadge: {
    backgroundColor: '#f1ef47'
  },
  hookBadgeText: {
    color: '#000000',
    fontWeight: '600'
  },
  twitterBadge: {
    backgroundColor: '#0EA5E9',
    marginBottom: 8
  },
  twitterBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  engagementBadge: {
    borderWidth: 1
  },
  engagementHigh: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E'
  },
  engagementHighText: {
    color: '#16A34A',
    fontWeight: '600'
  },
  engagementMedium: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B'
  },
  engagementMediumText: {
    color: '#D97706',
    fontWeight: '600'
  },
  engagementLow: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444'
  },
  engagementLowText: {
    color: '#DC2626',
    fontWeight: '600'
  },
  hookText: {
    color: '#111827',
    fontWeight: '600',
    lineHeight: 22
  },
  separator: {
    marginVertical: 12
  },
  copySection: {
    marginBottom: 12
  },
  copyLabel: {
    marginBottom: 6
  },
  copyText: {
    color: '#374151',
    lineHeight: 22
  },
  emojiSection: {
    marginTop: 8
  },
  emojiText: {
    fontSize: 24,
    marginTop: 4
  },
  threadSection: {
    marginTop: 12
  },
  threadLabel: {
    marginBottom: 8
  },
  threadItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    alignItems: 'flex-start'
  },
  threadNumber: {
    marginTop: 2,
    minWidth: 20
  },
  threadText: {
    flex: 1,
    color: '#374151',
    lineHeight: 20
  },
  tagsSection: {
    marginBottom: 0
  },
  tagsLabel: {
    marginBottom: 8
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  tag: {
    marginBottom: 0
  },
  categoryBadge: {
    backgroundColor: '#f1ef47',
    alignSelf: 'flex-start'
  },
  categoryText: {
    color: '#000000',
    fontWeight: '600'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  errorTitle: {
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center'
  },
  errorMessage: {
    textAlign: 'center'
  },
  skeletonTitle: {
    height: 28,
    width: '80%',
    marginBottom: 16
  },
  skeletonText: {
    height: 16,
    width: '100%',
    marginBottom: 8
  },
  skeletonCard: {
    height: 200,
    width: '100%',
    marginBottom: 16
  }
});
