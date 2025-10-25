/**
 * 📋 UserContentList Component
 *
 * Lista de contenidos manuales creados
 * - Muestra todos los contenidos (URGENT y NORMAL)
 * - Filtros por modo y estado
 * - Pull to refresh
 * - Acciones: Ver, Actualizar, Cerrar
 */

import React, { useState } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { UserContentCard } from './UserContentCard';
import {
  UserGeneratedContent,
  UserContentMode,
  UserContentStatus,
} from '@/src/types/user-generated-content.types';
import { Filter, X } from 'lucide-react-native';

interface UserContentListProps {
  contents: UserGeneratedContent[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onPressItem?: (contentId: string) => void;
  onPressUpdate?: (contentId: string) => void;
  onPressClose?: (contentId: string) => void;
  ListHeaderComponent?: React.ReactElement;
  ListEmptyComponent?: React.ReactElement;
}

export function UserContentList({
  contents,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onPressItem,
  onPressUpdate,
  onPressClose,
  ListHeaderComponent,
  ListEmptyComponent,
}: UserContentListProps) {
  const [filterMode, setFilterMode] = useState<UserContentMode | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<UserContentStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters
  const filteredContents = contents.filter((content) => {
    if (filterMode !== 'all' && content.mode !== filterMode) return false;
    if (filterStatus !== 'all' && content.status !== filterStatus) return false;
    return true;
  });

  // Loading state
  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-sm text-muted-foreground mt-2">
          Cargando contenidos...
        </Text>
      </View>
    );
  }

  // Empty state
  const renderEmpty = () => {
    if (ListEmptyComponent) {
      return ListEmptyComponent;
    }

    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-6xl mb-4">📝</Text>
        <Text className="text-lg font-bold text-center mb-2">
          No hay contenidos
        </Text>
        <Text className="text-sm text-muted-foreground text-center">
          {filterMode !== 'all' || filterStatus !== 'all'
            ? 'Intenta cambiar los filtros'
            : 'Crea tu primer contenido manual'}
        </Text>
        {(filterMode !== 'all' || filterStatus !== 'all') && (
          <Button
            variant="outline"
            onPress={() => {
              setFilterMode('all');
              setFilterStatus('all');
            }}
            className="mt-4"
          >
            Limpiar filtros
          </Button>
        )}
      </View>
    );
  };

  // Render item
  const renderItem = ({ item }: { item: UserGeneratedContent }) => (
    <UserContentCard
      content={item}
      onPress={() => onPressItem?.(item.id)}
      onUpdate={() => onPressUpdate?.(item.id)}
      onClose={() => onPressClose?.(item.id)}
      showActions={true}
    />
  );

  // Active filters count
  const activeFiltersCount =
    (filterMode !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0);

  return (
    <View className="flex-1">
      {/* Filter Toggle Button */}
      <View className="p-4 pb-2 flex-row items-center justify-between">
        <Text className="text-sm text-muted-foreground">
          {filteredContents.length} contenido(s)
        </Text>
        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          className="flex-row items-center gap-2"
        >
          <Filter size={16} color="#3b82f6" />
          <Text className="text-sm font-medium text-primary">Filtros</Text>
          {activeFiltersCount > 0 && (
            <View className="bg-primary rounded-full w-5 h-5 items-center justify-center">
              <Text className="text-xs font-bold text-white">
                {activeFiltersCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View className="px-4 pb-3 gap-3">
          {/* Mode Filter */}
          <View className="gap-2">
            <Text className="text-xs font-medium text-foreground">Modo</Text>
            <View className="flex-row gap-2">
              {[
                { value: 'all', label: 'Todos' },
                { value: UserContentMode.URGENT, label: '🚨 URGENT' },
                { value: UserContentMode.NORMAL, label: '📝 NORMAL' },
              ].map((mode) => (
                <Button
                  key={mode.value}
                  variant={filterMode === mode.value ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => setFilterMode(mode.value as typeof filterMode)}
                  className="flex-1"
                >
                  <Text className="text-xs">{mode.label}</Text>
                </Button>
              ))}
            </View>
          </View>

          {/* Status Filter */}
          <View className="gap-2">
            <Text className="text-xs font-medium text-foreground">Estado</Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                { value: 'all', label: 'Todos' },
                { value: UserContentStatus.PUBLISHED, label: 'Publicado' },
                { value: UserContentStatus.PROCESSING, label: 'Procesando' },
                { value: UserContentStatus.CLOSED, label: 'Cerrado' },
              ].map((status) => (
                <Button
                  key={status.value}
                  variant={filterStatus === status.value ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => setFilterStatus(status.value as typeof filterStatus)}
                  className="flex-1"
                >
                  <Text className="text-xs">{status.label}</Text>
                </Button>
              ))}
            </View>
          </View>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => {
                setFilterMode('all');
                setFilterStatus('all');
              }}
              className="flex-row gap-1"
            >
              <X size={14} />
              <Text className="text-xs">Limpiar filtros</Text>
            </Button>
          )}
        </View>
      )}

      {/* Content List */}
      <FlatList
        data={filteredContents}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
            />
          ) : undefined
        }
      />
    </View>
  );
}
