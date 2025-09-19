/**
 * 🔌 CONFIGURACIÓN UNIVERSAL SOCKET.IO
 */

// Función para obtener el token del auth store
const getAuthToken = () => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.tokens?.accessToken || null;
    }
    return null;
  } catch (error) {
    console.warn('Error getting auth token:', error);
    return null;
  }
};

export const SOCKET_CONFIG = {
  // URL del backend (desde .env)
  url: import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3000',

  // Opciones de conexión
  options: {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    forceNew: false,

    // Headers de autenticación
    extraHeaders: {
      'x-platform': 'web',
      'x-device-id': `web_${Date.now()}`,
    },

    // Transports
    transports: ['websocket', 'polling'],

    // Auth - usando token del auth store
    auth: (cb: (data: any) => void) => {
      const token = getAuthToken();
      console.log('🔑 Enviando token Socket.IO:', token ? 'Token presente' : 'Sin token');
      console.log('🔑 Token completo (primeros 20 chars):', token ? token.substring(0, 20) + '...' : 'null');
      cb({ token });
    }
  }
} as const;