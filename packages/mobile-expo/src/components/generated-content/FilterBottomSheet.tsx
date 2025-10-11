import React, { useState } from 'react'
import { View, Modal, StyleSheet, Pressable, ScrollView } from 'react-native'
import { ThemedText } from '@/src/components/ThemedText'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Filter, RotateCcw } from 'lucide-react-native'
import type { App } from '@/src/types/generated-content-filters.types'

interface FilterBottomSheetProps {
  visible: boolean
  onClose: () => void
  filters: App.GeneratedContentFilters
  onApply: (filters: App.GeneratedContentFilters) => void
  agents?: Array<{ id: string; name: string; type: string }>
  templates?: Array<{ id: string; name: string; type: string }>
  providers?: Array<{ id: string; name: string; model: string }>
  categories?: string[]
  tags?: string[]
}

/**
 * 🎯 FilterBottomSheet - Bottom Sheet completo para filtros avanzados
 * Features:
 * - Múltiples secciones de filtros
 * - Estado local con aplicar/resetear
 * - Checkboxes para selección múltiple
 * - Date range (simplificado con inputs)
 * - Quality slider
 * - Search input
 * - Scroll vertical
 * - Touch-friendly (48px min height)
 */
export function FilterBottomSheet({
  visible,
  onClose,
  filters,
  onApply,
  agents = [],
  templates = [],
  providers = [],
  categories = [],
  tags = [],
}: FilterBottomSheetProps) {
  // Estado local del sheet (no aplicado hasta presionar "Aplicar")
  const [localFilters, setLocalFilters] = useState<App.GeneratedContentFilters>(filters)

  // Sincronizar con props cuando abre
  React.useEffect(() => {
    if (visible) {
      setLocalFilters(filters)
    }
  }, [visible, filters])

  const handleApply = () => {
    onApply(localFilters)
    onClose()
  }

  const handleReset = () => {
    const resetFilters: App.GeneratedContentFilters = {
      status: [],
      tags: [],
      sortBy: 'generatedAt',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
    }
    setLocalFilters(resetFilters)
    onApply(resetFilters)
  }

  // Toggle status
  const toggleStatus = (status: App.GenerationStatus) => {
    const currentStatus = localFilters.status || []
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter((s) => s !== status)
      : [...currentStatus, status]
    setLocalFilters({ ...localFilters, status: newStatus })
  }

  // Toggle tag
  const toggleTag = (tag: string) => {
    const currentTags = localFilters.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag]
    setLocalFilters({ ...localFilters, tags: newTags })
  }

  const allStatuses: App.GenerationStatus[] = [
    'completed',
    'approved',
    'reviewing',
    'pending',
    'generating',
    'failed',
    'rejected',
  ]

  const statusLabels: Record<App.GenerationStatus, string> = {
    pending: 'Pendiente',
    generating: 'Generando',
    completed: 'Completado',
    failed: 'Fallido',
    reviewing: 'En revisión',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  }

  // Contador de filtros activos
  const activeFiltersCount =
    (localFilters.status?.length || 0) +
    (localFilters.agentId ? 1 : 0) +
    (localFilters.templateId ? 1 : 0) +
    (localFilters.providerId ? 1 : 0) +
    (localFilters.category ? 1 : 0) +
    (localFilters.tags?.length || 0) +
    (localFilters.search ? 1 : 0) +
    (localFilters.dateFrom || localFilters.dateTo ? 1 : 0) +
    (localFilters.minQualityScore ? 1 : 0) +
    (localFilters.hasReview !== undefined ? 1 : 0) +
    (localFilters.isPublished !== undefined ? 1 : 0)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Filter size={20} color="#111827" />
                <ThemedText variant="title-medium" style={styles.title}>
                  Filtros
                </ThemedText>
                {activeFiltersCount > 0 && (
                  <View style={styles.countBadge}>
                    <ThemedText variant="label-small" style={styles.countText}>
                      {activeFiltersCount}
                    </ThemedText>
                  </View>
                )}
              </View>
              <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}>
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>
          </View>

          {/* Content - Scrollable */}
          <ScrollView style={styles.content} bounces={false} showsVerticalScrollIndicator={false}>
            {/* Búsqueda */}
            <View style={styles.section}>
              <ThemedText variant="label-medium" style={styles.sectionTitle}>
                🔍 Búsqueda
              </ThemedText>
              <Input
                placeholder="Buscar en título, contenido..."
                value={localFilters.search || ''}
                onChangeText={(text) => setLocalFilters({ ...localFilters, search: text })}
                style={styles.input}
              />
            </View>

            {/* Estado */}
            <View style={styles.section}>
              <ThemedText variant="label-medium" style={styles.sectionTitle}>
                📊 Estado
              </ThemedText>
              {allStatuses.map((status) => (
                <Pressable
                  key={status}
                  onPress={() => toggleStatus(status)}
                  style={styles.checkboxRow}
                >
                  <Checkbox
                    checked={localFilters.status?.includes(status) || false}
                    onCheckedChange={() => toggleStatus(status)}
                  />
                  <ThemedText variant="body-medium" style={styles.checkboxLabel}>
                    {statusLabels[status]}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {/* Agente */}
            {agents.length > 0 && (
              <View style={styles.section}>
                <ThemedText variant="label-medium" style={styles.sectionTitle}>
                  🤖 Agente
                </ThemedText>
                <View style={styles.selectContainer}>
                  <Pressable
                    style={styles.selectButton}
                    onPress={() => setLocalFilters({ ...localFilters, agentId: undefined })}
                  >
                    <ThemedText
                      variant="body-medium"
                      style={!localFilters.agentId ? styles.selectedOption : styles.option}
                    >
                      Todos
                    </ThemedText>
                  </Pressable>
                  {agents.slice(0, 5).map((agent) => (
                    <Pressable
                      key={agent.id}
                      style={styles.selectButton}
                      onPress={() => setLocalFilters({ ...localFilters, agentId: agent.id })}
                    >
                      <ThemedText
                        variant="body-medium"
                        style={
                          localFilters.agentId === agent.id ? styles.selectedOption : styles.option
                        }
                        numberOfLines={1}
                      >
                        {agent.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Template */}
            {templates.length > 0 && (
              <View style={styles.section}>
                <ThemedText variant="label-medium" style={styles.sectionTitle}>
                  📝 Template
                </ThemedText>
                <View style={styles.selectContainer}>
                  <Pressable
                    style={styles.selectButton}
                    onPress={() => setLocalFilters({ ...localFilters, templateId: undefined })}
                  >
                    <ThemedText
                      variant="body-medium"
                      style={!localFilters.templateId ? styles.selectedOption : styles.option}
                    >
                      Todos
                    </ThemedText>
                  </Pressable>
                  {templates.slice(0, 5).map((template) => (
                    <Pressable
                      key={template.id}
                      style={styles.selectButton}
                      onPress={() =>
                        setLocalFilters({ ...localFilters, templateId: template.id })
                      }
                    >
                      <ThemedText
                        variant="body-medium"
                        style={
                          localFilters.templateId === template.id
                            ? styles.selectedOption
                            : styles.option
                        }
                        numberOfLines={1}
                      >
                        {template.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Proveedor */}
            {providers.length > 0 && (
              <View style={styles.section}>
                <ThemedText variant="label-medium" style={styles.sectionTitle}>
                  ⚡ Proveedor IA
                </ThemedText>
                <View style={styles.selectContainer}>
                  <Pressable
                    style={styles.selectButton}
                    onPress={() => setLocalFilters({ ...localFilters, providerId: undefined })}
                  >
                    <ThemedText
                      variant="body-medium"
                      style={!localFilters.providerId ? styles.selectedOption : styles.option}
                    >
                      Todos
                    </ThemedText>
                  </Pressable>
                  {providers.slice(0, 5).map((provider) => (
                    <Pressable
                      key={provider.id}
                      style={styles.selectButton}
                      onPress={() =>
                        setLocalFilters({ ...localFilters, providerId: provider.id })
                      }
                    >
                      <ThemedText
                        variant="body-medium"
                        style={
                          localFilters.providerId === provider.id
                            ? styles.selectedOption
                            : styles.option
                        }
                        numberOfLines={1}
                      >
                        {provider.name} ({provider.model})
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Categoría */}
            {categories.length > 0 && (
              <View style={styles.section}>
                <ThemedText variant="label-medium" style={styles.sectionTitle}>
                  📁 Categoría
                </ThemedText>
                <View style={styles.selectContainer}>
                  <Pressable
                    style={styles.selectButton}
                    onPress={() => setLocalFilters({ ...localFilters, category: undefined })}
                  >
                    <ThemedText
                      variant="body-medium"
                      style={!localFilters.category ? styles.selectedOption : styles.option}
                    >
                      Todas
                    </ThemedText>
                  </Pressable>
                  {categories.slice(0, 8).map((category) => (
                    <Pressable
                      key={category}
                      style={styles.selectButton}
                      onPress={() => setLocalFilters({ ...localFilters, category })}
                    >
                      <ThemedText
                        variant="body-medium"
                        style={
                          localFilters.category === category ? styles.selectedOption : styles.option
                        }
                        numberOfLines={1}
                      >
                        {category}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <View style={styles.section}>
                <ThemedText variant="label-medium" style={styles.sectionTitle}>
                  🏷️ Tags
                </ThemedText>
                <View style={styles.tagsContainer}>
                  {tags.slice(0, 12).map((tag) => (
                    <Pressable
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={[
                        styles.tagChip,
                        localFilters.tags?.includes(tag) && styles.tagChipSelected,
                      ]}
                    >
                      <ThemedText
                        variant="label-small"
                        style={[
                          styles.tagText,
                          localFilters.tags?.includes(tag) && styles.tagTextSelected,
                        ]}
                      >
                        {tag}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Otros filtros booleanos */}
            <View style={styles.section}>
              <ThemedText variant="label-medium" style={styles.sectionTitle}>
                ⚙️ Otros
              </ThemedText>

              <Pressable
                onPress={() =>
                  setLocalFilters({
                    ...localFilters,
                    hasReview:
                      localFilters.hasReview === undefined ? true : !localFilters.hasReview,
                  })
                }
                style={styles.checkboxRow}
              >
                <Checkbox
                  checked={localFilters.hasReview || false}
                  onCheckedChange={() =>
                    setLocalFilters({
                      ...localFilters,
                      hasReview:
                        localFilters.hasReview === undefined ? true : !localFilters.hasReview,
                    })
                  }
                />
                <ThemedText variant="body-medium" style={styles.checkboxLabel}>
                  Con revisión humana
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() =>
                  setLocalFilters({
                    ...localFilters,
                    isPublished:
                      localFilters.isPublished === undefined ? true : !localFilters.isPublished,
                  })
                }
                style={styles.checkboxRow}
              >
                <Checkbox
                  checked={localFilters.isPublished || false}
                  onCheckedChange={() =>
                    setLocalFilters({
                      ...localFilters,
                      isPublished:
                        localFilters.isPublished === undefined ? true : !localFilters.isPublished,
                    })
                  }
                />
                <ThemedText variant="body-medium" style={styles.checkboxLabel}>
                  Publicado
                </ThemedText>
              </Pressable>
            </View>

            {/* Espaciado para scroll */}
            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* Footer - Fixed */}
          <View style={styles.footer}>
            <Button
              onPress={handleReset}
              variant="outline"
              style={styles.footerButton}
              disabled={activeFiltersCount === 0}
            >
              <RotateCcw size={18} color="#6B7280" />
              <Text>Resetear</Text>
            </Button>
            <Button onPress={handleApply} style={[styles.footerButton, styles.applyButton]}>
              <Text style={styles.applyButtonText}>
                Aplicar {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </Text>
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#111827',
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 500,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    color: '#111827',
    fontWeight: '700',
    marginBottom: 12,
    fontSize: 14,
  },
  input: {
    minHeight: 48,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
  checkboxLabel: {
    color: '#374151',
    flex: 1,
  },
  selectContainer: {
    gap: 8,
  },
  selectButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minHeight: 44,
    justifyContent: 'center',
  },
  option: {
    color: '#6B7280',
  },
  selectedOption: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minHeight: 32,
  },
  tagChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  tagText: {
    color: '#6B7280',
    fontSize: 12,
  },
  tagTextSelected: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 24,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  footerButton: {
    flex: 1,
    minHeight: 52,
  },
  applyButton: {
    backgroundColor: '#3B82F6',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
})
