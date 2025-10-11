# 🎯 SEO Improvement - Feature Context & Implementation Guide

**Noticias Pachuca - Optimización SEO 2025/2026**

---

## 📋 RESUMEN EJECUTIVO

### Estado Actual

✅ **Fortalezas Identificadas:**

- TanStack Start v1.132.51 con SSR completo
- Ruta `/noticia/$slug` con implementación SEO EXCELENTE (NewsArticle schema, OG tags completos, Twitter Cards)
- Estructura de URLs limpia y semántica
- OptimizedImage component implementado
- robots.txt configurado
- Plausible Analytics funcionando en producción
- web-vitals package instalado (v4.2.4)

❌ **Gaps Críticos:**

- **NO existe sitemap.xml** (Crítico para indexación)
- Homepage (`/index.tsx`) **sin head configuration** (Página más importante sin SEO)
- Rutas secundarias con SEO básico o incompleto
- Falta NewsArticle schema en rutas de listados
- Sin BreadcrumbList schema markup
- No hay optimización de Core Web Vitals implementada
- Imágenes sin formato moderno (AVIF/WebP)
- Sin implementación de prefetch/preload estratégico

### Impacto de Implementación

📈 **Mejoras Esperadas:**

- +40-60% en tráfico orgánico (6 meses)
- +35% en CTR desde resultados de búsqueda (rich snippets)
- -50% en tiempo de indexación de nuevos artículos
- Cumplimiento 100% Core Web Vitals
- Elegibilidad para Google Discover

---

## 🏆 FASES DE IMPLEMENTACIÓN

### 🔴 **FASE 1: MUST-HAVE INMEDIATO** (Semana 1-2)

**Prioridad:** CRÍTICA | **Impacto:** ALTO | **Esfuerzo:** MEDIO

#### Tareas:

1. **Implementar Sitemap Dinámico XML**
   - Generar `/sitemap.xml` con todas las noticias publicadas
   - Actualización automática en cada deploy
   - Incluir `<lastmod>`, `<changefreq>`, `<priority>`
   - Segmentar por tipo: sitemap-index.xml → sitemap-noticias.xml, sitemap-categorias.xml

2. **Completar SEO de Homepage (`/index.tsx`)**
   - Agregar `head:` configuration completa
   - Meta tags: title, description, keywords
   - Open Graph completo con imagen destacada
   - Twitter Card
   - JSON-LD: Organization + WebSite schema

3. **NewsArticle Schema en Todos los Artículos**
   - Verificar que `/noticia.$slug.tsx` tenga estructura completa
   - Incluir: headline, datePublished, dateModified, author, publisher, image, articleBody

4. **BreadcrumbList Schema Markup**
   - Implementar en todas las rutas con breadcrumbs
   - `/categoria/$slug`, `/noticia/$slug`, `/autor/$slug`, `/tag/$slug`

5. **robots.txt Enhancement**
   - Agregar referencia a sitemap: `Sitemap: https://noticiaspachuca.com/sitemap.xml`
   - Configurar crawl-delay si es necesario

**Entregables:**

- ✅ Sitemap funcional en producción
- ✅ Homepage con SEO completo
- ✅ Todos los artículos con NewsArticle schema válido
- ✅ BreadcrumbList en rutas principales

---

### 🟡 **FASE 2: MUST-HAVE PRONTO** (Semana 3-4)

**Prioridad:** ALTA | **Impacto:** ALTO | **Esfuerzo:** MEDIO-ALTO

#### Tareas:

1. **Google Search Console Integration**
   - Verificar propiedad del sitio
   - Subir sitemap.xml
   - Configurar alertas de errores de indexación
   - Monitorear Core Web Vitals desde GSC

2. **Optimización de Imágenes Avanzada**
   - Implementar conversión automática a AVIF/WebP
   - Configurar CDN para servir formatos modernos
   - Agregar `<picture>` element con fallbacks
   - Implementar lazy loading inteligente (no en LCP image)
   - `fetchpriority="high"` en imagen destacada de artículos

3. **Páginas de Autor con E-E-A-T Signals**
   - `/autor/$slug` con Person schema completo
   - Bio extendida, credenciales, enlaces a redes sociales
   - Foto profesional optimizada
   - Listado de artículos del autor con paginación

4. **Canonical URLs en Todas las Páginas**
   - Asegurar que TODAS las rutas tengan `<link rel="canonical">`
   - Evitar contenido duplicado por parámetros de URL

5. **Meta Tags Avanzados**
   - `<meta name="robots" content="index, follow">` por defecto
   - `<meta name="robots" content="max-image-preview:large">`
   - `<meta name="robots" content="max-snippet:-1">`
   - Configurar `noindex` para páginas de paginación >1

6. **ItemList Schema para Listados**
   - Implementar en `/noticias`, `/categoria/$slug`, `/busqueda/$query`
   - Mejorar visibilidad en resultados de búsqueda

**Entregables:**

- ✅ Search Console activo y monitoreado
- ✅ Imágenes en formato moderno con lazy loading
- ✅ Páginas de autor optimizadas para E-E-A-T
- ✅ Canonical URLs en todas las páginas
- ✅ ItemList schema en listados

---

