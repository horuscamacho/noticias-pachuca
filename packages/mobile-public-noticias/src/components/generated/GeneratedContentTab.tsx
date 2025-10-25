import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GeneratedContentCard } from '@/src/components/content/GeneratedContentCard';
import { GeneratedContentFilters } from '@/src/components/generated/GeneratedContentFilters';
import {
  useGeneratedContent,
  getAllGeneratedContent,
  getTotalItems,
} from '@/src/hooks/useGeneratedContentFilters';
import type { App as FilterApp } from '@/src/types/generated-content-filters.types';
import { AlertCircle, FileX, Filter, X, Sparkles, Plus } from 'lucide-react-native';

/**
 * 📝 Tab de Contenidos Generados
 * Muestra listado de todos los contenidos generados por agentes editoriales
 * con infinite scroll y filtros
 */
export function GeneratedContentTab() {
  const router = useRouter();

  // Estado de filtros
  const [showFilters, setShowFilters] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<FilterApp.GeneratedContentFilters>({
    limit: 20,
    sortBy: 'generatedAt',
    sortOrder: 'desc',
  });

  // Filtros activos aplicados
  const [activeFilters, setActiveFilters] = useState<FilterApp.GeneratedContentFilters>({
    limit: 20,
    sortBy: 'generatedAt',
    sortOrder: 'desc',
  });

  // Hook principal con infinite query usando filtros activos
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useGeneratedContent(activeFilters);

  // Extraer items y total
  const items = getAllGeneratedContent(data);
  const total = getTotalItems(data);

  // Handlers de navegación
  const handleCardPress = (id: string) => {
    router.push(`/generated/${id}`);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Handlers de filtros
  const handleApplyFilters = () => {
    setActiveFilters(pendingFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const defaultFilters: FilterApp.GeneratedContentFilters = {
      limit: 20,
      sortBy: 'generatedAt',
      sortOrder: 'desc',
    };
    setPendingFilters(defaultFilters);
    setActiveFilters(defaultFilters);
    setShowFilters(false);
  };

  // Loading inicial
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f1ef47" />
        <ThemedText variant="body-medium" color="secondary" style={styles.loadingText}>
          Cargando contenidos generados...
        </ThemedText>
      </View>
    );
  }

  // Estado de error
  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={64} color="#EF4444" />
        <ThemedText variant="title-medium" style={styles.errorTitle}>
          Error al cargar contenidos
        </ThemedText>
        <ThemedText variant="body-medium" color="secondary" style={styles.errorMessage}>
          {error instanceof Error ? error.message : 'Ocurrió un error inesperado'}
        </ThemedText>
        <Button onPress={() => refetch()} style={styles.retryButton}>
          <ThemedText style={styles.retryButtonText}>Reintentar</ThemedText>
        </Button>
      </View>
    );
  }

  // Lista vacía
  if (items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <FileX size={64} color="#9CA3AF" />
        <ThemedText variant="title-medium" style={styles.emptyTitle}>
          No hay contenidos generados
        </ThemedText>
        <ThemedText variant="body-medium" color="secondary" style={styles.emptyMessage}>
          Los contenidos generados por tus agentes aparecerán aquí
        </ThemedText>
        <Button
          onPress={() => router.push('/user-content/create')}
          style={styles.emptyButton}
        >
          <ThemedText style={styles.emptyButtonText}>
            Crear Contenido Manual
          </ThemedText>
        </Button>
      </View>
    );
  }

  // Render del footer (loading más items)
  const renderFooter = () => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#f1ef47" />
        <ThemedText variant="body-small" color="secondary" style={styles.footerText}>
          Cargando más contenidos...
        </ThemedText>
      </View>
    );
  };

  // Render del header mejorado
  const renderHeader = () => (
    <>
      {/* Header mejorado */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <ThemedText variant="headline-medium" style={styles.title}>
              Contenidos Generados
            </ThemedText>
            <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
              {total} contenido{total !== 1 ? 's' : ''} generado{total !== 1 ? 's' : ''} por tus agentes
            </ThemedText>
          </View>

          <View style={styles.headerActions}>
            {/* Botón de filtros */}
            <Pressable
              onPress={() => setShowFilters(!showFilters)}
              style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            >
              {showFilters ? (
                <X size={20} color="#000" />
              ) : (
                <Filter size={20} color={showFilters ? '#000' : '#6B7280'} />
              )}
            </Pressable>

            {/* Botón crear contenido manual */}
            <Pressable
              onPress={() => router.push('/user-content/create')}
              style={styles.createButton}
            >
              <Plus size={20} color="#000" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>

        {/* Badge de filtros activos */}
        {!showFilters && (activeFilters.agentType || activeFilters.editorialLean || activeFilters.keywords?.length) && (
          <View style={styles.activeFiltlersBadge}>
            <Badge variant="default" style={styles.filtersBadge}>
              <Filter size={12} color="#000" />
              <ThemedText variant="label-small" style={styles.filtersBadgeText}>
                Filtros activos
              </ThemedText>
            </Badge>
          </View>
        )}
      </View>

      {/* Componente de filtros (condicional) */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <GeneratedContentFilters
            filters={pendingFilters}
            onFiltersChange={setPendingFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <GeneratedContentCard
            content={item}
            onPress={() => handleCardPress(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#f1ef47"
            colors={['#f1ef47']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
  },
  errorTitle: {
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#f1ef47',
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  emptyTitle: {
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#f1ef47',
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#f1ef47',
    borderColor: '#f1ef47',
  },
  createButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f1ef47',
    borderWidth: 2,
    borderColor: '#000000',
  },
  activeFiltlersBadge: {
    marginTop: 8,
  },
  filtersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderColor: '#f1ef47',
  },
  filtersBadgeText: {
    color: '#000',
    fontWeight: '600',
  },
  filtersContainer: {
    marginTop: 8,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    marginTop: 8,
  },
});
