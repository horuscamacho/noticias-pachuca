/**
 * 🔘 ModeSelector Component
 *
 * Selector de modo para contenido manual
 * - URGENT: Breaking news con auto-publicación
 * - NORMAL: Contenido estándar
 */

import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { UserContentMode } from '@/src/types/user-generated-content.types';
import { AlertCircle, FileText } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface ModeSelectorProps {
  selectedMode: UserContentMode;
  onModeChange: (mode: UserContentMode) => void;
  disabled?: boolean;
}

export function ModeSelector({
  selectedMode,
  onModeChange,
  disabled = false,
}: ModeSelectorProps) {
  const modes = [
    {
      value: UserContentMode.URGENT,
      label: 'URGENT',
      icon: AlertCircle,
      description: 'Breaking news de última hora',
      color: '#ef4444', // red-500
      bgColor: '#fee2e2', // red-100
    },
    {
      value: UserContentMode.NORMAL,
      label: 'NORMAL',
      icon: FileText,
      description: 'Contenido estándar',
      color: '#3b82f6', // blue-500
      bgColor: '#dbeafe', // blue-100
    },
  ];

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-foreground">Modo de Publicación</Text>
      <View className="flex-row gap-3">
        {modes.map((mode) => {
          const isSelected = selectedMode === mode.value;
          const Icon = mode.icon;

          return (
            <Pressable
              key={mode.value}
              onPress={() => !disabled && onModeChange(mode.value)}
              disabled={disabled}
              className={cn(
                'flex-1 rounded-lg border-2 p-4',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card',
                disabled && 'opacity-50'
              )}
            >
              <View className="gap-2">
                {/* Icon + Label */}
                <View className="flex-row items-center gap-2">
                  <View
                    className="rounded-full p-2"
                    style={{
                      backgroundColor: isSelected ? mode.color : mode.bgColor,
                    }}
                  >
                    <Icon
                      size={20}
                      color={isSelected ? '#fff' : mode.color}
                      strokeWidth={2.5}
                    />
                  </View>
                  <Text
                    className="text-base font-bold text-foreground"
                  >
                    {mode.label}
                  </Text>
                </View>

                {/* Description */}
                <Text className="text-xs text-muted-foreground">
                  {mode.description}
                </Text>

                {/* Selected indicator */}
                {isSelected && (
                  <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