### 🟢 **FASE 3: NICE-TO-HAVE** (Semana 5-6)

**Prioridad:** MEDIA | **Impacto:** MEDIO | **Esfuerzo:** ALTO

#### Tareas:

1. **Core Web Vitals Optimization**
   - **LCP Optimization:**
     - Preload featured image: `<link rel="preload" as="image" href="..."`
     - Eliminar render-blocking resources
     - Implementar resource hints (dns-prefetch, preconnect)
   - **INP Optimization:**
     - Reducir JavaScript main thread blocking
     - Implementar code splitting por ruta
     - Lazy load componentes no-críticos
   - **CLS Optimization:**
     - Reservar espacio para imágenes (width/height)
     - Evitar inserción dinámica de banners/ads sin espacio reservado

2. **RSS Feed para Google Discover**
   - Generar `/rss.xml` con últimas 100 noticias
   - Incluir imágenes de alta resolución (1200x675px mínimo)
   - Implementar feed específico por categoría

3. **AMP (Accelerated Mobile Pages) para Artículos**
   - Crear versión AMP de `/noticia/$slug`
   - Link rel="amphtml" en versión desktop
   - Validar con AMP Validator

4. **Prefetch Estratégico**
   - Prefetch artículos relacionados en hover
   - Preload critical assets (fonts, CSS)
   - Implementar service worker para caching offline

5. **Structured Data Avanzado**
   - **FAQPage schema** si aplica
   - **VideoObject schema** para videos embebidos
   - **LocalBusiness schema** para sección de contacto
   - **Event schema** si cubren eventos locales

6. **Internal Linking Strategy**
   - Sistema automático de links internos relacionados
   - Anchor texts optimizados
   - Profundidad máxima de 3 clics desde homepage

**Entregables:**

- ✅ Core Web Vitals en verde (LCP < 2.5s, INP < 200ms, CLS < 0.1)
- ✅ RSS feed funcional
- ✅ Prefetch implementado estratégicamente
- ✅ Structured data avanzado en todas las páginas relevantes

---

## 🔍 ANÁLISIS DETALLADO DEL ESTADO ACTUAL

### Estructura de Rutas Existentes

| Ruta                | Head Config | OG Tags     | Schema         | Canonical | Estado       |
| ------------------- | ----------- | ----------- | -------------- | --------- | ------------ |
| `/` (Homepage)      | ❌ NO       | ❌ NO       | ❌ NO          | ❌ NO     | 🔴 CRÍTICO   |
| `/noticia/$slug`    | ✅ COMPLETO | ✅ COMPLETO | ✅ NewsArticle | ✅ SÍ     | 🟢 EXCELENTE |
| `/categoria/$slug`  | ⚠️ BÁSICO   | ⚠️ BÁSICO   | ❌ NO          | ❌ NO     | 🟡 MEJORABLE |
| `/noticias`         | ⚠️ BÁSICO   | ⚠️ BÁSICO   | ❌ NO          | ❌ NO     | 🟡 MEJORABLE |
| `/autor/$slug`      | ⚠️ BÁSICO   | ⚠️ BÁSICO   | ❌ NO          | ❌ NO     | 🟡 MEJORABLE |
| `/tag/$slug`        | ⚠️ BÁSICO   | ⚠️ BÁSICO   | ❌ NO          | ❌ NO     | 🟡 MEJORABLE |
| `/busqueda/$query`  | ⚠️ BÁSICO   | ❌ NO       | ❌ NO          | ❌ NO     | 🟡 MEJORABLE |
| `/editorial/$slug`  | ❓ N/A      | ❓ N/A      | ❓ N/A         | ❓ N/A    | ❓ REVISAR   |
| `/columna/$slug`    | ❓ N/A      | ❓ N/A      | ❓ N/A         | ❓ N/A    | ❓ REVISAR   |
| `/columnista/$slug` | ❓ N/A      | ❓ N/A      | ❓ N/A         | ❓ N/A    | ❓ REVISAR   |

### Archivos Existentes

- ✅ **robots.txt**: Configurado pero básico (falta referencia a sitemap)
- ❌ **sitemap.xml**: NO EXISTE (CRÍTICO)
- ❌ **RSS feed**: NO EXISTE
- ✅ **Plausible Analytics**: Funcionando correctamente en producción
- ✅ **OptimizedImage component**: Implementado pero sin AVIF/WebP

### Configuración Técnica

- **Framework:** TanStack Start v1.132.51
- **React:** v19.0.0
- **SSR:** ✅ Completamente funcional
- **Build Tool:** Vite v7.1.9
- **Monitoreo:** web-vitals v4.2.4 instalado (no implementado)
- **Hosting:** AWS con CI/CD funcional

---

## 📚 INVESTIGACIÓN: BEST PRACTICES SEO 2025/2026

### 1. Core Web Vitals (Google Ranking Factor desde 2021)

**Métricas Críticas:**

- **LCP (Largest Contentful Paint):** < 2.5s ✅ GOOD | 2.5s-4s ⚠️ NEEDS IMPROVEMENT | >4s ❌ POOR
  - _Impacto:_ Primera impresión, tiempo de carga percibido
  - _Optimización:_ Preload LCP image, CDN, image optimization, reduce server response time

