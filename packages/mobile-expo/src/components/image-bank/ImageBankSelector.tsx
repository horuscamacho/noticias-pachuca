/**
 * 🖼️ ImageBankSelector Component
 *
 * Modal selector para elegir imágenes del banco durante publicación
 *
 * Features:
 * - Grid de imágenes con preview
 * - Búsqueda por keywords
 * - Infinite scroll
 * - Selección simple (una imagen a la vez)
 * - Preview grande al seleccionar
 */

import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  Modal,
  SafeAreaView,
  FlatList,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { ThemedText } from '@/src/components/ThemedText'
import { Ionicons } from '@expo/vector-icons'
import { X, Search, CheckCircle } from 'lucide-react-native'
import { useInfiniteQuery } from '@tanstack/react-query'
import { imageBankApi } from '@/src/services/image-bank/imageBankApi'
import type { ImageBankDocument } from '@/src/types/image-bank.types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IMAGE_SIZE = (SCREEN_WIDTH - 48) / 3 // 3 columns with 16px padding + 8px gaps

interface ImageBankSelectorProps {
  visible: boolean
  onClose: () => void
  onSelect: (image: ImageBankDocument) => void
  selectedImageId?: string
}

export function ImageBankSelector({
  visible,
  onClose,
  onSelect,
  selectedImageId,
}: ImageBankSelectorProps) {
  const [searchText, setSearchText] = useState('')
  const [selectedImage, setSelectedImage] = useState<ImageBankDocument | null>(null)

  // Query para obtener imágenes del banco
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['image-bank-selector', searchText],
    queryFn: ({ pageParam = 1 }) =>
      imageBankApi.getImageBank({
        page: pageParam,
        limit: 30,
        searchText: searchText || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    enabled: visible, // Solo ejecutar cuando el modal está visible
  })

  // Aplanar todas las páginas
  const allImages = data?.pages.flatMap((page) => page.data) || []

  // Handle end reached (infinite scroll)
  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  // Handle image selection
  const handleSelectImage = (image: ImageBankDocument) => {
    setSelectedImage(image)
  }

  // Handle confirm selection
  const handleConfirm = () => {
    if (selectedImage) {
      onSelect(selectedImage)
      setSelectedImage(null)
      setSearchText('')
      onClose()
    }
  }

  // Render image item
  const renderImageItem = ({ item }: { item: ImageBankDocument }) => {
    const isSelected = selectedImage?._id === item._id || selectedImageId === item._id

    return (
      <Pressable
        style={[styles.imageItem, isSelected && styles.imageItemSelected]}
        onPress={() => handleSelectImage(item)}
      >
        <Image
          source={{ uri: item.processedUrls.medium }}
          style={styles.imagePreview}
          resizeMode="cover"
        />
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <CheckCircle size={32} color="#f1ef47" fill="#000000" />
          </View>
        )}
        {item.quality && (
          <View style={[
            styles.qualityBadge,
            item.quality === 'high' && styles.qualityHigh,
            item.quality === 'medium' && styles.qualityMedium,
            item.quality === 'low' && styles.qualityLow,
          ]}>
            <ThemedText variant="label-small" style={styles.qualityText}>
              {item.quality === 'high' ? '🔥' : item.quality === 'medium' ? '👍' : '👎'}
            </ThemedText>
          </View>
        )}
      </Pressable>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ThemedText variant="title-large" style={styles.headerTitle}>
              Seleccionar Imagen
            </ThemedText>
            <ThemedText variant="body-small" style={styles.headerSubtitle}>
              {allImages.length} imágenes disponibles
            </ThemedText>
          </View>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
            <X size={24} color="#000000" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por keywords, caption..."
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText('')} hitSlop={8}>
                <X size={16} color="#6B7280" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Images Grid */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f1ef47" />
            <ThemedText variant="body-medium" style={styles.loadingText}>
              Cargando imágenes...
            </ThemedText>
          </View>
        ) : isError ? (
          <View style={styles.errorContainer}>
            <ThemedText variant="body-medium" style={styles.errorText}>
              Error al cargar imágenes
            </ThemedText>
          </View>
        ) : allImages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText variant="body-medium" style={styles.emptyText}>
              {searchText
                ? 'No se encontraron imágenes con esa búsqueda'
                : 'No hay imágenes en el banco'}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={allImages}
            renderItem={renderImageItem}
            keyExtractor={(item) => item._id}
            numColumns={3}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.gridRow}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#f1ef47" />
                </View>
              ) : null
            }
          />
        )}

        {/* Bottom Action Bar */}
        {selectedImage && (
          <View style={styles.bottomBar}>
            <View style={styles.selectedInfo}>
              <Image
                source={{ uri: selectedImage.processedUrls.thumbnail }}
                style={styles.selectedThumbnail}
              />
              <View style={styles.selectedDetails}>
                <ThemedText variant="label-medium" style={styles.selectedTitle} numberOfLines={1}>
                  {selectedImage.altText || selectedImage.caption || 'Imagen seleccionada'}
                </ThemedText>
                {selectedImage.keywords && selectedImage.keywords.length > 0 && (
                  <ThemedText variant="body-small" style={styles.selectedKeywords} numberOfLines={1}>
                    {selectedImage.keywords.slice(0, 3).join(', ')}
                  </ThemedText>
                )}
              </View>
            </View>
            <Pressable style={styles.confirmButton} onPress={handleConfirm}>
              <ThemedText variant="body-medium" style={styles.confirmButtonText}>
                Confirmar
              </ThemedText>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '900',
    color: '#111827',
  },
  headerSubtitle: {
    color: '#6B7280',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  gridContent: {
    padding: 16,
  },
  gridRow: {
    gap: 8,
    marginBottom: 8,
  },
  imageItem: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  imageItemSelected: {
    borderColor: '#f1ef47',
    borderWidth: 3,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  qualityHigh: {
    backgroundColor: '#22C55E',
  },
  qualityMedium: {
    backgroundColor: '#F59E0B',
  },
  qualityLow: {
    backgroundColor: '#EF4444',
  },
  qualityText: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#DC2626',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  selectedInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedDetails: {
    flex: 1,
  },
  selectedTitle: {
    color: '#111827',
    fontWeight: '600',
  },
  selectedKeywords: {
    color: '#6B7280',
    marginTop: 2,
  },
  confirmButton: {
    backgroundColor: '#f1ef47',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  confirmButtonText: {
    color: '#000000',
    fontWeight: '900',
  },
})
