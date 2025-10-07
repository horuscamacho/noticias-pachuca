import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 💬 DTO para envío de formulario de contacto
 */
export class ContactFormDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @IsEmail({}, { message: 'Debes proporcionar un email válido' })
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(5, { message: 'El asunto debe tener al menos 5 caracteres' })
  @MaxLength(200, { message: 'El asunto no puede exceder 200 caracteres' })
  subject: string;

  @IsString()
  @MinLength(20, { message: 'El mensaje debe tener al menos 20 caracteres' })
  @MaxLength(5000, { message: 'El mensaje no puede exceder 5000 caracteres' })
  message: string;
}

/**
 * 📨 DTO para respuesta de contacto exitoso
 */
export class ContactResponseDto {
  @IsString()
  message: string;

  @IsString()
  id: string;
}
