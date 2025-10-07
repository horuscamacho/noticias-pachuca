import { createServerFn } from '@tanstack/react-start';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface NewsletterSubscribeData {
  email: string;
  manana: boolean;
  tarde: boolean;
  semanal: boolean;
  deportes: boolean;
}

export interface NewsletterSubscribeResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * 📧 Server Function: Suscribirse a boletines
 */
export const subscribeNewsletter = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: NewsletterSubscribeData }): Promise<NewsletterSubscribeResponse> => {
    try {
      const url = `${API_BASE_URL}/public-content/suscribir-boletin`;

      console.log(`[subscribeNewsletter] Posting to: ${url}`);
      console.log(`[subscribeNewsletter] Data:`, data);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log(`[subscribeNewsletter] Response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error del servidor' }));
        console.error(`[subscribeNewsletter] Error response:`, error);
        throw new Error(error.message || 'Error al suscribirte');
      }

      const result = await response.json();
      console.log(`[subscribeNewsletter] Success:`, result);

      return {
        success: true,
        message: result.message || 'Te hemos enviado un email de confirmación',
      };
    } catch (error) {
      console.error('[subscribeNewsletter] Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al procesar tu suscripción',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },
);
