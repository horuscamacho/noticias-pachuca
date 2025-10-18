import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 🐦 DTO para cuentas de Twitter obtenidas desde GetLate.dev API
 */
export class TwitterAccountDto {
  @ApiProperty({
    description: 'ID único de la cuenta de Twitter en GetLate',
    example: 'tw_123456789'
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Nombre de usuario de Twitter (sin @)',
    example: 'noticiaspachuca'
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Nombre de display de la cuenta',
    example: 'Noticias Pachuca'
  })
  @IsString()
  displayName: string;

  @ApiProperty({
    description: 'URL de la imagen de perfil de la cuenta',
    required: false
  })
  @IsString()
  @IsOptional()
  profilePicture?: string;

  @ApiProperty({
    description: 'Número de seguidores de la cuenta',
    required: false
  })
  @IsNumber()
  @IsOptional()
  followerCount?: number;

  @ApiProperty({
    description: 'Indica si la cuenta está verificada',
    required: false
  })
  @IsOptional()
  isVerified?: boolean;

  @ApiProperty({
    description: 'Token de acceso específico de la cuenta',
    required: false
  })
  @IsString()
  @IsOptional()
  accessToken?: string;
}

/**
 * 🐦 Response DTO para el endpoint de cuentas de Twitter
 */
export class TwitterAccountsResponseDto {
  @ApiProperty({
    description: 'Lista de cuentas de Twitter disponibles',
    type: [TwitterAccountDto]
  })
  accounts: TwitterAccountDto[];

  @ApiProperty({
    description: 'Número total de cuentas encontradas'
  })
  @IsNumber()
  total: number;
}