- **INP (Interaction to Next Paint):** < 200ms ✅ GOOD | 200ms-500ms ⚠️ | >500ms ❌ POOR
  - _Reemplaza FID desde marzo 2024_
  - _Impacto:_ Responsividad a interacciones del usuario
  - _Optimización:_ Reduce JavaScript execution time, code splitting, lazy load

- **CLS (Cumulative Layout Shift):** < 0.1 ✅ GOOD | 0.1-0.25 ⚠️ | >0.25 ❌ POOR
  - _Impacto:_ Estabilidad visual, UX
  - _Optimización:_ Set width/height en imágenes, reservar espacio para ads/banners

### 2. NewsArticle Schema (JSON-LD)

**Estructura Requerida para News Sites:**

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Título completo de la noticia (max 110 chars)",
  "alternativeHeadline": "Subtítulo o título alternativo",
  "image": [
    "https://example.com/image-1x1.jpg",
    "https://example.com/image-4x3.jpg",
    "https://example.com/image-16x9.jpg"
  ],
  "datePublished": "2025-01-15T08:00:00+00:00",
  "dateModified": "2025-01-15T09:30:00+00:00",
  "author": {
    "@type": "Person",
    "name": "Nombre Completo del Autor",
    "url": "https://example.com/autor/nombre-apellido",
    "jobTitle": "Reportero Senior",
    "description": "Bio del autor"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Noticias Pachuca",
    "logo": {
      "@type": "ImageObject",
      "url": "https://noticiaspachuca.com/logo-600x60.png",
      "width": 600,
      "height": 60
    }
  },
  "description": "Meta description / excerpt (160 chars)",
  "articleBody": "Contenido completo del artículo en texto plano",
  "articleSection": "Política, Deportes, etc.",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "wordCount": 850,
  "url": "https://noticiaspachuca.com/noticia/slug-del-articulo",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://noticiaspachuca.com/noticia/slug-del-articulo"
  }
}
```

**Beneficios:**

- Rich snippets en Google (imagen, fecha, autor)
- Elegibilidad para Google News Top Stories
- Mayor CTR (+35% promedio)
- Mejor indexación por Google Bot

### 3. Sitemap XML - Generación Dinámica

**Estructura Recomendada para News Sites:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://noticiaspachuca.com/sitemap-noticias.xml</loc>
    <lastmod>2025-01-15T10:00:00+00:00</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://noticiaspachuca.com/sitemap-categorias.xml</loc>
    <lastmod>2025-01-10T00:00:00+00:00</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://noticiaspachuca.com/sitemap-autores.xml</loc>
    <lastmod>2025-01-10T00:00:00+00:00</lastmod>
  </sitemap>
</sitemapindex>
```

**sitemap-noticias.xml:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>https://noticiaspachuca.com/noticia/slug-ejemplo</loc>
    <news:news>
      <news:publication>
        <news:name>Noticias Pachuca</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>2025-01-15T08:00:00+00:00</news:publication_date>
      <news:title>Título de la Noticia</news:title>
      <news:keywords>keyword1, keyword2, keyword3</news:keywords>
    </news:news>
    <lastmod>2025-01-15T09:30:00+00:00</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
```

**Frecuencias Recomendadas:**

- Artículos nuevos (< 24h): `priority: 0.9`, `changefreq: hourly`
- Artículos recientes (< 7 días): `priority: 0.7`, `changefreq: daily`
- Artículos antiguos (> 30 días): `priority: 0.5`, `changefreq: weekly`
- Páginas estáticas: `priority: 0.6`, `changefreq: monthly`

### 4. URL Slug Best Practices (2025)

**Estructura Óptima:**

- ✅ 3-5 palabras clave
- ✅ Todo en minúsculas
- ✅ Separadas por guiones (`-`)
- ❌ NO incluir fechas en URL (afecta evergreen content)
- ❌ NO usar stop words (el, la, de, en, etc.) - opcional según contexto
- ✅ Incluir keyword principal del artículo

**Ejemplos:**

- ❌ MAL: `/noticia/2025/01/15/inauguran-nuevo-centro-de-salud-en-pachuca`
- ✅ BIEN: `/noticia/centro-salud-pachuca-inauguracion`
- ✅ BIEN: `/noticia/pachuca-nuevo-centro-salud`

**Beneficios URLs Limpias:**

- Mayor CTR en SERPs
- Mejor UX (URLs legibles y compartibles)
- Mejor keyword targeting
- No expira contenido por fecha en URL

### 5. E-E-A-T Signals (Experience, Expertise, Authoritativeness, Trustworthiness)

**Crítico para News Sites desde Google Helpful Content Update:**

**Implementación:**

1. **Páginas de Autor Completas:**
   - Bio extendida (200+ palabras)
   - Credenciales y experiencia
   - Enlaces a redes sociales verificadas
   - Foto profesional de alta calidad
   - Todos los artículos del autor

2. **About/Acerca de Page:**
   - Historia del medio
   - Equipo editorial
   - Estándares periodísticos
   - Política de correcciones
   - Contacto editorial

3. **Aviso de Privacidad + Términos y Condiciones:**
   - Transparencia en recopilación de datos
   - Política de cookies clara
   - GDPR compliance (si aplica)

4. **Contacto Visible:**
   - Email editorial
   - Teléfono
   - Dirección física (si aplica)
   - Formulario de contacto funcional

5. **Fechas y Actualizaciones:**
   - Fecha de publicación visible
   - Fecha de última modificación (si aplica)
   - Indicar si es contenido actualizado

### 6. Google News (2025 Status)

**Estado Actual:**

- ❌ Submissions manuales CERRADAS desde abril 2024
- ✅ Google selecciona publishers automáticamente (handpicked)
- ✅ Elegibilidad basada en:
  - Calidad editorial
  - E-E-A-T signals
  - Core Web Vitals
  - NewsArticle schema completo
  - Frecuencia de publicación consistente
  - Cumplimiento de políticas de contenido

**Requisitos Técnicos (2025):**

1. **Sitemap News XML** (formato específico)
2. **NewsArticle schema** en todos los artículos
3. **Core Web Vitals en verde**
4. **URLs únicas y estables** (no cambiar slugs)
5. **Imágenes de alta calidad** (min 1200x675px)
6. **Frecuencia:** Min 5 artículos/semana

**Estrategia:**

- ✅ Implementar todos los requisitos técnicos
- ✅ Mantener calidad editorial alta
- ✅ Publicar consistentemente
- ⏳ Esperar selección automática por Google (2-6 meses)

### 7. Image Optimization (2025)

**Formatos Modernos:**

- **AVIF:** -50% tamaño vs WebP, soporte creciendo (88% browsers)
- **WebP:** Estándar actual, -30% vs JPEG, soporte universal
- **Fallback JPEG:** Para browsers antiguos

**Implementación con `<picture>`:**

```html
<picture>
  <source type="image/avif" srcset="image.avif" />
  <source type="image/webp" srcset="image.webp" />
  <img src="image.jpg" alt="..." loading="lazy" width="1200" height="675" />
