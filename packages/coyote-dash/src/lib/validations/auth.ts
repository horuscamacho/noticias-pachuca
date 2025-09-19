// 🔒 Validaciones de autenticación con Zod - Sin any's
import { z } from "zod";

// Schema para login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email es requerido")
    .email("Formato de email inválido")
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(128, "La contraseña es demasiado larga"),

  deviceId: z.string().optional(),
  rememberMe: z.boolean().optional().default(false),
});

// Schema robusto para registro
export const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, "Nombre es requerido")
    .max(50, "Nombre muy largo")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Solo letras y espacios permitidos"),

  lastName: z
    .string()
    .min(1, "Apellido es requerido")
    .max(50, "Apellido muy largo")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Solo letras y espacios permitidos"),

  username: z
    .string()
    .min(3, "Usuario debe tener al menos 3 caracteres")
    .max(20, "Usuario muy largo")
    .regex(/^[a-zA-Z0-9_-]+$/, "Solo letras, números, guiones y guiones bajos")
    .transform((username) => username.toLowerCase()),

  email: z
    .string()
    .min(1, "Email es requerido")
    .email("Formato de email inválido")
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(128, "Contraseña muy larga")
    .regex(/^(?=.*[a-z])/, "Debe contener al menos una minúscula")
    .regex(/^(?=.*[A-Z])/, "Debe contener al menos una mayúscula")
    .regex(/^(?=.*\d)/, "Debe contener al menos un número")
    .regex(/^(?=.*[@$!%*?&])/, "Debe contener un carácter especial (@$!%*?&)"),

  confirmPassword: z.string(),

  terms: z
    .boolean()
    .refine((val) => val === true, "Debes aceptar los términos y condiciones"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Schema para cambio de contraseña
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Contraseña actual es requerida"),

  newPassword: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(128, "Contraseña muy larga")
    .regex(/^(?=.*[a-z])/, "Debe contener al menos una minúscula")
    .regex(/^(?=.*[A-Z])/, "Debe contener al menos una mayúscula")
    .regex(/^(?=.*\d)/, "Debe contener al menos un número")
    .regex(/^(?=.*[@$!%*?&])/, "Debe contener un carácter especial"),

  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmNewPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "La nueva contraseña debe ser diferente a la actual",
  path: ["newPassword"],
});

// Schema para recuperar contraseña
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email es requerido")
    .email("Formato de email inválido")
    .transform((email) => email.toLowerCase()),
});

// Schema para reset de contraseña
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, "Token es requerido"),

  newPassword: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(128, "Contraseña muy larga")
    .regex(/^(?=.*[a-z])/, "Debe contener al menos una minúscula")
    .regex(/^(?=.*[A-Z])/, "Debe contener al menos una mayúscula")
    .regex(/^(?=.*\d)/, "Debe contener al menos un número")
    .regex(/^(?=.*[@$!%*?&])/, "Debe contener un carácter especial"),

  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmNewPassword"],
});

// Tipos derivados de los schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Validación de fortaleza de contraseña (helper)
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push("Al menos 8 caracteres");

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("Una letra minúscula");

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("Una letra mayúscula");

  if (/\d/.test(password)) score += 1;
  else feedback.push("Un número");

  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push("Un carácter especial (@$!%*?&)");

  return { score, feedback };
};

// Validador asíncrono para email único (ejemplo)
export const validateEmailUnique = async (email: string): Promise<boolean> => {
  try {
    // Simular llamada a API para verificar email
    const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`);
    return response.ok;
  } catch {
    // En caso de error, asumir que está disponible
    return true;
  }
};

// Validador asíncrono para username único
export const validateUsernameUnique = async (username: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
    return response.ok;
  } catch {
    return true;
  }
};