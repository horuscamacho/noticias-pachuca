import { createServerFn } from '@tanstack/react-start';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  id?: string;
  error?: string;
}

/**
 * 📧 Server Function: Enviar formulario de contacto
 */
export const submitContact = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: ContactFormData }): Promise<ContactResponse> => {
    try {
      const url = `${API_BASE_URL}/public-content/contacto`;

      console.log(`[submitContact] Posting to: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al enviar el mensaje');
      }

      const result = await response.json();

      console.log(`[submitContact] Success: ${result.id}`);

      return {
        success: true,
        message: result.message,
        id: result.id,
      };
    } catch (error) {
      console.error('[submitContact] Error:', error);
      return {
        success: false,
        message: 'Error al enviar el mensaje. Por favor intenta de nuevo.',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },
);
