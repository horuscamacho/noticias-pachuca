/**
 * 📝 UserContentCard Component
 *
 * Card para mostrar contenido manual creado (URGENT o NORMAL)
 * - Muestra información básica del contenido
 * - Timer para contenido URGENT
 * - Badges de estado y modo
 * - Acciones: Ver detalle, Actualizar, Cerrar
 */

import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UrgentTimer } from './UrgentTimer';
import {
  UserGeneratedContent,
  UserContentStatus,
  UserContentMode,
} from '@/src/types/user-generated-content.types';
import {
  AlertCircle,
  FileText,
  Clock,
  Edit,
  XCircle,
  Eye,
  CheckCircle2,
  Loader2,
  XOctagon,
} from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface UserContentCardProps {
  content: UserGeneratedContent;
  onPress?: () => void;
  onUpdate?: () => void;
  onClose?: () => void;
  showActions?: boolean;
}

export function UserContentCard({
  content,
  onPress,
  onUpdate,
  onClose,
  showActions = true,
}: UserContentCardProps) {
  // Determine status color and icon
  const getStatusInfo = () => {
    switch (content.status) {
      case UserContentStatus.DRAFT:
        return { color: '#6b7280', icon: FileText, label: 'Borrador' };
      case UserContentStatus.PROCESSING:
        return { color: '#3b82f6', icon: Loader2, label: 'Procesando' };
      case UserContentStatus.PUBLISHED:
        return { color: '#10b981', icon: CheckCircle2, label: 'Publicado' };
      case UserContentStatus.CLOSED:
        return { color: '#ef4444', icon: XCircle, label: 'Cerrado' };
      case UserContentStatus.FAILED:
        return { color: '#dc2626', icon: XOctagon, label: 'Fallido' };
      default:
        return { color: '#6b7280', icon: FileText, label: content.status };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const ModeIcon = content.mode === UserContentMode.URGENT ? AlertCircle : FileText;

  // Determine if can update or close
  const canUpdate =
    content.isUrgent &&
    !content.urgentClosed &&
    content.status === UserContentStatus.PUBLISHED;

  const canClose =
    content.isUrgent &&
    !content.urgentClosed &&
    content.status === UserContentStatus.PUBLISHED;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <Card className="mb-3">
      <Pressable onPress={onPress} disabled={!onPress}>
        <CardHeader className="pb-3">
          {/* Header: Mode + Status */}
          <View className="flex-row items-center justify-between mb-2">
            {/* Mode Badge */}
            <View
              className={cn(
                'flex-row items-center gap-1 px-2 py-1 rounded-full',
                content.mode === UserContentMode.URGENT
                  ? 'bg-red-100'
                  : 'bg-blue-100'
              )}
            >
              <ModeIcon
                size={12}
                color={content.mode === UserContentMode.URGENT ? '#ef4444' : '#3b82f6'}
              />
              <Text
                className="text-xs font-bold"
                style={{
                  color:
                    content.mode === UserContentMode.URGENT ? '#ef4444' : '#3b82f6',
                }}
              >
                {content.mode === UserContentMode.URGENT ? 'URGENT' : 'NORMAL'}
              </Text>
            </View>

            {/* Status Badge */}
            <View className="flex-row items-center gap-1">
              <StatusIcon size={14} color={statusInfo.color} />
              <Text className="text-xs" style={{ color: statusInfo.color }}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text className="text-base font-bold text-foreground" numberOfLines={2}>
            {content.originalTitle}
          </Text>

          {/* Metadata */}
          <View className="flex-row items-center gap-2 mt-1">
            <Clock size={12} color="#6b7280" />
            <Text className="text-xs text-muted-foreground">
              {formatDate(content.createdAt)}
            </Text>
            {content.publicationType && (
              <>
                <Text className="text-xs text-muted-foreground">•</Text>
                <Text className="text-xs text-muted-foreground capitalize">
                  {content.publicationType}
                </Text>
              </>
            )}
            {content.urgentMetrics?.updatesCount && content.urgentMetrics.updatesCount > 0 && (
              <>
                <Text className="text-xs text-muted-foreground">•</Text>
                <Text className="text-xs text-muted-foreground">
                  {content.urgentMetrics.updatesCount} actualiz.
                </Text>
              </>
            )}
          </View>
        </CardHeader>

        <CardContent className="pt-0 gap-3">
          {/* Timer for URGENT content */}
          {content.isUrgent &&
            !content.urgentClosed &&
            content.urgentAutoCloseAt &&
            content.status === UserContentStatus.PUBLISHED && (
              <UrgentTimer
                urgentAutoCloseAt={content.urgentAutoCloseAt}
                compact={false}
                showProgressBar={true}
              />
            )}

          {/* Content preview */}
          <Text className="text-sm text-muted-foreground" numberOfLines={3}>
            {content.originalContent}
          </Text>

          {/* Media indicators */}
          {(content.uploadedImageUrls.length > 0 ||
            content.uploadedVideoUrls.length > 0) && (
            <View className="flex-row items-center gap-3">
              {content.uploadedImageUrls.length > 0 && (
                <Text className="text-xs text-muted-foreground">
                  📷 {content.uploadedImageUrls.length} imagen(es)
                </Text>
              )}
              {content.uploadedVideoUrls.length > 0 && (
                <Text className="text-xs text-muted-foreground">
                  🎥 {content.uploadedVideoUrls.length} video(s)
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          {showActions && (
            <View className="flex-row gap-2 mt-2">
              {/* Ver Detalle */}
              {onPress && (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={onPress}
                  className="flex-1 flex-row gap-1"
                >
                  <Eye size={14} />
                  <Text className="text-xs">Ver</Text>
                </Button>
              )}

              {/* Actualizar (solo URGENT activo) */}
              {canUpdate && onUpdate && (
                <Button
                  variant="default"
                  size="sm"
                  onPress={onUpdate}
                  className="flex-1 flex-row gap-1"
                >
                  <Edit size={14} />
                  <Text className="text-xs">Actualizar</Text>
                </Button>
              )}

              {/* Cerrar (solo URGENT activo) */}
              {canClose && onClose && (
                <Button
                  variant="destructive"
                  size="sm"
                  onPress={onClose}
                  className="flex-1 flex-row gap-1"
                >
                  <XCircle size={14} />
                  <Text className="text-xs">Cerrar</Text>
                </Button>
              )}
            </View>
          )}
        </CardContent>
      </Pressable>
    </Card>
  );
}
