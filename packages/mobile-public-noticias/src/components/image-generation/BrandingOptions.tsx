/**
 * BrandingOptions Component
 * Opciones de branding para generación de imágenes AI
 */

import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BrandingOptionsProps {
  includeDecorations: boolean;
  onToggleDecorations: (value: boolean) => void;
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  maxKeywords?: number;
}

const BRAND_YELLOW = '#f1ef47';

export function BrandingOptions({
  includeDecorations,
  onToggleDecorations,
  keywords,
  onKeywordsChange,
  maxKeywords = 5,
}: BrandingOptionsProps) {
  const [keywordInput, setKeywordInput] = useState('');

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();

    if (trimmed.length === 0) {
      return;
    }

    if (keywords.length >= maxKeywords) {
      return;
    }

    if (keywords.includes(trimmed)) {
      setKeywordInput('');
      return;
    }

    onKeywordsChange([...keywords, trimmed]);
    setKeywordInput('');
  };

  const handleRemoveKeyword = (keyword: string) => {
    onKeywordsChange(keywords.filter((k) => k !== keyword));
  };

  const canAddKeyword = keywordInput.trim().length > 0 && keywords.length < maxKeywords;

  return (
    <View className="gap-4">
      {/* Decorations Toggle */}
      <View className="gap-2">
        <Label>Elementos de marca</Label>
        <View className="flex-row items-center justify-between p-4 bg-card rounded-lg border border-border">
          <View className="flex-1 pr-4">
            <Text className="font-medium mb-1">
              Incluir decoraciones Coyote
            </Text>
            <Text className="text-sm text-muted-foreground">
              Logo, watermark y elementos visuales de marca
            </Text>
          </View>
          <Switch
            checked={includeDecorations}
            onCheckedChange={onToggleDecorations}
          />
        </View>
      </View>

      {/* Keywords Input */}
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Label>Palabras clave (opcional)</Label>
          <Text className="text-xs text-muted-foreground">
            {keywords.length} / {maxKeywords}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Input
            value={keywordInput}
            onChangeText={setKeywordInput}
            placeholder="Agregar keyword..."
            className="flex-1"
            onSubmitEditing={handleAddKeyword}
            returnKeyType="done"
            maxLength={30}
          />
          <Pressable
            onPress={handleAddKeyword}
            disabled={!canAddKeyword}
            className={cn(
              'h-10 px-4 rounded-md items-center justify-center',
              canAddKeyword ? 'bg-[#f1ef47]' : 'bg-muted'
            )}
          >
            <Text
              className={cn(
                'font-semibold',
                canAddKeyword ? 'text-black' : 'text-muted-foreground'
              )}
            >
              Agregar
            </Text>
          </Pressable>
        </View>

        {/* Keywords List */}
        {keywords.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mt-2">
            {keywords.map((keyword) => (
              <Pressable
                key={keyword}
                onPress={() => handleRemoveKeyword(keyword)}
                className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border-2 border-[#f1ef47] bg-[#f1ef47]/10"
              >
                <Text className="text-sm font-medium">{keyword}</Text>
                <X size={14} color="#000" />
              </Pressable>
            ))}
          </View>
        )}

        {/* Helper Text */}
        {includeDecorations && (
          <View className="mt-2 p-3 bg-muted/50 rounded-lg">
            <Text className="text-xs text-muted-foreground">
              💡 Las imágenes incluirán watermark "Coyote Noticias" y podrán usar tus keywords para personalización
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
