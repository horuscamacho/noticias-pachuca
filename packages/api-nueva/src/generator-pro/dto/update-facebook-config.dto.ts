import { PartialType } from '@nestjs/mapped-types';
import { CreateFacebookConfigDto } from './create-facebook-config.dto';

/**
 * 🤖 DTO para actualizar configuración de Facebook - Generator Pro
 * Extiende CreateFacebookConfigDto pero todos los campos son opcionales
 */
export class UpdateFacebookConfigDto extends PartialType(CreateFacebookConfigDto) {}