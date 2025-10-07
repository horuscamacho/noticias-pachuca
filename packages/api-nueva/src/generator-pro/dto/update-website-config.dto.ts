import { PartialType } from '@nestjs/mapped-types';
import { CreateWebsiteConfigDto } from './create-website-config.dto';

/**
 * 🤖 DTO para actualizar configuración de sitio web - Generator Pro
 * Extiende CreateWebsiteConfigDto pero todos los campos son opcionales
 */
export class UpdateWebsiteConfigDto extends PartialType(CreateWebsiteConfigDto) {}