import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, XCircle, ArrowLeft, Link2 } from 'lucide-react-native';
import type { TestListingResponse } from '@/src/types/outlet.types';

/**
 * 🧪 Pantalla de resultados de prueba de selectores de listado
 * Muestra las URLs encontradas al probar el selector de artículos
 */
export default function TestListingResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ result: string }>();

  // Parse del resultado
  let result: TestListingResponse | null = null;
  try {
    result = params.result ? JSON.parse(params.result) : null;
  } catch (error) {
    console.error('❌ Error parsing result:', error);
  }

  if (!result) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <XCircle size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Error al cargar resultados</Text>
          <Text style={styles.errorMessage}>No se pudieron cargar los resultados de la prueba</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { success, urls, count } = result;

  return (
    <View style={styles.container}>
      {/* Header fijo */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackButton}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resultados de Prueba</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, success ? styles.successBadge : styles.errorBadge]}>
          {success ? (
            <CheckCircle2 size={20} color="#10B981" />
          ) : (
            <XCircle size={20} color="#EF4444" />
          )}
          <Text style={[styles.statusText, success ? styles.successText : styles.errorText]}>
            {success ? 'Prueba exitosa' : 'Prueba fallida'}
          </Text>
        </View>

        {/* Contador */}
        <View style={styles.countCard}>
          <Text style={styles.countLabel}>URLs encontradas</Text>
          <Text style={styles.countValue}>{count}</Text>
        </View>

        {/* Lista de URLs */}
        {count > 0 ? (
          <View style={styles.urlsSection}>
            <Text style={styles.sectionTitle}>Artículos detectados</Text>
            <Text style={styles.sectionSubtitle}>
              El selector encontró {count} enlace{count !== 1 ? 's' : ''} de artículos
            </Text>

            <View style={styles.urlsList}>
              {urls.map((url, index) => (
                <View key={index} style={styles.urlCard}>
                  <View style={styles.urlHeader}>
                    <Link2 size={16} color="#6B7280" />
                    <Text style={styles.urlIndex}>#{index + 1}</Text>
                  </View>
                  <Text style={styles.urlText} numberOfLines={2}>
                    {url}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <XCircle size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No se encontraron URLs</Text>
            <Text style={styles.emptyMessage}>
              Verifica que el selector sea correcto y que la página tenga artículos
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer con botón volver */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.returnButton}
        >
          <ArrowLeft size={20} color="#000000" />
          <Text style={styles.returnButtonText}>Volver al formulario</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBackButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  successBadge: {
    backgroundColor: '#D1FAE5',
  },
  errorBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
  },
  successText: {
    color: '#047857',
  },
  errorText: {
    color: '#DC2626',
  },
  countCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  countLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  countValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#f1ef47',
  },
  urlsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  urlsList: {
    gap: 12,
  },
  urlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  urlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  urlIndex: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  urlText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  returnButton: {
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
  returnButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
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
