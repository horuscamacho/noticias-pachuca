import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Animated,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/src/components/ThemedText';
import { useResponsive } from '@/src/features/responsive';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { extractedNewsApi } from '@/src/services/api/extractedNewsApi';
import { imageBankApi, type ProcessImageDto } from '@/src/services/api/imageBankApi';
import type { App } from '@/src/types/extracted-content-filters.types';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { GenerateImageModal } from '@/src/components/image-generation/GenerateImageModal';
import { useImageGeneration } from '@/src/hooks/useImageGeneration';
import type { App as ImageGenApp } from '@/src/types/image-generation.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * 🖼️ Image Bank Screen
 *
 * Pantalla principal del banco de imágenes.
 *
 * Features:
 * - Grid de 3 columnas
 * - Infinite scroll con TanStack Query
 * - Imágenes extraídas del contenido
 * - Performance optimizado con expo-image
 */
export default function ImagesScreen() {
  const { isTablet } = useResponsive();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Grid 3 columnas con gap
  const COLUMNS = 3;
  const GAP = 4;
  const IMAGE_SIZE = (SCREEN_WIDTH - GAP * (COLUMNS + 1)) / COLUMNS;

  // ============================================================================
  // MULTI-SELECTION STATE
  // ============================================================================

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isStoringImages, setIsStoringImages] = useState(false);
  const [showBatchGenerateModal, setShowBatchGenerateModal] = useState(false);

  // Hook de generación de imágenes
  const { mutate: generateImage, isPending: isGenerating } = useImageGeneration();

  // ============================================================================
  // FILTERS STATE
  // ============================================================================

  const [showFilters, setShowFilters] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<App.SortBy>('extractedAt');
  const [sortOrder, setSortOrder] = useState<App.SortOrder>('desc');
  const [keywordSearch, setKeywordSearch] = useState('');

  // ============================================================================
  // KEYWORDS QUERY
  // ============================================================================

  const {
    data: keywordsData,
    isLoading: keywordsLoading,
  } = useQuery({
    queryKey: ['keywords', keywordSearch],
    queryFn: async () => {
      return await extractedNewsApi.getKeywords(keywordSearch || undefined);
    },
    enabled: showFilters, // Solo cargar cuando modal está abierto
  });

  // ============================================================================
  // DATA FETCHING - Infinite Query
  // ============================================================================

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['extracted-news', 'images', selectedKeywords, sortBy, sortOrder],
    queryFn: async ({ pageParam = 1 }) => {
      const filters: App.ExtractedContentFilters = {
        page: pageParam,
        limit: 30, // 30 imágenes por página (10 filas de 3)
        hasImages: true, // Solo contenido con imágenes
        keywords: selectedKeywords.length > 0 ? selectedKeywords : undefined,
        sortBy,
        sortOrder,
      };

      return await extractedNewsApi.getExtractedNews(filters);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext
        ? lastPage.pagination.page + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  // Flatten todas las páginas de imágenes
  const allImages = React.useMemo(() => {
    if (!data?.pages) return [];

    return data.pages.flatMap((page) =>
      page.data.flatMap((content) =>
        content.images.map((imageUrl, index) => ({
          id: `${content.id}-${index}`,
          url: imageUrl,
          contentId: content.id,
          title: content.title,
          domain: content.domain,
          outlet: content.domain,
          publishedAt: content.publishedAt,
          keywords: content.keywords || [],
          categories: content.categories || [],
        }))
      )
    );
  }, [data]);

  // ============================================================================
  // SELECTION HANDLERS
  // ============================================================================

  const handleLongPress = (imageId: string) => {
    setSelectionMode(true);
    setSelectedImages(new Set([imageId]));
  };

  const handleImagePress = (imageId: string) => {
    if (selectionMode) {
      // Toggle selection
      setSelectedImages((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(imageId)) {
          newSet.delete(imageId);
        } else {
          newSet.add(imageId);
        }

        // Si no hay selección, salir del modo
        if (newSet.size === 0) {
          setSelectionMode(false);
        }

        return newSet;
      });
    } else {
      // Navegar a detail screen
      router.push(`/image-detail/${imageId}`);
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedImages(new Set());
  };

  const handleSelectAll = () => {
    if (selectedImages.size === allImages.length) {
      // Deseleccionar todo
      setSelectedImages(new Set());
      setSelectionMode(false);
    } else {
      // Seleccionar todo
      setSelectedImages(new Set(allImages.map((img) => img.id)));
    }
  };

  const handleToggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) => {
      if (prev.includes(keyword)) {
        return prev.filter((k) => k !== keyword);
      } else {
        return [...prev, keyword];
      }
    });
  };

  const handleClearFilters = () => {
    setSelectedKeywords([]);
    setSortBy('extractedAt');
    setSortOrder('desc');
  };

  const handleBatchGenerate = (request: ImageGenApp.GenerateImageRequest) => {
    // Obtener las imágenes seleccionadas
    const selectedImagesData = allImages.filter((img) => selectedImages.has(img.id));

    // Crear array de job IDs para tracking
    const jobIds: string[] = [];

    // Generar una imagen por cada seleccionada
    selectedImagesData.forEach((img, index) => {
      const prompt = request.prompt || img.title || 'Imagen de noticia';

      generateImage(
        {
          ...request,
          prompt: `${prompt} - Imagen ${index + 1}`,
          extractedNoticiaId: img.contentId,
        },
        {
          onSuccess: (result) => {
            jobIds.push(result.jobId);

            // Cuando se completen todas, navegar a batch result
            if (jobIds.length === selectedImagesData.length) {
              setShowBatchGenerateModal(false);
              setSelectedImages(new Set());
              setSelectionMode(false);

              // Navegar a pantalla de batch result con los jobIds
              router.push(`/image-generation/batch-result?jobIds=${jobIds.join(',')}`);
            }
          },
        }
      );
    });
  };

  const handleStoreImages = async () => {
    if (selectedImages.size === 0) return;

    setIsStoringImages(true);

    try {
      // Obtener datos de las imágenes seleccionadas
      const selectedImagesData = allImages.filter((img) => selectedImages.has(img.id));

      console.log(`🖼️ Procesando ${selectedImagesData.length} imágenes...`);

      // Procesar una por una (no hay endpoint batch en backend)
      const results = await Promise.allSettled(
        selectedImagesData.map((img) =>
          imageBankApi.processSingleImage({
            imageUrl: img.url,
            outlet: img.domain || 'unknown',
            keywords: img.keywords || [],
            categories: img.categories || [],
            extractedNoticiaId: img.contentId,
            altText: img.title,
            caption: img.title,
          })
        )
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      console.log(`✅ Procesamiento completado: ${successful} exitosas, ${failed} fallidas`);

      // Invalidar cache de React Query para refrescar datos
      if (successful > 0) {
        // Invalidar lista de image-bank para refrescar el banco de imágenes
        await queryClient.invalidateQueries({ queryKey: ['image-bank'] });

        // Invalidar stats del banco de imágenes
        await queryClient.invalidateQueries({ queryKey: ['image-bank', 'stats'] });

        console.log('🔄 Cache invalidado exitosamente');
      }

      // Limpiar selección después de almacenar
      setSelectedImages(new Set());
      setSelectionMode(false);

      // Mostrar alert de resultado
      if (failed === 0) {
        Alert.alert(
          'Éxito',
          `${successful} ${successful === 1 ? 'imagen almacenada' : 'imágenes almacenadas'} exitosamente`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Procesamiento completado',
          `Exitosas: ${successful}\nFallidas: ${failed}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Error al almacenar imágenes:', error);
      Alert.alert(
        'Error',
        'No se pudieron almacenar las imágenes. Intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsStoringImages(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const renderImageItem = ({
    item,
  }: {
    item: {
      id: string;
      url: string;
      contentId: string;
      title?: string;
      outlet?: string;
      publishedAt?: Date;
    };
  }) => {
    const isSelected = selectedImages.has(item.id);

    return (
      <Pressable
        style={[
          styles.imageContainer,
          { width: IMAGE_SIZE, height: IMAGE_SIZE },
          isSelected && styles.imageContainerSelected,
        ]}
        onPress={() => handleImagePress(item.id)}
        onLongPress={() => handleLongPress(item.id)}
      >
        <Image
          source={{ uri: item.url }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        />

        {/* Checkmark overlay cuando está seleccionado */}
        {isSelected && (
          <View style={styles.checkmarkOverlay}>
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark" size={20} color="#000000" />
            </View>
          </View>
        )}

        {/* Número de selección cuando está en modo selección */}
        {selectionMode && !isSelected && (
          <View style={styles.selectionOverlay} />
        )}
      </Pressable>
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#f1ef47" />
        <ThemedText variant="body-small" color="secondary" style={styles.footerText}>
          Cargando más imágenes...
        </ThemedText>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <ThemedText variant="title-medium" style={styles.emptyTitle}>
        No hay imágenes disponibles
      </ThemedText>
      <ThemedText variant="body-medium" color="secondary">
        Extrae contenido de sitios para comenzar
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f1ef47" />
          <ThemedText variant="body-medium" color="secondary" style={styles.loadingText}>
            Cargando imágenes...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText variant="title-medium" style={styles.errorTitle}>
            Error al cargar imágenes
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary">
            Intenta nuevamente más tarde
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header mejorado */}
      {!selectionMode ? (
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <ThemedText variant="headline-medium" style={styles.title}>
                Banco de Imágenes
              </ThemedText>
              <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
                {allImages.length} imágenes extraídas de noticias
              </ThemedText>
            </View>

            <View style={styles.headerActions}>
              {/* Botón Upload */}
              <Pressable
                onPress={() => router.push('/image-bank/upload')}
                style={styles.uploadButton}
              >
                <Ionicons name="cloud-upload" size={20} color="#000000" />
              </Pressable>

              {/* Botón Filtros */}
              <Pressable onPress={() => setShowFilters(true)} style={styles.filterButton}>
                <Ionicons
                  name="funnel"
                  size={20}
                  color="#6B7280"
                />
                {selectedKeywords.length > 0 && (
                  <View style={styles.filterBadge}>
                    <ThemedText variant="body-small" style={styles.filterBadgeText}>
                      {selectedKeywords.length}
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.selectionHeader}>
          <Pressable onPress={handleCancelSelection} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color="#000000" />
          </Pressable>

          <View style={styles.selectionInfo}>
            <ThemedText variant="title-medium" style={styles.selectionCount}>
              {selectedImages.size} seleccionada{selectedImages.size !== 1 ? 's' : ''}
            </ThemedText>
          </View>

          <Button onPress={handleSelectAll} size="sm" variant="default">
            <Text>
              {selectedImages.size === allImages.length ? 'Deseleccionar' : 'Todo'}
            </Text>
          </Button>
        </View>
      )}

      {/* Botones de acción para imágenes seleccionadas */}
      {selectionMode && selectedImages.size > 0 && (
        <View style={styles.actionButtonContainer}>
          <Button
            onPress={() => setShowBatchGenerateModal(true)}
            disabled={isGenerating}
            size="default"
            variant="outline"
            style={styles.generateButton}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="sparkles" size={20} color="#000000" />
              <Text style={styles.buttonText}>
                Generar IA ({selectedImages.size})
              </Text>
            </View>
          </Button>

          <Button
            onPress={handleStoreImages}
            disabled={isStoringImages}
            size="default"
            variant="default"
          >
            {isStoringImages ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="#000000" />
                <Text style={styles.buttonText}>Almacenando...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="cloud-upload" size={20} color="#000000" />
                <Text style={styles.buttonText}>
                  Almacenar ({selectedImages.size})
                </Text>
              </View>
            )}
          </Button>
        </View>
      )}

      {/* Grid de imágenes */}
      <FlatList
        data={allImages}
        renderItem={renderImageItem}
        keyExtractor={(item) => item.id}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#f1ef47"
            colors={['#f1ef47']}
          />
        }
      />

      {/* Modal de Filtros */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header del modal */}
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={28} color="#000000" />
            </Pressable>
            <ThemedText variant="title-medium">Filtros</ThemedText>
            <Pressable onPress={handleClearFilters}>
              <ThemedText variant="body-medium" style={styles.clearText}>
                Limpiar
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Ordenamiento */}
            <View style={styles.filterSection}>
              <ThemedText variant="title-small" style={styles.filterTitle}>
                Ordenar por
              </ThemedText>
              <View style={styles.sortOptions}>
                <Pressable
                  style={[
                    styles.sortOption,
                    sortBy === 'extractedAt' && styles.sortOptionActive,
                  ]}
                  onPress={() => setSortBy('extractedAt')}
                >
                  <ThemedText
                    variant="body-medium"
                    style={sortBy === 'extractedAt' && styles.sortOptionTextActive}
                  >
                    Fecha de extracción
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.sortOption,
                    sortBy === 'publishedAt' && styles.sortOptionActive,
                  ]}
                  onPress={() => setSortBy('publishedAt')}
                >
                  <ThemedText
                    variant="body-medium"
                    style={sortBy === 'publishedAt' && styles.sortOptionTextActive}
                  >
                    Fecha de publicación
                  </ThemedText>
                </Pressable>
              </View>

              {/* Orden */}
              <View style={styles.sortOrderContainer}>
                <Pressable
                  style={[
                    styles.sortOrderButton,
                    sortOrder === 'desc' && styles.sortOrderButtonActive,
                  ]}
                  onPress={() => setSortOrder('desc')}
                >
                  <Ionicons
                    name="arrow-down"
                    size={20}
                    color={sortOrder === 'desc' ? '#000000' : '#6B7280'}
                  />
                  <ThemedText
                    variant="body-medium"
                    style={sortOrder === 'desc' && styles.sortOrderTextActive}
                  >
                    Más recientes
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.sortOrderButton,
                    sortOrder === 'asc' && styles.sortOrderButtonActive,
                  ]}
                  onPress={() => setSortOrder('asc')}
                >
                  <Ionicons
                    name="arrow-up"
                    size={20}
                    color={sortOrder === 'asc' ? '#000000' : '#6B7280'}
                  />
                  <ThemedText
                    variant="body-medium"
                    style={sortOrder === 'asc' && styles.sortOrderTextActive}
                  >
                    Más antiguos
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Keywords */}
            <View style={styles.filterSection}>
              <ThemedText variant="title-small" style={styles.filterTitle}>
                Keywords
              </ThemedText>

              {/* Search bar para keywords */}
              <TextInput
                style={styles.keywordSearch}
                placeholder="Buscar keywords..."
                placeholderTextColor="#9CA3AF"
                value={keywordSearch}
                onChangeText={setKeywordSearch}
              />

              {/* Lista de keywords */}
              <View style={styles.keywordsContainer}>
                {keywordsLoading ? (
                  <ActivityIndicator size="small" color="#f1ef47" />
                ) : keywordsData && keywordsData.length > 0 ? (
                  keywordsData.slice(0, 20).map((item) => {
                    const isSelected = selectedKeywords.includes(item.keyword);
                    return (
                      <Pressable
                        key={item.keyword}
                        style={[
                          styles.keywordChip,
                          isSelected && styles.keywordChipActive,
                        ]}
                        onPress={() => handleToggleKeyword(item.keyword)}
                      >
                        <ThemedText
                          variant="body-small"
                          style={isSelected && styles.keywordChipTextActive}
                        >
                          {item.keyword}
                        </ThemedText>
                        <ThemedText
                          variant="body-small"
                          color="secondary"
                          style={styles.keywordCount}
                        >
                          {item.count}
                        </ThemedText>
                      </Pressable>
                    );
                  })
                ) : (
                  <ThemedText variant="body-small" color="secondary">
                    No hay keywords disponibles
                  </ThemedText>
                )}
              </View>

              {/* Mostrar keywords seleccionados */}
              {selectedKeywords.length > 0 && (
                <View style={styles.selectedKeywordsContainer}>
                  <ThemedText variant="body-small" color="secondary" style={styles.selectedKeywordsLabel}>
                    Seleccionados ({selectedKeywords.length})
                  </ThemedText>
                  <View style={styles.selectedKeywordsList}>
                    {selectedKeywords.map((keyword) => (
                      <View key={keyword} style={styles.selectedKeywordChip}>
                        <ThemedText variant="body-small" style={styles.selectedKeywordText}>
                          {keyword}
                        </ThemedText>
                        <Pressable onPress={() => handleToggleKeyword(keyword)}>
                          <Ionicons name="close-circle" size={16} color="#000000" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer con botón aplicar */}
          <View style={styles.modalFooter}>
            <Button onPress={() => setShowFilters(false)} size="default" variant="default">
              <Text>Aplicar Filtros</Text>
            </Button>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal de generación batch AI */}
      <GenerateImageModal
        visible={showBatchGenerateModal}
        onClose={() => setShowBatchGenerateModal(false)}
        onGenerate={handleBatchGenerate}
        initialPrompt={`Generar ${selectedImages.size} imágenes para noticias`}
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
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f1ef47',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f1ef47',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  filterBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
  },
  gridContent: {
    padding: 4,
  },
  row: {
    justifyContent: 'flex-start',
    gap: 4,
    marginBottom: 4,
  },
  imageContainer: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    marginBottom: 8,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    marginBottom: 8,
  },
  // Selection styles
  imageContainerSelected: {
    borderWidth: 3,
    borderColor: '#f1ef47',
  },
  checkmarkOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  checkmarkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1ef47',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectionHeader: {
    padding: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelButton: {
    padding: 8,
  },
  selectionInfo: {
    flex: 1,
    alignItems: 'center',
  },
  selectionCount: {
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  clearText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
  },
  filterTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  sortOptionActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#f1ef47',
  },
  sortOptionTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  sortOrderContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  sortOrderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  sortOrderButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#f1ef47',
  },
  sortOrderTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  keywordSearch: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#000000',
    marginBottom: 12,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keywordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  keywordChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#f1ef47',
  },
  keywordChipTextActive: {
    fontWeight: '600',
  },
  keywordCount: {
    fontSize: 12,
  },
  selectedKeywordsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectedKeywordsLabel: {
    marginBottom: 8,
  },
  selectedKeywordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedKeywordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1ef47',
    borderWidth: 1,
    borderColor: '#f1ef47',
  },
  selectedKeywordText: {
    fontWeight: '600',
    color: '#000000',
  },
  modalFooter: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButtonContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  generateButton: {
    flex: 1,
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
});
