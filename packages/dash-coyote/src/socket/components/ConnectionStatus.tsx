import { useState, useEffect } from 'react';
import { useConnectionStatus } from '../context/SocketContext';
import { Badge } from '@/components/ui/badge';

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const ConnectionStatus = ({
  showDetails = false,
  className = ''
}: ConnectionStatusProps) => {
  const { isConnected, connectionState, lastPing } = useConnectionStatus();
  const [pingTime, setPingTime] = useState<number | null>(null);

  // 📊 Calcular latencia
  useEffect(() => {
    if (lastPing) {
      setPingTime(Date.now() - lastPing);
    }
  }, [lastPing]);

  const getStatusVariant = () => {
    switch (connectionState) {
      case 'connected': return 'default';
      case 'connecting':
      case 'reconnecting': return 'secondary';
      case 'error':
      case 'disconnected': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected': return '🟢';
      case 'connecting':
      case 'reconnecting': return '🟡';
      case 'error':
      case 'disconnected': return '🔴';
      default: return '⚪';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'reconnecting': return 'Reconectando...';
      case 'disconnected': return 'Desconectado';
      case 'error': return 'Error de conexión';
      default: return 'Estado desconocido';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Badge variant={getStatusVariant()} className="flex items-center gap-1">
        <span className="text-xs">{getStatusIcon()}</span>
        <span className="text-xs">{getStatusText()}</span>
      </Badge>

      {showDetails && isConnected && pingTime && (
        <Badge variant="outline" className="text-xs">
          📡 {pingTime}ms
        </Badge>
      )}
    </div>
  );
};

// 🎯 Componente compacto para header
export const ConnectionIndicator = () => {
  const { isConnected, connectionState } = useConnectionStatus();

  return (
    <div className="flex items-center gap-2">
      <div className={`
        w-2 h-2 rounded-full transition-colors duration-300
        ${isConnected ? 'bg-green-500' : 'bg-red-500'}
        ${connectionState === 'connecting' || connectionState === 'reconnecting'
          ? 'animate-pulse bg-yellow-500' : ''}
      `} />
      <span className="text-xs text-muted-foreground">
        {isConnected ? 'En línea' : 'Sin conexión'}
      </span>
    </div>
  );
};