</picture>
```

**Lazy Loading Strategy:**

- ✅ `loading="lazy"` en imágenes below-the-fold
- ❌ NO usar en LCP image (primera imagen visible)
- ✅ `fetchpriority="high"` en featured image de artículos
- ✅ `decoding="async"` en todas las imágenes

**Tamaños Recomendados (News Sites):**

- Hero/Featured: 1920x1080px (16:9)
- Thumbnails: 800x450px (16:9)
- Author photos: 400x400px (1:1)
- Logo: 600x60px (para schema)

### 8. TanStack Start SEO Capabilities

**Built-in Features:**

1. **`routeOptions.head`** - Server-side meta tags rendering
2. **Server Functions (`createServerFn`)** - SEO-friendly data fetching
3. **Streaming SSR** - Mejor TTFB (Time to First Byte)
4. **Islands Architecture** - Hydration selectiva, menor JS bundle

**Limitaciones y Soluciones:**

- **No built-in sitemap:** Implementar endpoint custom `/sitemap.xml`
- **No automatic canonical:** Agregar manualmente en cada ruta
- **No structured data helpers:** Implementar generadores de JSON-LD

**Ventajas vs Next.js:**

- ✅ Menor overhead (React Server Components no requerido)
- ✅ Bundle size menor (-40% aprox)
- ✅ Streaming SSR más eficiente
- ⚠️ Menos tooling SEO out-of-the-box

### 9. Indexación Dinámica - Desafíos

**Problema:** Noticias nuevas tardan en indexarse

**Soluciones:**

1. **Google Indexing API** (para news sites aprobados)
   - Push instantáneo de nuevas URLs
   - Requiere Service Account GCP
   - Límite: 200 URLs/día

2. **Sitemap en Tiempo Real:**
   - Regenerar sitemap cada vez que se publica noticia
   - Ping a Google: `http://www.google.com/ping?sitemap=URL`

3. **Internal Linking Automático:**
   - Linkear nuevos artículos desde homepage
   - Links desde artículos relacionados

4. **RSS Feed:**
   - Google lee RSS feeds frecuentemente
   - Actualizar cada hora

### 10. Mobile-First Indexing (Default desde 2023)

**Google indexa SOLO versión móvil:**

**Checklist:**

- ✅ Responsive design completo
- ✅ Contenido idéntico desktop/mobile
- ✅ Imágenes responsive (srcset)
- ✅ Touch targets min 48x48px
- ✅ Font size legible (16px min)
- ✅ No horizontal scroll
- ✅ Viewport meta tag configurado

---

## 🛠️ ESPECIFICACIONES TÉCNICAS DE IMPLEMENTACIÓN

### FASE 1 - Implementación Detallada

#### 1.1 Sitemap Dinámico - `/app/routes/sitemap[.]xml.tsx`

