import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PublishedNoticia, PublishedNoticiaDocument } from '../schemas/published-noticia.schema';

@Injectable()
export class SlugGeneratorService {
  constructor(
    @InjectModel(PublishedNoticia.name)
    private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
  ) {}

  /**
   * Genera un slug único basado en el título de la noticia
   * Formato: titulo-de-la-noticia-abc12345
   *
   * 🌐 FASE 4: Multi-sitio
   * @param title - Título de la noticia
   * @param siteIds - Array de IDs de sitios donde se publicará (opcional)
   * @returns Slug único y SEO-friendly
   */
  async generateUniqueSlug(title: string, siteIds?: string[]): Promise<string> {
    // 1. Limpiar y formatear título
    let slug = title
      .toLowerCase()
      .normalize('NFD') // Descomponer caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
      .trim()
      .replace(/\s+/g, '-') // Espacios a guiones
      .replace(/-+/g, '-') // Múltiples guiones a uno solo
      .substring(0, 60) // Max 60 caracteres para dejar espacio al UUID
      .replace(/^-+|-+$/g, ''); // 🔥 FIX: Eliminar guiones al inicio/final después de truncar

    // 1.1. Si el slug quedó vacío, usar un fallback
    if (!slug || slug.length === 0) {
      slug = 'noticia';
    }

    // 2. Agregar UUID corto (primeros 8 caracteres) para garantizar unicidad
    const shortUuid = this.generateShortUuid();
    slug = `${slug}-${shortUuid}`;

    // 3. Verificar que no exista en los sitios especificados
    const exists = await this.checkSlugExists(slug, siteIds);

    if (exists) {
      // Regenerar con nuevo UUID
      const newUuid = this.generateShortUuid();
      slug = `${slug.replace(/-[a-z0-9]{8}$/, '')}-${newUuid}`;
    }

    return slug;
  }

  /**
   * 🌐 FASE 4: Verifica si un slug ya existe en los sitios especificados
   * @param slug - Slug a verificar
   * @param siteIds - Array de IDs de sitios (opcional)
   * @returns true si existe, false si no
   */
  private async checkSlugExists(slug: string, siteIds?: string[]): Promise<boolean> {
    if (!siteIds || siteIds.length === 0) {
      // Sin sitios especificados, verificar globalmente (backward compatible)
      const exists = await this.publishedNoticiaModel.findOne({ slug });
      return !!exists;
    }

    // Con sitios especificados, verificar si existe en alguno de esos sitios
    const siteObjectIds = siteIds.map(id => new Types.ObjectId(id));

    const exists = await this.publishedNoticiaModel.findOne({
      slug,
      sites: { $in: siteObjectIds },
    });

    return !!exists;
  }

  /**
   * Genera un ID único de 8 caracteres (a-z, 0-9)
   * @returns String de 8 caracteres aleatorios
   */
  private generateShortUuid(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Valida si un slug es válido (formato URL-friendly)
   * @param slug - Slug a validar
   * @returns true si es válido, false si no
   */
  isValidSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  }
}
