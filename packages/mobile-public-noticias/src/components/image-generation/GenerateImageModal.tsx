/**
 * GenerateImageModal Component
 * Modal para generar imágenes AI con configuración de branding
 */

import React, { useState } from 'react';
import { View, Modal, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { X } from 'lucide-react-native';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { BrandingOptions } from './BrandingOptions';

interface GenerateImageModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (request: App.GenerateImageRequest) => void;
  initialPrompt?: string;
  extractedNoticiaId?: string;
}

interface QualityOption {
  value: App.ImageQuality;
  label: string;
  cost: number;
  description: string;
}

const QUALITY_OPTIONS: QualityOption[] = [
  {
    value: 'low',
    label: 'Baja',
    cost: 0.01,
    description: '512x512 - Rápido'
  },
  {
    value: 'medium',
    label: 'Media',
    cost: 0.04,
    description: '1024x1024 - Balance'
  },
  {
    value: 'high',
    label: 'Alta',
    cost: 0.17,
    description: '1792x1024 - Premium'
  },
];

const BRAND_YELLOW = '#f1ef47';

export function GenerateImageModal({
  visible,
  onClose,
  onGenerate,
  initialPrompt = '',
  extractedNoticiaId,
}: GenerateImageModalProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [quality, setQuality] = useState<App.ImageQuality>('medium');
  const [includeDecorations, setIncludeDecorations] = useState(true);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedQuality = QUALITY_OPTIONS.find((q) => q.value === quality);
  const estimatedCost = selectedQuality?.cost || 0;

  const handleGenerate = () => {
    if (prompt.trim().length === 0) {
      return;
    }

    const request: App.GenerateImageRequest = {
      prompt: prompt.trim(),
      quality,
      includeDecorations,
      keywords: keywords.length > 0 ? keywords : undefined,
      extractedNoticiaId,
    };

    setIsGenerating(true);
    onGenerate(request);
  };

  const handleClose = () => {
    if (!isGenerating) {
      setPrompt(initialPrompt);
      setQuality('medium');
      setIncludeDecorations(true);
      setKeywords([]);
      onClose();
    }
  };

  const isValid = prompt.trim().length > 0 && prompt.trim().length <= 2000;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Text className="text-lg font-bold" style={{ fontFamily: 'Aleo' }}>
            Generar Imagen AI
          </Text>
          <Pressable
            onPress={handleClose}
            disabled={isGenerating}
            className="p-2"
          >
            <X size={24} color={isGenerating ? '#999' : '#000'} />
          </Pressable>
        </View>

        <ScrollView className="flex-1">
          <View className="p-4 gap-6">
            {/* Prompt Input */}
            <View className="gap-2">
              <Label>
                Descripción de la imagen *
              </Label>
              <Input
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Describe la imagen que quieres generar..."
                multiline
                numberOfLines={4}
                maxLength={2000}
                className="min-h-[100px] text-base"
                style={{ textAlignVertical: 'top' }}
                editable={!isGenerating}
              />
              <Text className="text-xs text-muted-foreground text-right">
                {prompt.length} / 2000
              </Text>
            </View>

            {/* Quality Selector */}
            <View className="gap-2">
              <Label>Calidad de imagen</Label>
              <View className="gap-2">
                {QUALITY_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setQuality(option.value)}
                    disabled={isGenerating}
                    className={cn(
                      'p-4 rounded-lg border-2 flex-row items-center justify-between',
                      quality === option.value
                        ? 'border-[#f1ef47] bg-[#f1ef47]/10'
                        : 'border-border bg-card'
                    )}
                  >
                    <View className="flex-1">
                      <Text className="font-semibold">{option.label}</Text>
                      <Text className="text-sm text-muted-foreground">
                        {option.description}
                      </Text>
                    </View>
                    <Text className="font-bold" style={{ color: BRAND_YELLOW }}>
                      ${option.cost.toFixed(2)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Branding Options */}
            <BrandingOptions
              includeDecorations={includeDecorations}
              onToggleDecorations={setIncludeDecorations}
              keywords={keywords}
              onKeywordsChange={setKeywords}
              maxKeywords={5}
            />

            {/* Cost Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Calidad:</Text>
                  <Text className="font-medium">{selectedQuality?.label}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Decoraciones:</Text>
                  <Text className="font-medium">
                    {includeDecorations ? 'Sí' : 'No'}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Keywords:</Text>
                  <Text className="font-medium">{keywords.length}</Text>
                </View>
                <View className="h-px bg-border my-2" />
                <View className="flex-row justify-between">
                  <Text className="font-bold">Costo estimado:</Text>
                  <Text className="font-bold text-lg" style={{ color: BRAND_YELLOW }}>
                    ${estimatedCost.toFixed(2)} USD
                  </Text>
                </View>
              </CardContent>
            </Card>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View className="p-4 border-t border-border gap-3">
          <Button
            onPress={handleGenerate}
            disabled={!isValid || isGenerating}
            style={{ backgroundColor: isValid && !isGenerating ? BRAND_YELLOW : undefined }}
          >
            <Text className="font-bold" style={{ color: '#000' }}>
              {isGenerating ? 'Generando...' : `Generar por $${estimatedCost.toFixed(2)}`}
            </Text>
          </Button>
          <Button
            variant="outline"
            onPress={handleClose}
            disabled={isGenerating}
          >
            <Text>Cancelar</Text>
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
