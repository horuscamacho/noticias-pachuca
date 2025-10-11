import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, XCircle, ArrowLeft, Code2, FileText, Link2, Save } from 'lucide-react-native';
import { useLatestAiAnalysis } from '@/src/hooks/useAiOutlets';
import { useCreateOutlet } from '@/src/hooks/useOutlets';
import type { CreateOutletDto } from '@/src/types/outlet.types';

/**
 * 🤖 Pantalla de resultados de análisis AI
 * Muestra los resultados del análisis automático con OpenAI
 */
export default function AiAnalysisResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name: string; baseUrl: string; listingUrl: string; testUrl?: string }>();
  const { data: result, isLoading } = useLatestAiAnalysis();
  const createOutlet = useCreateOutlet();

  const handleSaveOutlet = () => {
    if (!result || !params.name || !params.baseUrl || !params.listingUrl) {
      console.error('❌ Missing required data to save outlet');
      return;
    }

    const outletData: CreateOutletDto = {
      name: params.name,
      baseUrl: params.baseUrl,
      listingUrl: params.listingUrl,
      testUrl: params.testUrl,
      listingSelectors: {
        articleLinks: result.listingAnalysis.selector,
      },
      contentSelectors: {
        titleSelector: result.contentAnalysis.selectors.titleSelector,
        contentSelector: result.contentAnalysis.selectors.contentSelector,
        imageSelector: result.contentAnalysis.selectors.imageSelector || '',
        dateSelector: result.contentAnalysis.selectors.dateSelector || '',
        authorSelector: result.contentAnalysis.selectors.authorSelector || '',
        categorySelector: result.contentAnalysis.selectors.categorySelector || '',
      },
    };

    console.log('💾 Saving outlet with data:', outletData);
    createOutlet.mutate(outletData);
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Cargando...', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f1ef47" />
          <Text style={styles.loadingText}>Cargando resultados...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (!result) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <XCircle size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Error al cargar resultados</Text>
          <Text style={styles.errorMessage}>No se pudieron cargar los resultados del análisis</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={20} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { listingAnalysis, contentAnalysis, validationResults, processingTimeMs } = result;
  const confidencePercent = Math.round(validationResults.overallConfidence * 100);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Análisis Completado',
          headerShown: true,
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Badge de confianza */}
        <View style={[styles.confidenceBadge, confidencePercent >= 80 ? styles.confidenceHigh : styles.confidenceMedium]}>
          <CheckCircle2 size={24} color={confidencePercent >= 80 ? '#10B981' : '#F59E0B'} />
          <View style={styles.confidenceTextContainer}>
            <Text style={styles.confidenceLabel}>Confianza del análisis</Text>
            <Text style={[styles.confidenceValue, confidencePercent >= 80 ? styles.confidenceValueHigh : styles.confidenceValueMedium]}>
              {confidencePercent}%
            </Text>
          </View>
        </View>

        {/* Tiempo de procesamiento */}
        <View style={styles.timeCard}>
          <Text style={styles.timeText}>⚡ Análisis completado en {(processingTimeMs / 1000).toFixed(1)} segundos</Text>
        </View>

        {/* Selectores Detectados */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Code2 size={20} color="#6B7280" />
            <Text style={styles.sectionTitle}>Selectores CSS Detectados</Text>
          </View>

          <View style={styles.selectorCard}>
            <Text style={styles.selectorLabel}>📋 Listado de artículos</Text>
            <View style={styles.selectorValueContainer}>
              <Text style={styles.selectorValue}>{listingAnalysis.selector}</Text>
            </View>
            <Text style={styles.selectorMeta}>
              Confianza: {Math.round(listingAnalysis.confidence * 100)}% • {listingAnalysis.count} artículos encontrados
            </Text>
          </View>

          <View style={styles.selectorCard}>
            <Text style={styles.selectorLabel}>📰 Título del artículo</Text>
            <View style={styles.selectorValueContainer}>
              <Text style={styles.selectorValue}>{contentAnalysis.selectors.titleSelector}</Text>
            </View>
          </View>

          <View style={styles.selectorCard}>
            <Text style={styles.selectorLabel}>📄 Contenido completo</Text>
            <View style={styles.selectorValueContainer}>
              <Text style={styles.selectorValue}>{contentAnalysis.selectors.contentSelector}</Text>
            </View>
          </View>

          {contentAnalysis.selectors.imageSelector && (
            <View style={styles.selectorCard}>
              <Text style={styles.selectorLabel}>🖼️ Imagen principal</Text>
              <View style={styles.selectorValueContainer}>
                <Text style={styles.selectorValue}>{contentAnalysis.selectors.imageSelector}</Text>
              </View>
            </View>
          )}

          {contentAnalysis.selectors.authorSelector && (
            <View style={styles.selectorCard}>
              <Text style={styles.selectorLabel}>👤 Autor</Text>
              <View style={styles.selectorValueContainer}>
                <Text style={styles.selectorValue}>{contentAnalysis.selectors.authorSelector}</Text>
              </View>
            </View>
          )}

          {contentAnalysis.selectors.dateSelector && (
            <View style={styles.selectorCard}>
              <Text style={styles.selectorLabel}>📅 Fecha</Text>
              <View style={styles.selectorValueContainer}>
                <Text style={styles.selectorValue}>{contentAnalysis.selectors.dateSelector}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Preview de URLs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Link2 size={20} color="#6B7280" />
            <Text style={styles.sectionTitle}>URLs Encontradas ({listingAnalysis.count})</Text>
          </View>
          <View style={styles.urlsList}>
            {listingAnalysis.urlsFound.slice(0, 5).map((url, index) => (
              <View key={index} style={styles.urlItem}>
                <Text style={styles.urlIndex}>#{index + 1}</Text>
                <Text style={styles.urlText} numberOfLines={1}>
                  {url}
                </Text>
              </View>
            ))}
            {listingAnalysis.count > 5 && (
              <Text style={styles.moreUrls}>...y {listingAnalysis.count - 5} más</Text>
            )}
          </View>
        </View>

        {/* Preview de contenido extraído */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color="#6B7280" />
            <Text style={styles.sectionTitle}>Preview del Contenido Extraído</Text>
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{contentAnalysis.extractedPreview.title}</Text>
            <Text style={styles.previewContent} numberOfLines={8}>
              {contentAnalysis.extractedPreview.content}
            </Text>

            {contentAnalysis.extractedPreview.author && (
              <View style={styles.previewMeta}>
                <Text style={styles.previewMetaLabel}>Autor:</Text>
                <Text style={styles.previewMetaValue}>{contentAnalysis.extractedPreview.author}</Text>
              </View>
            )}

            {contentAnalysis.extractedPreview.date && (
              <View style={styles.previewMeta}>
                <Text style={styles.previewMetaLabel}>Fecha:</Text>
                <Text style={styles.previewMetaValue}>{contentAnalysis.extractedPreview.date}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Mensajes de validación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Validación</Text>
          {validationResults.messages.map((message, index) => (
            <View key={index} style={styles.validationItem}>
              <CheckCircle2 size={16} color="#10B981" />
              <Text style={styles.validationText}>{message}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer con botones */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSaveOutlet}
          style={[styles.saveButton, createOutlet.isPending && styles.buttonDisabled]}
          disabled={createOutlet.isPending}
        >
          {createOutlet.isPending ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Save size={20} color="#000000" />
              <Text style={styles.saveButtonText}>Guardar Sitio Web</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.returnButton}>
          <ArrowLeft size={20} color="#6B7280" />
          <Text style={styles.returnButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  confidenceHigh: {
    backgroundColor: '#D1FAE5',
  },
  confidenceMedium: {
    backgroundColor: '#FEF3C7',
  },
  confidenceTextContainer: {
    flex: 1,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  confidenceValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  confidenceValueHigh: {
    color: '#047857',
  },
  confidenceValueMedium: {
    color: '#D97706',
  },
  timeCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  selectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selectorValueContainer: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  selectorValue: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#6366F1',
  },
  selectorMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  urlsList: {
    gap: 8,
  },
  urlItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  urlIndex: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  urlText: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
  },
  moreUrls: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 24,
  },
  previewContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  previewMeta: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  previewMetaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  previewMetaValue: {
    fontSize: 13,
    color: '#374151',
  },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  validationText: {
    fontSize: 13,
    color: '#374151',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#f1ef47',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 56,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  returnButton: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  returnButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#f1ef47',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
});
