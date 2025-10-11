import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { useResponsive } from '@/src/features/responsive';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LogList } from '@/components/ui/log-list';
import { Text } from '@/components/ui/text';
import {
  useOutlets,
  useStartFullExtraction,
} from '@/src/hooks/useOutlets';
import { useOutletStatistics } from '@/src/hooks/useExtractionHistory';
import { useExtractionLogs } from '@/src/hooks/useExtractionLogs';
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Play,
  AlertCircle,
  Sparkles,
  X,
  Plus,
} from 'lucide-react-native';
import type { OutletConfig } from '@/src/types/outlet.types';

/**
 * OutletCard Component - Beautiful card with real statistics
 */
interface OutletCardProps {
  outlet: OutletConfig;
  onViewDetails: (id: string) => void;
  onStartExtraction: (id: string, name: string) => void;
  isExtracting: boolean;
}

function OutletCard({ outlet, onViewDetails, onStartExtraction, isExtracting }: OutletCardProps) {
  const { data: statistics, isLoading: statsLoading } = useOutletStatistics(outlet.id);

  const lastExtraction = outlet.lastExtractionRun
    ? new Date(outlet.lastExtractionRun).toLocaleString('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'Nunca';

  return (
    <Card className="mb-4">
      {/* Header Section */}
      <CardHeader>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <CardTitle>
              <Text className="text-lg font-bold">{outlet.name}</Text>
            </CardTitle>
            <CardDescription className="mt-1">
              <View className="flex-row items-center gap-1 flex-wrap">
                <ExternalLink size={12} color="#6B7280" />
                <Text className="text-xs text-muted-foreground flex-shrink">
                  {outlet.baseUrl}
                </Text>
              </View>
            </CardDescription>
          </View>
          <Badge variant={outlet.isActive ? 'default' : 'secondary'}>
            <Text className="text-xs font-semibold">
              {outlet.isActive ? 'Activo' : 'Inactivo'}
            </Text>
          </Badge>
        </View>
      </CardHeader>

      {/* Statistics Section */}
      <CardContent>
        {statsLoading ? (
          <View className="gap-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </View>
        ) : (
          <>
            {/* Main Stats Row */}
            <View className="flex-row gap-2 mb-3">
              <View className="flex-1 bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <View className="flex-row items-center gap-1 mb-1">
                  <TrendingUp size={14} color="#3b82f6" />
                  <Text className="text-xs text-blue-600 dark:text-blue-400">URLs</Text>
                </View>
                <Text className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  {statistics?.totalUrlsExtracted ?? 0}
                </Text>
              </View>

              <View className="flex-1 bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                <View className="flex-row items-center gap-1 mb-1">
                  <CheckCircle2 size={14} color="#22c55e" />
                  <Text className="text-xs text-green-600 dark:text-green-400">Extraidos</Text>
                </View>
                <Text className="text-xl font-bold text-green-700 dark:text-green-300">
                  {statistics?.totalContentExtracted ?? 0}
                </Text>
              </View>
            </View>

            {/* Secondary Stats Row */}
            <View className="flex-row gap-2">
              <View className="flex-1 bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                <View className="flex-row items-center gap-1 mb-1">
                  <XCircle size={14} color="#ef4444" />
                  <Text className="text-xs text-red-600 dark:text-red-400">Fallos</Text>
                </View>
                <Text className="text-xl font-bold text-red-700 dark:text-red-300">
                  {statistics?.totalFailed ?? 0}
                </Text>
              </View>

              <View
                className="flex-1 p-3 rounded-lg"
                style={{ backgroundColor: '#f1ef47' }}
              >
                <View className="flex-row items-center gap-1 mb-1">
                  <Sparkles size={14} color="#000" />
                  <Text className="text-xs text-black font-medium">Tasa Éxito</Text>
                </View>
                <Text className="text-xl font-bold text-black">
                  {statistics?.successRate?.toFixed(1) ?? 0}%
                </Text>
              </View>
            </View>

            {/* Last Extraction Info */}
            <View className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <View className="flex-row items-center gap-2">
                <Clock size={14} color="#6B7280" />
                <Text className="text-xs text-muted-foreground">Última extracción:</Text>
                <Text className="text-xs font-medium">{lastExtraction}</Text>
              </View>
            </View>
          </>
        )}
      </CardContent>

      {/* Action Buttons */}
      <CardFooter className="gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onPress={() => onViewDetails(outlet.id)}
        >
          <Text className="font-semibold">Ver Detalles</Text>
        </Button>

        <TouchableOpacity
          onPress={() => onStartExtraction(outlet.id, outlet.name)}
          disabled={isExtracting || !outlet.isActive}
          activeOpacity={0.7}
          style={{ flex: 1 }}
        >
          <View
            className={`rounded-lg flex-row items-center justify-center gap-2 ${
              (isExtracting || !outlet.isActive) ? 'opacity-50' : ''
            }`}
            style={{
              backgroundColor: '#f1ef47',
              minHeight: 44,
              paddingHorizontal: 16,
            }}
          >
            {isExtracting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Play size={16} color="#000" fill="#000" />
            )}
            <Text className="font-semibold text-black">
              {isExtracting ? 'Extrayendo...' : 'Extraer Ahora'}
            </Text>
          </View>
        </TouchableOpacity>
      </CardFooter>
    </Card>
  );
}

