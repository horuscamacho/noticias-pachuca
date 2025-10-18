import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AIContentGeneration,
  AIContentGenerationDocument,
} from '../../content-ai/schemas/ai-content-generation.schema';
import { AIProviderService } from '../../content-ai/services/ai-provider.service';
import { ProviderFactoryService } from '../../content-ai/services/provider-factory.service';
import { PublishedNoticia, PublishedNoticiaDocument } from '../../pachuca-noticias/schemas/published-noticia.schema';

/**
 * 🎨 Service para actualizar copys de redes sociales con URLs usando IA
 *
 * FASE 1: Content Copy Updater
 *
 * Resuelve el problema de que los copys se generan ANTES de tener el slug/URL final.
 * Usa IA para insertar la URL de forma natural en el copy, manteniendo el tono original.
 *
 * Incluye soporte para t.co de Twitter (URLs siempre cuentan como 23 caracteres)
 */
@Injectable()
export class ContentCopyUpdaterService {
  private readonly logger = new Logger(ContentCopyUpdaterService.name);

  constructor(
    @InjectModel(AIContentGeneration.name)
    private aiContentModel: Model<AIContentGenerationDocument>,
    @InjectModel(PublishedNoticia.name)
    private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
    private readonly aiProviderService: AIProviderService,
    private readonly providerFactory: ProviderFactoryService,
  ) {
    this.logger.log('🎨 Content Copy Updater Service initialized');
  }

  /**
   * 📝 Actualiza un copy de red social para incluir la URL de la noticia
   *
   * @param originalCopy - Copy original generado por IA (sin URL)
   * @param noticiaUrl - URL completa de la noticia
   * @param contentType - Tipo de contenido (breaking_news, normal_news, blog, evergreen)
   * @param platform - Plataforma de destino (facebook, twitter)
   * @returns Copy actualizado con URL incluida naturalmente
   */
  async updateCopyWithUrl(
    originalCopy: string,
    noticiaUrl: string,
    contentType: 'breaking_news' | 'normal_news' | 'blog' | 'evergreen',
    platform: 'facebook' | 'twitter',
  ): Promise<string> {
    // IMPORTANTE: Twitter acorta URLs con t.co, SIEMPRE cuentan como 23 caracteres
    // Límite: 280 - 23 (URL) = 257 disponibles
    // Usamos 250 para margen de seguridad
    const maxCopyLength = platform === 'twitter' ? 250 : 400;

    const prompt = `
Eres un experto community manager. Tu tarea es actualizar el siguiente copy de ${platform}
para incluir la URL de la noticia de forma natural y atractiva.

Copy original: "${originalCopy}"
URL de la noticia: ${noticiaUrl}
Tipo de contenido: ${contentType}

${
  platform === 'twitter'
    ? `
⚠️ IMPORTANTE TWITTER:
- Twitter acorta AUTOMÁTICAMENTE las URLs con t.co (cuentan como 23 caracteres)
- No importa si la URL es larga o corta, SIEMPRE cuenta como 23 caracteres
- El copy debe tener máximo 250 caracteres (dejando espacio para la URL)
- Total final: ~250 (copy) + 23 (URL) = 273 caracteres (dentro de límite de 280)
`
    : ''
}

Requisitos:
1. Mantener el hook y tono original
2. Insertar la URL de forma natural (ejemplo: "Lee más 👉 [URL]" o "Detalles aquí: [URL]")
3. Máximo ${maxCopyLength} caracteres PARA EL COPY (la URL se agrega después)
4. Mantener emojis si los hay
5. NO cambiar el mensaje principal

Responde ÚNICAMENTE con el copy actualizado (SIN incluir la URL, solo el copy), sin explicaciones.
`;

    try {
      // Obtener provider óptimo
      const providers = await this.aiProviderService.findAll();
      if (providers.length === 0) {
        throw new Error('No hay providers AI disponibles');
      }

      const provider = await this.providerFactory.getOptimalProvider({
        maxTokens: 200,
        preferredProviders: [providers[0].id],
      });

      // Generar copy actualizado con IA
      const response = await provider.generateContent({
        systemPrompt: 'Eres un experto community manager para medios de noticias en México',
        userPrompt: prompt,
        maxTokens: 200,
        temperature: 0.7,
      });

      let updatedCopy = response.content.trim();

      // Validación de longitud
      if (updatedCopy.length > maxCopyLength) {
        this.logger.warn(
          `Copy excede máximo (${updatedCopy.length}/${maxCopyLength}), truncando...`,
        );
        updatedCopy = updatedCopy.substring(0, maxCopyLength - 3) + '...';
      }

      // Agregar URL al final (Twitter la convertirá automáticamente a t.co)
      const finalCopy = `${updatedCopy} ${noticiaUrl}`;

      // Log de verificación
      this.logger.log(
        `✅ Copy generado: ${finalCopy.length} chars total ` +
          `(copy: ${updatedCopy.length}, URL contará como: ${platform === 'twitter' ? 23 : noticiaUrl.length})`,
      );

      return finalCopy;
    } catch (error) {
      this.logger.error(`❌ Error actualizando copy con URL: ${error.message}`, error.stack);
      // Fallback: simplemente agregar URL al final
      return `${originalCopy} ${noticiaUrl}`;
    }
  }

