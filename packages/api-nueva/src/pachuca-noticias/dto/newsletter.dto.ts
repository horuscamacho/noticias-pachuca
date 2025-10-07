import { IsString, IsEmail, IsBoolean, IsOptional, MinLength, MaxLength, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 📧 DTO para suscripción a boletín
 */
export class SubscribeNewsletterDto {
  @IsEmail({}, { message: 'Debes proporcionar un email válido' })
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name?: string;

  @IsBoolean()
  @IsOptional()
  manana?: boolean; // Boletín de la mañana (6:00 AM)

  @IsBoolean()
  @IsOptional()
  tarde?: boolean; // Boletín de la tarde (6:00 PM)

  @IsBoolean()
  @IsOptional()
  semanal?: boolean; // Resumen semanal (Domingo 8:00 AM)

  @IsBoolean()
  @IsOptional()
  deportes?: boolean; // Deportes (condicional)

  // Metadata opcional
  @IsString()
  @IsOptional()
  source?: string; // 'footer' | 'popup' | 'article'
}

/**
 * 🔑 DTO para confirmar suscripción
 */
export class ConfirmSubscriptionDto {
  @IsString()
  @MinLength(10)
  token: string; // Token de confirmación
}

/**
 * 🚫 DTO para desuscribirse
 */
export class UnsubscribeDto {
  @IsString()
  @MinLength(10)
  token: string; // Token de desuscripción

  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string; // Razón opcional de baja
}

/**
 * ⚙️ DTO para actualizar preferencias
 */
export class UpdatePreferencesDto {
  @IsString()
  @MinLength(10)
  token: string; // Token de desuscripción

  @IsBoolean()
  @IsOptional()
  manana?: boolean;

  @IsBoolean()
  @IsOptional()
  tarde?: boolean;

  @IsBoolean()
  @IsOptional()
  semanal?: boolean;

  @IsBoolean()
  @IsOptional()
  deportes?: boolean;
}

/**
 * 📨 DTO de respuesta de suscripción
 */
export class NewsletterSubscriptionResponseDto {
  @IsString()
  message: string;

  @IsString()
  email: string;

  @IsBoolean()
  isConfirmed: boolean;
}

/**
 * 📰 DTO de contenido de boletín (preview)
 */
export class NewsletterContentDto {
  @IsString()
  @IsIn(['manana', 'tarde', 'semanal', 'deportes'])
  type: 'manana' | 'tarde' | 'semanal' | 'deportes';

  @IsString()
  subject: string;

  @IsString()
  html: string;

  noticias: Array<{
    id: string;
    title: string;
    slug: string;
    category: string;
    featuredImage?: string;
  }>;
}
