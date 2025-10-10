import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { useResponsive } from '@/src/features/responsive';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWebsiteConfigs, useExtractUrlsAndSave } from '@/src/hooks/useGeneratorPro';
import type { ExtractedUrl } from '@/src/services/generator-pro/generatorProApi';

export default function ExtractScreen() {
  const { isTablet } = useResponsive();
  const router = useRouter();
  const { data: websites, isLoading } = useWebsiteConfigs();
  const extractUrlsAndSave = useExtractUrlsAndSave();
  const [extractingWebsiteId, setExtractingWebsiteId] = useState<string | null>(null);

  const handleExtractUrls = async (websiteId: string, websiteName: string) => {
    try {
      setExtractingWebsiteId(websiteId);
      console.log('🔍 Extracting URLs for website:', websiteId);

      const result = await extractUrlsAndSave.mutateAsync(websiteId);
      console.log('✅ URLs extracted:', result);

      // Verificar si hay URLs extraídas
      if (!result.extractedUrls || result.extractedUrls.length === 0) {
        console.log('⚠️ No URLs found');
        Alert.alert(
          'Sin resultados',
          'No se encontraron URLs nuevas en este sitio. Es posible que ya se hayan extraído anteriormente.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Extraer solo las URLs del array de objetos
      const urls = result.extractedUrls.map((item: ExtractedUrl) => item.url);
      console.log('📋 Mapped URLs:', urls);

      console.log('🧭 Navigating to results with params:', {
        websiteId,
        websiteName,
        totalUrls: result.totalUrls
      });

      router.push({
        pathname: '/(tabs)/extract-results',
        params: {
          websiteId,
          websiteName,
          urls: JSON.stringify(urls),
          totalUrls: result.totalUrls.toString()
        }
      });
    } catch (error) {
      console.error('❌ Error extracting URLs:', error);
      Alert.alert('Error', 'No se pudieron extraer las URLs del sitio');
    } finally {
      setExtractingWebsiteId(null);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f1ef47" />
          <ThemedText variant="body-medium" color="secondary" style={styles.loadingText}>
            Cargando sitios web...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          isTablet && styles.contentTablet
        ]}
      >
        <View style={styles.header}>
          <ThemedText variant="title-large" style={styles.title}>
            Extraer Contenido
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
            Selecciona un sitio web para extraer noticias
          </ThemedText>
        </View>

        {websites && websites.length > 0 ? (
          <View style={styles.cardsContainer}>
            {websites.map((website) => (
              <Pressable
                key={website.id}
                onPress={() => {
                  console.log('🔍 Navigating to outlet:', website.id);
                  router.push(`/outlet/${website.id}`);
                }}
              >
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>
                    <ThemedText variant="title-medium" style={styles.cardTitle}>
                      {website.name}
                    </ThemedText>
                  </CardTitle>
                  <CardDescription>
                    <ThemedText variant="body-small" color="secondary" style={styles.cardUrl}>
                      {website.baseUrl}
                    </ThemedText>
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText variant="label-medium" color="secondary">
                        URLs Extraídas
                      </ThemedText>
                      <ThemedText variant="title-small" style={styles.statValue}>
                        {website.statistics?.totalUrlsExtracted || 0}
                      </ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText variant="label-medium" color="secondary">
                        Exitosas
                      </ThemedText>
                      <ThemedText variant="title-small" style={styles.statValue}>
                        {website.statistics?.successfulExtractions || 0}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, website.isActive ? styles.statusActive : styles.statusInactive]}>
                    <ThemedText variant="label-small" style={styles.statusText}>
                      {website.isActive ? 'Activo' : 'Inactivo'}
                    </ThemedText>
                  </View>
                </CardContent>

                <CardFooter>
                  <Button
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleExtractUrls(website.id, website.name);
                    }}
                    disabled={extractingWebsiteId === website.id || !website.isActive}
                    style={styles.extractButton}
                  >
                    <ThemedText variant="label-medium" style={styles.buttonText}>
                      {extractingWebsiteId === website.id ? 'Extrayendo...' : 'Extraer URLs'}
                    </ThemedText>
                  </Button>
                </CardFooter>
              </Card>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <ThemedText variant="title-medium" style={styles.emptyTitle}>
              No hay sitios configurados
            </ThemedText>
            <ThemedText variant="body-medium" color="secondary" style={styles.emptyDescription}>
              Configura sitios web desde el panel de administración
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 24,
    paddingBottom: 40
  },
  contentTablet: {
    paddingHorizontal: 80,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%'
  },
  header: {
    marginBottom: 32
  },
  title: {
    color: '#111827',
    marginBottom: 8
  },
  subtitle: {
    color: '#6B7280'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    textAlign: 'center'
  },
  cardsContainer: {
    gap: 16
  },
  cardTitle: {
    color: '#111827'
  },
  cardUrl: {
    fontSize: 12,
    marginTop: 4
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16
  },
  statItem: {
    flex: 1
  },
  statValue: {
    color: '#111827',
    marginTop: 4
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  statusActive: {
    backgroundColor: '#DCFCE7'
  },
  statusInactive: {
    backgroundColor: '#F3F4F6'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500'
  },
  extractButton: {
    flex: 1
  },
  buttonText: {
    color: '#000000',
    fontWeight: '600'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64
  },
  emptyTitle: {
    color: '#111827',
    marginBottom: 8
  },
  emptyDescription: {
    textAlign: 'center'
  }
});
