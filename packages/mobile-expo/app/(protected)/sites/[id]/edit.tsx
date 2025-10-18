import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SiteFormFields } from '@/src/components/sites/SiteFormFields';
import { SocialMediaConfig } from '@/src/components/sites/SocialMediaConfig';
import { useSiteById, useUpdateSite, useDeleteSite } from '@/src/hooks/useSites';
import { useResponsive } from '@/src/features/responsive';
import type { CreateSitePayload, SocialMedia, UpdateSitePayload } from '@/src/types/site.types';

/**
 * 🌐 FASE 13: Pantalla de Editar Site
 * Formulario con campos básicos + configuración de redes sociales
 */

export default function EditSiteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isTablet } = useResponsive();

  const { data: site, isLoading: isLoadingSite } = useSiteById(id);
  const updateSite = useUpdateSite();
  const deleteSite = useDeleteSite();

  // Tabs
  const [activeTab, setActiveTab] = useState<'basic' | 'social'>('basic');

  const [formData, setFormData] = useState<CreateSitePayload | null>(null);
  const [socialMediaData, setSocialMediaData] = useState<SocialMedia>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos del site cuando estén disponibles
  useEffect(() => {
    if (site) {
      setFormData({
        domain: site.domain,
        name: site.name,
        description: site.description,
        isActive: site.isActive,
        isMainSite: site.isMainSite
      });
      setSocialMediaData(site.socialMedia || {});
    }
  }, [site]);

  /**
   * Validación SIMPLIFICADA - Solo 5 campos
   */
  const validateForm = (): boolean => {
    if (!formData) return false;

    const newErrors: Record<string, string> = {};

    console.log('🔍 Validando formulario simplificado de Site (Edit):', formData);

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
    // Solo validar si estamos en el tab básico
    if (activeTab === 'basic' && (!formData || !validateForm())) {
      Alert.alert('Error de validación', 'Por favor corrige los campos marcados en rojo');
      return;
    }

    if (!formData) return;

    try {
      // Combinar datos básicos + social media
      const payload: UpdateSitePayload = {
        ...formData,
        socialMedia: socialMediaData,
      };

      await updateSite.mutateAsync({ id, data: payload });

      Alert.alert(
        'Éxito',
        `El sitio "${formData.name}" ha sido actualizado exitosamente`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error updating site:', error);
      Alert.alert(
        'Error',
        'No se pudo actualizar el sitio. Intenta de nuevo.'
      );
    }
  };

  const handleDelete = () => {
    if (!site) return;

    Alert.alert(
      'Eliminar Sitio',
      `¿Estás seguro de que deseas eliminar "${site.name}"? Esta acción no se puede deshacer.`,
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
              await deleteSite.mutateAsync(id);
              Alert.alert(
                'Éxito',
                'El sitio ha sido eliminado exitosamente',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]
              );
            } catch (error) {
              console.error('Error deleting site:', error);
              Alert.alert(
                'Error',
                'No se pudo eliminar el sitio. Intenta de nuevo.'
              );
            }
          }
        }
      ]
    );
  };

  if (isLoadingSite) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Editar Sitio',
            headerBackTitle: 'Atrás'
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f1ef47" />
          <ThemedText variant="body-medium" color="secondary" style={{ marginTop: 16 }}>
            Cargando sitio...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!site || !formData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Editar Sitio',
            headerBackTitle: 'Atrás'
          }}
        />
        <View style={styles.errorContainer}>
          <ThemedText variant="title-medium" style={{ color: '#EF4444', marginBottom: 8 }}>
            Sitio no encontrado
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary">
            No se pudo cargar el sitio solicitado
          </ThemedText>
          <Button
            variant="outline"
            onPress={() => router.back()}
            style={{ marginTop: 24 }}
          >
            <ThemedText variant="label-medium">Regresar</ThemedText>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Editar Sitio',
          headerBackTitle: 'Atrás'
        }}
      />

      <View style={[styles.content, isTablet && styles.contentTablet]}>
        <View style={styles.header}>
          <ThemedText variant="title-large" style={styles.title}>
            Editar Sitio
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
            {site.domain}
          </ThemedText>

          {/* Tabs */}
          <View style={styles.tabs}>
            <Button
              variant={activeTab === 'basic' ? 'default' : 'outline'}
              onPress={() => setActiveTab('basic')}
              style={styles.tab}
            >
              <ThemedText
                variant="label-medium"
                style={activeTab === 'basic' ? styles.tabActiveText : undefined}
              >
                📝 Información Básica
              </ThemedText>
            </Button>
            <Button
              variant={activeTab === 'social' ? 'default' : 'outline'}
              onPress={() => setActiveTab('social')}
              style={styles.tab}
            >
              <ThemedText
                variant="label-medium"
                style={activeTab === 'social' ? styles.tabActiveText : undefined}
              >
                📱 Redes Sociales
              </ThemedText>
            </Button>
          </View>
        </View>

        <Separator style={styles.separator} />

        {/* Tab Content */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {activeTab === 'basic' ? (
            <>
              <SiteFormFields
                data={formData}
                onChange={setFormData}
                errors={errors}
              />

              {/* Botón Eliminar Sitio */}
              <View style={styles.deleteSection}>
                <ThemedText variant="title-small" style={{ color: '#EF4444', marginBottom: 8 }}>
                  Zona de Peligro
                </ThemedText>
                <ThemedText variant="body-small" color="secondary" style={{ marginBottom: 16 }}>
                  Eliminar este sitio removerá toda su configuración. Esta acción no se puede deshacer.
                </ThemedText>
                <Button
                  variant="outline"
                  onPress={handleDelete}
                  style={styles.deleteButton}
                  disabled={deleteSite.isPending}
                >
                  {deleteSite.isPending ? (
                    <>
                      <ActivityIndicator size="small" color="#EF4444" style={{ marginRight: 8 }} />
                      <ThemedText variant="label-medium" style={styles.deleteButtonText}>
                        Eliminando...
                      </ThemedText>
                    </>
                  ) : (
                    <ThemedText variant="label-medium" style={styles.deleteButtonText}>
                      🗑️ Eliminar Sitio
                    </ThemedText>
                  )}
                </Button>
              </View>
            </>
          ) : (
            <SocialMediaConfig
              data={socialMediaData}
              onChange={setSocialMediaData}
            />
          )}
        </ScrollView>

        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={() => router.back()}
            style={styles.actionButton}
            disabled={updateSite.isPending}
          >
            <ThemedText variant="label-medium">Cancelar</ThemedText>
          </Button>

          <Button
            onPress={handleSubmit}
            style={[styles.actionButton, styles.updateButton]}
            disabled={updateSite.isPending}
          >
            {updateSite.isPending ? (
              <>
                <ActivityIndicator size="small" color="#000" style={{ marginRight: 8 }} />
                <ThemedText variant="label-medium" style={styles.updateButtonText}>
                  Guardando...
                </ThemedText>
              </>
            ) : (
              <ThemedText variant="label-medium" style={styles.updateButtonText}>
                💾 Guardar Cambios
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
    marginBottom: 16
  },
  title: {
    color: '#111827',
    marginBottom: 4
  },
  subtitle: {
    color: '#6B7280',
    marginBottom: 16
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
  },
  tabActiveText: {
    color: '#000000',
    fontWeight: '600',
  },
  separator: {
    marginVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  deleteSection: {
    marginTop: 32,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2'
  },
  deleteButton: {
    borderColor: '#EF4444'
  },
  deleteButtonText: {
    color: '#EF4444',
    fontWeight: '600'
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
  updateButton: {
    backgroundColor: '#f1ef47'
  },
  updateButtonText: {
    color: '#000000',
    fontWeight: '600'
  }
});
