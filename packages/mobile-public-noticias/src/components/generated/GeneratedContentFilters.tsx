import React, { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectOption } from '@/components/ui/select';
import type { App as FilterApp } from '@/src/types/generated-content-filters.types';
import {
  useAgents,
  useCategories,
} from '@/src/hooks/useGeneratedContentFilters';
import { ActivityIndicator } from 'react-native';

interface GeneratedContentFiltersProps {
  filters: FilterApp.GeneratedContentFilters;
  onFiltersChange: (filters: FilterApp.GeneratedContentFilters) => void;
  onApply: () => void;
  onClear: () => void;
}

/**
 * 🔍 Componente de Filtros para Contenidos Generados
 * Permite filtrar por status, agente, categoría y búsqueda
 */
export function GeneratedContentFilters({
  filters,
  onFiltersChange,
  onApply,
  onClear,
}: GeneratedContentFiltersProps) {
  // Cargar opciones de filtros
  const { data: agents, isLoading: isLoadingAgents } = useAgents();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();

  // Status options
  const statusOptions: SelectOption[] = [
    { label: 'Todos', value: '' },
    { label: '✅ Completado', value: 'completed' },
    { label: '⏳ Pendiente', value: 'pending' },
    { label: '🔄 Generando', value: 'generating' },
    { label: '✔️ Aprobado', value: 'approved' },
    { label: '👀 En revisión', value: 'reviewing' },
    { label: '❌ Rechazado', value: 'rejected' },
    { label: '❗ Fallido', value: 'failed' },
  ];

  // Convertir agentes a options
  const agentOptions: SelectOption[] = [
    { label: 'Todos los agentes', value: '' },
    ...(agents?.map(agent => ({
      label: agent.name,
      value: agent.id,
    })) || []),
  ];

  // Convertir categorías a options
  const categoryOptions: SelectOption[] = [
    { label: 'Todas las categorías', value: '' },
    ...(categories?.map(category => ({
      label: category,
      value: category,
    })) || []),
  ];

  // Orden options
  const sortByOptions: SelectOption[] = [
    { label: 'Fecha de generación', value: 'generatedAt' },
    { label: 'Fecha de publicación', value: 'publishedAt' },
    { label: 'Título', value: 'title' },
    { label: 'Calidad', value: 'qualityScore' },
    { label: 'Categoría', value: 'category' },
  ];

  const sortOrderOptions: SelectOption[] = [
    { label: 'Más recientes primero', value: 'desc' },
    { label: 'Más antiguos primero', value: 'asc' },
  ];

  return (
    <Card style={styles.card}>
      <CardHeader>
        <CardTitle>
          <ThemedText variant="title-small">🔍 Filtros</ThemedText>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Status */}
        <View style={styles.filterGroup}>
          <ThemedText variant="label-medium" style={styles.filterLabel}>
            Estado
          </ThemedText>
          <Select
            value={filters.status?.[0] || ''}
            onValueChange={(value) => {
              onFiltersChange({
                ...filters,
                status: value ? [value as FilterApp.GenerationStatus] : undefined,
              });
            }}
            options={statusOptions}
            placeholder="Seleccionar estado"
          />
        </View>

        {/* Agente */}
        <View style={styles.filterGroup}>
          <ThemedText variant="label-medium" style={styles.filterLabel}>
            Agente
          </ThemedText>
          {isLoadingAgents ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#f1ef47" />
            </View>
          ) : (
            <Select
              value={filters.agentId || ''}
              onValueChange={(value) => {
                onFiltersChange({
                  ...filters,
                  agentId: value || undefined,
                });
              }}
              options={agentOptions}
              placeholder="Todos los agentes"
            />
          )}
        </View>

        {/* Categoría */}
        <View style={styles.filterGroup}>
          <ThemedText variant="label-medium" style={styles.filterLabel}>
            Categoría
          </ThemedText>
          {isLoadingCategories ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#f1ef47" />
            </View>
          ) : (
            <Select
              value={filters.category || ''}
              onValueChange={(value) => {
                onFiltersChange({
                  ...filters,
                  category: value || undefined,
                });
              }}
              options={categoryOptions}
              placeholder="Todas las categorías"
            />
          )}
        </View>

        {/* Búsqueda */}
        <View style={styles.filterGroup}>
          <ThemedText variant="label-medium" style={styles.filterLabel}>
            Búsqueda
          </ThemedText>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar en título o contenido..."
            placeholderTextColor="#9CA3AF"
            value={filters.search || ''}
            onChangeText={(text) => {
              onFiltersChange({
                ...filters,
                search: text || undefined,
              });
            }}
          />
        </View>

        {/* Ordenamiento */}
        <View style={styles.filterGroup}>
          <ThemedText variant="label-medium" style={styles.filterLabel}>
            Ordenar por
          </ThemedText>
          <Select
            value={filters.sortBy || 'generatedAt'}
            onValueChange={(value) => {
              onFiltersChange({
                ...filters,
                sortBy: value as FilterApp.GeneratedContentFilters['sortBy'],
              });
            }}
            options={sortByOptions}
          />
        </View>

        <View style={styles.filterGroup}>
          <ThemedText variant="label-medium" style={styles.filterLabel}>
            Orden
          </ThemedText>
          <Select
            value={filters.sortOrder || 'desc'}
            onValueChange={(value) => {
              onFiltersChange({
                ...filters,
                sortOrder: value as 'asc' | 'desc',
              });
            }}
            options={sortOrderOptions}
          />
        </View>

        {/* Botones de acción */}
        <View style={styles.actions}>
          <Button
            variant="outline"
            style={styles.actionButton}
            onPress={onClear}
          >
            <ThemedText style={styles.clearButtonText}>
              Limpiar
            </ThemedText>
          </Button>
          <Button
            style={[styles.actionButton, styles.applyButton]}
            onPress={onApply}
          >
            <ThemedText style={styles.applyButtonText}>
              Aplicar Filtros
            </ThemedText>
          </Button>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    color: '#111827',
    marginBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  clearButtonText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#f1ef47',
  },
  applyButtonText: {
    color: '#000',
    fontWeight: '600',
  },
});
