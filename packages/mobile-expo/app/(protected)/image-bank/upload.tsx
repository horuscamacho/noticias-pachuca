/**
 * 📤 Manual Image Upload Screen
 *
 * Pantalla para subir imágenes manualmente desde la galería del celular
 *
 * Features:
 * - Multi-image picker (hasta 10 imágenes)
 * - Preview de imágenes seleccionadas
 * - Formulario con metadata completa (opcional)
 * - TagArrayInput para keywords/tags/categories
 * - AuthorInput para citado automático
 * - Progress tracking durante upload
 * - Navegación al banco tras completar
 */

import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { ThemedText } from '@/src/components/ThemedText'
import { Ionicons } from '@expo/vector-icons'
import { Upload, X, ImagePlus, CheckCircle } from 'lucide-react-native'
import { TagArrayInput } from '@/src/components/image-bank/TagArrayInput'
import { AuthorInput, type AuthorData } from '@/src/components/image-bank/AuthorInput'
import { useUploadImages } from '@/src/hooks/useUploadImages'

interface SelectedImage {
  uri: string
  name: string
  type: string
  size: number
}

export default function ImageBankUploadScreen() {
  const router = useRouter()

  // ============================================================================
  // STATE
  // ============================================================================

  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Form fields (todos opcionales excepto outlet)
  const [outlet] = useState('noticiaspachuca.com') // TODO: Get from auth context
  const [keywords, setKeywords] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [altText, setAltText] = useState('')
  const [caption, setCaption] = useState('')
  const [authorData, setAuthorData] = useState<AuthorData>({})

  // Hook para upload
  const { mutate: uploadImages } = useUploadImages()

  // ============================================================================
  // IMAGE PICKER
  // ============================================================================

  const handlePickImages = async () => {
    try {
      // Pedir permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Necesitamos permisos para acceder a tu galería'
        )
        return
      }

      // Abrir picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: 10, // Max 10 imágenes
      })

      if (!result.canceled && result.assets) {
        // Convertir a formato esperado
        const images: SelectedImage[] = result.assets.map((asset, index) => ({
          uri: asset.uri,
          name: `image-${Date.now()}-${index}.jpg`,
          type: asset.type === 'image' ? 'image/jpeg' : 'image/jpeg',
          size: asset.fileSize || 0,
        }))

        setSelectedImages(images)
      }
    } catch (error) {
      console.error('Error picking images:', error)
      Alert.alert('Error', 'No se pudieron seleccionar las imágenes')
    }
  }

  // ============================================================================
  // REMOVE IMAGE
  // ============================================================================

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  // ============================================================================
  // UPLOAD
  // ============================================================================

  const handleUpload = async () => {
    // Validaciones
    if (selectedImages.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos una imagen')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Crear FormData
      const formData = new FormData()

      // Agregar archivos
      selectedImages.forEach((image, index) => {
        formData.append('files', {
          uri: image.uri,
          name: image.name,
          type: image.type,
        } as any)
      })

      // Agregar metadata obligatoria
      formData.append('outlet', outlet)

      // Agregar metadata opcional
      if (keywords.length > 0) {
        formData.append('keywords', JSON.stringify(keywords))
      }
      if (tags.length > 0) {
        formData.append('tags', JSON.stringify(tags))
      }
      if (categories.length > 0) {
        formData.append('categories', JSON.stringify(categories))
      }
      if (altText.trim()) {
        formData.append('altText', altText.trim())
      }
      if (caption.trim()) {
        formData.append('caption', caption.trim())
      }

      // Author/Attribution fields
      if (authorData.captureType) {
        formData.append('captureType', authorData.captureType)
      }
      if (authorData.photographerName) {
        formData.append('photographerName', authorData.photographerName)
      }
      if (authorData.author) {
        formData.append('author', authorData.author)
      }
      if (authorData.license) {
        formData.append('license', authorData.license)
      }
      if (authorData.attribution) {
        formData.append('attribution', authorData.attribution)
      }

      // Llamar al hook
      uploadImages(formData, {
        onSuccess: (response) => {
          setIsUploading(false)
          setUploadProgress(100)

          // Mostrar resultado
          Alert.alert(
            '¡Éxito!',
            `${response.totalUploaded} imagen(es) subida(s) correctamente`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navegar al banco de imágenes
                  router.replace('/(tabs)/images')
                },
              },
            ]
          )
        },
        onError: (error) => {
          setIsUploading(false)
          setUploadProgress(0)
          Alert.alert('Error', 'No se pudieron subir las imágenes')
        },
      })

      // Simular progreso (en producción esto vendría del backend)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)
    } catch (error) {
      console.error('Error uploading:', error)
      setIsUploading(false)
      setUploadProgress(0)
      Alert.alert('Error', 'No se pudieron subir las imágenes')
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <ThemedText variant="title-large" style={styles.headerTitle}>
          Subir Imágenes
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Image Picker Section */}
        <View style={styles.section}>
          <ThemedText variant="label-medium" style={styles.sectionTitle}>
            📸 Imágenes ({selectedImages.length}/10)
          </ThemedText>

          {selectedImages.length === 0 ? (
            <Pressable style={styles.pickerButton} onPress={handlePickImages}>
              <ImagePlus size={48} color="#6B7280" />
              <ThemedText variant="body-medium" style={styles.pickerText}>
                Seleccionar imágenes de la galería
              </ThemedText>
              <ThemedText variant="body-small" style={styles.pickerSubtext}>
                Hasta 10 imágenes (JPEG, PNG, WebP - Max 10MB c/u)
              </ThemedText>
            </Pressable>
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesPreview}
              >
                {selectedImages.map((image, index) => (
                  <View key={index} style={styles.imagePreviewContainer}>
                    <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                    <Pressable
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <X size={16} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>

              {selectedImages.length < 10 && (
                <Pressable style={styles.addMoreButton} onPress={handlePickImages}>
                  <ImagePlus size={20} color="#000000" />
                  <ThemedText variant="body-medium" style={styles.addMoreText}>
                    Agregar más imágenes
                  </ThemedText>
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* Metadata Form */}
        {selectedImages.length > 0 && (
          <>
            {/* Keywords */}
            <View style={styles.section}>
              <TagArrayInput
                label="🔑 Keywords"
                value={keywords}
                onChange={setKeywords}
                placeholder="ej: hidalgo, política..."
                variant="keywords"
              />
            </View>

            {/* Tags */}
            <View style={styles.section}>
              <TagArrayInput
                label="🏷️ Tags"
                value={tags}
                onChange={setTags}
                placeholder="ej: elecciones, municipio..."
                variant="default"
              />
            </View>

            {/* Categories */}
            <View style={styles.section}>
              <TagArrayInput
                label="📂 Categorías"
                value={categories}
                onChange={setCategories}
                placeholder="ej: Política, Gobierno..."
                variant="categories"
              />
            </View>

            {/* Alt Text */}
            <View style={styles.section}>
              <ThemedText variant="label-medium" style={styles.label}>
                ♿ Texto Alternativo (Accesibilidad)
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="ej: Palacio de Gobierno de Hidalgo"
                placeholderTextColor="#9CA3AF"
                value={altText}
                onChangeText={setAltText}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Caption */}
            <View style={styles.section}>
              <ThemedText variant="label-medium" style={styles.label}>
                💬 Caption / Descripción
              </ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="ej: Vista frontal del Palacio de Gobierno del estado de Hidalgo"
                placeholderTextColor="#9CA3AF"
                value={caption}
                onChangeText={setCaption}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Author/Attribution */}
            <View style={styles.section}>
              <AuthorInput value={authorData} onChange={setAuthorData} />
            </View>

            {/* Upload Button */}
            <View style={styles.section}>
              {isUploading ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="large" color="#f1ef47" />
                  <ThemedText variant="body-medium" style={styles.uploadingText}>
                    Subiendo imágenes... {uploadProgress}%
                  </ThemedText>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                    />
                  </View>
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.uploadButton,
                    pressed && styles.uploadButtonPressed,
                  ]}
                  onPress={handleUpload}
                >
                  <Upload size={20} color="#000000" />
                  <ThemedText variant="body-medium" style={styles.uploadButtonText}>
                    Subir {selectedImages.length} imagen(es)
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontWeight: '900',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#111827',
    fontWeight: '700',
  },
  pickerButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    gap: 12,
  },
  pickerText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  pickerSubtext: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  imagesPreview: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
  },
  addMoreText: {
    color: '#000000',
    fontWeight: '600',
  },
  label: {
    color: '#111827',
    fontWeight: '700',
  },
  input: {
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlignVertical: 'top',
  },
  textArea: {
    minHeight: 100,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f1ef47',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 16,
    padding: 16,
  },
  uploadButtonPressed: {
    backgroundColor: '#e5e33d',
  },
  uploadButtonText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 16,
  },
  uploadingContainer: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  uploadingText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f1ef47',
  },
})
