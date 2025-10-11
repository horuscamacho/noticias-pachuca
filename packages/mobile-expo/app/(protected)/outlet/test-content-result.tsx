import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, XCircle, ArrowLeft, FileText, User, Calendar, Tag, Image as ImageIcon } from 'lucide-react-native';
import type { TestContentResponse } from '@/src/types/outlet.types';

/**
 * 🧪 Pantalla de resultados de prueba de selectores de contenido
 * Muestra el contenido extraído al probar los selectores
 */
export default function TestContentResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ result: string }>();

  // Parse del resultado
  let result: TestContentResponse | null = null;
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

  const { success, title, content, images, author, publishedAt, category } = result;

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
            {success ? 'Extracción exitosa' : 'Extracción fallida'}
          </Text>
        </View>

        {/* Título */}
        {title && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={18} color="#6B7280" />
              <Text style={styles.sectionLabel}>Título</Text>
            </View>
            <Text style={styles.titleText}>{title}</Text>
          </View>
        )}

        {/* Metadata */}
        {(author || publishedAt || category) && (
          <View style={styles.metadataContainer}>
            {author && (
              <View style={styles.metadataItem}>
                <User size={16} color="#6B7280" />
                <Text style={styles.metadataText}>{author}</Text>
              </View>
            )}
            {publishedAt && (
              <View style={styles.metadataItem}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.metadataText}>{publishedAt}</Text>
              </View>
            )}
            {category && (
              <View style={styles.metadataItem}>
                <Tag size={16} color="#6B7280" />
                <Text style={styles.metadataText}>{category}</Text>
              </View>
            )}
          </View>
        )}

        {/* Imágenes */}
        {images && images.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ImageIcon size={18} color="#6B7280" />
              <Text style={styles.sectionLabel}>
                Imágenes ({images.length})
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagesScroll}
            >
              {images.map((imageUrl, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  <Text style={styles.imageIndex}>#{index + 1}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Contenido completo */}
        {content && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={18} color="#6B7280" />
              <Text style={styles.sectionLabel}>Contenido completo</Text>
            </View>
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>{content}</Text>
            </View>
            <View style={styles.contentStats}>
              <Text style={styles.statsText}>
                {content.split(' ').length} palabras • {content.length} caracteres
              </Text>
            </View>
          </View>
        )}

        {/* Estado vacío si no hay contenido */}
        {!title && !content && (
          <View style={styles.emptyState}>
            <XCircle size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No se extrajo contenido</Text>
            <Text style={styles.emptyMessage}>
              Verifica que los selectores sean correctos y que la URL contenga el contenido esperado
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
    marginBottom: 20,
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 30,
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metadataText: {
    fontSize: 13,
    color: '#374151',
  },
  imagesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  imageWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  imageIndex: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  contentBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contentText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  contentStats: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  statsText: {
    fontSize: 13,
    color: '#9CA3AF',
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
