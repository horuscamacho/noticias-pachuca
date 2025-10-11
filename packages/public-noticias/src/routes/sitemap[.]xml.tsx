import { createFileRoute } from '@tanstack/react-router'
import { getNoticias } from '../features/noticias'
import { getCategories } from '../features/public-content'

export const Route = createFileRoute('/sitemap.xml')({
  beforeLoad: async () => {
    // Fetch data
    const noticiasResponse = await getNoticias({
      data: {
        page: 1,
        limit: 10000, // Todas las noticias
        status: 'published',
        sortBy: 'publishedAt',
        sortOrder: 'desc',
      }
    })

    const categoriesResponse = await getCategories()

    const noticias = noticiasResponse.data || []
    const categories = categoriesResponse.data || []

    const baseUrl = 'https://noticiaspachuca.com'
    const now = new Date().toISOString()

    // Determinar prioridad y changefreq según antigüedad
    const getPriorityAndFreq = (publishedAt: Date) => {
      const daysSince = Math.floor(
        (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSince < 1) return { priority: 0.9, changefreq: 'hourly' }
      if (daysSince < 7) return { priority: 0.7, changefreq: 'daily' }
      if (daysSince < 30) return { priority: 0.6, changefreq: 'weekly' }
      return { priority: 0.5, changefreq: 'monthly' }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Noticias -->
  ${noticias.map(noticia => {
    const { priority, changefreq } = getPriorityAndFreq(noticia.publishedAt)
    const lastmod = noticia.updatedAt || noticia.publishedAt
    const isRecent = Math.floor(
      (Date.now() - new Date(noticia.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    ) < 2

    return `<url>
    <loc>${baseUrl}/noticia/${noticia.slug}</loc>
    ${isRecent ? `<news:news>
      <news:publication>
        <news:name>Noticias Pachuca</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${new Date(noticia.publishedAt).toISOString()}</news:publication_date>
      <news:title><![CDATA[${noticia.title}]]></news:title>
      ${noticia.keywords?.length > 0 ? `<news:keywords>${noticia.keywords.join(', ')}</news:keywords>` : ''}
    </news:news>` : ''}
    ${noticia.featuredImage?.large ? `<image:image>
      <image:loc>${noticia.featuredImage.large}</image:loc>
      <image:title><![CDATA[${noticia.title}]]></image:title>
      ${noticia.featuredImage.alt ? `<image:caption><![CDATA[${noticia.featuredImage.alt}]]></image:caption>` : ''}
    </image:image>` : ''}
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  }).join('\n  ')}

  <!-- Categorías -->
  ${categories.map(cat => `<url>
    <loc>${baseUrl}/categoria/${cat.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n  ')}

  <!-- Páginas estáticas -->
  <url>
    <loc>${baseUrl}/noticias</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${baseUrl}/editorial</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>${baseUrl}/columna-opinion</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>${baseUrl}/contacto</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <url>
    <loc>${baseUrl}/aviso-privacidad</loc>
    <lastmod>${now}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

</urlset>`

    // Throw Response para retornar XML directamente
    throw new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache 1 hora
      }
    })
  },
})
