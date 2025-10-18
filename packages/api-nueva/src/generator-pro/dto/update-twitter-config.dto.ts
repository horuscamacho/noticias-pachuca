import { PartialType } from '@nestjs/mapped-types';
import { CreateTwitterConfigDto } from './create-twitter-config.dto';

/**
 * 🐦 DTO para actualizar configuración de Twitter - Generator Pro
 * Extiende CreateTwitterConfigDto pero todos los campos son opcionales
 */
export class UpdateTwitterConfigDto extends PartialType(CreateTwitterConfigDto) {}