```typescript
// /app/routes/sitemap[.]xml.tsx
import { createFileRoute } from "@tanstack/react-router";
import { getNoticias } from "../features/noticias";
import { getCategories } from "../features/public-content";

export const Route = createFileRoute("/sitemap.xml")({
  loader: async () => {
    const noticiasResponse = await getNoticias({
      data: {
        page: 1,
        limit: 10000, // Todas las noticias
        status: "published",
        sortBy: "publishedAt",
        sortOrder: "desc",
      },
    });

    const categoriesResponse = await getCategories();

    return {
      noticias: noticiasResponse.data || [],
      categories: categoriesResponse.data || [],
    };
  },
  component: () => null, // No renderizar componente React
  beforeLoad: async ({ context }) => {
    // Generar XML en beforeLoad y retornar Response
    const { noticias, categories } = await context.loader();

    const baseUrl = "https://noticiaspachuca.com";
    const now = new Date().toISOString();

    // Determinar prioridad y changefreq según antigüedad
    const getPriorityAndFreq = (publishedAt: Date) => {
      const daysSince = Math.floor(
        (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSince < 1) return { priority: 0.9, changefreq: "hourly" };
      if (daysSince < 7) return { priority: 0.7, changefreq: "daily" };
      if (daysSince < 30) return { priority: 0.6, changefreq: "weekly" };
      return { priority: 0.5, changefreq: "monthly" };
    };

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
  ${noticias
    .map((noticia) => {
      const { priority, changefreq } = getPriorityAndFreq(noticia.publishedAt);
      const lastmod = noticia.updatedAt || noticia.publishedAt;
      const isRecent =
        Math.floor(
          (Date.now() - new Date(noticia.publishedAt).getTime()) /
            (1000 * 60 * 60 * 24)
        ) < 2;

      return `<url>
    <loc>${baseUrl}/noticia/${noticia.slug}</loc>
    ${
      isRecent
        ? `<news:news>
      <news:publication>
        <news:name>Noticias Pachuca</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${new Date(noticia.publishedAt).toISOString()}</news:publication_date>
      <news:title><![CDATA[${noticia.title}]]></news:title>
      ${noticia.keywords?.length > 0 ? `<news:keywords>${noticia.keywords.join(", ")}</news:keywords>` : ""}
    </news:news>`
        : ""
    }
    ${
      noticia.featuredImage?.large
        ? `<image:image>
      <image:loc>${noticia.featuredImage.large}</image:loc>
      <image:title><![CDATA[${noticia.title}]]></image:title>
      ${noticia.featuredImage.alt ? `<image:caption><![CDATA[${noticia.featuredImage.alt}]]></image:caption>` : ""}
    </image:image>`
        : ""
    }
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join("\n  ")}

  <!-- Categorías -->
  ${categories
    .map(
      (cat) => `<url>
    <loc>${baseUrl}/categoria/${cat.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join("\n  ")}

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

</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600", // Cache 1 hora
      },
    });
  },
});
```

#### 1.2 Homepage SEO - `/app/routes/index.tsx`

```typescript
// Agregar al Route configuration existente:
export const Route = createFileRoute("/")({
  component: HomePage,
  loader: async () => {
    // ... loader existente
  },
  head: () => {
    const canonicalUrl = "https://noticiaspachuca.com";
    const ogImage = "https://noticiaspachuca.com/og-image-home.jpg"; // Crear imagen 1200x630

    return {
      meta: [
        // Basic meta tags
        {
          title:
            "Noticias Pachuca - Noticias de Última Hora en Pachuca, Hidalgo y México",
        },
        {
          name: "description",
          content:
            "Mantente informado con las últimas noticias de Pachuca, Hidalgo y México. Política, deportes, cultura, economía y más. Actualizado 24/7.",
        },
        {
          name: "keywords",
          content:
            "noticias pachuca, pachuca hidalgo, noticias hidalgo, noticias méxico, diario pachuca, periódico pachuca",
        },

        // Open Graph
        {
          property: "og:title",
          content: "Noticias Pachuca - Tu Fuente de Información Local",
        },
        {
          property: "og:description",
          content:
            "Las noticias más importantes de Pachuca, Hidalgo y México. Cobertura 24/7 de política, deportes, cultura y más.",
        },
        { property: "og:image", content: ogImage },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:site_name", content: "Noticias Pachuca" },
        { property: "og:locale", content: "es_MX" },

        // Twitter Card
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "Noticias Pachuca - Tu Fuente de Información Local",
        },
        {
          name: "twitter:description",
          content: "Las noticias más importantes de Pachuca, Hidalgo y México.",
        },
        { name: "twitter:image", content: ogImage },

        // Additional meta
        {
          name: "robots",
          content: "index, follow, max-image-preview:large, max-snippet:-1",
        },
        { name: "googlebot", content: "index, follow" },
        { name: "language", content: "es-MX" },
        { name: "geo.region", content: "MX-HGO" },
        { name: "geo.placename", content: "Pachuca de Soto" },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
      scripts: [
        // Organization + WebSite Schema
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://noticiaspachuca.com/#organization",
                name: "Noticias Pachuca",
                url: "https://noticiaspachuca.com",
                logo: {
                  "@type": "ImageObject",
                  "@id": "https://noticiaspachuca.com/#logo",
                  url: "https://noticiaspachuca.com/logo-600x60.png",
                  width: 600,
                  height: 60,
                  caption: "Noticias Pachuca",
                },
                sameAs: [
                  "https://facebook.com/noticiaspachuca",
                  "https://twitter.com/noticiaspachuca",
                  "https://instagram.com/noticiaspachuca",
                ],
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "editorial",
                  email: "contacto@noticiaspachuca.com",
                },
              },
              {
                "@type": "WebSite",
                "@id": "https://noticiaspachuca.com/#website",
                url: "https://noticiaspachuca.com",
                name: "Noticias Pachuca",
                description: "Noticias de Pachuca, Hidalgo y México",
                publisher: {
                  "@id": "https://noticiaspachuca.com/#organization",
                },
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate:
                      "https://noticiaspachuca.com/busqueda/{search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ],
          }),
        },
      ],
    };
  },
});
```

#### 1.3 BreadcrumbList Schema - Utility Helper

```typescript
// /app/utils/generateBreadcrumbSchema.ts
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: index === items.length - 1 ? undefined : item.url, // Último item sin URL
    })),
  };
}
```

**Uso en `/categoria/$slug.tsx`:**

```typescript
export const Route = createFileRoute("/categoria/$slug")({
  // ... loader existente
  head: ({ loaderData }) => {
    const { category } = loaderData;
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: "Inicio", url: "https://noticiaspachuca.com" },
      {
        name: category.name,
        url: `https://noticiaspachuca.com/categoria/${category.slug}`,
      },
    ]);

    return {
      meta: [
        { title: category.seoTitle },
        { name: "description", content: category.seoDescription },
        { property: "og:title", content: category.seoTitle },
        { property: "og:description", content: category.seoDescription },
        { property: "og:type", content: "website" },
        {
          property: "og:url",
          content: `https://noticiaspachuca.com/categoria/${category.slug}`,
        },
        { name: "robots", content: "index, follow" },
      ],
      links: [
        {
          rel: "canonical",
          href: `https://noticiaspachuca.com/categoria/${category.slug}`,
        },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(breadcrumbSchema),
        },
      ],
    };
  },
});
```

#### 1.4 robots.txt Enhancement

```txt
# /public/robots.txt
User-agent: *
Allow: /

