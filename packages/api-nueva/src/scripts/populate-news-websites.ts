/**
 * 📰 Script para poblar configuraciones de sitios web de noticias
 *
 * Este script crea/actualiza las configuraciones de 18 sitios de noticias
 * con sus selectores CSS para extracción automatizada de contenido.
 *
 * Basado en análisis HTML detallado de cada sitio.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { NewsWebsiteConfig, NewsWebsiteConfigDocument } from '../generator-pro/schemas/news-website-config.schema';

interface SiteConfig {
  name: string;
  baseUrl: string;
  listingUrl: string;
  testUrl?: string;
  isActive: boolean;
  listingSelectors: {
    articleLinks: string;
    titleSelector?: string;
    imageSelector?: string;
    dateSelector?: string;
    categorySelector?: string;
  };
  contentSelectors: {
    titleSelector: string;
    contentSelector: string;
    imageSelector?: string;
    dateSelector?: string;
    authorSelector?: string;
    categorySelector?: string;
    excerptSelector?: string;
    tagsSelector?: string;
  };
  extractionFrequency: number; // minutos
  notes?: string;
  extractionSettings?: {
    useJavaScript?: boolean;
    waitTime?: number;
    rateLimit?: number;
    timeout?: number;
    retryAttempts?: number;
    maxUrlsPerRun?: number;
  };
}

const SITES_CONFIG: SiteConfig[] = [
  // ========================================
  // 2. CRITERIOHIDALGO - Next.js con GraphQL
  // ========================================
  {
    name: 'Criterio Hidalgo',
    baseUrl: 'https://criteriohidalgo.com',
    listingUrl: 'https://criteriohidalgo.com/noticias/hidalgo',
    isActive: true,
    listingSelectors: {
      articleLinks: 'script#__NEXT_DATA__', // Requiere parseo de JSON
      titleSelector: '', // Extraído del JSON
      imageSelector: '',
      dateSelector: '',
    },
    contentSelectors: {
      titleSelector: 'h1',
      contentSelector: 'article .content',
      imageSelector: 'article img',
      dateSelector: 'time',
      authorSelector: '.author',
    },
    extractionFrequency: 30,
    extractionSettings: {
      useJavaScript: true,
      waitTime: 2000,
      maxUrlsPerRun: 20,
    },
    notes: 'Sitio Next.js con datos en JSON embebido. Requiere parseo especial de __NEXT_DATA__',
  },

  // ========================================
  // 3. CRONICAHGO - WordPress tradicional
  // ========================================
  {
    name: 'Crónica Hidalgo',
    baseUrl: 'https://www.cronicahidalgo.com',
    listingUrl: 'https://www.cronicahidalgo.com/feed/',
    isActive: true,
    listingSelectors: {
      articleLinks: 'a[href*="cronicahidalgo.com"]',
      titleSelector: '.story h1 a, .story h2 a',
      imageSelector: '.story img',
      categorySelector: '.categoria a',
    },
    contentSelectors: {
      titleSelector: 'h1.entry-title, h2.entry-title',
      contentSelector: '.entry, .story-content',
      imageSelector: '.story img, article img',
      dateSelector: 'time.entry-date',
      authorSelector: '.author',
      categorySelector: '.categoria a',
    },
    extractionFrequency: 30,
    notes: 'WordPress tradicional. RSS feed recomendado: https://www.cronicahidalgo.com/feed/',
  },

  // ========================================
  // 4. EFFETA - WordPress ColorNews
  // ========================================
  {
    name: 'Effeta',
    baseUrl: 'https://www.effeta.info',
    listingUrl: 'https://www.effeta.info/feed/',
    isActive: true,
    listingSelectors: {
      articleLinks: '.single-article .entry-title a, .article-content h3.entry-title a',
      titleSelector: 'h3.entry-title a',
      imageSelector: '.single-article figure img',
      dateSelector: 'time.entry-date',
      categorySelector: '.cat-links a',
    },
    contentSelectors: {
      titleSelector: 'h1.entry-title',
      contentSelector: '.entry-content',
      imageSelector: 'article figure img',
      dateSelector: 'time.entry-date',
      authorSelector: '.author.vcard a',
      categorySelector: '.cat-links a',
      excerptSelector: '.entry-content p:first-of-type',
    },
    extractionFrequency: 30,
    notes: 'WordPress con tema ColorNews. RSS feed recomendado.',
  },

  // ========================================
  // 5. ELSOLHGO / El Hidalgo Digital
  // ========================================
  {
    name: 'El Hidalgo Digital',
    baseUrl: 'https://elhidalgodigital.com',
    listingUrl: 'https://elhidalgodigital.com/category/estado/',
    isActive: true,
    listingSelectors: {
      articleLinks: 'article a[rel="bookmark"], h2.entry-title a',
      titleSelector: 'h2.entry-title a',
      imageSelector: 'article img.wp-post-image',
      dateSelector: 'time.entry-date',
    },
    contentSelectors: {
      titleSelector: 'h1.entry-title',
      contentSelector: '.entry-content',
      imageSelector: 'article img',
      dateSelector: 'time.entry-date',
      authorSelector: '.author.vcard a',
      categorySelector: '.cat-links a',
    },
    extractionFrequency: 30,
    notes: 'WordPress. Feed alternativo: https://elhidalgodigital.com/feed/',
  },

  // ========================================
  // 6. EL UNIVERSAL HIDALGO - Marfeel SDK
  // ========================================
  {
    name: 'El Universal Hidalgo',
    baseUrl: 'https://www.eluniversalhidalgo.com.mx',
    listingUrl: 'https://www.eluniversalhidalgo.com.mx/municipios/',
    isActive: true,
    listingSelectors: {
      articleLinks: 'article a, .article-link',
      titleSelector: 'h2, h3.article-title',
      imageSelector: 'article img',
    },
    contentSelectors: {
      titleSelector: 'h1',
      contentSelector: 'article .content, .article-body',
      imageSelector: 'article img, figure img',
      dateSelector: 'time',
      authorSelector: '.author-name',
    },
    extractionFrequency: 30,
    extractionSettings: {
      useJavaScript: true,
      waitTime: 3000,
    },
    notes: 'Sitio dinámico con Marfeel SDK. Requiere renderizado JS.',
  },

  // ========================================
  // 7. ENFASIS / Noticias Énfasis
  // ========================================
  {
    name: 'Noticias Énfasis',
    baseUrl: 'https://www.noticiasenfasis.com.mx',
    listingUrl: 'https://www.noticiasenfasis.com.mx/feed/',
    isActive: true,
    listingSelectors: {
      articleLinks: '.td_module_wrap a[rel="bookmark"], .entry-title a',
      titleSelector: 'h3.entry-title a',
      imageSelector: 'img.entry-thumb, .td-module-thumb img',
      categorySelector: '.td-post-category',
    },
    contentSelectors: {
      titleSelector: 'h1.entry-title',
      contentSelector: '.td-post-content',
      imageSelector: '.td-post-featured-image img',
      dateSelector: 'time.entry-date',
      authorSelector: '.td-post-author-name a',
      categorySelector: '.td-post-category',
    },
    extractionFrequency: 30,
    notes: 'WordPress Newspaper theme. RSS feed recomendado.',
  },

  // ========================================
  // 8. FOCUS HIDALGO - Wix (RSS Only)
  // ========================================
  {
    name: 'Focus Hidalgo',
    baseUrl: 'https://www.focushidalgopachuca.com',
    listingUrl: 'https://www.focushidalgopachuca.com/blog-feed.xml',
    isActive: true,
    listingSelectors: {
      articleLinks: '', // RSS only
    },
    contentSelectors: {
      titleSelector: 'h1',
      contentSelector: 'article, .blog-post-content',
      imageSelector: 'article img',
    },
    extractionFrequency: 60,
    notes: 'Sitio Wix con HTML extremadamente complejo. SOLO usar RSS feed.',
  },

  // ========================================
  // 9. HIDALGO NOTICIAS - Zox News
  // ========================================
  {
    name: 'Hidalgo Noticias',
    baseUrl: 'https://hidalgonoticias.com',
    listingUrl: 'https://hidalgonoticias.com/feed/',
    isActive: true,
    listingSelectors: {
      articleLinks: 'article a, .post-title a',
      titleSelector: 'h2.post-title a',
      imageSelector: 'article img',
    },
    contentSelectors: {
      titleSelector: 'h1.entry-title',
      contentSelector: '.entry-content',
      imageSelector: 'article img',
      dateSelector: 'time.entry-date',
      authorSelector: '.author-name',
    },
    extractionFrequency: 30,
    notes: 'WordPress Zox News theme. RSS feed recomendado.',
  },

  // ========================================
  // 10. LA JORNADA HIDALGO - Next.js
  // ========================================
  {
    name: 'La Jornada Hidalgo',
    baseUrl: 'https://lajornadahidalgo.com',
    listingUrl: 'https://lajornadahidalgo.com',
    isActive: true,
    listingSelectors: {
      articleLinks: 'article a, .article-link',
      titleSelector: 'h2, h3',
      imageSelector: 'article img',
    },
    contentSelectors: {
      titleSelector: 'h1',
      contentSelector: 'article .content',
      imageSelector: 'article img',
      dateSelector: 'time',
    },
    extractionFrequency: 30,
    extractionSettings: {
      useJavaScript: true,
      waitTime: 2000,
    },
    notes: 'Sitio Next.js con Marfeel SDK. Requiere renderizado JS.',
  },

  // ========================================
  // 11. LATINUS - Custom Bootstrap
  // ========================================
  {
    name: 'Latinus',
    baseUrl: 'https://latinus.us',
    listingUrl: 'https://latinus.us/mexico/',
    isActive: true,
    listingSelectors: {
      articleLinks: 'article a, .article-link',
      titleSelector: 'h2, h3',
      imageSelector: 'article img',
    },
    contentSelectors: {
      titleSelector: 'h1',
      contentSelector: 'article .content, .article-body',
      imageSelector: 'article img',
      dateSelector: 'time',
    },
    extractionFrequency: 60,
    notes: 'Sitio custom Bootstrap orientado a audiencia internacional.',
  },

  // ========================================
  // 12. LA SILLA ROTA HGO - Custom Bootstrap
  // ========================================
  {
    name: 'La Silla Rota Hidalgo',
    baseUrl: 'https://lasillarota.com',
    listingUrl: 'https://lasillarota.com/hidalgo/',
    isActive: true,
    listingSelectors: {
      articleLinks: 'article.article-v2 h2.titulo a',
      titleSelector: 'h2.titulo a',
      imageSelector: 'figure picture img',
      categorySelector: 'h3.volanta',
    },
    contentSelectors: {
      titleSelector: 'h1.titulo',
      contentSelector: '.bajada p, .t5-bajada, article .content',
      imageSelector: 'figure picture img',
      dateSelector: 'time',
      authorSelector: '.autor .nombredeautor',
      categorySelector: 'h3.volanta',
    },
    extractionFrequency: 30,
    notes: 'Sitio custom Bootstrap. Mismo sistema que Latinus.',
  },

  // ========================================
  // 13. PACHUCA BRILLA - NewsCard
  // ========================================
  {
    name: 'Pachuca Brilla',
    baseUrl: 'https://pachucabrilla.com',
    listingUrl: 'https://pachucabrilla.com/feed/',
    isActive: true,
    listingSelectors: {
      articleLinks: '.post-boxed h3.entry-title a',
      titleSelector: 'h3.entry-title a',
      imageSelector: '.post-img-wrap a.post-img',
      dateSelector: '.entry-meta .date a',
      categorySelector: '.cat-links a',
    },
    contentSelectors: {
      titleSelector: 'h1.entry-title',
      contentSelector: '.entry-content',
      imageSelector: '.featured-post-img',
      dateSelector: 'time.entry-date',
      authorSelector: '.by-author.vcard.author a',
      categorySelector: '.cat-links a',
    },
    extractionFrequency: 30,
    notes: 'WordPress NewsCard v4.0.0. RSS feed recomendado.',
  },

  // ========================================
  // 14. PLAZA JUAREZ - Newspaper v12.7.1 ✅ VERIFICADO
  // ========================================
  {
    name: 'Plaza Juárez',
    baseUrl: 'https://plazajuarez.mx',
    listingUrl: 'https://plazajuarez.mx/category/noticias-hidalgo/',
    testUrl: 'https://plazajuarez.mx/solidaridad-del-pueblo-hidalguense-se-refleja-en-los-centros-de-acopio/',
    isActive: true,
    listingSelectors: {
      articleLinks: '.td-module-thumb a[href], p.entry-title.td-module-title a[href]',
      titleSelector: 'p.entry-title.td-module-title a',
      imageSelector: '.td-module-thumb a span.entry-thumb',
      dateSelector: 'time.entry-date.updated.td-module-date',
      categorySelector: '.td-post-category',
    },
    contentSelectors: {
      titleSelector: 'title, h1',
      contentSelector: '.tdb_single_content .tdb-block-inner p, .td-post-content',
      imageSelector: '.tdb_single_featured img, .td-post-featured-image img',
      dateSelector: 'time.entry-date, meta[property="article:published_time"]',
      authorSelector: '.td-post-author-name a, meta[name="author"]',
      categorySelector: '.td-post-category',
      excerptSelector: '.td-excerpt',
    },
    extractionFrequency: 30,
    notes: '✅ WordPress Newspaper v12.7.1 con tagDiv Composer. Selectores verificados manualmente 2025-10-16. RSS alternativo: https://plazajuarez.mx/feed/',
  },

  // ========================================
  // 15. PUNTO X PUNTO - SmartMag + Elementor ❌ DESACTIVADO (Cloudflare blocking)
  // ========================================
  {
    name: 'Punto por Punto Noticias',
    baseUrl: 'https://puntoporpuntonoticias.mx',
    listingUrl: 'https://puntoporpuntonoticias.mx/category/estatal/',
    testUrl: 'https://puntoporpuntonoticias.mx/236-caminos-afectados-y-22-puentes-danados-por-las-lluvias-en-hidalgo/',
    isActive: false,
    listingSelectors: {
      articleLinks: 'article.l-post a.image-link[href], article.l-post h2.post-title a[href]',
      titleSelector: 'h2.post-title a',
      imageSelector: 'span.img.bg-cover[data-bgsrc]',
      dateSelector: 'time.post-date',
      categorySelector: '.meta-item.post-cat a',
    },
    contentSelectors: {
      titleSelector: 'h1.is-title.post-title, .the-post-header h1',
      contentSelector: '.post-content.cf.entry-content.content-spacious, .post-content.entry-content',
      imageSelector: '.single-featured .featured img, a.image-link.media-ratio img',
      dateSelector: 'time.post-date',
      authorSelector: '.author.vcard a',
      categorySelector: '.post-meta .meta-item.post-cat a.category',
      excerptSelector: 'div.excerpt p',
    },
    extractionFrequency: 30,
    notes: '❌ DESACTIVADO: Cloudflare Error 500 bloquea extracción automática. WordPress SmartMag con Elementor. Selectores verificados manualmente 2025-10-16. RSS alternativo: https://puntoporpuntonoticias.mx/feed/',
  },

  // ========================================
  // 16. QUADRATIN HIDALGO - Quadratin 2022 ✅ VERIFICADO
  // ========================================
  {
    name: 'Quadratín Hidalgo',
    baseUrl: 'https://hidalgo.quadratin.com.mx',
    listingUrl: 'https://hidalgo.quadratin.com.mx/',
    testUrl: 'https://hidalgo.quadratin.com.mx/municipios/pronostican-lluvias-y-bajas-temperaturas-para-hidalgo/',
    isActive: true,
    listingSelectors: {
      articleLinks: 'article.q-notice > a:not(.tag-container)',
      titleSelector: 'article.q-notice h4',
      imageSelector: 'article.q-notice figure img',
      dateSelector: '.note-time time, p.note-time time',
      categorySelector: '.tag-container .tag',
    },
    contentSelectors: {
      titleSelector: '.q-content h1, h1',
      contentSelector: '.q-content__info, .q-content .q-content__info',
      imageSelector: '.q-content__carrousel figure img, img.wp-post-image',
      dateSelector: '.q-content__time .date, .q-content__time .hour',
      authorSelector: '.q-content__redacted',
      categorySelector: '.tag-container .tag',
      excerptSelector: '.q-notice__excerpt',
    },
    extractionFrequency: 30,
    notes: '✅ WordPress Quadratin 2022. Selectores verificados 2025-10-16. RSS alternativo: https://hidalgo.quadratin.com.mx/municipios/feed/',
  },

  // ========================================
  // 17. SINTESIS - Newspaper v7.6.1 ✅ VERIFICADO
  // ========================================
  {
    name: 'Síntesis Hidalgo',
    baseUrl: 'https://sintesis.com.mx/hidalgo',
    listingUrl: 'https://sintesis.com.mx/hidalgo/category/metropoli-hidalgo/',
    testUrl: 'https://sintesis.com.mx/hidalgo/2025/10/16/auxilian-235-policias-a-damnificados-por-huracanes-en-199-localidades/',
    isActive: true,
    listingSelectors: {
      articleLinks: '.td-module-thumb a[href], h3.entry-title.td-module-title a[href]',
      titleSelector: 'h3.entry-title.td-module-title a',
      imageSelector: '.td-module-thumb img.entry-thumb',
      dateSelector: 'time.entry-date.updated.td-module-date',
      categorySelector: 'a.td-post-category',
    },
    contentSelectors: {
      titleSelector: 'h1.entry-title',
      contentSelector: '.td-post-content',
      imageSelector: '.td-post-featured-image img',
      dateSelector: 'time.entry-date',
      authorSelector: '.td-post-author-name a',
      categorySelector: 'a.td-post-category',
      excerptSelector: '.td-excerpt',
    },
    extractionFrequency: 30,
    notes: '✅ WordPress Newspaper v7.6.1. Selectores verificados manualmente 2025-10-16. RSS alternativo: https://sintesis.com.mx/hidalgo/feed/',
  },

  // ========================================
  // 18. TENDENCIAS - Marfeel SDK (Belleza) ✅ VERIFICADO
  // ========================================
  {
    name: 'Trendencias',
    baseUrl: 'https://www.trendencias.com',
    listingUrl: 'https://www.trendencias.com/categoria/belleza',
    testUrl: 'https://www.trendencias.com/belleza/tres-colores-unas-que-rejuvenecen-manos-uno-que-suma-anos-experta-manicurista',
    isActive: true,
    listingSelectors: {
      articleLinks: '.abstract-title a[href], .abstract-figure a[href]',
      titleSelector: 'h2.abstract-title a',
      imageSelector: '.base-asset-image img',
      dateSelector: 'time.abstract-date',
      categorySelector: 'a.abstract-taxonomy',
    },
    contentSelectors: {
      titleSelector: 'h1',
      contentSelector: 'article .content, .article-content',
      imageSelector: 'article img, .article-image img',
      dateSelector: 'time.abstract-date, time',
      authorSelector: 'a.abstract-author, .author-name',
      categorySelector: 'a.abstract-taxonomy',
    },
    extractionFrequency: 60,
    extractionSettings: {
      useJavaScript: true,
      waitTime: 2000,
    },
    notes: '✅ Sitio de moda/belleza nacional. NO específico de Hidalgo. Incluido por solicitud del usuario. Selectores verificados 2025-10-16.',
  },

  // ========================================
  // 19. ZUNOTICIA - Twenty Twenty One + Elementor ✅ VERIFICADO
  // ========================================
  {
    name: 'Zunoticia',
    baseUrl: 'https://www.zunoticia.com/noticias-de-hidalgo',
    listingUrl: 'https://www.zunoticia.com/noticias-de-hidalgo/category/estado/',
    testUrl: 'https://www.zunoticia.com/noticias-de-hidalgo/2025/10/15/fueron-localizadas-dos-personas-con-vida/',
    isActive: true,
    listingSelectors: {
      articleLinks: '.anwp-pg-post-teaser__title a.anwp-link-without-effects[href]',
      titleSelector: '.anwp-pg-post-teaser__title a',
      imageSelector: '.anwp-pg-post-teaser__thumbnail img.anwp-pg-post-teaser__thumbnail-img',
      dateSelector: 'time.anwp-pg-published',
      categorySelector: '.anwp-pg-category__wrapper',
    },
    contentSelectors: {
      titleSelector: '.elementor-widget-theme-post-title .elementor-heading-title, h2.elementor-heading-title',
      contentSelector: '.elementor-widget-theme-post-content .elementor-widget-container',
      imageSelector: '.elementor-widget-theme-post-featured-image img',
      dateSelector: '.elementor-post-info__item--type-date',
      authorSelector: '.elementor-widget-theme-post-content p em',
      categorySelector: '.elementor-post-info__terms-list-item',
      excerptSelector: '.anwp-pg-post-teaser__excerpt',
    },
    extractionFrequency: 30,
    notes: '✅ WordPress Twenty Twenty One v2.3 con Elementor y AnWP Post Grid. Selectores verificados manualmente 2025-10-16.',
  },
];

async function bootstrap() {
  console.log('📰 Iniciando población de sitios web de noticias...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const newsWebsiteConfigModel = app.get<Model<NewsWebsiteConfigDocument>>('NewsWebsiteConfigModel');

  try {
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const config of SITES_CONFIG) {
      try {
        // Buscar si ya existe
        const existing = await newsWebsiteConfigModel.findOne({ name: config.name }).exec();

        if (existing) {
          // Actualizar configuración existente
          await newsWebsiteConfigModel.updateOne(
            { name: config.name },
            {
              $set: {
                ...config,
                updatedAt: new Date(),
              },
            }
          ).exec();

          updated++;
          console.log(`✅ Actualizado: ${config.name}`);
        } else {
          // Crear nueva configuración
          await newsWebsiteConfigModel.create({
            ...config,
            statistics: {
              totalUrlsExtracted: 0,
              totalContentGenerated: 0,
              totalPublished: 0,
              successfulExtractions: 0,
              failedExtractions: 0,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          created++;
          console.log(`🆕 Creado: ${config.name}`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error procesando ${config.name}:`, error.message);
      }
    }

    console.log('\n📊 Resumen de población:');
    console.log(`   ✅ Creados: ${created}`);
    console.log(`   🔄 Actualizados: ${updated}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📝 Total procesados: ${SITES_CONFIG.length}`);

    // Mostrar estadísticas finales
    const totalActive = await newsWebsiteConfigModel.countDocuments({ isActive: true }).exec();
    const totalInactive = await newsWebsiteConfigModel.countDocuments({ isActive: false }).exec();

    console.log('\n📈 Estado actual del sistema:');
    console.log(`   🟢 Sitios activos: ${totalActive}`);
    console.log(`   🔴 Sitios inactivos: ${totalInactive}`);
    console.log(`   📊 Total sitios: ${totalActive + totalInactive}`);

  } catch (error) {
    console.error('❌ Error fatal:', error);
  } finally {
    await app.close();
    console.log('\n✅ Proceso completado');
  }
}

bootstrap();
