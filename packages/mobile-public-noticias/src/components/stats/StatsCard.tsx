import React from 'react';
import { View } from 'react-native';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  icon: string;
  title: string;
  value: number | string;
  subtitle?: string;
  variant?: 'default' | 'primary' | 'secondary';
  className?: string;
}

/**
 * 🌐 FASE 8: StatsCard Component
 * Card para mostrar estadísticas en el Home
 */
export function StatsCard({
  icon,
  title,
  value,
  subtitle,
  variant = 'default',
  className
}: StatsCardProps) {
  const variantStyles = {
    default: 'bg-card',
    primary: 'bg-primary/10 border-primary/20',
    secondary: 'bg-secondary/10 border-secondary/20'
  };

  return (
    <Card className={cn(variantStyles[variant], 'flex-1 min-w-[150px]', className)}>
      <CardContent className="pt-6 gap-2">
        {/* Icon y Title */}
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-2xl">{icon}</Text>
          <Text className="text-muted-foreground text-sm font-medium">{title}</Text>
        </View>

        {/* Value */}
        <Text className="text-3xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>

        {/* Subtitle (opcional) */}
        {subtitle && (
          <Text className="text-muted-foreground text-xs">{subtitle}</Text>
        )}
      </CardContent>
    </Card>
  );
}