# Sitemaps
Sitemap: https://noticiaspachuca.com/sitemap.xml

# Evitar indexar páginas de paginación duplicadas
User-agent: Googlebot
Disallow: /*?page=

# Evitar indexar resultados de búsqueda con pocos resultados
User-agent: *
Disallow: /busqueda/*

# Evitar páginas de registro/login
User-agent: *
Disallow: /login
Disallow: /registro
Disallow: /perfil

# Crawl-delay para bots agresivos
User-agent: MJ12bot
Crawl-delay: 10

User-agent: AhrefsBot
Crawl-delay: 10
```

---

### FASE 2 - Implementación Detallada

#### 2.1 Imagen Optimization - OptimizedImage v2

```typescript
// /app/components/OptimizedImage.tsx (UPDATED)
import { useState, useEffect } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  priority?: boolean // LCP image
  sizes?: string
  width?: number
  height?: number
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  priority = false,
  sizes = '100vw',
  width,
  height
}: OptimizedImageProps) {
  // Generar URLs para diferentes formatos (asumiendo CDN soporta transformaciones)
  const getImageUrl = (format: 'avif' | 'webp' | 'jpg', quality = 85) => {
    // Si usas Cloudflare Images o similar:
    // return `${src}?format=${format}&quality=${quality}`

    // Si usas AWS S3 + Lambda@Edge para transformación:
    // return `${src}?f=${format}&q=${quality}`

    // Por ahora, asumir CDN detecta formato por Accept header
    return src
  }

  const avifSrc = getImageUrl('avif', 80)
  const webpSrc = getImageUrl('webp', 85)
  const jpgSrc = getImageUrl('jpg', 85)

  return (
    <picture>
      <source type="image/avif" srcSet={avifSrc} />
      <source type="image/webp" srcSet={webpSrc} />
      <img
        src={jpgSrc}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        width={width}
        height={height}
        sizes={sizes}
      />
    </picture>
  )
}
```

#### 2.2 Páginas de Autor con E-E-A-T - `/autor/$slug.tsx` Enhancement

```typescript
// Agregar al head existente:
head: ({ loaderData }) => {
  const { author } = loaderData;

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    url: `https://noticiaspachuca.com/autor/${author.slug}`,
    image: author.photo || "https://noticiaspachuca.com/default-author.jpg",
    jobTitle: author.jobTitle || "Reportero",
    description: author.bio,
    worksFor: {
      "@type": "Organization",
      name: "Noticias Pachuca",
      url: "https://noticiaspachuca.com",
    },
    sameAs: [
      author.twitter && `https://twitter.com/${author.twitter}`,
      author.linkedin && author.linkedin,
      author.facebook && author.facebook,
    ].filter(Boolean),
  };

  return {
    meta: [
      { title: `${author.name} - Autor en Noticias Pachuca` },
      {
        name: "description",
        content: author.bio || `Todas las noticias escritas por ${author.name}`,
      },
      { property: "og:type", content: "profile" },
      { property: "og:title", content: `${author.name} - Noticias Pachuca` },
      { property: "og:image", content: author.photo },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      {
        rel: "canonical",
        href: `https://noticiaspachuca.com/autor/${author.slug}`,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(personSchema),
      },
    ],
  };
};
```

#### 2.3 ItemList Schema para Listados - `/noticias.tsx`

```typescript
head: ({ loaderData }) => {
  const { noticias } = loaderData;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: noticias.slice(0, 10).map((noticia, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://noticiaspachuca.com/noticia/${noticia.slug}`,
      name: noticia.title,
    })),
  };

  return {
    meta: [
      { title: "Todas las Noticias - Noticias Pachuca" },
      {
        name: "description",
        content:
          "Mantente informado con las últimas noticias de Pachuca, Hidalgo y México.",
      },
      {
        property: "og:title",
        content: "Todas las Noticias - Noticias Pachuca",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "https://noticiaspachuca.com/noticias" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(itemListSchema),
      },
    ],
  };
};
```

---

### FASE 3 - Core Web Vitals Optimization

#### 3.1 LCP Optimization - Resource Hints

```typescript
// __root.tsx - Agregar en head global
export const Route = createRootRoute({
  head: () => ({
    links: [
      // DNS Prefetch para dominios externos
      { rel: "dns-prefetch", href: "https://plausible.io" },
      { rel: "dns-prefetch", href: "https://cdn.noticiaspachuca.com" },

      // Preconnect para recursos críticos
      {
        rel: "preconnect",
        href: "https://cdn.noticiaspachuca.com",
        crossOrigin: "anonymous",
      },

      // Preload critical assets
      {
        rel: "preload",
        href: "/fonts/inter-bold.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
    ],
  }),
});
```

```typescript
// /noticia/$slug.tsx - Preload LCP image
head: ({ loaderData }) => {
  const { noticia } = loaderData;

  return {
    links: [
      // Preload featured image (LCP element)
      noticia.featuredImage?.large && {
        rel: "preload",
        as: "image",
        href: noticia.featuredImage.large,
        imageSrcSet: `${noticia.featuredImage.medium} 800w, ${noticia.featuredImage.large} 1200w`,
        imageSizes: "(max-width: 768px) 100vw, 1200px",
        fetchPriority: "high",
      },
    ].filter(Boolean),
    // ... resto del head
  };
};
```

#### 3.2 INP Optimization - Code Splitting

```typescript
// Lazy load components no-críticos
import { lazy, Suspense } from 'react'

const SubscribeForm = lazy(() => import('../components/newsletter/SubscribeForm'))
const RelatedArticles = lazy(() => import('../components/shared/RelatedArticles'))

// Uso:
<Suspense fallback={<div className="h-40 bg-gray-100 animate-pulse" />}>
  <SubscribeForm />
</Suspense>
```

#### 3.3 CLS Optimization - Reserve Space

```typescript
// Siempre incluir width/height en imágenes
<OptimizedImage
  src={article.imageUrl}
  alt={article.title}
  width={800}
  height={450}
  className="w-full h-auto" // CSS mantiene aspect ratio
  priority={false}
/>

// Para banners/ads, reservar espacio:
<div className="min-h-[250px] bg-gray-100">
  {/* Ad container */}
