/**
 * Image Generation Result Screen
 *
 * Pantalla que muestra el progreso y resultado de generación AI.
 *
 * Features:
 * - Progress tracking en tiempo real via Socket.IO
 * - Preview de imagen generada
 * - Botón para almacenar en banco de imágenes
 * - Navegación tras completar
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { GenerationProgress } from '@/src/components/image-generation/GenerationProgress';
import { GeneratedImagePreview } from '@/src/components/image-generation/GeneratedImagePreview';
import { useImageGenerationById } from '@/src/hooks/useImageGenerationById';
import { useImageGenerationLogs } from '@/src/hooks/useImageGenerationLogs';
import { useImageGenerationSocket } from '@/src/hooks/useImageGenerationSocket';
import { useStoreInBank } from '@/src/hooks/useStoreInBank';
import type { App } from '@/src/types/image-generation.types';

export default function ImageGenerationResultScreen() {
  const { generationId } = useLocalSearchParams<{ generationId: string }>();
  const router = useRouter();
  const [isStoringInBank, setIsStoringInBank] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  // Fetch generation details (con polling si está en progreso)
  const {
    data: generation,
    isLoading,
    isError,
  } = useImageGenerationById(generationId || '', {
    enabled: !!generationId,
  });

  // Escuchar eventos de socket en tiempo real (usa jobId, no generationId)
  // Socket events usan jobId (BullMQ job ID) para matchear
  const logs = useImageGenerationLogs(generation?.jobId?.toString() || '');

  // Socket listeners en tiempo real para progreso y completado
  const { processingIds, isProcessing } = useImageGenerationSocket({
    onGenerationProgress: (data) => {
      console.log(`📊 Progress update: ${data.progress}% - ${data.message}`);
      // React Query auto-invalida y actualiza la UI
    },
    onGenerationCompleted: (data) => {
      console.log(`✅ Generation completed: ${data.generationId}`);
      // React Query auto-invalida y actualiza la UI
    },
    onGenerationFailed: (data) => {
      console.error(`❌ Generation failed: ${data.error}`);
      // React Query auto-invalida y actualiza la UI
    },
  });

  // Hook para almacenar en banco
  const { mutate: storeInBank, isPending: isStoring } = useStoreInBank();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStoreInBank = () => {
    if (!generation?.id) return;

    setIsStoringInBank(true);
    storeInBank(
      {
        id: generation.id,
        metadata: {
          keywords: generation.brandingConfig?.keywords || [],
          altText: generation.prompt,
          caption: `Imagen generada con IA - ${generation.quality}`,
        },
      },
      {
        onSuccess: () => {
          setIsStoringInBank(false);
          // Navegar al tab de imágenes
          router.replace('/(tabs)/images');
        },
        onError: () => {
          setIsStoringInBank(false);
        },
      }
    );
  };

  const handleRegenerate = () => {
    // Navegar de vuelta a image detail con modal abierto
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f1ef47" />
          <ThemedText variant="body-medium" style={styles.loadingText}>
            Cargando generación...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !generation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color="#EF4444" />
          <ThemedText variant="title-medium" style={styles.errorTitle}>
            Error al cargar generación
          </ThemedText>
          <Pressable onPress={handleClose} style={styles.errorButton}>
            <ThemedText variant="body-medium" style={styles.errorButtonText}>
              Volver
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isInProgress =
    generation.status === 'queued' || generation.status === 'processing';
  const isCompleted = generation.status === 'completed';
  const isFailed = generation.status === 'failed';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#000000" />
        </Pressable>
        <ThemedText variant="title-medium" style={styles.headerTitle}>
          Generación AI
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress o resultado */}
        {isInProgress && (
          <View style={styles.progressSection}>
            <GenerationProgress
              logs={logs}
              progress={generation.progress || 0}
              cost={generation.cost}
              isGenerating={true}
            />
          </View>
        )}

        {isCompleted && generation.resultUrl && (
          <View style={styles.resultSection}>
            <GeneratedImagePreview
              imageUrl={generation.resultUrl}
              generation={generation}
              onStore={handleStoreInBank}
              onRegenerate={handleRegenerate}
              onClose={handleClose}
            />
          </View>
        )}

        {isFailed && (
          <View style={styles.failedSection}>
            <Ionicons name="close-circle" size={64} color="#EF4444" />
            <ThemedText variant="title-medium" style={styles.failedTitle}>
              Generación fallida
            </ThemedText>
            {generation.error && (
              <ThemedText variant="body-medium" style={styles.failedMessage}>
                {generation.error}
              </ThemedText>
            )}
            <View style={styles.failedActions}>
              <Pressable
                style={[styles.actionButton, styles.regenerateButton]}
                onPress={handleRegenerate}
              >
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <ThemedText variant="body-medium" style={styles.regenerateButtonText}>
                  Reintentar
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.closeButton]}
                onPress={handleClose}
              >
                <ThemedText variant="body-medium" style={styles.closeButtonText}>
                  Cerrar
                </ThemedText>
              </Pressable>
            </View>
          </View>
        )}

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
  progressSection: {
    padding: 16,
  },
  resultSection: {
    padding: 16,
  },
  failedSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    minHeight: 400,
  },
  failedTitle: {
    textAlign: 'center',
    color: '#EF4444',
  },
  failedMessage: {
    textAlign: 'center',
    color: '#6B7280',
  },
  failedActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  regenerateButton: {
    backgroundColor: '#3B82F6',
  },
  regenerateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#E5E7EB',
  },
  closeButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorTitle: {
    textAlign: 'center',
    color: '#EF4444',
  },
  errorButton: {
    backgroundColor: '#f1ef47',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  errorButtonText: {
    color: '#000000',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 32,
  },
});
