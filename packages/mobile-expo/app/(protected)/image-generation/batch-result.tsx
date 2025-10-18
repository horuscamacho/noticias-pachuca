/**
 * Batch Image Generation Result Screen
 *
 * Pantalla que muestra el progreso y resultados de generación batch AI.
 *
 * Features:
 * - Tracking de múltiples jobs en paralelo
 * - Grid de previews cuando se completan
 * - Acción bulk "Almacenar todos"
 * - Progress individual por imagen
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useImageGenerationById } from '@/src/hooks/useImageGenerationById';
import { useImageGenerationSocket } from '@/src/hooks/useImageGenerationSocket';
import { useStoreInBank } from '@/src/hooks/useStoreInBank';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { App } from '@/src/types/image-generation.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_WIDTH - 48) / 2; // 2 columnas con padding

interface BatchJobStatus {
  jobId: string;
  generation: App.ImageGeneration | undefined;
  isLoading: boolean;
  isError: boolean;
}

export default function BatchImageGenerationResultScreen() {
  const { jobIds } = useLocalSearchParams<{ jobIds: string }>();
  const router = useRouter();
  const [storedIds, setStoredIds] = useState<Set<string>>(new Set());

  // Parse jobIds from comma-separated string
  const jobIdArray = useMemo(() => {
    return jobIds?.split(',') || [];
  }, [jobIds]);

  // Hook para almacenar en banco
  const { mutate: storeInBank, isPending: isStoring } = useStoreInBank();

  // Socket listeners en tiempo real para todas las generaciones en batch
  const { processingIds } = useImageGenerationSocket({
    onGenerationProgress: (data) => {
      console.log(`📊 Batch Progress: ${data.generationId} at ${data.progress}%`);
      // React Query auto-invalida y actualiza la UI
    },
    onGenerationCompleted: (data) => {
      console.log(`✅ Batch item completed: ${data.generationId}`);
      // React Query auto-invalida y actualiza la UI
    },
    onGenerationFailed: (data) => {
      console.error(`❌ Batch item failed: ${data.generationId} - ${data.error}`);
      // React Query auto-invalida y actualiza la UI
    },
  });

  // ============================================================================
  // DATA FETCHING - Fetch all jobs in parallel
  // ============================================================================

  // Crear hooks para cada job
  const batchStatus: BatchJobStatus[] = jobIdArray.map((jobId) => {
    const { data, isLoading, isError } = useImageGenerationById(jobId, {
      enabled: !!jobId,
    });

    return {
      jobId,
      generation: data,
      isLoading,
      isError,
    };
  });

  // ============================================================================
  // COMPUTED STATE
  // ============================================================================

  const allCompleted = batchStatus.every(
    (status) => status.generation?.status === 'completed'
  );

  const allFailed = batchStatus.every(
    (status) => status.generation?.status === 'failed'
  );

  const inProgress = batchStatus.some(
    (status) =>
      status.generation?.status === 'queued' ||
      status.generation?.status === 'processing'
  );

  const completedCount = batchStatus.filter(
    (status) => status.generation?.status === 'completed'
  ).length;

  const failedCount = batchStatus.filter(
    (status) => status.generation?.status === 'failed'
  ).length;

  const totalCost = batchStatus.reduce((sum, status) => {
    return sum + (status.generation?.cost || 0);
  }, 0);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStoreAll = () => {
    const completedGenerations = batchStatus.filter(
      (status) =>
        status.generation?.status === 'completed' && status.generation?.id
    );

    completedGenerations.forEach((status) => {
      if (!status.generation?.id) return;

      storeInBank(
        {
          id: status.generation.id,
          metadata: {
            keywords: status.generation.brandingConfig?.keywords || [],
            altText: status.generation.prompt,
            caption: `Imagen generada con IA - ${status.generation.quality}`,
          },
        },
        {
          onSuccess: () => {
            setStoredIds((prev) => new Set(prev).add(status.generation!.id));
          },
        }
      );
    });
  };

  const handleStoreOne = (generationId: string) => {
    const status = batchStatus.find((s) => s.generation?.id === generationId);
    if (!status?.generation) return;

    storeInBank(
      {
        id: generationId,
        metadata: {
          keywords: status.generation.brandingConfig?.keywords || [],
          altText: status.generation.prompt,
          caption: `Imagen generada con IA - ${status.generation.quality}`,
        },
      },
      {
        onSuccess: () => {
          setStoredIds((prev) => new Set(prev).add(generationId));
        },
      }
    );
  };

  const handleClose = () => {
    router.back();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#000000" />
        </Pressable>
        <ThemedText variant="title-medium" style={styles.headerTitle}>
          Generación Batch AI
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <CardHeader>
            <CardTitle>Resumen de Generación</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.summaryRow}>
              <ThemedText variant="body-medium" color="secondary">
                Total de imágenes:
              </ThemedText>
              <ThemedText variant="body-medium" style={styles.summaryValue}>
                {jobIdArray.length}
              </ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText variant="body-medium" color="secondary">
                Completadas:
              </ThemedText>
              <ThemedText
                variant="body-medium"
                style={[styles.summaryValue, { color: '#10B981' }]}
              >
                {completedCount}
              </ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText variant="body-medium" color="secondary">
                Fallidas:
              </ThemedText>
              <ThemedText
                variant="body-medium"
                style={[styles.summaryValue, { color: '#EF4444' }]}
              >
                {failedCount}
              </ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText variant="body-medium" color="secondary">
                Costo total:
              </ThemedText>
              <ThemedText variant="body-medium" style={styles.summaryValue}>
                ${totalCost.toFixed(3)}
              </ThemedText>
            </View>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {allCompleted && (
          <View style={styles.actionsContainer}>
            <Button
              onPress={handleStoreAll}
              disabled={isStoring || storedIds.size === completedCount}
              size="default"
              variant="default"
              style={styles.storeAllButton}
            >
              {isStoring ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="#000000" />
                  <Text style={styles.buttonText}>Almacenando...</Text>
                </View>
              ) : storedIds.size === completedCount ? (
                <View style={styles.buttonContent}>
                  <Ionicons name="checkmark-circle" size={20} color="#000000" />
                  <Text style={styles.buttonText}>Todas almacenadas</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="cloud-upload" size={20} color="#000000" />
                  <Text style={styles.buttonText}>
                    Almacenar todas ({completedCount})
                  </Text>
                </View>
              )}
            </Button>
          </View>
        )}

        {/* Grid de resultados */}
        <View style={styles.gridContainer}>
          {batchStatus.map((status, index) => (
            <View key={status.jobId} style={styles.gridItem}>
              <Card style={styles.resultCard}>
                <CardContent style={styles.resultCardContent}>
                  {/* Status header */}
                  <View style={styles.resultHeader}>
                    <ThemedText variant="body-small" style={styles.resultIndex}>
                      Imagen {index + 1}
                    </ThemedText>
                    {status.generation?.status === 'completed' && (
                      <Badge variant="success" style={styles.statusBadge}>
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                      </Badge>
                    )}
                    {status.generation?.status === 'failed' && (
                      <Badge variant="destructive" style={styles.statusBadge}>
                        <Ionicons name="close" size={12} color="#FFF" />
                      </Badge>
                    )}
                    {(status.generation?.status === 'queued' ||
                      status.generation?.status === 'processing') && (
                      <Badge variant="secondary" style={styles.statusBadge}>
                        <ActivityIndicator size="small" color="#000" />
                      </Badge>
                    )}
                  </View>

                  {/* Image preview */}
                  {status.generation?.resultUrl ? (
                    <Pressable
                      style={styles.imagePreview}
                      onPress={() =>
                        router.push(`/image-generation/result?generationId=${status.generation?.id}`)
                      }
                    >
                      <Image
                        source={{ uri: status.generation.resultUrl }}
                        style={styles.previewImage}
                        contentFit="cover"
                        transition={200}
                        placeholder={status.generation.blurhash}
                      />
                      {storedIds.has(status.generation.id) && (
                        <View style={styles.storedOverlay}>
                          <Ionicons
                            name="checkmark-circle"
                            size={32}
                            color="#f1ef47"
                          />
                        </View>
                      )}
                    </Pressable>
                  ) : (
                    <View style={styles.placeholderContainer}>
                      {status.isLoading ? (
                        <ActivityIndicator size="large" color="#f1ef47" />
                      ) : (
                        <Ionicons
                          name="image-outline"
                          size={48}
                          color="#9CA3AF"
                        />
                      )}
                    </View>
                  )}

                  {/* Progress bar */}
                  {status.generation &&
                    (status.generation.status === 'queued' ||
                      status.generation.status === 'processing') && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${status.generation.progress || 0}%`,
                              },
                            ]}
                          />
                        </View>
                        <ThemedText
                          variant="body-small"
                          color="secondary"
                          style={styles.progressText}
                        >
                          {status.generation.progress || 0}%
                        </ThemedText>
                      </View>
                    )}

                  {/* Action button */}
                  {status.generation?.status === 'completed' &&
                    status.generation?.id &&
                    !storedIds.has(status.generation.id) && (
                      <Button
                        onPress={() => handleStoreOne(status.generation!.id)}
                        disabled={isStoring}
                        size="sm"
                        variant="outline"
                        style={styles.storeOneButton}
                      >
                        <Text style={styles.storeOneText}>Almacenar</Text>
                      </Button>
                    )}
                </CardContent>
              </Card>
            </View>
          ))}
        </View>

        {/* Spacer bottom */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    margin: 16,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryValue: {
    fontWeight: '600',
  },
  actionsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  storeAllButton: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  gridItem: {
    width: IMAGE_SIZE,
  },
  resultCard: {
    overflow: 'hidden',
  },
  resultCardContent: {
    padding: 12,
    gap: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultIndex: {
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imagePreview: {
    width: '100%',
    height: IMAGE_SIZE - 32,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  storedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    width: '100%',
    height: IMAGE_SIZE - 32,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    gap: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f1ef47',
    borderRadius: 3,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 11,
  },
  storeOneButton: {
    marginTop: 4,
  },
  storeOneText: {
    fontSize: 12,
  },
  bottomSpacer: {
    height: 32,
  },
});
