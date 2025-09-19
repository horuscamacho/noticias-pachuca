import { createContext, useContext } from 'react';
import type { SocketContextType } from '../types/socket-state';

// Contexto principal
export const SocketContext = createContext<SocketContextType | null>(null);

// Hook para usar el contexto
export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error(
      '🚨 useSocket debe usarse dentro de SocketProvider. ' +
      'Asegúrate de envolver tu app con <SocketProvider>'
    );
  }

  return context;
};

// Hook para socket instance directa
export const useSocketInstance = () => {
  const { socket } = useSocket();
  return socket;
};

// Hook para estado de conexión
export const useConnectionStatus = () => {
  const { isConnected, connectionState, lastPing } = useSocket();
  return { isConnected, connectionState, lastPing };
};