import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { Button } from '@/components/ui/button';
import { SiteFormFields } from '@/src/components/sites/SiteFormFields';
import { useCreateSite } from '@/src/hooks/useSites';
import { useResponsive } from '@/src/features/responsive';
import type { CreateSitePayload } from '@/src/types/site.types';

/**
 * 🌐 FASE 8.9: Pantalla de Crear Site (SIMPLIFICADA)
 * Formulario con SOLO 5 campos esenciales
 */

// Initial form data SIMPLIFICADO (solo 5 campos)
const INITIAL_FORM_DATA: CreateSitePayload = {
  domain: '',
  name: '',
  description: '',
  isActive: true,
  isMainSite: false
};

export default function CreateSiteScreen() {
  const router = useRouter();
  const { isTablet } = useResponsive();
  const createSite = useCreateSite();

  const [formData, setFormData] = useState<CreateSitePayload>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validación SIMPLIFICADA - Solo 5 campos
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    console.log('🔍 Validando formulario simplificado de Site:', formData);

    // 1. Domain (required, min 3 chars, formato URL válido)
    if (!formData.domain || formData.domain.trim().length < 3) {
      newErrors.domain = 'El dominio es requerido (mínimo 3 caracteres)';
    } else if (!/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/.test(formData.domain.toLowerCase())) {
      newErrors.domain = 'Formato de dominio inválido (ej: noticiaspachuca.com)';
    }

    // 2. Name (required, min 3 chars)
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'El nombre es requerido (mínimo 3 caracteres)';
    }

    // 3. Description (required, min 10 chars, max 500 chars)
    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'La descripción es requerida (mínimo 10 caracteres)';
    } else if (formData.description.length > 500) {
      newErrors.description = 'La descripción no puede exceder 500 caracteres';
    }

    // 4 y 5: isMainSite e isActive son booleans, no requieren validación

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
      await createSite.mutateAsync(formData);

      Alert.alert(
        'Éxito',
        `El sitio "${formData.name}" ha sido creado exitosamente`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error creating site:', error);
      Alert.alert(
        'Error',
        'No se pudo crear el sitio. Intenta de nuevo.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Crear Nuevo Sitio',
          headerBackTitle: 'Cancelar'
        }}
      />

      <View style={[styles.content, isTablet && styles.contentTablet]}>
        <View style={styles.header}>
          <ThemedText variant="title-large" style={styles.title}>
            Crear Nuevo Sitio
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
            Define el destino donde se publicará tu contenido generado
          </ThemedText>
        </View>

        <SiteFormFields
          data={formData}
          onChange={setFormData}
          errors={errors}
        />

        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={() => router.back()}
            style={styles.actionButton}
            disabled={createSite.isPending}
          >
            <ThemedText variant="label-medium">Cancelar</ThemedText>
          </Button>

          <Button
            onPress={handleSubmit}
            style={[styles.actionButton, styles.createButton]}
            disabled={createSite.isPending}
          >
            {createSite.isPending ? (
              <>
                <ActivityIndicator size="small" color="#000" style={{ marginRight: 8 }} />
                <ThemedText variant="label-medium" style={styles.createButtonText}>
                  Creando...
                </ThemedText>
              </>
            ) : (
              <ThemedText variant="label-medium" style={styles.createButtonText}>
                ✨ Crear Sitio
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
