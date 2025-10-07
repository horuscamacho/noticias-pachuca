import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 📘 DTO para páginas de Facebook obtenidas desde GetLate.dev API
 */
export class FacebookPageDto {
  @ApiProperty({
    description: 'ID único de la página de Facebook',
    example: '123456789012345'
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Nombre de la página de Facebook',
    example: 'Mi Página de Noticias'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Nombre de usuario de la página',
    example: '@mipaginanoticias',
    required: false
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({
    description: 'URL de la imagen de perfil de la página',
    required: false
  })
  @IsString()
  @IsOptional()
  picture?: string;

  @ApiProperty({
    description: 'Número de seguidores de la página',
    required: false
  })
  @IsNumber()
  @IsOptional()
  followerCount?: number;

  @ApiProperty({
    description: 'Indica si la página está verificada',
    required: false
  })
  @IsOptional()
  isVerified?: boolean;

  @ApiProperty({
    description: 'Token de acceso específico de la página',
    required: false
  })
  @IsString()
  @IsOptional()
  accessToken?: string;
}

/**
 * 📘 Response DTO para el endpoint de páginas de Facebook
 */
export class FacebookPagesResponseDto {
  @ApiProperty({
    description: 'Lista de páginas de Facebook disponibles',
    type: [FacebookPageDto]
  })
  pages: FacebookPageDto[];

  @ApiProperty({
    description: 'Número total de páginas encontradas'
  })
  @IsNumber()
  total: number;
}