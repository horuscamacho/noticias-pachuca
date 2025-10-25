/**
 * ⏱️ UrgentTimer Component
 *
 * Muestra countdown para contenido URGENT
 * - Timer de 2 horas desde creación/actualización
 * - Progress bar visual
 * - Auto-actualización cada segundo
 * - Indicador de estado (activo/por expirar/expirado)
 */

import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Clock, AlertTriangle } from 'lucide-react-native';
import { useUrgentTimeRemaining } from '@/src/hooks/useUserContent';
import { cn } from '@/lib/utils';

interface UrgentTimerProps {
  urgentAutoCloseAt: string;
  compact?: boolean;
  showProgressBar?: boolean;
  className?: string;
}

export function UrgentTimer({
  urgentAutoCloseAt,
  compact = false,
  showProgressBar = true,
  className,
}: UrgentTimerProps) {
  const [, setTick] = useState(0);

  // Force re-render every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeRemaining = useUrgentTimeRemaining(urgentAutoCloseAt);

  // Determine status
  const getStatus = () => {
    if (timeRemaining.isExpired) {
      return { color: '#ef4444', label: 'EXPIRADO', icon: AlertTriangle };
    }
    if (timeRemaining.minutes < 30 && timeRemaining.hours === 0) {
      return { color: '#f59e0b', label: 'POR EXPIRAR', icon: AlertTriangle };
    }
    return { color: '#10b981', label: 'ACTIVO', icon: Clock };
  };

  const status = getStatus();
  const Icon = status.icon;

  // Format time
  const formatTime = () => {
    const { hours, minutes, seconds } = timeRemaining;
    if (timeRemaining.isExpired) {
      return 'Expirado';
    }
    if (compact) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <View className={cn('gap-2', className)}>
      {/* Timer Display */}
      <View className="flex-row items-center gap-2">
        <Icon size={16} color={status.color} />
        <View className="flex-1">
          <Text
            className="text-xs font-medium"
            style={{ color: status.color }}
          >
            {status.label}
          </Text>
          <Text className="text-base font-bold" style={{ color: status.color }}>
            {formatTime()}
          </Text>
        </View>
        {!compact && (
          <Text className="text-xs text-muted-foreground">
            {timeRemaining.percentage}%
          </Text>
        )}
      </View>

      {/* Progress Bar */}
      {showProgressBar && (
        <View className="h-2 bg-muted rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${timeRemaining.percentage}%`,
              backgroundColor: status.color,
            }}
          />
        </View>
      )}

      {/* Warning text */}
      {!compact && !timeRemaining.isExpired && timeRemaining.minutes < 30 && timeRemaining.hours === 0 && (
        <Text className="text-xs text-yellow-600">
          ⚠️ Este contenido se cerrará automáticamente en {timeRemaining.minutes} minutos
        </Text>
      )}

      {!compact && timeRemaining.isExpired && (
        <Text className="text-xs text-destructive">
          ❌ Este contenido ya no está activo. El sistema agregó un párrafo de cierre automáticamente.
        </Text>
      )}
    </View>
  );
}
