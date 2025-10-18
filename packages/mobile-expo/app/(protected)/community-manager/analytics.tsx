import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { Button } from '@/components/ui/button';
import { useCommunityManagerStats, useRecyclingStats } from '@/src/hooks';
import { useResponsive } from '@/src/features/responsive';
import type { Platform, RecycleType } from '@/src/types/community-manager.types';

/**
 * 📊 FASE 7: Pantalla de Analytics del Community Manager
 * Estadísticas generales, por plataforma, tipo de contenido y reciclaje
 */

const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: '📘 Facebook',
  twitter: '🐦 Twitter',
  instagram: '📷 Instagram',
};

const RECYCLE_TYPE_LABELS: Record<RecycleType, string> = {
  pure_evergreen: '🌲 Evergreen Puro',
  seasonal_evergreen: '🍂 Evergreen Estacional',
  durable: '⏳ Durable',
  not_recyclable: '❌ No Reciclable',
};

export default function AnalyticsScreen() {
  const { isTablet } = useResponsive();

  const {
    data: cmStats,
    isLoading: isLoadingCM,
    error: cmError,
    refetch: refetchCM,
    isRefetching: isRefetchingCM,
  } = useCommunityManagerStats();

  const {
    data: recyclingStats,
    isLoading: isLoadingRecycling,
    error: recyclingError,
    refetch: refetchRecycling,
    isRefetching: isRefetchingRecycling,
  } = useRecyclingStats();

  const isLoading = isLoadingCM || isLoadingRecycling;
  const isRefetching = isRefetchingCM || isRefetchingRecycling;
  const error = cmError || recyclingError;

  const handleRefresh = () => {
    refetchCM();
    refetchRecycling();
  };

  const renderOverallStats = () => {
    if (!cmStats) return null;

    return (
      <View style={styles.section}>
        <ThemedText variant="label-large" style={styles.sectionTitle}>
          📊 Estadísticas Generales
        </ThemedText>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <ThemedText variant="title-large" style={[styles.statNumber, { color: '#3B82F6' }]}>
              {cmStats.scheduledPosts.total}
            </ThemedText>
            <ThemedText variant="body-small" color="secondary">
              Posts Programados
            </ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText variant="title-large" style={[styles.statNumber, { color: '#10B981' }]}>
              {cmStats.recycling.totalRecycled}
            </ThemedText>
            <ThemedText variant="body-small" color="secondary">
              Contenido Reciclado
            </ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText variant="title-large" style={[styles.statNumber, { color: '#F59E0B' }]}>
              {cmStats.recycling.totalEligible}
            </ThemedText>
            <ThemedText variant="body-small" color="secondary">
              Elegible para Reciclar
            </ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText variant="title-large" style={[styles.statNumber, { color: '#8B5CF6' }]}>
              {cmStats.recycling.averagePerformance.toFixed(1)}%
            </ThemedText>
            <ThemedText variant="body-small" color="secondary">
              Performance Promedio
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  const renderPlatformStats = () => {
    if (!cmStats) return null;

    const platforms = Object.entries(cmStats.scheduledPosts.byPlatform) as [Platform, number][];

    return (
      <View style={styles.section}>
        <ThemedText variant="label-large" style={styles.sectionTitle}>
          🌐 Posts por Plataforma
        </ThemedText>
        <View style={styles.listContainer}>
          {platforms.map(([platform, count]) => (
            <View key={platform} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <ThemedText variant="body-medium">
                  {PLATFORM_LABELS[platform]}
                </ThemedText>
              </View>
              <View style={styles.listItemRight}>
                <ThemedText variant="label-large" style={{ color: '#3B82F6' }}>
                  {count}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderContentTypeStats = () => {
    if (!cmStats) return null;

    const contentTypes = Object.entries(cmStats.scheduledPosts.byContentType);

    const contentTypeLabels: Record<string, string> = {
      breaking_news: '🚨 Breaking News',
      normal_news: '📰 Noticia Normal',
      blog: '✍️ Blog',
      evergreen: '🌲 Evergreen',
      recycled: '♻️ Reciclado',
    };

    return (
      <View style={styles.section}>
        <ThemedText variant="label-large" style={styles.sectionTitle}>
          📝 Posts por Tipo de Contenido
        </ThemedText>
        <View style={styles.listContainer}>
          {contentTypes.map(([contentType, count]) => (
            <View key={contentType} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <ThemedText variant="body-medium">
                  {contentTypeLabels[contentType] || contentType}
                </ThemedText>
              </View>
              <View style={styles.listItemRight}>
                <ThemedText variant="label-large" style={{ color: '#10B981' }}>
                  {count}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderStatusStats = () => {
    if (!cmStats) return null;

    const statuses = Object.entries(cmStats.scheduledPosts.byStatus);

    const statusLabels: Record<string, string> = {
      scheduled: '⏰ Programado',
      processing: '⚙️ Procesando',
      published: '✅ Publicado',
      failed: '❌ Fallido',
      cancelled: '🚫 Cancelado',
    };

    const statusColors: Record<string, string> = {
      scheduled: '#3B82F6',
      processing: '#F59E0B',
      published: '#10B981',
      failed: '#EF4444',
      cancelled: '#6B7280',
    };

    return (
      <View style={styles.section}>
        <ThemedText variant="label-large" style={styles.sectionTitle}>
          📋 Posts por Estado
        </ThemedText>
        <View style={styles.listContainer}>
          {statuses.map(([status, count]) => (
            <View key={status} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <ThemedText variant="body-medium">
                  {statusLabels[status] || status}
                </ThemedText>
              </View>
              <View style={styles.listItemRight}>
                <ThemedText variant="label-large" style={{ color: statusColors[status] || '#6B7280' }}>
                  {count}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRecyclingStats = () => {
    if (!recyclingStats) return null;

    const recycleTypes = Object.entries(recyclingStats.byRecycleType) as [RecycleType, number][];

    return (
      <View style={styles.section}>
        <ThemedText variant="label-large" style={styles.sectionTitle}>
          ♻️ Reciclaje por Tipo
        </ThemedText>
        <View style={styles.listContainer}>
          {recycleTypes.map(([recycleType, count]) => (
            <View key={recycleType} style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <ThemedText variant="body-medium">
                  {RECYCLE_TYPE_LABELS[recycleType]}
                </ThemedText>
              </View>
              <View style={styles.listItemRight}>
                <ThemedText variant="label-large" style={{ color: '#8B5CF6' }}>
                  {count}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* Top Performing Recycles */}
        {recyclingStats.topPerformingRecycles.length > 0 && (
          <View style={styles.topPerformingContainer}>
            <ThemedText variant="label-medium" style={{ marginBottom: 8 }}>
              🏆 Top Reciclajes con Mejor Performance
            </ThemedText>
            {recyclingStats.topPerformingRecycles.slice(0, 5).map((item, index) => (
              <View key={item.noticiaId} style={styles.topPerformingItem}>
                <View style={styles.topPerformingRank}>
                  <ThemedText variant="label-small" style={{ color: '#3B82F6' }}>
                    #{index + 1}
                  </ThemedText>
                </View>
                <View style={styles.topPerformingContent}>
                  <ThemedText variant="body-small" numberOfLines={1}>
                    {item.title}
                  </ThemedText>
                  <ThemedText variant="body-small" color="secondary" style={{ marginTop: 2 }}>
                    Reciclaje #{item.recycleNumber} • {item.performanceVsOriginal.toFixed(1)}% vs original
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Analytics',
          headerBackTitle: 'Atrás',
        }}
      />

      <ScrollView
        style={[styles.content, isTablet && styles.contentTablet]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="title-large" style={styles.title}>
            📊 Analytics del Community Manager
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary">
            Métricas y estadísticas de publicaciones
          </ThemedText>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <ThemedText variant="body-medium" color="secondary" style={{ marginTop: 12 }}>
              Cargando estadísticas...
            </ThemedText>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <ThemedText variant="body-medium" style={{ color: '#EF4444' }}>
              ❌ Error al cargar estadísticas
            </ThemedText>
            <Button onPress={handleRefresh} style={{ marginTop: 12 }}>
              <ThemedText>Reintentar</ThemedText>
            </Button>
          </View>
        )}

        {/* Stats Sections */}
        {!isLoading && !error && (
          <View style={styles.sectionsContainer}>
            {renderOverallStats()}
            {renderPlatformStats()}
            {renderContentTypeStats()}
            {renderStatusStats()}
            {renderRecyclingStats()}
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
  sectionsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#111827',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
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
  statNumber: {
    marginBottom: 4,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemLeft: {
    flex: 1,
  },
  listItemRight: {
    marginLeft: 16,
  },
  topPerformingContainer: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  topPerformingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  topPerformingRank: {
    width: 32,
    alignItems: 'center',
    marginTop: 2,
  },
  topPerformingContent: {
    flex: 1,
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
});
