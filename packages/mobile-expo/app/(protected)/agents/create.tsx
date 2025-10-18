import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { Button } from '@/components/ui/button';
import { AgentFormFields } from '@/src/components/agents/AgentFormFields';
import { useCreateContentAgent } from '@/src/hooks/useContentAgents';
import { useResponsive } from '@/src/features/responsive';
import type { CreateContentAgentRequest } from '@/src/types/content-agent.types';

const INITIAL_FORM_DATA: CreateContentAgentRequest = {
  name: '',
  agentType: 'reportero',
  description: '',
  personality: '',
  specializations: [],
  editorialLean: 'neutral',
  writingStyle: {
    tone: 'formal',
    vocabulary: 'intermediate',
    length: 'medium',
    structure: 'linear',
    audience: 'general'
  },
  isActive: true
};

export default function CreateAgentScreen() {
  const router = useRouter();
  const { isTablet } = useResponsive();
  const createAgent = useCreateContentAgent();

  const [formData, setFormData] = useState<CreateContentAgentRequest>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateContentAgentRequest, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateContentAgentRequest, string>> = {};

    console.log('🔍 Validando formulario:', {
      name: formData.name,
      nameLength: formData.name.length,
      description: formData.description.substring(0, 50) + '...',
      descriptionLength: formData.description.length,
      personality: formData.personality.substring(0, 50) + '...',
      personalityLength: formData.personality.length,
      specializations: formData.specializations,
      specializationsLength: formData.specializations.length
    });

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = `El nombre debe tener al menos 3 caracteres (actual: ${formData.name.length})`;
    }

    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = `La descripción debe tener al menos 10 caracteres (actual: ${formData.description.length})`;
    }

    if (!formData.personality || formData.personality.trim().length < 50) {
      newErrors.personality = `La personalidad debe tener al menos 50 caracteres (actual: ${formData.personality.length})`;
    }

    if (formData.specializations.length === 0) {
      newErrors.specializations = 'Agrega al menos una especialización (ej: política, deportes)';
    }

    console.log('❌ Errores encontrados:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error de validación', 'Por favor corrige los campos marcados en rojo');
      return;
    }

    try {
      await createAgent.mutateAsync(formData);

      Alert.alert(
        'Éxito',
        `El agente "${formData.name}" ha sido creado exitosamente`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error creating agent:', error);
      Alert.alert(
        'Error',
        'No se pudo crear el agente. Intenta de nuevo.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Crear Nuevo Agente',
          headerBackTitle: 'Cancelar'
        }}
      />

      <View style={[styles.content, isTablet && styles.contentTablet]}>
        <View style={styles.header}>
          <ThemedText variant="title-large" style={styles.title}>
            Crear Nuevo Agente
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
            Define la personalidad, estilo editorial y especialización del agente
          </ThemedText>
        </View>

        <AgentFormFields
          data={formData}
          onChange={setFormData}
          errors={errors}
        />

        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={() => router.back()}
            style={styles.actionButton}
            disabled={createAgent.isPending}
          >
            <ThemedText variant="label-medium">Cancelar</ThemedText>
          </Button>

          <Button
            onPress={handleSubmit}
            style={[styles.actionButton, styles.createButton]}
            disabled={createAgent.isPending}
          >
            {createAgent.isPending ? (
              <>
                <ActivityIndicator size="small" color="#000" style={{ marginRight: 8 }} />
                <ThemedText variant="label-medium" style={styles.createButtonText}>
                  Creando...
                </ThemedText>
              </>
            ) : (
              <ThemedText variant="label-medium" style={styles.createButtonText}>
                ✨ Crear Agente
              </ThemedText>
            )}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  content: {
    flex: 1,
    padding: 16
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
    paddingBottom: 32
  },
  actionButton: {
    flex: 1
  },
  createButton: {
    backgroundColor: '#f1ef47'
  },
  createButtonText: {
    color: '#000000',
    fontWeight: '600'
  }
});
