import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { useResponsive } from '@/src/features/responsive';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useContentAgents } from '@/src/hooks/useContentAgents';
import { useGenerateContent } from '@/src/hooks/useGeneratedContent';
import type { ContentAgent } from '@/src/types/content-agent.types';

// Mapeo de tipos de agente a emojis
const AGENT_TYPE_EMOJI: Record<string, string> = {
  reportero: '📰',
  columnista: '✍️',
  trascendido: '🔍',
  'seo-specialist': '🎯'
};

// Mapeo de editorial lean a colores
const EDITORIAL_LEAN_COLOR: Record<string, string> = {
  conservative: '#DC2626',
  progressive: '#2563EB',
  neutral: '#6B7280',
  humor: '#F59E0B',
  critical: '#7C3AED',
  analytical: '#059669'
};

function AgentCard({
  agent,
  isSelected,
  onToggle
}: {
  agent: ContentAgent;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <Card style={styles.agentCard}>
      <CardHeader>
        <View style={styles.agentHeader}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            style={styles.checkbox}
          />
          <View style={{ flex: 1 }}>
            <CardTitle>
              <ThemedText variant="title-small">
                {AGENT_TYPE_EMOJI[agent.agentType] || '🤖'} {agent.name}
              </ThemedText>
            </CardTitle>
            <CardDescription>
              <ThemedText variant="body-small" color="secondary" style={{ marginTop: 4 }}>
                {agent.description}
              </ThemedText>
            </CardDescription>
          </View>
        </View>
      </CardHeader>
      <CardContent>
        <View style={styles.agentInfo}>
          <Badge variant="outline" style={{ backgroundColor: EDITORIAL_LEAN_COLOR[agent.editorialLean] + '20' }}>
            <ThemedText variant="label-small" style={{ color: EDITORIAL_LEAN_COLOR[agent.editorialLean] }}>
              {agent.editorialLean}
            </ThemedText>
          </Badge>

          <Badge variant="secondary">
            <ThemedText variant="label-small">
              Tono: {agent.writingStyle.tone}
            </ThemedText>
          </Badge>

          <Badge variant="secondary">
            <ThemedText variant="label-small">
              Largo: {agent.writingStyle.length}
            </ThemedText>
          </Badge>
        </View>

        {agent.specializations && agent.specializations.length > 0 && (
          <View style={styles.specializations}>
            <ThemedText variant="label-small" color="secondary">
              Especialidades:
            </ThemedText>
            <ThemedText variant="body-small" style={{ marginTop: 4 }}>
              {agent.specializations.join(', ')}
            </ThemedText>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

export default function SelectAgentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isTablet } = useResponsive();

  // Obtener agentes activos
  const { data: agents, isLoading, error } = useContentAgents({ isActive: true });

  // Estado local para agentes seleccionados
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mutation para generar contenido
  const generateContent = useGenerateContent();

  // Toggle de selección
  const toggleAgent = (agentId: string) => {
    setSelectedAgentIds((prev) => {
      if (prev.includes(agentId)) {
        return prev.filter((id) => id !== agentId);
      } else {
        return [...prev, agentId];
      }
    });
  };

  // Handler para generar contenido
  const handleGenerate = async () => {
    if (selectedAgentIds.length === 0) {
      Alert.alert('Atención', 'Selecciona al menos un agente para generar contenido');
      return;
    }

    if (isGenerating) {
      console.log('⚠️ Generation already in progress, ignoring duplicate request');
      return;
    }

    setIsGenerating(true);
    console.log(`🎯 Generating content for post ${id} with ${selectedAgentIds.length} agents`);

    // Mostrar alert inmediatamente
    Alert.alert(
      'Generación iniciada',
      `Se están generando ${selectedAgentIds.length} contenido(s). Los resultados aparecerán automáticamente cuando terminen.`,
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );

    try {
      // Generar contenido con cada agente seleccionado (fire-and-forget)
      selectedAgentIds.forEach((agentId) => {
        generateContent.mutate({
          extractedContentId: id!,
          agentId
        }, {
          onSuccess: () => {
            console.log(`✅ Generation request accepted for agent ${agentId}`);
          },
          onError: (error: any) => {
            // Ignorar errores de timeout - el socket manejará la actualización
            console.log(`⚠️ Generation request sent/timed out for agent ${agentId}:`, error?.message);
          }
        });
      });

      console.log(`✅ All ${selectedAgentIds.length} content generation requests sent`);

    } catch (error) {
      console.error('Error generating content:', error);
      setIsGenerating(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Seleccionar Agentes' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f1ef47" />
          <ThemedText variant="body-medium" color="secondary" style={styles.loadingText}>
            Cargando agentes...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !agents) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Error' }} />
        <View style={styles.errorContainer}>
          <ThemedText variant="title-medium" style={styles.errorTitle}>
            Error al cargar agentes
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary" style={styles.errorMessage}>
            {error instanceof Error ? error.message : 'No se pudieron cargar los agentes'}
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (agents.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Seleccionar Agentes' }} />
        <View style={styles.emptyContainer}>
          <ThemedText variant="title-medium" style={styles.emptyTitle}>
            No hay agentes disponibles
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary" style={styles.emptyMessage}>
            Configura agentes editoriales desde el panel de administración
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Seleccionar Agentes' }} />

      <ScrollView contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="title-large" style={styles.title}>
            Seleccionar Agentes
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
            Selecciona uno o varios agentes para generar contenido
          </ThemedText>

          {selectedAgentIds.length > 0 && (
            <View style={styles.selectionBadge}>
              <ThemedText variant="label-medium" style={styles.selectionText}>
                {selectedAgentIds.length} agente(s) seleccionado(s)
              </ThemedText>
            </View>
          )}
        </View>

        {/* Lista de agentes */}
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isSelected={selectedAgentIds.includes(agent.id)}
            onToggle={() => toggleAgent(agent.id)}
          />
        ))}

        {/* Botones de acción */}
        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={() => router.back()}
            style={styles.actionButton}
          >
            <ThemedText variant="label-medium">Cancelar</ThemedText>
          </Button>

          <Button
            onPress={handleGenerate}
            disabled={selectedAgentIds.length === 0 || isGenerating}
            style={[styles.actionButton, styles.generateButton]}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator size="small" color="#000" style={{ marginRight: 8 }} />
                <ThemedText variant="label-medium" style={styles.generateButtonText}>
                  Iniciando...
                </ThemedText>
              </>
            ) : (
              <ThemedText variant="label-medium" style={styles.generateButtonText}>
                ✨ Generar Contenido
              </ThemedText>
            )}
          </Button>
        </View>
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
  header: {
    marginBottom: 24
  },
  title: {
    color: '#111827',
    marginBottom: 8
  },
  subtitle: {
    color: '#6B7280'
  },
  selectionBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 12
  },
  selectionText: {
    color: '#1E40AF',
    fontWeight: '600'
  },
  agentCard: {
    marginBottom: 16
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  checkbox: {
    marginTop: 2
  },
  agentInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  specializations: {
    marginTop: 8
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24
  },
  actionButton: {
    flex: 1
  },
  generateButton: {
    backgroundColor: '#f1ef47'
  },
  generateButtonText: {
    color: '#000000',
    fontWeight: '600'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    textAlign: 'center'
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  emptyTitle: {
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyMessage: {
    textAlign: 'center'
  }
});
