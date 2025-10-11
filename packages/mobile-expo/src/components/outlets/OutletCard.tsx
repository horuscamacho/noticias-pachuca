import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/src/components/ThemedText';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOutletStatistics } from '@/src/hooks/useExtractionHistory';
import { useStartFullExtraction } from '@/src/hooks/useOutlets';
import { useExtractionLogs } from '@/src/hooks/useExtractionLogs';
import { TrendingUp, CheckCircle2, XCircle, Clock, Play, Eye, Zap } from 'lucide-react-native';
import type { OutletConfig } from '@/src/types/outlet.types';

interface OutletCardProps {
  outlet: OutletConfig;
}

/**
 * OutletCard - Enhanced card component for outlet list
 * Features:
 * - Real-time statistics using useOutletStatistics
 * - Direct extraction with useStartFullExtraction
 * - Live extraction status with useExtractionLogs
 * - Navigation to outlet detail
 * - Touch-friendly buttons (56px min height)
 */
export function OutletCard({ outlet }: OutletCardProps) {
  const router = useRouter();
  const { data: statistics, isLoading: statsLoading } = useOutletStatistics(outlet.id);
  const { logs, isExtracting } = useExtractionLogs(outlet.id);
  const startExtraction = useStartFullExtraction();
  const [showLogs, setShowLogs] = useState(false);

  const handleNavigateToDetail = () => {
    console.log('🔍 Navigating to outlet:', outlet.id);
    router.push(`/outlet/${outlet.id}`);
  };

  const handleStartExtraction = async () => {
    try {
      console.log('🚀 Starting extraction for outlet:', outlet.id);
      await startExtraction.mutateAsync(outlet.id);
      Alert.alert(
        'Extracción Iniciada',
        `La extracción para ${outlet.name} ha comenzado. Puedes ver el progreso en los logs.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Error starting extraction:', error);
      Alert.alert(
        'Error',
        'No se pudo iniciar la extracción. Por favor, intenta de nuevo.',
        [{ text: 'OK' }]
      );
    }
  };

  const successRate = statistics
    ? statistics.totalUrlsExtracted > 0
      ? ((statistics.successfulExtractions / statistics.totalUrlsExtracted) * 100).toFixed(1)
      : '0.0'
    : '0.0';

  const lastExtraction = outlet.lastExtractionRun
    ? new Date(outlet.lastExtractionRun).toLocaleString('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'Nunca';

  return (
    <Card style={styles.card}>
      <CardHeader>
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <CardTitle>
              <ThemedText variant="title-medium" style={styles.cardTitle}>
                {outlet.name}
              </ThemedText>
            </CardTitle>
            <CardDescription>
              <ThemedText variant="body-small" color="secondary" style={styles.cardUrl}>
                {outlet.baseUrl}
              </ThemedText>
            </CardDescription>
          </View>
          <View style={styles.badges}>
            {isExtracting && (
              <Badge variant="default" style={styles.liveBadge}>
                <Zap size={12} color="#000" />
                <ThemedText variant="label-small" style={styles.liveBadgeText}>
                  En Vivo
                </ThemedText>
              </Badge>
            )}
            <Badge variant={outlet.isActive ? 'default' : 'secondary'} style={styles.statusBadge}>
              <ThemedText variant="label-small" style={styles.statusText}>
                {outlet.isActive ? 'Activo' : 'Inactivo'}
              </ThemedText>
            </Badge>
          </View>
        </View>
      </CardHeader>

      <CardContent>
        {/* Statistics Grid */}
        {statsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#f1ef47" />
            <ThemedText variant="body-small" color="secondary">
              Cargando estadísticas...
            </ThemedText>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <View style={styles.statHeader}>
                <TrendingUp size={14} color="#3b82f6" />
                <ThemedText variant="label-small" color="secondary" style={styles.statLabel}>
                  URLs
                </ThemedText>
              </View>
              <ThemedText variant="title-small" style={styles.statValue}>
                {statistics?.totalUrlsExtracted ?? 0}
              </ThemedText>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statHeader}>
                <CheckCircle2 size={14} color="#22c55e" />
                <ThemedText variant="label-small" color="secondary" style={styles.statLabel}>
                  Exitosas
                </ThemedText>
              </View>
              <ThemedText variant="title-small" style={[styles.statValue, styles.successText]}>
                {statistics?.successfulExtractions ?? 0}
              </ThemedText>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statHeader}>
                <XCircle size={14} color="#ef4444" />
                <ThemedText variant="label-small" color="secondary" style={styles.statLabel}>
                  Fallos
                </ThemedText>
              </View>
              <ThemedText variant="title-small" style={[styles.statValue, styles.errorText]}>
                {statistics?.failedExtractions ?? 0}
              </ThemedText>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statHeader}>
                <Clock size={14} color="#f59e0b" />
                <ThemedText variant="label-small" color="secondary" style={styles.statLabel}>
                  Tasa
                </ThemedText>
              </View>
              <ThemedText variant="title-small" style={[styles.statValue, styles.rateText]}>
                {successRate}%
              </ThemedText>
            </View>
          </View>
        )}

        {/* Last Extraction Info */}
        <View style={styles.lastExtraction}>
          <ThemedText variant="label-small" color="secondary">
            Última extracción: {lastExtraction}
          </ThemedText>
        </View>

        {/* Live Logs Section - Only show when extracting */}
        {isExtracting && logs.length > 0 && (
          <View style={styles.logsSection}>
            <TouchableOpacity
              onPress={() => setShowLogs(!showLogs)}
              style={styles.logsToggle}
              activeOpacity={0.7}
            >
              <ThemedText variant="label-medium" style={styles.logsToggleText}>
                {showLogs ? '▼' : '▶'} Logs en vivo ({logs.length})
              </ThemedText>
            </TouchableOpacity>
            {showLogs && (
              <View style={styles.logsContainer}>
                {logs.slice(-3).map((log) => (
                  <View key={log.id} style={styles.logItem}>
                    <ThemedText variant="body-small" style={styles.logText}>
                      {log.message}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </CardContent>

      <CardFooter>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handleNavigateToDetail}
            style={[styles.button, styles.detailButton]}
            activeOpacity={0.7}
          >
            <Eye size={18} color="#666" />
            <ThemedText variant="label-medium" style={styles.detailButtonText}>
              Ver Detalles
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleStartExtraction}
            disabled={isExtracting || startExtraction.isPending || !outlet.isActive}
            style={[
              styles.button,
              styles.extractButton,
              (isExtracting || startExtraction.isPending || !outlet.isActive) && styles.buttonDisabled,
            ]}
            activeOpacity={0.7}
          >
            {startExtraction.isPending ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Play size={18} color="#000" fill="#000" />
            )}
            <ThemedText variant="label-medium" style={styles.extractButtonText}>
              {isExtracting ? 'Extrayendo...' : 'Extraer Ahora'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </CardFooter>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    color: '#111827',
  },
  cardUrl: {
    fontSize: 12,
    marginTop: 4,
  },
  badges: {
    gap: 8,
    alignItems: 'flex-end',
  },
  liveBadge: {
    backgroundColor: '#f1ef47',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveBadgeText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    minHeight: 70,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  successText: {
    color: '#22c55e',
  },
  errorText: {
    color: '#ef4444',
  },
  rateText: {
    color: '#f59e0b',
  },
  lastExtraction: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logsSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  logsToggle: {
    paddingVertical: 4,
  },
  logsToggleText: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  logsContainer: {
    marginTop: 8,
    backgroundColor: '#1F2937',
    borderRadius: 6,
    padding: 8,
    maxHeight: 120,
  },
  logItem: {
    paddingVertical: 2,
  },
  logText: {
    color: '#E5E7EB',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 56,
  },
  detailButton: {
    backgroundColor: '#F3F4F6',
  },
  detailButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  extractButton: {
    backgroundColor: '#f1ef47',
  },
  extractButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
