/**
 * 📝 UserContentForm Component
 *
 * Formulario principal para crear contenido manual (URGENT o NORMAL)
 * - Modo URGENT: Breaking news con auto-publicación y timer de 2 horas
 * - Modo NORMAL: Contenido estándar con tipo seleccionable
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileUploadSection } from './FileUploadSection';
import { ModeSelector } from './ModeSelector';
import {
  UserContentMode,
  PublicationType,
  CreateUrgentContentDto,
  CreateNormalContentDto,
} from '@/src/types/user-generated-content.types';
import {
  useCreateUrgentContent,
  useCreateNormalContent,
} from '@/src/hooks/useUserContent';
import { useSites } from '@/src/hooks/useSites';
import { useContentAgents } from '@/src/hooks/useContentAgents';

interface UserContentFormProps {
  onSuccess?: (contentId: string) => void;
  onCancel?: () => void;
  initialMode?: UserContentMode;
}

export function UserContentForm({
  onSuccess,
  onCancel,
  initialMode = UserContentMode.NORMAL,
}: UserContentFormProps) {
  // State
  const [mode, setMode] = useState<UserContentMode>(initialMode);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publicationType, setPublicationType] = useState<PublicationType>(
    PublicationType.NOTICIA
  );
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  // Mutations
  const createUrgent = useCreateUrgentContent();
  const createNormal = useCreateNormalContent();

  // Get sites for selector
  const { data: sitesData } = useSites({ isActive: true });
  const sites = sitesData?.sites || [];
  const selectedSite = sites.find(site => site.id === selectedSiteId);

  // Get agents for selector (API retorna directamente el array)
  const { data: agents } = useContentAgents({ isActive: true });
  const selectedAgent = agents?.find(agent => agent.id === selectedAgentId);

  const isLoading = createUrgent.isPending || createNormal.isPending;

  // Reset form cuando cambia el modo
  useEffect(() => {
    if (mode === UserContentMode.URGENT) {
      setPublicationType(PublicationType.BREAKING);
    } else {
      setPublicationType(PublicationType.NOTICIA);
    }
  }, [mode]);

  // Validación simple (sin Alerts) - solo para deshabilitar botón
  const isValid = () => {
    return (
      selectedSiteId.length > 0 &&
      selectedAgentId.length > 0 &&
      title.trim().length >= 10 &&
      title.trim().length <= 200 &&
      content.trim().length >= 50 &&
      imageUrls.length <= 10 &&
      videoUrls.length <= 5
    );
  };

  // Validación con mensajes de error (solo para submit)
  const validateWithErrors = () => {
    if (!selectedSiteId) {
      Alert.alert('Error', 'Debes seleccionar un sitio donde publicar');
      return false;
    }
    if (!selectedAgentId) {
      Alert.alert('Error', 'Debes seleccionar un agente editorial');
      return false;
    }
    if (title.trim().length < 10) {
      Alert.alert('Error', 'El título debe tener al menos 10 caracteres');
      return false;
    }
    if (title.trim().length > 200) {
      Alert.alert('Error', 'El título no puede exceder 200 caracteres');
      return false;
    }
    if (content.trim().length < 50) {
      Alert.alert('Error', 'El contenido debe tener al menos 50 caracteres');
      return false;
    }
    if (imageUrls.length > 10) {
      Alert.alert('Error', 'Máximo 10 imágenes permitidas');
      return false;
    }
    if (videoUrls.length > 5) {
      Alert.alert('Error', 'Máximo 5 videos permitidos');
      return false;
    }
    return true;
  };

  // Handlers
  const handleSubmit = async () => {
    if (!validateWithErrors()) return;

    if (mode === UserContentMode.URGENT) {
      // Confirmar creación de contenido URGENT
      Alert.alert(
        '🚨 Crear Contenido URGENT',
        'Este contenido se publicará INMEDIATAMENTE como breaking news y se auto-cerrará en 2 horas sin actualización.\n\n¿Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Publicar Ahora',
            style: 'destructive',
            onPress: () => {
              const dto: CreateUrgentContentDto = {
                originalTitle: title.trim(),
                originalContent: content.trim(),
                agentId: selectedAgentId,
                siteId: selectedSiteId,
                uploadedImageUrls: imageUrls.length > 0 ? imageUrls : undefined,
                uploadedVideoUrls: videoUrls.length > 0 ? videoUrls : undefined,
              };

              console.log('🚨 [URGENT] Payload being sent:', JSON.stringify(dto, null, 2));

              // Fire-and-forget: Enviar sin esperar respuesta
              createUrgent.mutate(dto, {
                onSuccess: (data) => {
                  console.log('✅ [URGENT] Contenido enviado para procesamiento:', data.content.id);
                },
                onError: (error) => {
                  // Silenciar errores de timeout - el contenido se está procesando en background
                  const errorMessage = error instanceof Error ? error.message : String(error);
                  if (errorMessage.includes('timeout')) {
                    console.log('⏱️ [URGENT] Request timeout (esperado) - contenido procesándose en background');
                  } else {
                    console.error('❌ [URGENT] Error al enviar contenido:', error);
                  }
                }
              });

              // Cerrar formulario inmediatamente
              Alert.alert(
                '⏳ Procesando Contenido URGENT',
                'Tu breaking news se está generando con IA. Recibirás una notificación cuando esté listo.',
                [{ text: 'OK', onPress: () => onSuccess?.('pending') }]
              );
            },
          },
        ]
      );
    } else {
      // Crear contenido NORMAL
      const dto: CreateNormalContentDto = {
        originalTitle: title.trim(),
        originalContent: content.trim(),
        agentId: selectedAgentId,
        siteId: selectedSiteId,
        publicationType,
        uploadedImageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        uploadedVideoUrls: videoUrls.length > 0 ? videoUrls : undefined,
      };

      console.log('📝 [NORMAL] Modo seleccionado:', mode);
      console.log('📝 [NORMAL] Payload being sent:', JSON.stringify(dto, null, 2));

      // Fire-and-forget: Enviar sin esperar respuesta
      createNormal.mutate(dto, {
        onSuccess: (data) => {
          console.log('✅ [NORMAL] Contenido enviado para procesamiento:', data.content.id);
        },
        onError: (error) => {
          // Silenciar errores de timeout - el contenido se está procesando en background
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('timeout')) {
            console.log('⏱️ [NORMAL] Request timeout (esperado) - contenido procesándose en background');
          } else {
            console.error('❌ [NORMAL] Error al enviar contenido:', error);
          }
        }
      });

      // Cerrar formulario inmediatamente
      Alert.alert(
        '⏳ Procesando Contenido',
        `Tu ${publicationType} se está generando con IA. Recibirás una notificación cuando esté listo.`,
        [{ text: 'OK', onPress: () => onSuccess?.('pending') }]
      );
    }
  };

  const handleCancel = () => {
    if (title.trim() || content.trim() || imageUrls.length > 0 || videoUrls.length > 0) {
      Alert.alert('Cancelar', '¿Descartar los cambios?', [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, descartar',
          style: 'destructive',
          onPress: onCancel,
        },
      ]);
    } else {
      onCancel?.();
    }
  };

  const wordCount = content.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const targetWords = mode === UserContentMode.URGENT ? '300-500' : '500-700';

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={true}
    >
      <View className="p-4 gap-6">
        {/* Mode Selector */}
        <ModeSelector
          selectedMode={mode}
          onModeChange={setMode}
          disabled={isLoading}
        />

        {/* Site Selector */}
        <View className="gap-2">
          <Label>
            Sitio donde publicar *
          </Label>
          {sites.length === 0 ? (
            <Text className="text-sm text-muted-foreground">
              Cargando sitios...
            </Text>
          ) : (
            <View className="gap-2">
              {sites.map((site) => (
                <Button
                  key={site.id}
                  variant={selectedSiteId === site.id ? 'default' : 'outline'}
                  onPress={() => setSelectedSiteId(site.id)}
                  disabled={isLoading}
                  className="w-full justify-start"
                >
                  <View className="flex-row items-center gap-2">
                    <Text className={selectedSiteId === site.id ? 'font-bold' : ''}>
                      {site.name}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      ({site.domain})
                    </Text>
                  </View>
                </Button>
              ))}
            </View>
          )}
        </View>

        {/* Agent Selector */}
        <View className="gap-2">
          <Label>
            Agente editorial *
            <Text className="text-muted-foreground text-xs"> - Define el estilo de redacción</Text>
          </Label>
          {!agents || agents.length === 0 ? (
            <Text className="text-sm text-muted-foreground">
              Cargando agentes...
            </Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {agents.map((agent) => (
                <Button
                  key={agent.id}
                  variant={selectedAgentId === agent.id ? 'default' : 'outline'}
                  onPress={() => setSelectedAgentId(agent.id)}
                  disabled={isLoading}
                  className="flex-1 min-w-[45%]"
                >
                  <Text className={selectedAgentId === agent.id ? 'font-bold' : ''}>
                    {agent.agentType === 'reportero' && '📰'}
                    {agent.agentType === 'columnista' && '✍️'}
                    {agent.agentType === 'trascendido' && '🔍'}
                    {agent.agentType === 'seo-specialist' && '🎯'}
                    {' '}{agent.name}
                  </Text>
                </Button>
              ))}
            </View>
          )}
        </View>

        {/* Título */}
        <View className="gap-2">
          <Label>
            Título *
            {mode === UserContentMode.URGENT && (
              <Text className="text-destructive"> (URGENT)</Text>
            )}
          </Label>
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder={
              mode === UserContentMode.URGENT
                ? 'Ej: Accidente múltiple en carretera Pachuca-México'
                : 'Ej: Nueva inversión en infraestructura educativa'
            }
            maxLength={200}
            editable={!isLoading}
            className="text-base"
          />
          <Text className="text-xs text-muted-foreground text-right">
            {title.length} / 200 caracteres
          </Text>
        </View>

        {/* Tipo de Publicación (solo NORMAL) */}
        {mode === UserContentMode.NORMAL && (
          <View className="gap-2">
            <Label>Tipo de Publicación</Label>
            <View className="flex-row gap-2">
              {[
                { value: PublicationType.NOTICIA, label: '📰 Noticia' },
                { value: PublicationType.BREAKING, label: '🚨 Breaking' },
                { value: PublicationType.BLOG, label: '📝 Blog' },
              ].map((type) => (
                <Button
                  key={type.value}
                  variant={publicationType === type.value ? 'default' : 'outline'}
                  onPress={() => setPublicationType(type.value)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Text>{type.label}</Text>
                </Button>
              ))}
            </View>
          </View>
        )}

        {/* Contenido */}
        <View className="gap-2">
          <Label>
            Contenido *
            <Text className="text-muted-foreground text-xs">
              {' '}
              (Objetivo: {targetWords} palabras)
            </Text>
          </Label>
          <Input
            value={content}
            onChangeText={setContent}
            placeholder={
              mode === UserContentMode.URGENT
                ? 'Describe la noticia de última hora con información esencial y verificable...'
                : 'Escribe el contenido completo con contexto, detalles y perspectiva...'
            }
            multiline
            numberOfLines={14}
            className="text-base"
            style={{
              textAlignVertical: 'top',
              height: 280,
              paddingTop: 12,
              paddingBottom: 12
            }}
            editable={!isLoading}
          />
          <View className="flex-row justify-between mt-2">
            <Text className="text-xs text-muted-foreground">
              {wordCount} palabras
            </Text>
            <Text className="text-xs text-muted-foreground">
              {content.length} caracteres
            </Text>
          </View>
          {wordCount > 0 && (
            <Text
              className={`text-xs ${
                mode === UserContentMode.URGENT
                  ? wordCount >= 300 && wordCount <= 500
                    ? 'text-green-600'
                    : 'text-yellow-600'
                  : wordCount >= 500 && wordCount <= 700
                    ? 'text-green-600'
                    : 'text-yellow-600'
              }`}
            >
              {mode === UserContentMode.URGENT
                ? wordCount < 300
                  ? `Faltan ${300 - wordCount} palabras para el mínimo`
                  : wordCount > 500
                    ? `${wordCount - 500} palabras sobre el máximo`
                    : '✓ Longitud ideal'
                : wordCount < 500
                  ? `Faltan ${500 - wordCount} palabras para el mínimo`
                  : wordCount > 700
                    ? `${wordCount - 700} palabras sobre el máximo`
                    : '✓ Longitud ideal'}
            </Text>
          )}
        </View>

        {/* File Upload Section */}
        <View className="mt-4">
          <FileUploadSection
            imageUrls={imageUrls}
            videoUrls={videoUrls}
            onImageUrlsChange={setImageUrls}
            onVideoUrlsChange={setVideoUrls}
            disabled={isLoading}
            maxImages={10}
            maxVideos={5}
            outlet={selectedSite?.domain || ''}
          />
        </View>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {mode === UserContentMode.URGENT ? '🚨 Modo URGENT' : '📝 Modo NORMAL'}
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-2">
            {mode === UserContentMode.URGENT ? (
              <>
                <Text className="text-sm">
                  • ⚡ <Text className="font-bold">Auto-publicación inmediata</Text>
                </Text>
                <Text className="text-sm">
                  • 📏 <Text className="font-bold">Redacción corta</Text> (300-500
                  palabras)
                </Text>
                <Text className="text-sm">
                  • 🔥 <Text className="font-bold">Copys agresivos</Text> para redes
                  sociales
                </Text>
                <Text className="text-sm">
                  • ⏰{' '}
                  <Text className="font-bold">Auto-cierre en 2 horas</Text> sin
                  actualización
                </Text>
              </>
            ) : (
              <>
                <Text className="text-sm">
                  • 📰 <Text className="font-bold">Tipo seleccionable</Text>{' '}
                  (noticia/breaking/blog)
                </Text>
                <Text className="text-sm">
                  • 📏 <Text className="font-bold">Redacción estándar</Text> (500-700
                  palabras)
                </Text>
                <Text className="text-sm">
                  • 📱 <Text className="font-bold">Copys balanceados</Text> para redes
                  sociales
                </Text>
                <Text className="text-sm">
                  • ♾️ <Text className="font-bold">No se auto-cierra</Text>
                </Text>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <View className="flex-row gap-3 pb-8">
          <Button
            variant="outline"
            onPress={handleCancel}
            disabled={isLoading}
            className="flex-1"
          >
            <Text>Cancelar</Text>
          </Button>
          <Button
            onPress={handleSubmit}
            disabled={isLoading || !isValid()}
            className="flex-1"
          >
            <Text>
              {isLoading
                ? 'Publicando...'
                : mode === UserContentMode.URGENT
                  ? '🚨 Publicar Ahora'
                  : '📝 Publicar Contenido'}
            </Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
