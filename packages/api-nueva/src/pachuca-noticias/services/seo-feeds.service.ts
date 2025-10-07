import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PublishedNoticia, PublishedNoticiaDocument } from '../schemas/published-noticia.schema';

/**
 * 🗺️ Servicio para generar sitemap.xml y RSS feed dinámicos
 */
@Injectable()
export class SeoFeedsService {
  private readonly logger = new Logger(SeoFeedsService.name);
  private readonly BASE_URL = 'https://noticiaspachuca.com';

  constructor(
    @InjectModel(PublishedNoticia.name)
    private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
  ) {}

  /**
   * Genera sitemap.xml con todas las noticias publicadas
   * @returns XML string del sitemap
   */
  async generateSitemap(): Promise<string> {
    try {
      // Obtener todas las noticias publicadas
      const noticias = await this.publishedNoticiaModel
        .find({ status: 'published' })
        .select('slug lastModifiedAt priority')
        .sort({ publishedAt: -1 })
        .lean()
        .exec();

      // Construir XML
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      // URL principal
      xml += '  <url>\n';
      xml += `    <loc>${this.BASE_URL}/</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>1.0</priority>\n';
      xml += '  </url>\n';

      // URL de listado de noticias
      xml += '  <url>\n';
      xml += `    <loc>${this.BASE_URL}/noticias</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xml += '    <changefreq>hourly</changefreq>\n';
      xml += '    <priority>0.9</priority>\n';
      xml += '  </url>\n';

      // Agregar cada noticia
      for (const noticia of noticias) {
        xml += '  <url>\n';
        xml += `    <loc>${this.BASE_URL}/noticia/${noticia.slug}</loc>\n`;
        xml += `    <lastmod>${noticia.lastModifiedAt.toISOString()}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += `    <priority>${this.calculatePriority(noticia.priority)}</priority>\n`;
        xml += '  </url>\n';
      }

      xml += '</urlset>';

      this.logger.log(`📄 Sitemap generado con ${noticias.length} noticias`);

      return xml;
    } catch (error) {
      this.logger.error('❌ Error generando sitemap:', error);
      throw error;
    }
  }

  /**
   * Genera RSS feed con las últimas 50 noticias
   * Formato RSS 2.0
   * @returns XML string del RSS feed
   */
  async generateRssFeed(): Promise<string> {
    try {
      // Obtener últimas 50 noticias publicadas
      const noticias = await this.publishedNoticiaModel
        .find({ status: 'published' })
        .sort({ publishedAt: -1 })
        .limit(50)
        .populate('category')
        .lean()
        .exec();

      const latestPubDate = noticias.length > 0
        ? noticias[0].publishedAt.toUTCString()
        : new Date().toUTCString();

      // Construir XML RSS 2.0
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">\n';
      xml += '  <channel>\n';

      // Metadata del canal
      xml += '    <title>Noticias Pachuca</title>\n';
      xml += `    <link>${this.BASE_URL}</link>\n`;
      xml += '    <description>Las últimas noticias de Pachuca, Hidalgo y México</description>\n';
      xml += '    <language>es-MX</language>\n';
      xml += `    <lastBuildDate>${latestPubDate}</lastBuildDate>\n`;
      xml += `    <atom:link href="${this.BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>\n`;
      xml += '    <copyright>© 2025 Noticias Pachuca</copyright>\n';
      xml += '    <managingEditor>noreply@noticiaspachuca.com (Noticias Pachuca)</managingEditor>\n';
      xml += '    <webMaster>tech@noticiaspachuca.com (Tech Team)</webMaster>\n';

      // Items (noticias)
      for (const noticia of noticias) {
        xml += '    <item>\n';
        xml += `      <title><![CDATA[${noticia.title}]]></title>\n`;
        xml += `      <link>${this.BASE_URL}/noticia/${noticia.slug}</link>\n`;
        xml += `      <guid isPermaLink="true">${this.BASE_URL}/noticia/${noticia.slug}</guid>\n`;
        xml += `      <description><![CDATA[${noticia.summary}]]></description>\n`;

        // Contenido completo (opcional, pero recomendado)
        if (noticia.content) {
          xml += `      <content:encoded><![CDATA[${noticia.content}]]></content:encoded>\n`;
        }

        xml += `      <pubDate>${noticia.publishedAt.toUTCString()}</pubDate>\n`;
        const categoryName = (noticia.category as { name?: string })?.name || 'General';
        xml += `      <category>${categoryName}</category>\n`;

        // Autor
        if (noticia.author) {
          xml += `      <author>noreply@noticiaspachuca.com (${noticia.author})</author>\n`;
        }

        // Imagen destacada (enclosure)
        if (noticia.featuredImage?.large) {
          xml += `      <enclosure url="${noticia.featuredImage.large}" type="image/webp"/>\n`;
        }

        xml += '    </item>\n';
      }

      xml += '  </channel>\n';
      xml += '</rss>';

      this.logger.log(`📡 RSS feed generado con ${noticias.length} noticias`);

      return xml;
    } catch (error) {
      this.logger.error('❌ Error generando RSS feed:', error);
      throw error;
    }
  }

  /**
   * Calcula la prioridad normalizada para sitemap (0.0 - 1.0)
   * @param priority - Prioridad original (1-10)
   * @returns Prioridad normalizada
   */
  private calculatePriority(priority: number = 5): string {
    // Normalizar de 1-10 a 0.5-0.9 (reservar 1.0 para home)
    const normalized = 0.5 + (priority / 10) * 0.4;
    return normalized.toFixed(1);
  }

  /**
   * Capitaliza la primera letra de una categoría
   * @param category - Categoría en lowercase
   * @returns Categoría capitalizada
   */
  private capitalizeCategory(category: string): string {
    if (!category) return 'General';
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
}
