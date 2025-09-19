// Exportar todo el sistema Socket.IO
export { SocketProvider } from './context/SocketProvider';
export { useSocket, useSocketInstance, useConnectionStatus } from './context/SocketContext';
export * from './hooks';
export * from './components';
export * from './types/socket-events';
export * from './types/socket-state';
export { SOCKET_CONFIG } from './config/socket-config';