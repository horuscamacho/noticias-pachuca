import { z } from 'zod';

/**
 * Validation schema for user registration
 *
 * Requirements:
 * - First name: Minimum 2 characters
 * - Last name: Minimum 2 characters
 * - Email: Valid email format
 * - Birthdate: Minimum 18 years old
 * - Gender: One of male, female, other
 * - Password: Minimum 8 characters
 */
export const registerSchema = z.object({
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras'),

  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras'),

  email: z
    .string()
    .email('Ingresa un correo electrónico válido')
    .toLowerCase()
    .trim(),

  birthdate: z
    .date({
      required_error: 'Debes seleccionar tu fecha de nacimiento',
      invalid_type_error: 'Fecha inválida',
    })
    .refine(
      (date) => {
        const today = new Date();
        const eighteenYearsAgo = new Date(
          today.getFullYear() - 18,
          today.getMonth(),
          today.getDate()
        );
        return date <= eighteenYearsAgo;
      },
      {
        message: 'Debes tener al menos 18 años para registrarte',
      }
    ),

  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Debes seleccionar tu género',
    invalid_type_error: 'Selecciona una opción válida',
  }),

  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Debe contener mayúsculas, minúsculas y números'
    ),
});

/**
 * TypeScript type inferred from schema
 */
export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Helper to calculate age from birthdate
 */
export function calculateAge(birthdate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Gender options for segmented control
 */
export const GENDER_OPTIONS = [
  { label: 'Hombre', value: 'male' as const },
  { label: 'Mujer', value: 'female' as const },
  { label: 'Otro', value: 'other' as const },
];
