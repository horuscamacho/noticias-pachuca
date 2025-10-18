import { createServerFn } from '@tanstack/react-start';
import { getSiteHeaders } from '../../../lib/site-headers';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface ConfirmSubscriptionResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * 🔓 Server Function: Confirmar suscripción a boletines
 * 🌐 FASE 6: Incluye header x-site-domain para multi-sitio
 */
export const confirmSubscription = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data: { token: string } }): Promise<ConfirmSubscriptionResponse> => {
    try {
      const url = `${API_BASE_URL}/public-content/confirmar-suscripcion?token=${data.token}`;

      console.log(`[confirmSubscription] GET to: ${url}`);

      const response = await fetch(url, {
        headers: getSiteHeaders(), // 🌐 FASE 6: Header con x-site-domain
      });

      console.log(`[confirmSubscription] Response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error del servidor' }));
        console.error(`[confirmSubscription] Error response:`, error);
        throw new Error(error.message || 'Error al confirmar suscripción');
      }

      const result = await response.json();
      console.log(`[confirmSubscription] Success:`, result);

      return {
        success: true,
        message: result.message || '¡Suscripción confirmada exitosamente!',
      };
    } catch (error) {
      console.error('[confirmSubscription] Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al confirmar tu suscripción',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },
);