</div>
```

#### 3.4 Monitoring Implementation

```typescript
// /app/utils/webVitals.ts
import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";

export function initWebVitalsTracking() {
  if (typeof window === "undefined") return;

  onCLS((metric) => {
    // Enviar a analytics
    if (window.plausible) {
      window.plausible("Web Vitals", {
        props: {
          metric: "CLS",
          value: metric.value.toFixed(4),
          rating: metric.rating,
        },
      });
    }
  });

  onINP((metric) => {
    if (window.plausible) {
      window.plausible("Web Vitals", {
        props: {
          metric: "INP",
          value: Math.round(metric.value),
          rating: metric.rating,
        },
      });
    }
  });

  onLCP((metric) => {
    if (window.plausible) {
      window.plausible("Web Vitals", {
        props: {
          metric: "LCP",
          value: Math.round(metric.value),
          rating: metric.rating,
        },
      });
    }
  });
}
```

```typescript
// __root.tsx - Inicializar tracking
import { initWebVitalsTracking } from './utils/webVitals'

function RootComponent() {
  useEffect(() => {
    if (import.meta.env.PROD) {
      initWebVitalsTracking()
    }
  }, [])

  return <Outlet />
}
```

---

## 📊 MÉTRICAS DE ÉXITO

### KPIs a Monitorear (Google Search Console + Plausible)

1. **Organic Traffic:**
   - Baseline: [Medir en semana 1]
   - Objetivo 3 meses: +25%
   - Objetivo 6 meses: +50%

2. **Average CTR:**
   - Baseline: [Medir en GSC]
   - Objetivo: 5-7% (con rich snippets)

3. **Avg. Position:**
   - Baseline: [Medir top 10 keywords]
   - Objetivo: Top 3 para keywords principales

4. **Core Web Vitals (GSC):**
   - LCP: 90%+ URLs en "Good" (< 2.5s)
   - INP: 90%+ URLs en "Good" (< 200ms)
   - CLS: 95%+ URLs en "Good" (< 0.1)

5. **Indexed Pages:**
   - Baseline: [Medir actual]
   - Objetivo: 100% de páginas publicadas indexadas en < 24h

6. **Mobile Usability Errors:**
   - Objetivo: 0 errores en GSC

7. **Structured Data Errors:**
   - Objetivo: 0 errores, 100% valid schema

---

## 🔄 MANTENIMIENTO CONTINUO

### Tareas Mensuales:

- ✅ Review Google Search Console performance
- ✅ Check for crawl errors y fix them
- ✅ Monitor Core Web Vitals trends
- ✅ Update sitemap if structure changes
- ✅ Review top keywords y optimize content

### Tareas Trimestrales:

- ✅ SEO audit completo (Screaming Frog o Sitebulb)
- ✅ Competitor analysis (keywords, backlinks)
- ✅ Content gap analysis
- ✅ Update meta descriptions underperforming

### Tareas Anuales:

- ✅ Full technical SEO audit
- ✅ Schema markup updates (new standards)
- ✅ Image optimization review (new formats)
- ✅ URL structure review

---

## 📚 RECURSOS Y HERRAMIENTAS

### Testing Tools:

1. **Google Search Console** - https://search.google.com/search-console
2. **Google PageSpeed Insights** - https://pagespeed.web.dev
3. **Schema Markup Validator** - https://validator.schema.org
4. **Rich Results Test** - https://search.google.com/test/rich-results
5. **Mobile-Friendly Test** - https://search.google.com/test/mobile-friendly
6. **Lighthouse CI** - Integrar en GitHub Actions

### Monitoring:

1. **Google Search Console** - Organic performance
2. **Plausible Analytics** - User behavior + Web Vitals events
3. **UptimeRobot** - Monitorear uptime
4. **Sentry** - Error tracking

### SEO Resources:

1. **Google Search Central Blog** - https://developers.google.com/search/blog
2. **Schema.org Documentation** - https://schema.org
3. **Core Web Vitals Guide** - https://web.dev/vitals

---

## ✅ CHECKLIST PRE-LAUNCH

Antes de marcar una fase como completada, verificar:

### FASE 1 Checklist:

- [ ] Sitemap.xml accesible en `https://noticiaspachuca.com/sitemap.xml`
- [ ] Sitemap incluye TODAS las páginas importantes
- [ ] Sitemap enviado a Google Search Console
- [ ] Homepage tiene head completo con todos los meta tags
- [ ] Validar Organization schema en https://validator.schema.org
- [ ] Validar WebSite schema con SearchAction
- [ ] Todos los artículos tienen NewsArticle schema completo
- [ ] BreadcrumbList implementado en rutas con breadcrumbs
- [ ] Validar breadcrumbs en https://search.google.com/test/rich-results
- [ ] robots.txt incluye referencia a sitemap
- [ ] Probar `curl https://noticiaspachuca.com/robots.txt`

