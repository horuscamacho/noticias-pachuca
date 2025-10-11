import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { extractedNewsApi } from '@/src/services/api/extractedNewsApi';
import { Ionicons } from '@expo/vector-icons';
import { formatRelativeTime } from '@/src/mappers/extracted-content-filters.mappers';
import type { App as ExtractedApp } from '@/src/types/extracted-content-filters.types';
import type { App as ImageGenApp } from '@/src/types/image-generation.types';
import { GenerateImageModal } from '@/src/components/image-generation/GenerateImageModal';
import { useImageGeneration } from '@/src/hooks/useImageGeneration';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * 🖼️ Image Detail Screen
 *
 * Pantalla de detalle de una imagen del banco.
 *
 * Features:
 * - Imagen en tamaño completo
 * - Metadatos: source, fecha, outlet
 * - Keywords y categorías
 * - Imágenes relacionadas del mismo contenido
 */
export default function ImageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Extraer contentId e index del id compuesto
  const [contentId, imageIndex] = id?.split('-') || [];

  // Estado para modal de generación AI
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Hook de generación de imágenes
  const { mutate: generateImage, isPending: isGenerating } = useImageGeneration();

  // ============================================================================
  // DATA FETCHING - Primero buscar en cache, luego en API
  // ============================================================================

  const { data: content, isLoading, isError } = useQuery({
    queryKey: ['extracted-content', contentId],
    queryFn: async () => {
      // Primero intentar buscar en el cache del infinite query
      // Buscar en todas las queries que empiecen con ['extracted-news', 'images']
      const queryCache = queryClient.getQueryCache();
      const imageQueries = queryCache.findAll({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key[0] === 'extracted-news' && key[1] === 'images';
        },
      });

      // Buscar en todas las queries cacheadas
      for (const query of imageQueries) {
        const cachedData = query.state.data as {
          pages: Array<ExtractedApp.PaginatedResponse<ExtractedApp.ExtractedContent>>;
          pageParams: number[];
        } | undefined;

        if (cachedData?.pages) {
          for (const page of cachedData.pages) {
            const found = page.data.find((content) => content.id === contentId);
            if (found) {
              return found;
            }
          }
        }
      }

      // Si no está en cache, hacer fetch al API
      return await extractedNewsApi.getExtractedNewsById(contentId);
    },
    enabled: !!contentId,
  });

  // Handler para generar imagen AI
  const handleGenerateImage = (request: ImageGenApp.GenerateImageRequest) => {
    generateImage(request, {
      onSuccess: (result) => {
        setShowGenerateModal(false);
        // Navegar a pantalla de resultado con generationId (MongoDB _id)
        router.push(`/image-generation/result?generationId=${result.generation.id}`);
      },
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f1ef47" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !content) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText variant="title-medium">Error al cargar imagen</ThemedText>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText variant="body-medium" style={styles.backButtonText}>
              Volver
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentImageUrl = content.images[parseInt(imageIndex, 10)];
  const otherImages = content.images.filter((_, idx) => idx !== parseInt(imageIndex, 10));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#000000" />
        </Pressable>
        <ThemedText variant="title-medium" style={styles.headerTitle}>
          Detalle de Imagen
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Imagen principal */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: currentImageUrl }}
            style={styles.mainImage}
            contentFit="contain"
            transition={200}
          />
        </View>

        {/* Metadatos */}
        <View style={styles.metadataSection}>
          {/* Source */}
          <View style={styles.metadataRow}>
            <Ionicons name="globe-outline" size={20} color="#6B7280" />
            <View style={styles.metadataContent}>
              <ThemedText variant="body-small" color="secondary">
                Fuente
              </ThemedText>
              <ThemedText variant="body-medium" style={styles.metadataValue}>
                {content.domain || 'Desconocido'}
              </ThemedText>
            </View>
          </View>

          {/* Fecha */}
          {content.publishedAt && (
            <View style={styles.metadataRow}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <View style={styles.metadataContent}>
                <ThemedText variant="body-small" color="secondary">
                  Publicado
                </ThemedText>
                <ThemedText variant="body-medium" style={styles.metadataValue}>
                  {formatRelativeTime(content.publishedAt)}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Título */}
          {content.title && (
            <View style={styles.metadataRow}>
              <Ionicons name="text-outline" size={20} color="#6B7280" />
              <View style={styles.metadataContent}>
                <ThemedText variant="body-small" color="secondary">
                  Título
                </ThemedText>
                <ThemedText variant="body-medium" style={styles.metadataValue}>
                  {content.title}
                </ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* Acciones */}
        <View style={styles.actionsSection}>
          <Pressable
            style={[
              styles.actionButton,
              isGenerating && styles.actionButtonDisabled,
            ]}
            onPress={() => setShowGenerateModal(true)}
            disabled={isGenerating}
          >
            <Ionicons name="sparkles" size={20} color="#000000" />
            <ThemedText variant="body-medium" style={styles.actionButtonText}>
              {isGenerating ? 'Generando...' : 'Generar con IA'}
            </ThemedText>
          </Pressable>
        </View>

        {/* Keywords */}
        {content.keywords && content.keywords.length > 0 && (
          <View style={styles.section}>
            <ThemedText variant="title-small" style={styles.sectionTitle}>
              Keywords
            </ThemedText>
            <View style={styles.tagsContainer}>
              {content.keywords.map((keyword, idx) => (
                <View key={idx} style={styles.tag}>
                  <ThemedText variant="body-small" style={styles.tagText}>
                    {keyword}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Categorías */}
        {content.categories && content.categories.length > 0 && (
          <View style={styles.section}>
            <ThemedText variant="title-small" style={styles.sectionTitle}>
              Categorías
            </ThemedText>
            <View style={styles.tagsContainer}>
              {content.categories.map((category, idx) => (
                <View key={idx} style={[styles.tag, styles.categoryTag]}>
                  <ThemedText variant="body-small" style={styles.tagText}>
                    {category}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Imágenes relacionadas */}
        {otherImages.length > 0 && (
          <View style={styles.section}>
            <ThemedText variant="title-small" style={styles.sectionTitle}>
              Otras imágenes de este contenido ({otherImages.length})
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedImagesContainer}
            >
              {otherImages.map((imageUrl, idx) => {
                // Calcular el índice real de la imagen
                const realIndex = content.images.findIndex((img) => img === imageUrl);
                const relatedId = `${contentId}-${realIndex}`;

                return (
                  <Pressable
                    key={idx}
                    style={styles.relatedImageContainer}
                    onPress={() => {
                      router.setParams({ id: relatedId });
                    }}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.relatedImage}
                      contentFit="cover"
                      transition={200}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Spacer bottom */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal de generación AI */}
      <GenerateImageModal
        visible={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerateImage}
        initialPrompt={content?.title || ''}
        extractedNoticiaId={contentId}
      />
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
  backButtonText: {
    color: '#f1ef47',
    fontWeight: '600',
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
  imageSection: {
    backgroundColor: '#000000',
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75, // Aspect ratio 4:3
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  metadataSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metadataContent: {
    flex: 1,
  },
  metadataValue: {
    marginTop: 2,
  },
  actionsSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1ef47',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#000000',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryTag: {
    backgroundColor: '#FEF3C7',
    borderColor: '#f1ef47',
  },
  tagText: {
    color: '#374151',
  },
  relatedImagesContainer: {
    gap: 8,
  },
  relatedImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  relatedImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  bottomSpacer: {
    height: 32,
  },
});
