import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GeneratedContent } from '@/src/types/generated-content.types';

interface GeneratedContentCardProps {
  content: GeneratedContent;
  onPress: () => void;
}

// Mapeo de tipos de agente a emojis
const AGENT_TYPE_EMOJI: Record<string, string> = {
  reportero: '📰',
  columnista: '✍️',
  trascendido: '🔍',
  'seo-specialist': '🎯'
};

export function GeneratedContentCard({ content, onPress }: GeneratedContentCardProps) {
  // Preview del contenido (primeros 200 caracteres)
  const contentPreview = content.generatedContent?.substring(0, 200) + '...' || 'Sin contenido';

  // Fecha de generación formateada
  const generatedDate = new Date(content.createdAt).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Determinar emoji del agente (si tenemos el tipo)
  const agentEmoji = content.agentName
    ? AGENT_TYPE_EMOJI[content.agentName.toLowerCase()] || '🤖'
    : '🤖';

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <Card>
        <CardHeader>
          <CardTitle>
            <ThemedText variant="title-small" style={styles.title} numberOfLines={2}>
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

        <CardContent>
          {/* Preview del contenido */}
          <ThemedText variant="body-small" color="secondary" style={styles.preview} numberOfLines={3}>
            {contentPreview}
          </ThemedText>

          {/* Badges de metadata */}
          <View style={styles.badges}>
            {content.generationMetadata?.model && (
              <Badge variant="secondary">
                <ThemedText variant="label-small">
                  {content.generationMetadata.model}
                </ThemedText>
              </Badge>
            )}

            {content.generationMetadata?.totalTokens && (
              <Badge variant="outline">
                <ThemedText variant="label-small">
                  {content.generationMetadata.totalTokens.toLocaleString()} tokens
                </ThemedText>
              </Badge>
            )}

            {content.socialMediaCopies?.facebook && (
              <Badge variant="outline" style={styles.facebookBadge}>
                <ThemedText variant="label-small" style={styles.facebookText}>
                  📱 Facebook
                </ThemedText>
              </Badge>
            )}

            {content.socialMediaCopies?.twitter && (
              <Badge variant="outline" style={styles.twitterBadge}>
                <ThemedText variant="label-small" style={styles.twitterText}>
                  🐦 Twitter
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
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12
  },
  title: {
    color: '#111827',
    lineHeight: 20
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap'
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12
  },
  facebookBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6'
  },
  facebookText: {
    color: '#1E40AF'
  },
  twitterBadge: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0EA5E9'
  },
  twitterText: {
    color: '#0369A1'
  },
  cta: {
    alignItems: 'flex-end'
  },
  ctaText: {
    color: '#3B82F6',
    fontWeight: '600'
  }
});
