import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { useResponsive } from '@/src/features/responsive';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useExtractContentFromUrls } from '@/src/hooks/useGeneratorPro';
import { ExternalLink, CheckCircle2, Download, ArrowLeft } from 'lucide-react-native';

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
        `${result.totalProcessed} noticias extraídas y guardadas correctamente`,
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
        showsVerticalScrollIndicator={false}
      >
        {/* Header mejorado */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="#111827" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <ThemedText variant="headline-medium" style={styles.title}>
                Contenidos Extraídos
              </ThemedText>
              <View style={styles.websiteInfo}>
                <ExternalLink size={14} color="#6B7280" />
                <ThemedText variant="body-medium" color="secondary">
                  {websiteName}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={[styles.statBox, styles.statBoxBlue]}>
              <ThemedText variant="label-small" style={styles.statLabel}>
                URLs Encontradas
              </ThemedText>
              <ThemedText variant="title-large" style={styles.statValueBlue}>
                {totalUrls}
              </ThemedText>
            </View>

            <View style={[styles.statBox, styles.statBoxGreen]}>
              <ThemedText variant="label-small" style={styles.statLabel}>
                Seleccionadas
              </ThemedText>
              <ThemedText variant="title-large" style={styles.statValueGreen}>
                {selectedUrls.length}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Lista de URLs */}
        <Card style={styles.urlsCard}>
          <CardHeader>
            <View style={styles.cardHeaderRow}>
              <CardTitle>
                <ThemedText variant="title-medium" style={styles.cardTitle}>
                  URLs Disponibles
                </ThemedText>
              </CardTitle>
              <TouchableOpacity onPress={toggleSelectAll}>
                <Badge variant={selectedUrls.length === urls.length ? "default" : "secondary"}>
                  <ThemedText variant="label-small" style={styles.badgeText}>
                    {selectedUrls.length === urls.length ? 'Deseleccionar' : 'Seleccionar Todo'}
                  </ThemedText>
                </Badge>
              </TouchableOpacity>
            </View>
          </CardHeader>

          <CardContent>
            <View style={styles.urlsList}>
              {urls.map((url: string, index: number) => {
                const isSelected = selectedUrls.includes(url);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.urlItem,
                      isSelected && styles.urlItemSelected
                    ]}
                    onPress={() => toggleUrl(url)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.urlItemContent}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleUrl(url)}
                      />
                      <View style={styles.urlTextContainer}>
                        <ThemedText
                          variant="body-small"
                          style={styles.urlText}
                          numberOfLines={2}
                        >
                          {url}
                        </ThemedText>
                        {isSelected && (
                          <View style={styles.selectedIndicator}>
                            <CheckCircle2 size={16} color="#22c55e" />
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </CardContent>
        </Card>
      </ScrollView>

      {/* Sticky Footer con acciones */}
      <View style={styles.stickyFooter}>
        <View style={styles.footerContent}>
          <Button
            variant="outline"
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            <ThemedText variant="label-medium">Cancelar</ThemedText>
          </Button>

          <TouchableOpacity
            onPress={handleExtractContent}
            disabled={selectedUrls.length === 0 || extractContent.isPending}
            activeOpacity={0.7}
            style={[
              styles.extractButton,
              (selectedUrls.length === 0 || extractContent.isPending) && styles.extractButtonDisabled
            ]}
          >
            <View style={styles.extractButtonContent}>
              {extractContent.isPending ? (
                <>
                  <ActivityIndicator size="small" color="#000" />
                  <ThemedText variant="label-medium" style={styles.extractButtonText}>
                    Extrayendo...
                  </ThemedText>
                </>
              ) : (
                <>
                  <Download size={20} color="#000" />
                  <ThemedText variant="label-medium" style={styles.extractButtonText}>
                    Extraer ({selectedUrls.length})
                  </ThemedText>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingBottom: 100,
  },
  contentTablet: {
    paddingHorizontal: 80,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    color: '#111827',
    marginBottom: 4,
  },
  websiteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  statBoxBlue: {
    backgroundColor: '#EFF6FF',
  },
  statBoxGreen: {
    backgroundColor: '#F0FDF4',
  },
  statLabel: {
    color: '#6B7280',
    marginBottom: 4,
  },
  statValueBlue: {
    color: '#1e40af',
    fontWeight: '700',
  },
  statValueGreen: {
    color: '#15803d',
    fontWeight: '700',
  },
  urlsCard: {
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#111827',
  },
  badgeText: {
    fontWeight: '600',
  },
  urlsList: {
    gap: 8,
  },
  urlItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  urlItemSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22c55e',
  },
  urlItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  urlTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urlText: {
    flex: 1,
    color: '#374151',
    fontSize: 13,
  },
  selectedIndicator: {
    marginLeft: 'auto',
  },
  stickyFooter: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  footerContent: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  extractButton: {
    flex: 2,
    backgroundColor: '#f1ef47',
    borderRadius: 8,
    minHeight: 48,
  },
  extractButtonDisabled: {
    opacity: 0.5,
  },
  extractButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  extractButtonText: {
    color: '#000000',
    fontWeight: '600',
  },
});
