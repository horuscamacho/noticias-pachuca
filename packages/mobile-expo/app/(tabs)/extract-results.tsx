import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { useResponsive } from '@/src/features/responsive';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useExtractContentFromUrls } from '@/src/hooks/useGeneratorPro';

export default function ExtractResultsScreen() {
  const { isTablet } = useResponsive();
  const router = useRouter();
  const params = useLocalSearchParams<{
    websiteId: string;
    websiteName: string;
    urls: string;
    totalUrls: string;
  }>();

  const websiteId = params.websiteId;
  const websiteName = params.websiteName;
  const urls = params.urls ? JSON.parse(params.urls) : [];
  const totalUrls = params.totalUrls ? parseInt(params.totalUrls, 10) : 0;

  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const extractContent = useExtractContentFromUrls();

  const toggleUrl = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUrls.length === urls.length) {
      setSelectedUrls([]);
    } else {
      setSelectedUrls([...urls]);
    }
  };

  const handleExtractContent = async () => {
    if (selectedUrls.length === 0) {
      Alert.alert('Error', 'Selecciona al menos una URL para extraer');
      return;
    }

    try {
      const result = await extractContent.mutateAsync({
        urls: selectedUrls,
        websiteId,
      });

      Alert.alert(
        'Éxito',
        `✅ ${result.totalProcessed} noticias extraídas y guardadas correctamente`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error extracting content:', error);
      Alert.alert('Error', 'No se pudo extraer el contenido de las URLs seleccionadas');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
      >
        <View style={styles.header}>
          <ThemedText variant="title-large" style={styles.title}>
            Resultados de Extracción
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
            {websiteName} - {totalUrls} URLs encontradas
          </ThemedText>
        </View>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>
              <View style={styles.headerRow}>
                <ThemedText variant="title-medium" style={styles.cardTitle}>
                  URLs Extraídas
                </ThemedText>
                <TouchableOpacity onPress={toggleSelectAll}>
                  <ThemedText variant="label-medium" style={styles.selectAllButton}>
                    {selectedUrls.length === urls.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <View style={styles.urlsList}>
              {urls.map((url: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.urlItem}
                  onPress={() => toggleUrl(url)}
                  activeOpacity={0.7}
                >
                  <Checkbox
                    checked={selectedUrls.includes(url)}
                    onCheckedChange={() => toggleUrl(url)}
                  />
                  <ThemedText
                    variant="body-small"
                    style={styles.urlText}
                    numberOfLines={2}
                  >
                    {url}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </CardContent>
        </Card>

        <View style={styles.footer}>
          <Button
            variant="outline"
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            <ThemedText variant="label-medium">Cancelar</ThemedText>
          </Button>

          <Button
            onPress={handleExtractContent}
            disabled={selectedUrls.length === 0 || extractContent.isPending}
            style={styles.extractButton}
          >
            <ThemedText variant="label-medium" style={styles.extractButtonText}>
              {extractContent.isPending
                ? 'Extrayendo...'
                : `Extraer Contenido (${selectedUrls.length})`}
            </ThemedText>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  contentTablet: {
    paddingHorizontal: 80,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7280',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#111827',
  },
  selectAllButton: {
    color: '#000000',
    textDecorationLine: 'underline',
  },
  urlsList: {
    gap: 12,
  },
  urlItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  urlText: {
    flex: 1,
    color: '#374151',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  extractButton: {
    flex: 2,
  },
  extractButtonText: {
    color: '#000000',
    fontWeight: '600',
  },
});
