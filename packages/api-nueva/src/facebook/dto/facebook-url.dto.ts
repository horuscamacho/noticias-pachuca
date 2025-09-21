import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsBoolean
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 🔗 DTOs PARA OBTENER INFORMACIÓN DE PÁGINA DESDE URL
 * Convierte URL de Facebook a PageID y datos de página
 */

export class FacebookPageUrlDto {
  @ApiProperty({
    description: 'Facebook page URL',
    example: 'https://www.facebook.com/PageName',
    type: String
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'Must be a valid URL' })
  pageUrl: string;
}

export class FacebookPageInfoDto {
  @ApiProperty({
    description: 'Facebook Page ID',
    example: '123456789',
    type: String
  })
  pageId: string;

  @ApiProperty({
    description: 'Page display name',
    example: 'Pachuca Noticias',
    type: String
  })
  pageName: string;

  @ApiProperty({
    description: 'Page category',
    example: 'Media/News Company',
    type: String
  })
  category: string;

  @ApiProperty({
    description: 'Page is verified by Facebook',
    example: true,
    type: Boolean
  })
  verified: boolean;

  @ApiProperty({
    description: 'Page is accessible via Graph API',
    example: true,
    type: Boolean
  })
  isAccessible: boolean;

  @ApiProperty({
    description: 'Page follower count',
    example: 15000,
    type: Number,
    required: false
  })
  followerCount?: number;

  @ApiProperty({
    description: 'Page about/description',
    example: 'Noticias de Pachuca y Hidalgo',
    type: String,
    required: false
  })
  about?: string;
}