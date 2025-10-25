/**
 * GenerationProgress Component
 * Muestra progreso y logs de generación de imágenes AI
 */

import React from 'react';
import { View } from 'react-native';
import { Loader2, Image, Upload, Check } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LogList } from '@/components/ui/log-list';
import { cn } from '@/lib/utils';
import type { LogItem } from '@/src/types/outlet.types';

interface GenerationProgressProps {
  logs: LogItem[];
  progress: number;
  cost?: number;
  isGenerating: boolean;
}

interface ProgressStep {
  key: string;
  label: string;
  icon: typeof Loader2;
  threshold: number;
}

const PROGRESS_STEPS: ProgressStep[] = [
  {
    key: 'preparing',
    label: 'Preparando solicitud',
    icon: Loader2,
    threshold: 0,
  },
  {
    key: 'generating',
    label: 'Generando imagen AI',
    icon: Image,
    threshold: 20,
  },
  {
    key: 'processing',
    label: 'Procesando decoraciones',
    icon: Loader2,
    threshold: 60,
  },
  {
    key: 'uploading',
    label: 'Subiendo a storage',
    icon: Upload,
    threshold: 80,
  },
  {
    key: 'completed',
    label: 'Completado',
    icon: Check,
    threshold: 100,
  },
];

const BRAND_YELLOW = '#f1ef47';

export function GenerationProgress({
  logs,
  progress,
  cost,
  isGenerating,
}: GenerationProgressProps) {
  const currentStep = PROGRESS_STEPS.reduce((current, step) => {
    if (progress >= step.threshold) {
      return step;
    }
    return current;
  }, PROGRESS_STEPS[0]);

  const IconComponent = currentStep.icon;

  return (
    <View className="gap-4">
      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso de generación</CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
          {/* Progress Bar */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                {isGenerating && progress < 100 && (
                  <View className="animate-spin">
                    <IconComponent size={16} color={BRAND_YELLOW} />
                  </View>
                )}
                {progress === 100 && (
                  <Check size={16} color="#22C55E" />
                )}
                <Text className="text-sm font-medium">
                  {currentStep.label}
                </Text>
              </View>
              <Text className="text-sm font-bold" style={{ color: BRAND_YELLOW }}>
                {progress}%
              </Text>
            </View>

            {/* Progress Bar Visual */}
            <View className="h-2 bg-muted rounded-full overflow-hidden">
              <View
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  backgroundColor: progress === 100 ? '#22C55E' : BRAND_YELLOW,
                }}
              />
            </View>
          </View>

          {/* Steps Indicator */}
          <View className="flex-row justify-between mt-2">
            {PROGRESS_STEPS.slice(0, -1).map((step, index) => {
              const isActive = progress >= step.threshold;
              const isCompleted = progress > step.threshold;

              return (
                <View key={step.key} className="flex-1 items-center gap-1">
                  <View
                    className={cn(
                      'w-8 h-8 rounded-full items-center justify-center',
                      isCompleted && 'bg-green-500',
                      isActive && !isCompleted && 'bg-[#f1ef47]',
                      !isActive && 'bg-muted'
                    )}
                  >
                    <step.icon
                      size={16}
                      color={isActive || isCompleted ? '#000' : '#999'}
                    />
                  </View>
                  <Text className="text-[10px] text-center text-muted-foreground">
                    {step.label.split(' ')[0]}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Cost Display */}
          {cost !== undefined && (
            <View className="flex-row items-center justify-between p-3 bg-muted/50 rounded-lg mt-2">
              <Text className="text-sm text-muted-foreground">
                Costo de generación:
              </Text>
              <Text className="font-bold" style={{ color: BRAND_YELLOW }}>
                ${cost.toFixed(2)} USD
              </Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Logs Display */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registro de actividad</CardTitle>
          </CardHeader>
          <CardContent>
            <LogList
              logs={logs}
              maxHeight={300}
              autoScroll={true}
            />
          </CardContent>
        </Card>
      )}
    </View>
  );
}
