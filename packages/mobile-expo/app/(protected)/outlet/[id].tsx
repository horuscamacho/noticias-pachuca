import { ScrollView, View, ActivityIndicator } from 'react-native';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { LogList } from '@/components/ui/log-list';
import { Text } from '@/components/ui/text';

export default function OutletDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: outlet, isLoading, error, refetch } = useOutletById(id!);
  const { logs, isExtracting } = useExtractionLogs(id!);

  const updateFrequencies = useUpdateFrequencies();
  const startExtraction = useStartFullExtraction();
  const pauseOutlet = usePauseOutlet();
  const resumeOutlet = useResumeOutlet();

  const [extractionFreq, setExtractionFreq] = useState('');
  const [contentGenFreq, setContentGenFreq] = useState('');
  const [publishingFreq, setPublishingFreq] = useState('');
  const [isActiveLocal, setIsActiveLocal] = useState(false);

  useEffect(() => {
    if (outlet) {
      setExtractionFreq(outlet.extractionFrequency.toString());
      setContentGenFreq(outlet.contentGenerationFrequency.toString());
      setPublishingFreq(outlet.publishingFrequency.toString());
      setIsActiveLocal(outlet.isActive);
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

        {/* 2. Estadísticas Section */}
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="gap-3">
              <View className="flex-row gap-3">
                <View className="flex-1 bg-muted p-3 rounded-lg">
                  <Text className="text-sm text-muted-foreground">URLs Extraídas</Text>
                  <Text className="text-2xl font-bold mt-1">
                    {outlet.statistics.totalUrlsExtracted}
                  </Text>
                </View>
                <View className="flex-1 bg-muted p-3 rounded-lg">
                  <Text className="text-sm text-muted-foreground">Contenido Generado</Text>
                  <Text className="text-2xl font-bold mt-1">
                    {outlet.statistics.totalContentGenerated}
                  </Text>
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1 bg-muted p-3 rounded-lg">
                  <Text className="text-sm text-muted-foreground">Publicados</Text>
                  <Text className="text-2xl font-bold mt-1">
                    {outlet.statistics.totalPublished}
                  </Text>
                </View>
                <View className="flex-1 bg-muted p-3 rounded-lg">
                  <Text className="text-sm text-muted-foreground">Fallos</Text>
                  <Text className="text-2xl font-bold mt-1 text-destructive">
                    {outlet.statistics.failedExtractions}
                  </Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 3. Logs en Tiempo Real Section */}
        {isExtracting && logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Progreso de Extracción</CardTitle>
            </CardHeader>
            <CardContent>
              <LogList logs={logs} maxHeight={350} />
            </CardContent>
          </Card>
        )}

        {/* 4. Configuración de Frecuencias Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frecuencias de Scraping</CardTitle>
            <CardDescription>Configurar intervalos en minutos (1-1440)</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <View>
              <Label nativeID="extractionFreq">Extracción de URLs (minutos)</Label>
              <Input
                aria-labelledby="extractionFreq"
                keyboardType="numeric"
                value={extractionFreq}
                onChangeText={setExtractionFreq}
                placeholder="Ej: 60"
              />
            </View>
            <View>
              <Label nativeID="contentGenFreq">Generación de Contenido (minutos)</Label>
              <Input
                aria-labelledby="contentGenFreq"
                keyboardType="numeric"
                value={contentGenFreq}
                onChangeText={setContentGenFreq}
                placeholder="Ej: 120"
              />
            </View>
            <View>
              <Label nativeID="publishingFreq">Publicación (minutos)</Label>
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
              {updateFrequencies.isPending && <ActivityIndicator className="mr-2" size="small" color="white" />}
              <Text>Guardar Frecuencias</Text>
            </Button>
          </CardFooter>
        </Card>

        {/* 5. Estado del Outlet Section */}
        <Card>
          <CardHeader>
            <CardTitle>Estado</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <View className="flex-row items-center justify-between">
              <Label nativeID="activeSwitch">Outlet Activo</Label>
              <Switch checked={isActiveLocal} onCheckedChange={setIsActiveLocal} nativeID="activeSwitch" />
            </View>
            <Separator />
            <View>
              <Text className="text-sm text-muted-foreground">Última extracción</Text>
              <Text className="text-base mt-1">{lastExtraction}</Text>
            </View>
          </CardContent>
        </Card>

        {/* 6. Acciones Rápidas Section */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="gap-3">
              <View className="flex-row gap-3">
                <Button
                  className="flex-1"
                  variant="default"
                  onPress={handleStartExtraction}
                  disabled={isExtracting || startExtraction.isPending}
                >
                  {startExtraction.isPending && <ActivityIndicator className="mr-2" size="small" color="white" />}
                  <Text>🚀 Comenzar Extracción</Text>
                </Button>
                <Button
                  className="flex-1"
                  variant="secondary"
                  onPress={handlePause}
                  disabled={pauseOutlet.isPending}
                >
                  {pauseOutlet.isPending && <ActivityIndicator className="mr-2" size="small" />}
                  <Text>⏸️ Pausar</Text>
                </Button>
              </View>
              <View className="flex-row gap-3">
                <Button
                  className="flex-1"
                  variant="secondary"
                  onPress={handleResume}
                  disabled={resumeOutlet.isPending}
                >
                  {resumeOutlet.isPending && <ActivityIndicator className="mr-2" size="small" />}
                  <Text>▶️ Reanudar</Text>
                </Button>
                <Button
                  className="flex-1"
                  variant="default"
                  onPress={handleSaveFrequencies}
                  disabled={updateFrequencies.isPending}
                >
                  {updateFrequencies.isPending && <ActivityIndicator className="mr-2" size="small" color="white" />}
                  <Text>💾 Guardar Cambios</Text>
                </Button>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
