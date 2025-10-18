import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { Button } from '@/components/ui/button';
import { useEligibleContent, useRecyclingStats, useScheduleRecycled } from '@/src/hooks';
import { useResponsive } from '@/src/features/responsive';
import type { Platform, EligibleContent, RecycleType } from '@/src/types/community-manager.types';

/**
 * ♻️ FASE 7: Pantalla de Reciclaje de Contenido
 * Lista de contenido elegible para reciclaje con botón para programar
 */

const PLATFORMS: Platform[] = ['facebook', 'twitter'];

const RECYCLE_TYPE_LABELS: Record<RecycleType, string> = {
  pure_evergreen: '🌲 Evergreen Puro',
  seasonal_evergreen: '🍂 Evergreen Estacional',
  durable: '⏳ Durable',
  not_recyclable: '❌ No Reciclable',
};

const RECYCLE_TYPE_COLORS: Record<RecycleType, string> = {
  pure_evergreen: '#10B981',
  seasonal_evergreen: '#F59E0B',
  durable: '#3B82F6',
  not_recyclable: '#6B7280',
};

export default function RecyclingScreen() {
  const { isTablet } = useResponsive();
  const [limit] = useState(20);

  const {
    data: eligibleContent,
    isLoading: isLoadingContent,
    error: contentError,
    refetch: refetchContent,
    isRefetching: isRefetchingContent,
  } = useEligibleContent(limit);

  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useRecyclingStats();

  const scheduleRecycled = useScheduleRecycled();

  const handleScheduleRecycle = async (noticiaId: string, platforms: Platform[]) => {
    try {
      await scheduleRecycled.mutateAsync({
        noticiaId,
        platforms,
      });
      // Refetch both eligible content and stats after scheduling
      refetchContent();
      refetchStats();
    } catch (error) {
      console.error('Error scheduling recycled content:', error);
    }
  };

  const renderStats = () => {
    if (isLoadingStats || !stats) {
      return null;
    }

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <ThemedText variant="title-large" style={styles.statsNumber}>
            {stats.totalEligible}
          </ThemedText>
          <ThemedText variant="body-small" color="secondary">
            Contenido Elegible
          </ThemedText>
        </View>
        <View style={styles.statsCard}>
          <ThemedText variant="title-large" style={styles.statsNumber}>
            {stats.totalRecycled}
          </ThemedText>
          <ThemedText variant="body-small" color="secondary">
            Total Reciclado
          </ThemedText>
        </View>
        <View style={styles.statsCard}>
          <ThemedText variant="title-large" style={styles.statsNumber}>
            {stats.averagePerformanceVsOriginal.toFixed(1)}%
          </ThemedText>
          <ThemedText variant="body-small" color="secondary">
            Performance Promedio
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderEligibleItem = (item: EligibleContent) => {
    const recycleTypeColor = RECYCLE_TYPE_COLORS[item.recycleType];
    const publishedDate = new Date(item.publishedAt);

    return (
      <View key={item.noticiaId} style={styles.contentCard}>
        {/* Header */}
        <View style={styles.contentHeader}>
          <View style={{ flex: 1 }}>
            <ThemedText variant="label-large" numberOfLines={2}>
              {item.noticiaTitle}
            </ThemedText>
            <ThemedText variant="body-small" color="secondary" style={{ marginTop: 4 }}>
              {item.noticiaSlug}
            </ThemedText>
          </View>
          <View style={[styles.recycleTypeBadge, { backgroundColor: recycleTypeColor }]}>
            <ThemedText variant="label-small" style={styles.recycleTypeText}>
              {RECYCLE_TYPE_LABELS[item.recycleType]}
            </ThemedText>
          </View>
        </View>

        {/* Metadata */}
        <View style={styles.contentMetadata}>
          <View style={styles.metadataRow}>
            <ThemedText variant="body-small" color="secondary">
              📊 Performance: {item.performanceScore.toFixed(1)}
            </ThemedText>
            <ThemedText variant="body-small" color="secondary">
              📅 {item.ageMonths} {item.ageMonths === 1 ? 'mes' : 'meses'}
            </ThemedText>
          </View>
          <ThemedText variant="body-small" color="secondary" style={{ marginTop: 4 }}>
            Publicado: {publishedDate.toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </ThemedText>
        </View>

        {/* Eligibility Reasons */}
        {item.eligibilityReasons.length > 0 && (
          <View style={styles.reasonsContainer}>
            <ThemedText variant="label-small" style={{ marginBottom: 4 }}>
              Razones de Elegibilidad:
            </ThemedText>
            {item.eligibilityReasons.map((reason, index) => (
              <ThemedText
                key={index}
                variant="body-small"
                color="secondary"
                style={{ marginLeft: 8, marginTop: 2 }}
              >
                • {reason}
              </ThemedText>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            variant="default"
            onPress={() => handleScheduleRecycle(item.noticiaId, ['facebook', 'twitter'])}
            style={styles.scheduleButton}
            disabled={scheduleRecycled.isPending}
          >
            <ThemedText variant="label-small" style={{ color: '#FFFFFF' }}>
              ♻️ Programar en Todas
            </ThemedText>
          </Button>
          <Button
            variant="outline"
            onPress={() => handleScheduleRecycle(item.noticiaId, ['facebook'])}
            style={styles.platformButton}
            disabled={scheduleRecycled.isPending}
          >
            <ThemedText variant="label-small">📘 Facebook</ThemedText>
          </Button>
          <Button
            variant="outline"
            onPress={() => handleScheduleRecycle(item.noticiaId, ['twitter'])}
            style={styles.platformButton}
            disabled={scheduleRecycled.isPending}
          >
            <ThemedText variant="label-small">🐦 Twitter</ThemedText>
          </Button>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Reciclaje de Contenido',
          headerBackTitle: 'Atrás',
        }}
      />

      <ScrollView
        style={[styles.content, isTablet && styles.contentTablet]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetchingContent}
            onRefresh={() => {
              refetchContent();
              refetchStats();
            }}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="title-large" style={styles.title}>
            ♻️ Contenido Elegible para Reciclaje
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary">
            {eligibleContent?.length || 0} artículos disponibles
          </ThemedText>
        </View>

        {/* Stats */}
        {renderStats()}

        {/* Loading State */}
        {isLoadingContent && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <ThemedText variant="body-medium" color="secondary" style={{ marginTop: 12 }}>
              Cargando contenido elegible...
            </ThemedText>
          </View>
        )}

        {/* Error State */}
        {contentError && (
          <View style={styles.errorContainer}>
            <ThemedText variant="body-medium" style={{ color: '#EF4444' }}>
              ❌ Error al cargar contenido elegible
            </ThemedText>
            <Button onPress={() => refetchContent()} style={{ marginTop: 12 }}>
              <ThemedText>Reintentar</ThemedText>
            </Button>
          </View>
        )}

        {/* Eligible Content List */}
        {!isLoadingContent && !contentError && (
          <View style={styles.contentContainer}>
            {eligibleContent && eligibleContent.length > 0 ? (
              eligibleContent.map(renderEligibleItem)
            ) : (
              <View style={styles.emptyContainer}>
                <ThemedText variant="title-medium">🎉</ThemedText>
                <ThemedText variant="body-medium" color="secondary" style={{ marginTop: 8 }}>
                  No hay contenido elegible para reciclaje en este momento
                </ThemedText>
                <ThemedText
                  variant="body-small"
                  color="secondary"
                  style={{ marginTop: 4, textAlign: 'center' }}
                >
                  El contenido evergreen aparecerá aquí cuando cumpla los criterios
                </ThemedText>
              </View>
            )}
          </View>
        )}
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
    flex: 1,
  },
  contentTablet: {
    paddingHorizontal: 80,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    color: '#111827',
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsNumber: {
    color: '#3B82F6',
    marginBottom: 4,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 8,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  recycleTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  recycleTypeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 10,
  },
  contentMetadata: {
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reasonsContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  scheduleButton: {
    flex: 1,
  },
  platformButton: {
    minWidth: 90,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
});
