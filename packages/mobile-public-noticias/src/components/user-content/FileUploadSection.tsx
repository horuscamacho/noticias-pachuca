/**
 * 📤 FileUploadSection Component
 *
 * Sección para subir imágenes y videos
 * - Máximo 10 imágenes
 * - Máximo 5 videos
 * - Muestra preview de archivos subidos
 * - Permite eliminar archivos
 */

import React, { useState } from 'react';
import { View, Pressable, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useFileUpload } from '@/src/hooks/useUserContent';
import { ImagePlus, Video, X, Loader2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { cn } from '@/lib/utils';

interface FileUploadSectionProps {
  imageUrls: string[];
  videoUrls: string[];
  onImageUrlsChange: (urls: string[]) => void;
  onVideoUrlsChange: (urls: string[]) => void;
  disabled?: boolean;
  maxImages?: number;
  maxVideos?: number;
  outlet: string; // Required: domain of the site where content will be published
}

export function FileUploadSection({
  imageUrls,
  videoUrls,
  onImageUrlsChange,
  onVideoUrlsChange,
  disabled = false,
  maxImages = 10,
  maxVideos = 5,
  outlet,
}: FileUploadSectionProps) {
  const uploadFiles = useFileUpload();
  const [uploadingType, setUploadingType] = useState<'images' | 'videos' | null>(null);

  // Request permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos Requeridos',
        'Se necesitan permisos para acceder a la galería.'
      );
      return false;
    }
    return true;
  };

  // Pick images
  const handlePickImages = async () => {
    if (disabled || imageUrls.length >= maxImages) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const remaining = maxImages - imageUrls.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: remaining,
      });

      if (!result.canceled && result.assets.length > 0) {
        setUploadingType('images');

        // Create FormData
        const formData = new FormData();
        formData.append('outlet', outlet); // Required field for image bank
        result.assets.forEach((asset, index) => {
          formData.append('files', {
            uri: asset.uri,
            type: 'image/jpeg',
            name: `image_${Date.now()}_${index}.jpg`,
          } as any);
        });

        // Upload
        const response = await uploadFiles.mutateAsync(formData);

        // Add URLs
        onImageUrlsChange([...imageUrls, ...response.urls]);

        Alert.alert('✅ Éxito', `${response.urls.length} imagen(es) subida(s)`);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Error al subir imágenes'
      );
    } finally {
      setUploadingType(null);
    }
  };

  // Pick videos
  const handlePickVideos = async () => {
    if (disabled || videoUrls.length >= maxVideos) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const remaining = maxVideos - videoUrls.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: remaining,
      });

      if (!result.canceled && result.assets.length > 0) {
        setUploadingType('videos');

        // Create FormData
        const formData = new FormData();
        formData.append('outlet', outlet); // Required field for image bank
        result.assets.forEach((asset, index) => {
          formData.append('files', {
            uri: asset.uri,
            type: 'video/mp4',
            name: `video_${Date.now()}_${index}.mp4`,
          } as any);
        });

        // Upload
        const response = await uploadFiles.mutateAsync(formData);

        // Add URLs
        onVideoUrlsChange([...videoUrls, ...response.urls]);

        Alert.alert('✅ Éxito', `${response.urls.length} video(s) subido(s)`);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Error al subir videos'
      );
    } finally {
      setUploadingType(null);
    }
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    Alert.alert('Eliminar imagen', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          const newUrls = imageUrls.filter((_, i) => i !== index);
          onImageUrlsChange(newUrls);
        },
      },
    ]);
  };

  // Remove video
  const handleRemoveVideo = (index: number) => {
    Alert.alert('Eliminar video', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          const newUrls = videoUrls.filter((_, i) => i !== index);
          onVideoUrlsChange(newUrls);
        },
      },
    ]);
  };

  const isUploading = uploadingType !== null;

  return (
    <View className="gap-4">
      {/* Images Section */}
      <View className="gap-2">
        <Label>
          Imágenes (opcional)
          <Text className="text-muted-foreground text-xs">
            {' '}
            - {imageUrls.length} / {maxImages}
          </Text>
        </Label>

        {imageUrls.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="gap-2"
          >
            <View className="flex-row gap-2 pb-2">
              {imageUrls.map((url, index) => (
                <View key={index} className="relative">
                  <Image
                    source={{ uri: url }}
                    className="w-24 h-24 rounded-lg"
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => handleRemoveImage(index)}
                    disabled={disabled}
                    className="absolute -top-2 -right-2 bg-destructive rounded-full p-1"
                  >
                    <X size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        <Button
          variant="outline"
          onPress={handlePickImages}
          disabled={disabled || imageUrls.length >= maxImages || isUploading}
          className="flex-row gap-2"
        >
          {uploadingType === 'images' ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <Text>Subiendo...</Text>
            </>
          ) : (
            <>
              <ImagePlus size={18} />
              <Text>
                {imageUrls.length >= maxImages
                  ? 'Máximo alcanzado'
                  : 'Agregar Imágenes'}
              </Text>
            </>
          )}
        </Button>
      </View>

      {/* Videos Section */}
      <View className="gap-2">
        <Label>
          Videos (opcional)
          <Text className="text-muted-foreground text-xs">
            {' '}
            - {videoUrls.length} / {maxVideos}
          </Text>
        </Label>

        {videoUrls.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="gap-2"
          >
            <View className="flex-row gap-2 pb-2">
              {videoUrls.map((url, index) => (
                <View key={index} className="relative">
                  <View className="w-24 h-24 rounded-lg bg-muted items-center justify-center">
                    <Video size={32} color="#888" />
                  </View>
                  <Pressable
                    onPress={() => handleRemoveVideo(index)}
                    disabled={disabled}
                    className="absolute -top-2 -right-2 bg-destructive rounded-full p-1"
                  >
                    <X size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        <Button
          variant="outline"
          onPress={handlePickVideos}
          disabled={disabled || videoUrls.length >= maxVideos || isUploading}
          className="flex-row gap-2"
        >
          {uploadingType === 'videos' ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <Text>Subiendo...</Text>
            </>
          ) : (
            <>
              <Video size={18} />
              <Text>
                {videoUrls.length >= maxVideos
                  ? 'Máximo alcanzado'
                  : 'Agregar Videos'}
              </Text>
            </>
          )}
        </Button>
      </View>
    </View>
  );
}
