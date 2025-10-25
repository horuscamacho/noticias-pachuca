import { z } from 'zod';

/**
 * Validation schema for user login
 *
 * Requirements:
 * - Email: Valid email format
 * - Password: Minimum 8 characters
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Ingresa un correo electrónico válido')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),
});

/**
 * TypeScript type inferred from schema
 */
export type LoginFormData = z.infer<typeof loginSchema>;
