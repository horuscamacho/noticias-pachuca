import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { useResponsive } from '@/src/features/responsive';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MultiSelect } from '@/components/ui/multi-select';
import { CompactRadioGroup } from '@/components/ui/compact-radio-group';
import { useGeneratedContentDetail } from '@/src/hooks/useGeneratedContentFilters';
import { useSites } from '@/src/hooks/useSites';
import { usePublishContent, useImproveCopy } from '@/src/hooks';
import type { PublishContentRequest } from '@/src/types/publish.types';

export default function PublishContentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isTablet } = useResponsive();

  // Hooks - usando el nuevo hook de filtros
  const { data: content, isLoading: contentLoading } = useGeneratedContentDetail(id!);
  // ✅ FIX: useSites retorna { sites: Site[], total: number }, no un array directamente
  const { data: sitesData } = useSites({ isActive: true });
  const sites = sitesData?.sites;
  const publishMutation = usePublishContent();
  const improveCopyMutation = useImproveCopy();

  // State
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [publicationType, setPublicationType] = useState<'breaking' | 'news' | 'blog'>('news');
  const [publishToSocialMedia, setPublishToSocialMedia] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<('facebook' | 'twitter')[]>([
    'facebook',
    'twitter',
  ]);
  const [improveCopy, setImproveCopy] = useState(true);
  const [useOriginalImage, setUseOriginalImage] = useState(true);

  const handlePublish = async () => {
    try {
      // Validaciones
      if (selectedSiteIds.length === 0) {
        Alert.alert('Error', 'Selecciona al menos un sitio donde publicar');
        return;
      }

      if (publishToSocialMedia && selectedPlatforms.length === 0) {
        Alert.alert('Error', 'Selecciona al menos una plataforma de redes sociales');
        return;
      }

      // Mejorar copy si est� activado
      if (improveCopy && publishToSocialMedia) {
        try {
          await improveCopyMutation.mutateAsync({
            contentId: id!,
            canonicalUrl: undefined,
          });
        } catch (error) {
          console.warn('Failed to improve copy:', error);
        }
      }

      // Preparar request
      const request: PublishContentRequest = {
        contentId: id!,
        siteIds: selectedSiteIds,
        publicationType,
        publishToSocialMedia,
        socialMediaPlatforms: selectedPlatforms,
        improveCopy,
        useOriginalImage,
      };

      // Publicar
      const result = await publishMutation.mutateAsync(request);

      // Mostrar resultado
      const message =
        publicationType === 'breaking'
          ? `Publicado inmediatamente en ${selectedSiteIds.length} sitio(s)`
          : `Programado en cola para ${selectedSiteIds.length} sitio(s)`;

      Alert.alert('�xito', message, [
        {
          text: 'Ver contenido',
          onPress: () => router.back(),
        },
      ]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error', `No se pudo publicar: ${errorMessage}`);
    }
  };

  // Loading state
  if (contentLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Publicar Contenido' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <ThemedText style={styles.loadingText}>Cargando...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!content) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Error' }} />
        <View style={styles.errorContainer}>
          <ThemedText variant="title-medium" style={styles.errorTitle}>
            Contenido no encontrado
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const siteOptions = sites?.map((site) => ({
    label: site.name,
    value: site.id,
    description: site.domain,
  })) || [];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Publicar Contenido',
          headerBackTitle: 'Atr�s',
        }}
      />

      <ScrollView contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}>
        {/* Card Superior con Resumen */}
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <ThemedText variant="title-medium">{content.generatedTitle}</ThemedText>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.badges}>
              <Badge variant="secondary">
                <ThemedText variant="label-small">
                  {content.generationMetadata?.model || 'Unknown'}
                </ThemedText>
              </Badge>
              {content.generationMetadata?.totalTokens && (
                <Badge variant="outline">
                  <ThemedText variant="label-small">
                    {content.generationMetadata.totalTokens.toLocaleString()} tokens
                  </ThemedText>
                </Badge>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Sección 1: Seleccionar Sitios */}
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <ThemedText variant="title-medium">¿Dónde publicar?</ThemedText>
            </CardTitle>
            <CardDescription>
              <ThemedText variant="body-small" color="secondary">
                Selecciona uno o más sitios donde se publicará el contenido
              </ThemedText>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MultiSelect
              value={selectedSiteIds}
              onValueChange={setSelectedSiteIds}
              options={siteOptions}
              placeholder="Seleccionar sitios..."
            />
          </CardContent>
        </Card>

        {/* Sección 2: Tipo de Publicación */}
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <ThemedText variant="title-medium">¿Cómo publicar?</ThemedText>
            </CardTitle>
            <CardDescription>
              <ThemedText variant="body-small" color="secondary">
                Elige el tipo de publicación según la urgencia
              </ThemedText>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompactRadioGroup
              value={publicationType}
              onValueChange={(value) => setPublicationType(value as typeof publicationType)}
              options={[
                {
                  value: 'breaking',
                  label: 'Breaking News',
                  description: 'Publica inmediatamente',
                },
                {
                  value: 'news',
                  label: 'Noticia Normal',
                  description: 'Cola inteligente (horario óptimo)',
                },
                {
                  value: 'blog',
                  label: 'Blog Post',
                  description: 'Cola inteligente (menor prioridad)',
                },
              ]}
            />
          </CardContent>
        </Card>

        {/* Sección 3: Redes Sociales */}
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <ThemedText variant="title-medium">Publicar en redes sociales</ThemedText>
            </CardTitle>
            <CardDescription>
              <ThemedText variant="body-small" color="secondary">
                Comparte automáticamente en Facebook y Twitter
              </ThemedText>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <View style={styles.switchRow}>
              <ThemedText variant="body-medium">Habilitar publicación en redes</ThemedText>
              <Switch checked={publishToSocialMedia} onCheckedChange={setPublishToSocialMedia} />
            </View>

            {publishToSocialMedia && (
              <View style={styles.socialMediaOptions}>
                <ThemedText variant="label-medium" color="secondary" style={styles.sectionLabel}>
                  Plataformas:
                </ThemedText>

                <View style={styles.checkboxRow}>
                  <Checkbox
                    checked={selectedPlatforms.includes('facebook')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPlatforms([...selectedPlatforms, 'facebook']);
                      } else {
                        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== 'facebook'));
                      }
                    }}
                  />
                  <ThemedText variant="body-medium" style={styles.checkboxLabel}>
                    Facebook
                  </ThemedText>
                </View>

                <View style={styles.checkboxRow}>
                  <Checkbox
                    checked={selectedPlatforms.includes('twitter')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPlatforms([...selectedPlatforms, 'twitter']);
                      } else {
                        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== 'twitter'));
                      }
                    }}
                  />
                  <ThemedText variant="body-medium" style={styles.checkboxLabel}>
                    Twitter
                  </ThemedText>
                </View>

                <View style={styles.divider} />

                <View style={styles.checkboxRow}>
                  <Checkbox checked={improveCopy} onCheckedChange={setImproveCopy} />
                  <View style={styles.improveCopyLabel}>
                    <ThemedText variant="body-medium">Mejorar copy con IA</ThemedText>
                    <ThemedText variant="body-small" color="secondary">
                      Optimiza hooks y agrega URL antes de publicar
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Secci�n 4: Imagen */}
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <ThemedText variant="title-medium">Imagen destacada</ThemedText>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.checkboxRow}>
              <Checkbox checked={useOriginalImage} onCheckedChange={setUseOriginalImage} />
              <ThemedText variant="body-medium" style={styles.checkboxLabel}>
                Usar imagen original de la noticia
              </ThemedText>
            </View>
          </CardContent>
        </Card>

        {/* Botones de Acci�n */}
        <View style={styles.actions}>
          <Button
            onPress={() => router.back()}
            variant="outline"
            style={styles.cancelButton}
            disabled={publishMutation.isPending || improveCopyMutation.isPending}
          >
            <ThemedText>Cancelar</ThemedText>
          </Button>

          <Button
            onPress={handlePublish}
            style={styles.publishButton}
            disabled={
              publishMutation.isPending ||
              improveCopyMutation.isPending ||
              selectedSiteIds.length === 0
            }
          >
            {(publishMutation.isPending || improveCopyMutation.isPending) ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <ThemedText style={styles.publishButtonText}>
                {publicationType === 'breaking' ? 'Publicar Ahora' : 'Programar'}
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
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  contentTablet: {
    paddingHorizontal: 80,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  section: {
    marginBottom: 16,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  socialMediaOptions: {
    marginTop: 16,
    gap: 12,
  },
  sectionLabel: {
    marginBottom: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkboxLabel: {
    marginTop: 2,
  },
  improveCopyLabel: {
    flex: 1,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  publishButton: {
    flex: 2,
    backgroundColor: '#3B82F6',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    color: '#111827',
    textAlign: 'center',
  },
});
