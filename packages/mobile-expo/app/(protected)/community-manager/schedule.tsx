import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { Button } from '@/components/ui/button';
import { useScheduledPosts, useCancelScheduledPost } from '@/src/hooks';
import { useResponsive } from '@/src/features/responsive';
import type { Platform, ContentType, PostStatus, ScheduledPost } from '@/src/types/community-manager.types';

/**
 * 📅 FASE 7: Pantalla de Calendario de Posts Programados
 * Lista de posts programados con filtros por plataforma, tipo, status
 */

const PLATFORMS: Platform[] = ['facebook', 'twitter'];
const CONTENT_TYPES: ContentType[] = ['breaking_news', 'normal_news', 'blog', 'evergreen', 'recycled'];
const STATUSES: PostStatus[] = ['scheduled', 'processing', 'published', 'failed', 'cancelled'];

const PLATFORM_ICONS: Record<Platform, string> = {
  facebook: '📘',
  twitter: '🐦',
  instagram: '📷',
};

const STATUS_COLORS: Record<PostStatus, string> = {
  scheduled: '#3B82F6',
  processing: '#F59E0B',
  published: '#10B981',
  failed: '#EF4444',
  cancelled: '#6B7280',
};

export default function ScheduleScreen() {
  const { isTablet } = useResponsive();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | undefined>();
  const [selectedContentType, setSelectedContentType] = useState<ContentType | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<PostStatus | undefined>();

  const {
    data: posts,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useScheduledPosts({
    platform: selectedPlatform,
    contentType: selectedContentType,
    status: selectedStatus,
    limit: 50,
  });

  const cancelPost = useCancelScheduledPost();

  const handleCancelPost = async (postId: string) => {
    try {
      await cancelPost.mutateAsync({
        scheduledPostId: postId,
        reason: 'Cancelled by user from mobile app',
      });
    } catch (error) {
      console.error('Error cancelling post:', error);
    }
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ThemedText variant="label-large" style={styles.filterLabel}>
        Filtros
      </ThemedText>

      {/* Platform Filter */}
      <View style={styles.filterGroup}>
        <ThemedText variant="body-small" color="secondary">
          Plataforma
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <Button
            variant={selectedPlatform === undefined ? 'default' : 'outline'}
            onPress={() => setSelectedPlatform(undefined)}
            style={styles.filterButton}
          >
            <ThemedText variant="label-small">Todas</ThemedText>
          </Button>
          {PLATFORMS.map((platform) => (
            <Button
              key={platform}
              variant={selectedPlatform === platform ? 'default' : 'outline'}
              onPress={() => setSelectedPlatform(platform)}
              style={styles.filterButton}
            >
              <ThemedText variant="label-small">
                {PLATFORM_ICONS[platform]} {platform}
              </ThemedText>
            </Button>
          ))}
        </ScrollView>
      </View>

      {/* Status Filter */}
      <View style={styles.filterGroup}>
        <ThemedText variant="body-small" color="secondary">
          Estado
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <Button
            variant={selectedStatus === undefined ? 'default' : 'outline'}
            onPress={() => setSelectedStatus(undefined)}
            style={styles.filterButton}
          >
            <ThemedText variant="label-small">Todos</ThemedText>
          </Button>
          {STATUSES.map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              onPress={() => setSelectedStatus(status)}
              style={styles.filterButton}
            >
              <ThemedText variant="label-small">{status}</ThemedText>
            </Button>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderPost = (post: ScheduledPost) => {
    const statusColor = STATUS_COLORS[post.status];
    const scheduledDate = new Date(post.scheduledAt);
    const canCancel = post.status === 'scheduled';

    return (
      <View key={post.id} style={styles.postCard}>
        {/* Header */}
        <View style={styles.postHeader}>
          <View style={styles.postHeaderLeft}>
            <ThemedText variant="label-large">
              {PLATFORM_ICONS[post.platform as Platform]} {post.platform}
            </ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <ThemedText variant="label-small" style={styles.statusText}>
                {post.status}
              </ThemedText>
            </View>
          </View>
          <ThemedText variant="body-small" color="secondary">
            Prioridad: {post.priority}
          </ThemedText>
        </View>

        {/* Content */}
        <View style={styles.postContent}>
          <ThemedText variant="body-medium" numberOfLines={3}>
            {post.postContent}
          </ThemedText>
        </View>

        {/* Metadata */}
        <View style={styles.postMetadata}>
          <ThemedText variant="body-small" color="secondary">
            📅 {scheduledDate.toLocaleDateString('es-MX', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </ThemedText>
          <ThemedText variant="body-small" color="secondary">
            🕐 {scheduledDate.toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </ThemedText>
          {post.metadata?.timeWindow && (
            <ThemedText variant="body-small" color="secondary">
              📊 {post.metadata.timeWindow}
            </ThemedText>
          )}
        </View>

        {/* Actions */}
        {canCancel && (
          <Button
            variant="outline"
            onPress={() => handleCancelPost(post.id)}
            style={styles.cancelButton}
            disabled={cancelPost.isPending}
          >
            <ThemedText variant="label-small" style={{ color: '#EF4444' }}>
              ❌ Cancelar
            </ThemedText>
          </Button>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Posts Programados',
          headerBackTitle: 'Atrás',
        }}
      />

      <ScrollView
        style={[styles.content, isTablet && styles.contentTablet]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="title-large" style={styles.title}>
            📅 Calendario de Posts
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary">
            {posts?.length || 0} posts programados
          </ThemedText>
        </View>

        {/* Filters */}
        {renderFilters()}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <ThemedText variant="body-medium" color="secondary" style={{ marginTop: 12 }}>
              Cargando posts...
            </ThemedText>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <ThemedText variant="body-medium" style={{ color: '#EF4444' }}>
              ❌ Error al cargar posts
            </ThemedText>
            <Button onPress={() => refetch()} style={{ marginTop: 12 }}>
              <ThemedText>Reintentar</ThemedText>
            </Button>
          </View>
        )}

        {/* Posts List */}
        {!isLoading && !error && (
          <View style={styles.postsContainer}>
            {posts && posts.length > 0 ? (
              posts.map(renderPost)
            ) : (
              <View style={styles.emptyContainer}>
                <ThemedText variant="title-medium">📭</ThemedText>
                <ThemedText variant="body-medium" color="secondary" style={{ marginTop: 8 }}>
                  No hay posts programados
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
  filtersContainer: {
    padding: 16,
    paddingTop: 8,
  },
  filterLabel: {
    color: '#111827',
    marginBottom: 12,
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterScroll: {
    marginTop: 8,
  },
  filterButton: {
    marginRight: 8,
    minWidth: 80,
  },
  postsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  postCard: {
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
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  postContent: {
    marginBottom: 12,
  },
  postMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  cancelButton: {
    marginTop: 8,
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
