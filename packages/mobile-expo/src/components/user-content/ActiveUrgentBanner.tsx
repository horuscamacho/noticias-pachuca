/**
 * 🚨 ActiveUrgentBanner Component
 *
 * Banner horizontal para mostrar contenido URGENT activo
 * - ScrollView horizontal de cards compactos
 * - Muestra todos los contenidos URGENT activos
 * - Polling automático cada 30 segundos
 * - Countdown timer para cada contenido
 */

import React from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { useActiveUrgentList } from '@/src/hooks/useUserContent';
import { UrgentTimer } from './UrgentTimer';
import { AlertCircle, ChevronRight } from 'lucide-react-native';

interface ActiveUrgentBannerProps {
  onPressItem?: (contentId: string) => void;
  onPressViewAll?: () => void;
}

export function ActiveUrgentBanner({
  onPressItem,
  onPressViewAll,
}: ActiveUrgentBannerProps) {
  const { data, isLoading, isError } = useActiveUrgentList({
    enabled: true,
    refetchInterval: 30000, // Polling cada 30 segundos
  });

  // No mostrar banner si no hay contenido activo
  if (!isLoading && (!data || data.total === 0)) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <View className="bg-red-50 border-t-2 border-b-2 border-red-500 py-4 px-4">
        <View className="flex-row items-center justify-center gap-2">
          <ActivityIndicator size="small" color="#ef4444" />
          <Text className="text-sm text-red-600">
            Cargando contenido URGENT...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View className="bg-red-50 border-t-2 border-b-2 border-red-500 py-4 px-4">
        <Text className="text-sm text-red-600 text-center">
          ⚠️ Error al cargar contenido URGENT
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-red-50 border-t-2 border-b-2 border-red-500 py-3">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 mb-2">
        <View className="flex-row items-center gap-2">
          <AlertCircle size={20} color="#ef4444" strokeWidth={2.5} />
          <Text className="text-sm font-bold text-red-600">
            🚨 ÚLTIMO MOMENTO
          </Text>
          <View className="bg-red-600 px-2 py-0.5 rounded-full">
            <Text className="text-xs font-bold text-white">{data?.total || 0}</Text>
          </View>
        </View>

        {onPressViewAll && (
          <Pressable
            onPress={onPressViewAll}
            className="flex-row items-center gap-1"
          >
            <Text className="text-xs font-medium text-red-600">Ver todos</Text>
            <ChevronRight size={14} color="#ef4444" />
          </Pressable>
        )}
      </View>

      {/* Horizontal ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 gap-3"
      >
        {data?.content.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onPressItem?.(item.id)}
            className="w-64"
          >
            <Card className="bg-white">
              <View className="p-3 gap-2">
                {/* Title */}
                <Text className="text-sm font-bold text-foreground" numberOfLines={2}>
                  {item.originalTitle}
                </Text>

                {/* Timer */}
                {item.urgentAutoCloseAt && (
                  <UrgentTimer
                    urgentAutoCloseAt={item.urgentAutoCloseAt}
                    compact={true}
                    showProgressBar={true}
                  />
                )}

                {/* Tap to view */}
                <Text className="text-xs text-muted-foreground">
                  Toca para ver detalles →
                </Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
