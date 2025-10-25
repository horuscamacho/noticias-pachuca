import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ContentAgent } from '@/src/types/content-agent.types';

const AGENT_TYPE_EMOJI: Record<ContentAgent['agentType'], string> = {
  reportero: '📰',
  columnista: '✍️',
  trascendido: '🔍',
  'seo-specialist': '🎯'
};

const EDITORIAL_LEAN_COLOR: Record<ContentAgent['editorialLean'], string> = {
  conservative: '#DC2626',
  progressive: '#2563EB',
  neutral: '#6B7280',
  humor: '#F59E0B',
  critical: '#7C3AED',
  analytical: '#059669'
};

export interface AgentCardProps {
  agent: ContentAgent;
  onPress?: () => void;
}

export function AgentCard({ agent, onPress }: AgentCardProps) {
  const emoji = AGENT_TYPE_EMOJI[agent.agentType] || '🤖';
  const leanColor = EDITORIAL_LEAN_COLOR[agent.editorialLean] || '#6B7280';

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>
            <ThemedText variant="title-small" numberOfLines={1}>
              {emoji} {agent.name}
            </ThemedText>
          </CardTitle>
          <CardDescription>
            <ThemedText variant="body-small" color="secondary" numberOfLines={2}>
              {agent.description}
            </ThemedText>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <View style={styles.badges}>
            <Badge variant="outline" style={{ backgroundColor: leanColor + '20' }}>
              <ThemedText variant="label-small" style={{ color: leanColor }}>
                {agent.editorialLean}
              </ThemedText>
            </Badge>

            <Badge variant="secondary">
              <ThemedText variant="label-small">
                {agent.writingStyle.tone}
              </ThemedText>
            </Badge>

            {agent.specializations.length > 0 && (
              <Badge variant="secondary">
                <ThemedText variant="label-small">
                  {agent.specializations[0]}
                  {agent.specializations.length > 1 && ` +${agent.specializations.length - 1}`}
                </ThemedText>
              </Badge>
            )}
          </View>

          {!agent.isActive && (
            <View style={styles.inactiveFlag}>
              <ThemedText variant="label-small" style={styles.inactiveText}>
                Inactivo
              </ThemedText>
            </View>
          )}
        </CardContent>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  inactiveFlag: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  inactiveText: {
    color: '#DC2626',
    fontWeight: '600'
  }
});
