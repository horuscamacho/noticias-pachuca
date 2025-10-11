/**
 * GeneratedImagePreview Component
 * Preview y acciones para imagen AI generada
 */

import React from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Save, RefreshCw, X, AlertCircle } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GeneratedImagePreviewProps {
  imageUrl: string;
  generation: App.ImageGeneration;
  onStore: () => void;
  onRegenerate: () => void;
  onClose: () => void;
}

const BRAND_YELLOW = '#f1ef47';
const SCREEN_WIDTH = Dimensions.get('window').width;

export function GeneratedImagePreview({
  imageUrl,
  generation,
  onStore,
  onRegenerate,
  onClose,
}: GeneratedImagePreviewProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getQualityLabel = (quality: App.ImageQuality): string => {
    const labels: Record<App.ImageQuality, string> = {
      low: 'Baja (512x512)',
      medium: 'Media (1024x1024)',
      high: 'Alta (1792x1024)',
    };
    return labels[quality];
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-4">
        {/* AI-Generated Badge */}
        <View className="flex-row justify-between items-center">
          <Badge variant="destructive" className="flex-row gap-1 items-center px-3 py-1.5">
            <AlertCircle size={14} color="#fff" />
            <Text className="text-white font-bold text-xs">
              AI-GENERATED
            </Text>
          </Badge>
          <Text className="text-xs text-muted-foreground">
            {formatDate(generation.createdAt)}
          </Text>
        </View>

        {/* Image Preview */}
        <Card>
          <CardContent className="p-0">
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: SCREEN_WIDTH - 48, // 24px padding on each side
                aspectRatio: generation.aspectRatio || 1,
                borderRadius: 12,
              }}
              contentFit="contain"
              transition={300}
              placeholder={generation.blurhash}
            />
            {generation.includesWatermark && (
              <View className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded">
                <Text className="text-white text-[10px] font-bold">
                  Coyote Noticias
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Metadata Card */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles de generación</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            {/* Prompt */}
            <View className="gap-1">
              <Text className="text-xs text-muted-foreground font-semibold">
                Prompt:
              </Text>
              <Text className="text-sm">
                {generation.prompt}
              </Text>
            </View>

            {/* Quality & Cost */}
            <View className="flex-row gap-4">
              <View className="flex-1 gap-1">
                <Text className="text-xs text-muted-foreground font-semibold">
                  Calidad:
                </Text>
                <Text className="text-sm font-medium">
                  {getQualityLabel(generation.quality)}
                </Text>
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-xs text-muted-foreground font-semibold">
                  Costo:
                </Text>
                <Text className="text-sm font-bold" style={{ color: BRAND_YELLOW }}>
                  ${generation.cost.toFixed(2)} USD
                </Text>
              </View>
            </View>

            {/* Generation Time */}
            {generation.generationTimeMs && (
              <View className="gap-1">
                <Text className="text-xs text-muted-foreground font-semibold">
                  Tiempo de generación:
                </Text>
                <Text className="text-sm font-medium">
                  {formatDuration(generation.generationTimeMs)}
                </Text>
              </View>
            )}

            {/* Keywords */}
            {generation.keywords && generation.keywords.length > 0 && (
              <View className="gap-2">
                <Text className="text-xs text-muted-foreground font-semibold">
                  Keywords:
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {generation.keywords.map((keyword) => (
                    <View
                      key={keyword}
                      className="px-2 py-1 rounded-full bg-[#f1ef47]/20 border border-[#f1ef47]"
                    >
                      <Text className="text-xs font-medium">
                        {keyword}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Branding Info */}
            <View className="flex-row items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <View
                className={cn(
                  'w-2 h-2 rounded-full',
                  generation.includesWatermark ? 'bg-green-500' : 'bg-gray-400'
                )}
              />
              <Text className="text-xs text-muted-foreground flex-1">
                {generation.includesWatermark
                  ? 'Incluye watermark y decoraciones de marca'
                  : 'Sin elementos de marca'}
              </Text>
            </View>

            {/* Status */}
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-muted-foreground font-semibold">
                Estado:
              </Text>
              <Badge
                variant={generation.status === 'completed' ? 'default' : 'outline'}
                className="px-2 py-0.5"
              >
                <Text className="text-xs">
                  {generation.status === 'completed' ? 'Completada' : generation.status}
                </Text>
              </Badge>
            </View>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <View className="gap-3 pb-8">
          <Button
            onPress={onStore}
            style={{ backgroundColor: BRAND_YELLOW }}
            className="flex-row gap-2"
          >
            <Save size={18} color="#000" />
            <Text className="font-bold text-base" style={{ color: '#000' }}>
              Almacenar en Banco de Imágenes
            </Text>
          </Button>

          <Button
            variant="outline"
            onPress={onRegenerate}
            className="flex-row gap-2"
          >
            <RefreshCw size={18} color="#000" />
            <Text className="font-medium">
              Regenerar con mismo prompt
            </Text>
          </Button>

          <Button
            variant="ghost"
            onPress={onClose}
            className="flex-row gap-2"
          >
            <X size={18} color="#000" />
            <Text>
              Cerrar
            </Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