  /**
   * 🔄 Regenera completamente los copys de redes sociales para contenido reciclado
   *
   * @param noticia - Noticia a reciclar
   * @returns Objeto con copys regenerados para cada plataforma
   */
  async regenerateSocialCopies(
    noticia: PublishedNoticiaDocument,
  ): Promise<{
    facebook: string;
    twitter: string;
  }> {
    this.logger.log(`🔄 Regenerando copys para noticia reciclada: ${noticia.slug}`);

    const prompt = `
Eres un experto community manager. Tu tarea es crear NUEVOS copys para redes sociales
para una noticia que será reciclada (republicada después de 3+ meses).

Título de la noticia: "${noticia.title}"
Resumen: "${noticia.summary}"
Tipo de contenido: ${noticia.contentType}

Requisitos:
1. Crear copys COMPLETAMENTE NUEVOS (no reutilizar los originales)
2. Usar DIFERENTES hooks, ángulos, y CTAs que la publicación original
3. Mantener la información factual pero con nueva presentación
4. Agregar menciones como "[Actualizado]" o "[Guía completa]" si es evergreen
5. Facebook: 80-120 palabras con hook único, desarrollo engaging, CTA específico, 2-3 emojis
6. Twitter: 230-250 caracteres con hook potente, dato verificable, 1-2 hashtags relevantes

Responde en formato JSON:
{
  "facebook": "copy completo para Facebook",
  "twitter": "copy completo para Twitter"
}
`;

    try {
      const providers = await this.aiProviderService.findAll();
      if (providers.length === 0) {
        throw new Error('No hay providers AI disponibles');
      }

      const provider = await this.providerFactory.getOptimalProvider({
        maxTokens: 400,
        preferredProviders: [providers[0].id],
      });

      const response = await provider.generateContent({
        systemPrompt: 'Eres un experto community manager para medios de noticias en México',
        userPrompt: prompt,
        maxTokens: 400,
        temperature: 0.85, // Mayor creatividad para reciclaje
      });

      // Parsear respuesta JSON
      const cleanContent = response.content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleanContent);

      // Validar que tenga los campos requeridos
      if (!parsed.facebook || !parsed.twitter) {
        throw new Error('Respuesta de IA no tiene los campos facebook/twitter');
      }

      // Construir URL de la noticia (asumiendo primer sitio)
      const baseDomain = 'https://noticiaspachuca.com'; // TODO: Obtener del sitio
      const noticiaUrl = `${baseDomain}/noticia/${noticia.slug}`;

      // Agregar URL a los copys
      const facebookCopy = `${parsed.facebook} ${noticiaUrl}`;
      const twitterCopy = `${parsed.twitter} ${noticiaUrl}`;

      this.logger.log(`✅ Copys regenerados para ${noticia.slug}`);

      return {
        facebook: facebookCopy,
        twitter: twitterCopy,
      };
    } catch (error) {
      this.logger.error(`❌ Error regenerando copys: ${error.message}`, error.stack);

      // Fallback: usar copys originales con marca de reciclaje
      const baseDomain = 'https://noticiaspachuca.com';
      const noticiaUrl = `${baseDomain}/noticia/${noticia.slug}`;

      return {
        facebook: `[Actualizado] ${noticia.summary} Lee más: ${noticiaUrl}`,
        twitter: `[Actualizado] ${noticia.title.substring(0, 200)} ${noticiaUrl}`,
      };
    }
  }

  /**
   * 📊 Estima la longitud de un copy incluyendo el conteo de URL por plataforma
   *
   * @param copy - Copy sin URL
   * @param url - URL a incluir
   * @param platform - Plataforma
   * @returns Longitud total estimada
   */
  estimateTotalLength(copy: string, url: string, platform: 'facebook' | 'twitter'): number {
    const urlLength = platform === 'twitter' ? 23 : url.length; // t.co siempre 23 chars
    return copy.length + 1 + urlLength; // +1 por el espacio
  }

  /**
   * ✅ Valida que un copy cumpla con los límites de la plataforma
   *
   * @param copy - Copy completo (incluyendo URL)
   * @param platform - Plataforma
   * @returns true si es válido, false si excede límite
   */
  validateCopyLength(copy: string, platform: 'facebook' | 'twitter'): boolean {
    const maxLength = platform === 'twitter' ? 280 : 63206; // Facebook no tiene límite estricto

    if (platform === 'twitter') {
      // Contar URLs en el copy (cada una cuenta como 23)
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = copy.match(urlRegex) || [];
      const urlsLength = urls.length * 23;
      const textLength = copy.replace(urlRegex, '').length;
      const totalLength = textLength + urlsLength;

      return totalLength <= maxLength;
    }

    return copy.length <= maxLength;
  }
}
