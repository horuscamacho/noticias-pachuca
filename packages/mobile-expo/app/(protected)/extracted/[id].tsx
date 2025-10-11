import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Image, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { useResponsive } from '@/src/features/responsive';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useExtractedNewsById } from '@/src/hooks/useExtractedNewsFilters';
import { useGeneratedContentByPostId } from '@/src/hooks/useGeneratedContent';
import { useContentGenerationSocket } from '@/src/hooks/useContentGenerationSocket';
import { GeneratedContentCard } from '@/src/components/content/GeneratedContentCard';

export default function ExtractedPostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isTablet } = useResponsive();

  // Obtener datos del post
  const { data: post, isLoading, error, refetch } = useExtractedNewsById(id!);

  // Obtener contenidos generados
  const { data: generatedContents, isLoading: isLoadingGenerated } = useGeneratedContentByPostId(id!);

  // Escuchar eventos de socket para generación en tiempo real
  const { processingIds, isProcessing } = useContentGenerationSocket();

  const isGenerating = isProcessing(id!);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Cargando...' }} />
        <ScrollView contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}>
          <Skeleton style={styles.skeletonImage} />
          <Skeleton style={styles.skeletonTitle} />
          <Skeleton style={styles.skeletonText} />
          <Skeleton style={styles.skeletonText} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Error' }} />
        <View style={styles.errorContainer}>
          <ThemedText variant="title-medium" style={styles.errorTitle}>
            Error al cargar el post
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary" style={styles.errorMessage}>
            {error instanceof Error ? error.message : 'Post no encontrado'}
          </ThemedText>
          <Button onPress={() => refetch()} style={{ marginTop: 16 }}>
            <ThemedText variant="label-medium">Reintentar</ThemedText>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: post.title }} />

      <ScrollView contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}>

        {/* Sección 1: Imagen del Post */}
        {post.images && post.images.length > 0 && (
          <Card style={styles.section}>
            <CardContent>
              <Image
                source={{ uri: post.images[0] }}
                style={styles.image}
                resizeMode="cover"
                onError={(e) => {
                  console.log('Error loading image:', e.nativeEvent.error);
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Sección 2: Información del Post */}
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <ThemedText variant="title-large" style={styles.postTitle}>
                {post.title}
              </ThemedText>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.infoRow}>
              <ThemedText variant="label-medium" color="secondary">Fuente:</ThemedText>
              <ThemedText variant="body-medium">{post.domain || 'Desconocida'}</ThemedText>
            </View>

            {post.author && (
              <View style={styles.infoRow}>
                <ThemedText variant="label-medium" color="secondary">Autor:</ThemedText>
                <ThemedText variant="body-medium">{post.author}</ThemedText>
              </View>
            )}

            {post.category && (
              <View style={styles.infoRow}>
                <ThemedText variant="label-medium" color="secondary">Categoría:</ThemedText>
                <ThemedText variant="body-medium">{post.category}</ThemedText>
              </View>
            )}

            {post.publishedAt && (
              <View style={styles.infoRow}>
                <ThemedText variant="label-medium" color="secondary">Publicado:</ThemedText>
                <ThemedText variant="body-medium">
                  {new Date(post.publishedAt).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </ThemedText>
              </View>
            )}

            <Separator style={{ marginVertical: 12 }} />

            <ThemedText variant="label-medium" color="secondary" style={{ marginBottom: 8 }}>
              URL:
            </ThemedText>
            <ThemedText
              variant="body-small"
              style={styles.link}
              onPress={() => Linking.openURL(post.sourceUrl)}
            >
              {post.sourceUrl}
            </ThemedText>
          </CardContent>
        </Card>

        {/* Sección 3: Contenido Extraído */}
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <ThemedText variant="title-medium">Contenido Extraído</ThemedText>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.contentBox}>
              <ThemedText variant="body-medium" style={styles.contentText}>
                {post.content}
              </ThemedText>
            </View>
          </CardContent>
        </Card>

        {/* Sección 4: Acciones Rápidas */}
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <ThemedText variant="title-medium">Acciones Rápidas</ThemedText>
            </CardTitle>
            <CardDescription>
              <ThemedText variant="body-small" color="secondary">
                Genera contenido con agentes de IA
              </ThemedText>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onPress={() => {
                console.log('🎯 Navigating to select agents for post:', id);
                router.push(`/extracted/${id}/select-agents`);
              }}
              disabled={isGenerating}
              style={styles.createButton}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator size="small" color="#000" style={{ marginRight: 8 }} />
                  <ThemedText variant="label-medium" style={styles.buttonText}>
                    Generando...
                  </ThemedText>
                </>
              ) : (
                <ThemedText variant="label-medium" style={styles.buttonText}>
                  ✨ Crear Contenido
                </ThemedText>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Sección 5: Contenidos Generados */}
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <ThemedText variant="title-medium">
                Contenidos Generados ({generatedContents?.length || 0})
              </ThemedText>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingGenerated ? (
              <View style={styles.loadingGenerated}>
                <ActivityIndicator size="small" color="#f1ef47" />
                <ThemedText variant="body-small" color="secondary" style={{ marginTop: 8 }}>
                  Cargando contenidos...
                </ThemedText>
              </View>
            ) : generatedContents && generatedContents.length > 0 ? (
              <View>
                {generatedContents.map((content) => (
                  <GeneratedContentCard
                    key={content.id}
                    content={content}
                    onPress={() => {
                      console.log('🔍 Navigating to generated content:', content.id);
                      router.push(`/generated/${content.id}`);
                    }}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyGenerated}>
                <ThemedText variant="body-medium" color="secondary" style={{ textAlign: 'center' }}>
                  Aún no se ha generado contenido para este post
                </ThemedText>
                <ThemedText variant="body-small" color="secondary" style={{ textAlign: 'center', marginTop: 8 }}>
                  Usa "Crear Contenido" para generar con agentes de IA
                </ThemedText>
              </View>
            )}
          </CardContent>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  contentTablet: {
    paddingHorizontal: 80,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%'
  },
  section: {
    marginBottom: 16
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8
  },
  postTitle: {
    color: '#111827',
    lineHeight: 28
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap'
  },
  link: {
    color: '#3B82F6',
    textDecorationLine: 'underline'
  },
  contentBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8
  },
  contentText: {
    color: '#374151',
    lineHeight: 22
  },
  createButton: {
    width: '100%'
  },
  buttonText: {
    color: '#000000',
    fontWeight: '600'
  },
  loadingGenerated: {
    alignItems: 'center',
    paddingVertical: 24
  },
  emptyGenerated: {
    alignItems: 'center',
    paddingVertical: 32
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  errorTitle: {
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center'
  },
  errorMessage: {
    textAlign: 'center'
  },
  skeletonImage: {
    width: '100%',
    height: 200,
    marginBottom: 16
  },
  skeletonTitle: {
    height: 28,
    width: '80%',
    marginBottom: 16
  },
  skeletonText: {
    height: 16,
    width: '100%',
    marginBottom: 8
  }
});
