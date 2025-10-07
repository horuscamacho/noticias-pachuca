import { createServerFn } from '@tanstack/react-start';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface UnsubscribeResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * 🚫 Server Function: Desuscribirse de boletines
 */
export const unsubscribe = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data: { token: string; reason?: string } }): Promise<UnsubscribeResponse> => {
    try {
      const url = data.reason
        ? `${API_BASE_URL}/public-content/desuscribir?token=${data.token}&reason=${encodeURIComponent(data.reason)}`
        : `${API_BASE_URL}/public-content/desuscribir?token=${data.token}`;

      console.log(`[unsubscribe] GET to: ${url}`);

      const response = await fetch(url);

      console.log(`[unsubscribe] Response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error del servidor' }));
        console.error(`[unsubscribe] Error response:`, error);
        throw new Error(error.message || 'Error al desuscribirse');
      }

      const result = await response.json();
      console.log(`[unsubscribe] Success:`, result);

      return {
        success: true,
        message: result.message || 'Te has desuscrito exitosamente',
      };
    } catch (error) {
      console.error('[unsubscribe] Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al procesar tu solicitud',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },
);