/**
 * Extraction Logs Modal Component
 */
interface ExtractionLogsModalProps {
  visible: boolean;
  outletId: string | null;
  outletName: string | null;
  onClose: () => void;
}

function ExtractionLogsModal({
  visible,
  outletId,
  outletName,
  onClose,
}: ExtractionLogsModalProps) {
  // 🔥 Solo activar el hook cuando el modal está visible Y tenemos un outletId válido
  const shouldFetchLogs = visible && !!outletId;
  const { logs, isExtracting } = useExtractionLogs(shouldFetchLogs ? outletId : '');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text className="text-lg font-bold">Logs de Extracción</Text>
              {outletName && (
                <Text className="text-sm text-muted-foreground mt-1">{outletName}</Text>
              )}
            </View>
            {isExtracting && (
              <Badge className="bg-[#f1ef47] mr-2">
                <Text className="text-black font-semibold">En Vivo</Text>
              </Badge>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Logs Content */}
          <View style={styles.modalBody}>
            {logs.length === 0 ? (
              <View style={styles.emptyLogs}>
                <AlertCircle size={48} color="#9CA3AF" />
                <Text className="text-muted-foreground text-center mt-4">
                  No hay logs disponibles.{'\n'}
                  La extracción comenzará en breve.
                </Text>
              </View>
            ) : (
              <LogList logs={logs} maxHeight={500} />
            )}
          </View>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <Button onPress={onClose} className="w-full">
              <Text className="font-semibold">Cerrar</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Main Extract Screen Component
 */
export default function ExtractScreen() {
  const { isTablet } = useResponsive();
  const router = useRouter();
  const { data: outlets, isLoading, refetch } = useOutlets();
  const startExtraction = useStartFullExtraction();

  const [refreshing, setRefreshing] = useState(false);
  const [extractingOutletId, setExtractingOutletId] = useState<string | null>(null);
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleViewDetails = (outletId: string) => {
    console.log('🔍 Navigating to outlet detail:', outletId);
    router.push(`/outlet/${outletId}`);
  };

  const handleStartExtraction = async (outletId: string, outletName: string) => {
    try {
      setExtractingOutletId(outletId);
      setSelectedOutlet({ id: outletId, name: outletName });
      setLogsModalVisible(true);

      console.log('🚀 Starting extraction for outlet:', outletId);

      await startExtraction.mutateAsync(outletId);

      console.log('✅ Extraction completed for outlet:', outletId);
    } catch (error) {
      console.error('❌ Error starting extraction:', error);
    } finally {
      setExtractingOutletId(null);
    }
  };

  const handleCloseLogsModal = () => {
    setLogsModalVisible(false);
    setSelectedOutlet(null);
  };

  // Loading State
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f1ef47" />
          <ThemedText variant="body-medium" color="secondary" style={styles.loadingText}>
            Cargando outlets...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f1ef47" />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <ThemedText variant="title-large" style={styles.title}>
            Extraer Contenido
          </ThemedText>
          <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
            Gestiona y extrae noticias de tus outlets configurados
          </ThemedText>
        </View>

        {/* Outlets List */}
        {outlets && outlets.length > 0 ? (
          <View style={styles.outletsContainer}>
            {outlets.map((outlet) => (
              <OutletCard
                key={outlet.id}
                outlet={outlet}
                onViewDetails={handleViewDetails}
                onStartExtraction={handleStartExtraction}
                isExtracting={extractingOutletId === outlet.id}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <AlertCircle size={64} color="#9CA3AF" />
            <ThemedText variant="title-medium" style={styles.emptyTitle}>
              No hay outlets configurados
            </ThemedText>
            <ThemedText variant="body-medium" color="secondary" style={styles.emptyDescription}>
              Configura outlets desde el panel de administración para comenzar a extraer noticias
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Botón Crear Nuevo Sitio - Sticky Footer */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          onPress={() => router.push('/outlet/create')}
          activeOpacity={0.7}
          style={styles.createButton}
        >
          <View style={styles.createButtonContent}>
            <Plus size={20} color="#000" strokeWidth={2.5} />
            <Text style={styles.createButtonText}>Crear Nuevo Sitio</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Extraction Logs Modal */}
      <ExtractionLogsModal
        visible={logsModalVisible}
        outletId={selectedOutlet?.id || null}
        outletName={selectedOutlet?.name || null}
        onClose={handleCloseLogsModal}
      />
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
    padding: 16,
    paddingBottom: 40,
  },
  contentTablet: {
    paddingHorizontal: 80,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    color: '#111827',
    marginBottom: 8,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    textAlign: 'center',
  },
  outletsContainer: {
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  emptyLogs: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  stickyFooter: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  createButton: {
    width: '100%',
  },
  createButtonContent: {
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
  createButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
