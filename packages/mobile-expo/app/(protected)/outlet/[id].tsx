import { ScrollView, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  useOutletById,
  useUpdateFrequencies,
  useStartFullExtraction,
  usePauseOutlet,
  useResumeOutlet,
} from '@/src/hooks/useOutlets';
import { useExtractionLogs } from '@/src/hooks/useExtractionLogs';
import { useOutletStatistics, useExtractionHistory } from '@/src/hooks/useExtractionHistory';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { LogList } from '@/components/ui/log-list';
import { Text } from '@/components/ui/text';
import { Play, Pause, RotateCw, Clock, CheckCircle2, XCircle, TrendingUp } from 'lucide-react-native';

export default function OutletDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: outlet, isLoading, error, refetch } = useOutletById(id!);
  const { data: statistics, isLoading: statsLoading } = useOutletStatistics(id!);
  const { data: history, isLoading: historyLoading } = useExtractionHistory(id!, 5);
  const { logs, isExtracting } = useExtractionLogs(id!);

  const updateFrequencies = useUpdateFrequencies();
  const startExtraction = useStartFullExtraction();
  const pauseOutlet = usePauseOutlet();
  const resumeOutlet = useResumeOutlet();

  const [extractionFreq, setExtractionFreq] = useState('');
  const [contentGenFreq, setContentGenFreq] = useState('');
  const [publishingFreq, setPublishingFreq] = useState('');

  useEffect(() => {
    if (outlet) {
      setExtractionFreq(outlet.extractionFrequency.toString());
      setContentGenFreq(outlet.contentGenerationFrequency.toString());
      setPublishingFreq(outlet.publishingFrequency.toString());
    }
  }, [outlet]);

  const handleSaveFrequencies = () => {
    const extractionVal = parseInt(extractionFreq);
    const contentGenVal = parseInt(contentGenFreq);
    const publishingVal = parseInt(publishingFreq);

    if (
      extractionVal < 1 ||
      extractionVal > 1440 ||
      contentGenVal < 1 ||
      contentGenVal > 1440 ||
      publishingVal < 1 ||
      publishingVal > 1440
    ) {
      return;
    }

    updateFrequencies.mutate({
      id: id!,
      dto: {
        extractionFrequency: extractionVal,
        contentGenerationFrequency: contentGenVal,
        publishingFrequency: publishingVal,
      },
    });
  };

  const handleStartExtraction = () => {
    startExtraction.mutate(id!);
  };

  const handlePause = () => {
    pauseOutlet.mutate(id!);
  };

  const handleResume = () => {
    resumeOutlet.mutate(id!);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background p-4">
        <Stack.Screen options={{ title: 'Cargando...' }} />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
      </View>
    );
  }

  if (error || !outlet) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-4">
        <Stack.Screen options={{ title: 'Error' }} />
        <Text className="text-destructive mb-4">Error al cargar el outlet</Text>
        <Button onPress={() => refetch()}>
          <Text>Reintentar</Text>
        </Button>
      </View>
    );
  }

  const lastExtraction = outlet.lastExtractionRun
    ? new Date(outlet.lastExtractionRun).toLocaleString('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'Nunca';

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-600">
            <Text className="text-white">Completado</Text>
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <Text>Error</Text>
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="secondary" className="bg-yellow-600">
            <Text className="text-white">Parcial</Text>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Text>En progreso</Text>
          </Badge>
        );
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <Stack.Screen options={{ title: outlet.name }} />

      <View className="p-4 gap-4">
        {/* 1. Header Section */}
        <Card>
          <CardHeader>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <CardTitle>{outlet.name}</CardTitle>
                <CardDescription className="mt-1">{outlet.baseUrl}</CardDescription>
              </View>
              <Badge variant={outlet.isActive ? 'default' : 'secondary'}>
                <Text>{outlet.isActive ? 'Activo' : 'Inactivo'}</Text>
              </Badge>
            </View>
          </CardHeader>
        </Card>

        {/* 2. Real-Time Logs Section - ALWAYS VISIBLE */}
        <Card>
          <CardHeader>
            <View className="flex-row items-center justify-between">
              <CardTitle>Logs de Extraccion</CardTitle>
              {isExtracting && (
                <Badge variant="default" className="bg-[#f1ef47]">
                  <Text className="text-black font-semibold">En Vivo</Text>
                </Badge>
              )}
            </View>
            <CardDescription>
              Seguimiento en tiempo real de las extracciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <View className="bg-muted/30 rounded-lg p-8 items-center justify-center">
                <Text className="text-muted-foreground text-center">
                  No hay extracciones en progreso.{'\n'}
                  Inicia una extraccion para ver los logs en tiempo real.
                </Text>
              </View>
            ) : (
              <LogList logs={logs} maxHeight={350} />
            )}
          </CardContent>
        </Card>

        {/* 3. Statistics Section - REAL DATA */}
        <Card>
          <CardHeader>
            <CardTitle>Estadisticas Reales</CardTitle>
            <CardDescription>Datos desde la base de datos</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <View className="gap-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </View>
            ) : (
              <View className="gap-3">
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-muted p-4 rounded-lg">
                    <View className="flex-row items-center gap-2 mb-2">
                      <TrendingUp size={16} color="#3b82f6" />
                      <Text className="text-xs text-muted-foreground">URLs Extraidas</Text>
                    </View>
                    <Text className="text-2xl font-bold">
                      {statistics?.totalUrlsExtracted ?? 0}
                    </Text>
                  </View>
                  <View className="flex-1 bg-muted p-4 rounded-lg">
                    <View className="flex-row items-center gap-2 mb-2">
                      <CheckCircle2 size={16} color="#22c55e" />
                      <Text className="text-xs text-muted-foreground">Extraidos OK</Text>
                    </View>
                    <Text className="text-2xl font-bold text-green-600">
                      {statistics?.totalContentExtracted ?? 0}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-muted p-4 rounded-lg">
                    <View className="flex-row items-center gap-2 mb-2">
                      <XCircle size={16} color="#ef4444" />
                      <Text className="text-xs text-muted-foreground">Fallos</Text>
                    </View>
                    <Text className="text-2xl font-bold text-red-600">
                      {statistics?.totalFailed ?? 0}
                    </Text>
                  </View>
                  <View className="flex-1 bg-muted p-4 rounded-lg">
                    <View className="flex-row items-center gap-2 mb-2">
                      <Clock size={16} color="#f59e0b" />
                      <Text className="text-xs text-muted-foreground">Tasa Exito</Text>
                    </View>
                    <Text className="text-2xl font-bold text-[#f1ef47]">
                      {statistics?.successRate?.toFixed(1) ?? 0}%
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </CardContent>
        </Card>

        {/* 4. Quick Actions Section - CARD-BASED */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rapidas</CardTitle>
            <CardDescription>Control del outlet y extracciones</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            {/* Start Extraction Card */}
            <TouchableOpacity
              onPress={handleStartExtraction}
              disabled={isExtracting || startExtraction.isPending}
              activeOpacity={0.7}
            >
              <View
                className={`bg-[#f1ef47] p-4 rounded-lg flex-row items-center gap-3 ${
                  (isExtracting || startExtraction.isPending) && 'opacity-50'
                }`}
                style={{ minHeight: 56 }}
              >
                {startExtraction.isPending ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Play size={20} color="#000" fill="#000" />
                )}
                <View className="flex-1">
                  <Text className="font-semibold text-black">Iniciar Extraccion</Text>
                  <Text className="text-xs text-black/70">Extraer URLs y contenido completo</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Pause/Resume Actions */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handlePause}
                disabled={pauseOutlet.isPending || !outlet.isActive}
                activeOpacity={0.7}
                className="flex-1"
              >
                <View
                  className={`bg-secondary p-4 rounded-lg flex-row items-center gap-3 ${
                    (pauseOutlet.isPending || !outlet.isActive) && 'opacity-50'
                  }`}
                  style={{ minHeight: 56 }}
                >
                  {pauseOutlet.isPending ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Pause size={18} color="#666" />
                  )}
                  <View className="flex-1">
                    <Text className="font-semibold">Pausar Outlet</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleResume}
                disabled={resumeOutlet.isPending || outlet.isActive}
                activeOpacity={0.7}
                className="flex-1"
              >
                <View
                  className={`bg-secondary p-4 rounded-lg flex-row items-center gap-3 ${
                    (resumeOutlet.isPending || outlet.isActive) && 'opacity-50'
                  }`}
                  style={{ minHeight: 56 }}
                >
                  {resumeOutlet.isPending ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <RotateCw size={18} color="#666" />
                  )}
                  <View className="flex-1">
                    <Text className="font-semibold">Reanudar</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        {/* 5. Extraction History Section */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Extracciones</CardTitle>
            <CardDescription>Ultimas 5 ejecuciones</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <View className="gap-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </View>
            ) : history && history.length > 0 ? (
              <View className="gap-2">
                {history.map((item, index) => (
                  <View key={item.id}>
                    <View className="bg-muted/50 p-3 rounded-lg">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs text-muted-foreground">
                          {new Date(item.startedAt).toLocaleString('es-MX', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </Text>
                        {getStatusBadge(item.status)}
                      </View>
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row gap-4">
                          <View>
                            <Text className="text-xs text-muted-foreground">URLs</Text>
                            <Text className="font-semibold">{item.totalUrlsFound}</Text>
                          </View>
                          <View>
                            <Text className="text-xs text-muted-foreground">Extraidos</Text>
                            <Text className="font-semibold text-green-600">
                              {item.totalContentExtracted}
                            </Text>
                          </View>
                          <View>
                            <Text className="text-xs text-muted-foreground">Fallos</Text>
                            <Text className="font-semibold text-red-600">
                              {item.totalFailed}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text className="text-xs text-muted-foreground">Duracion</Text>
                          <Text className="font-semibold">{formatDuration(item.duration)}</Text>
                        </View>
                      </View>
                      {item.errorMessage && (
                        <Text className="text-xs text-red-600 mt-2">
                          Error: {item.errorMessage}
                        </Text>
                      )}
                    </View>
                    {index < history.length - 1 && <Separator className="my-2" />}
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-muted/30 rounded-lg p-6 items-center">
                <Text className="text-muted-foreground text-center">
                  No hay historial de extracciones disponible
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* 6. Configuration Section */}
        <Card>
          <CardHeader>
            <CardTitle>Configuracion de Frecuencias</CardTitle>
            <CardDescription>Intervalos en minutos (1-1440)</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <View>
              <Label nativeID="extractionFreq">Extraccion de URLs</Label>
              <Input
                aria-labelledby="extractionFreq"
                keyboardType="numeric"
                value={extractionFreq}
                onChangeText={setExtractionFreq}
                placeholder="Ej: 60"
              />
            </View>
            <View>
              <Label nativeID="contentGenFreq">Generacion de Contenido</Label>
              <Input
                aria-labelledby="contentGenFreq"
                keyboardType="numeric"
                value={contentGenFreq}
                onChangeText={setContentGenFreq}
                placeholder="Ej: 120"
              />
            </View>
            <View>
              <Label nativeID="publishingFreq">Publicacion</Label>
              <Input
                aria-labelledby="publishingFreq"
                keyboardType="numeric"
                value={publishingFreq}
                onChangeText={setPublishingFreq}
                placeholder="Ej: 30"
              />
            </View>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onPress={handleSaveFrequencies}
              disabled={updateFrequencies.isPending}
            >
              {updateFrequencies.isPending && (
                <ActivityIndicator className="mr-2" size="small" color="white" />
              )}
              <Text>Guardar Frecuencias</Text>
            </Button>
          </CardFooter>
        </Card>

        {/* 7. Status Section */}
        <Card>
          <CardHeader>
            <CardTitle>Informacion del Outlet</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View>
              <Text className="text-sm text-muted-foreground">Ultima extraccion</Text>
              <Text className="text-base mt-1 font-medium">{lastExtraction}</Text>
            </View>
            <Separator />
            <View>
              <Text className="text-sm text-muted-foreground">Estado actual</Text>
              <Text className="text-base mt-1 font-medium">
                {outlet.isActive ? 'Activo - Scraping automatico' : 'Pausado'}
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