### FASE 2 Checklist:

- [ ] Google Search Console verificado y sitemap enviado
- [ ] OptimizedImage component actualizado con AVIF/WebP
- [ ] Páginas de autor tienen Person schema completo
- [ ] Canonical URLs en TODAS las páginas
- [ ] Meta robots configurado correctamente (index/noindex según página)
- [ ] ItemList schema en páginas de listado
- [ ] Validar TODOS los schemas en https://validator.schema.org
- [ ] Test en PageSpeed Insights (mobile + desktop)

### FASE 3 Checklist:

- [ ] Core Web Vitals monitoreados en Plausible
- [ ] LCP < 2.5s en 90%+ páginas (PageSpeed Insights)
- [ ] INP < 200ms en 90%+ páginas
- [ ] CLS < 0.1 en 95%+ páginas
- [ ] Resource hints implementados (dns-prefetch, preconnect)
- [ ] LCP image preload en artículos
- [ ] Lazy loading en componentes no-críticos
- [ ] Code splitting implementado
- [ ] RSS feed funcional en `/rss.xml`
- [ ] Test en múltiples dispositivos reales

---

## 🎓 NOTAS FINALES

### Priorización:

**Si solo puedes hacer 3 cosas, haz estas:**

1. ✅ Implementar sitemap.xml dinámico (CRÍTICO)
2. ✅ Completar SEO de homepage (CRÍTICO)
3. ✅ Optimizar Core Web Vitals (LCP priority) (ALTO IMPACTO)

### Timeline Realista:

- **Fase 1:** 2 semanas (1 dev full-time)
- **Fase 2:** 2 semanas (1 dev full-time)
- **Fase 3:** 2 semanas (1 dev full-time + testing)
- **Total:** 6 semanas (~1.5 meses)

### ROI Esperado:

- **Inversión:** ~240 horas de desarrollo
- **Retorno:** +40-60% tráfico orgánico en 6 meses
- **Valor:** Si tráfico actual = 10K/mes → +4-6K visitas/mes gratis (vs ads)

### Riesgos y Mitigaciones:

1. **Riesgo:** Google tarda en reindexar
   - **Mitigación:** Submit URLs manually en GSC, internal linking

2. **Riesgo:** Core Web Vitals difíciles de optimizar
   - **Mitigación:** Enfocarse en LCP primero (mayor impacto)

3. **Riesgo:** Cambios en algoritmo de Google
   - **Mitigación:** Seguir best practices fundamentales (schema, speed, UX)

---

**Documento creado:** 2025-01-15
**Última actualización:** 2025-01-15
**Versión:** 1.0
**Autor:** Jarvis AI + Technical Researcher Agent
