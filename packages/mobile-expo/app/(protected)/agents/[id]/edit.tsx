import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { Button } from '@/components/ui/button';
import { AgentFormFields } from '@/src/components/agents/AgentFormFields';
import { useContentAgentById, useUpdateContentAgent, useDeleteContentAgent } from '@/src/hooks/useContentAgents';
import { useResponsive } from '@/src/features/responsive';
import type { CreateContentAgentRequest } from '@/src/types/content-agent.types';

export default function EditAgentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isTablet } = useResponsive();

  const { data: agent, isLoading } = useContentAgentById(id as string);
  const updateAgent = useUpdateContentAgent();
  const deleteAgent = useDeleteContentAgent();

  const [formData, setFormData] = useState<CreateContentAgentRequest | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateContentAgentRequest, string>>>({});

  // Inicializar formulario cuando se carga el agente
  useEffect(() => {
    if (agent && !formData) {
      setFormData({
        name: agent.name,
        agentType: agent.agentType,
        description: agent.description,
        personality: agent.personality,
        specializations: agent.specializations,
        editorialLean: agent.editorialLean,
        writingStyle: agent.writingStyle,
        isActive: agent.isActive
      });
    }
  }, [agent, formData]);

  const validateForm = (): boolean => {
    if (!formData) return false;

    const newErrors: Partial<Record<keyof CreateContentAgentRequest, string>> = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres';
    }

    if (!formData.personality || formData.personality.trim().length < 50) {
      newErrors.personality = 'La personalidad debe tener al menos 50 caracteres';
    }

    if (formData.specializations.length === 0) {
      newErrors.specializations = 'Agrega al menos una especialización';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!formData || !validateForm()) {
      Alert.alert('Error de validación', 'Por favor corrige los campos marcados en rojo');
      return;
    }

    try {
      await updateAgent.mutateAsync({ id: id as string, data: formData });

      Alert.alert(
        'Éxito',
        `El agente "${formData.name}" ha sido actualizado`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error updating agent:', error);
      Alert.alert(
        'Error',
        'No se pudo actualizar el agente. Intenta de nuevo.'
      );
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar el agente "${agent?.name}"? Esta acción no se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAgent.mutateAsync(id as string);

              Alert.alert(
                'Eliminado',
                'El agente ha sido eliminado exitosamente',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]
              );
            } catch (error) {
              console.error('Error deleting agent:', error);
              Alert.alert('Error', 'No se pudo eliminar el agente');
            }
          }
        }
      ]
    );
  };

  if (isLoading || !formData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Cargando...' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f1ef47" />
          <ThemedText variant="body-medium" color="secondary" style={{ marginTop: 16 }}>
            Cargando agente...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Editar Agente',
          headerBackTitle: 'Cancelar'
        }}
      />

      <View style={[styles.content, isTablet && styles.contentTablet]}>
        <View style={styles.header}>
          <ThemedText variant="title-large" style={styles.title}>
            Editar Agente
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
            Modifica la configuración del agente editorial
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
            disabled={updateAgent.isPending || deleteAgent.isPending}
          >
            <ThemedText variant="label-medium">Cancelar</ThemedText>
          </Button>

          <Button
            onPress={handleSubmit}
            style={[styles.actionButton, styles.updateButton]}
            disabled={updateAgent.isPending || deleteAgent.isPending}
          >
            {updateAgent.isPending ? (
              <>
                <ActivityIndicator size="small" color="#000" style={{ marginRight: 8 }} />
                <ThemedText variant="label-medium" style={styles.updateButtonText}>
                  Actualizando...
                </ThemedText>
              </>
            ) : (
              <ThemedText variant="label-medium" style={styles.updateButtonText}>
                💾 Guardar Cambios
              </ThemedText>
            )}
          </Button>
        </View>

        <Button
          variant="outline"
          onPress={handleDelete}
          style={styles.deleteButton}
          disabled={updateAgent.isPending || deleteAgent.isPending}
        >
          <ThemedText variant="label-medium" style={styles.deleteButtonText}>
            🗑️ Eliminar Agente
          </ThemedText>
        </Button>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
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
    paddingVertical: 16
  },
  actionButton: {
    flex: 1
  },
  updateButton: {
    backgroundColor: '#f1ef47'
  },
  updateButtonText: {
    color: '#000000',
    fontWeight: '600'
  },
  deleteButton: {
    borderColor: '#EF4444',
    marginBottom: 32
  },
  deleteButtonText: {
    color: '#EF4444',
    fontWeight: '600'
  }
});
