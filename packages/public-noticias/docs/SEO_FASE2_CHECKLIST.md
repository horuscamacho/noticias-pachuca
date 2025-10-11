# ✅ CHECKLIST FASE 2 - SEO IMPLEMENTATION

## 📋 Pre-Launch Verification

### Optimización de Imágenes (AVIF/WebP)
- [ ] `OptimizedImage` component usa `<picture>` element
- [ ] AVIF sources presentes (primera opción)
- [ ] WebP sources presentes (segunda opción)
- [ ] JPEG/PNG fallback funcional
- [ ] `fetchpriority="high"` en imágenes críticas (LCP)
- [ ] `loading="lazy"` en imágenes below-the-fold
- [ ] `decoding="async"` en todas las imágenes
- [ ] Test en navegadores: Chrome, Safari, Firefox
- [ ] Verificar DevTools Network: formato AVIF cargando correctamente

### Person Schema (Páginas de Autor)
- [ ] `/autor/$slug` tiene Person schema
- [ ] Schema incluye `name` y `url`
- [ ] Schema incluye `worksFor` Organization
- [ ] Validar en https://validator.schema.org
- [ ] Validar en https://search.google.com/test/rich-results
- [ ] TODO: Agregar `image`, `jobTitle`, `description` cuando backend lo soporte
- [ ] TODO: Agregar `sameAs` redes sociales cuando backend lo soporte

### ItemList Schema (Listados)
- [ ] `/noticias` tiene ItemList schema
- [ ] `/categoria/$slug` tiene ItemList schema
- [ ] ItemList incluye primeros 10 artículos
- [ ] Cada item tiene `position`, `url`, `name`
- [ ] Validar en https://validator.schema.org
- [ ] Preview en Google: carrusel de noticias

### Canonical URLs
- [ ] Todas las rutas principales tienen canonical ✅
- [ ] Homepage: `https://noticiaspachuca.com` ✅
- [ ] Noticias: incluye slug completo ✅
- [ ] Categorías: incluye slug de categoría ✅
- [ ] Autores: incluye slug de autor ✅
- [ ] Tags: incluye slug de tag ✅

### Meta Robots Avanzados
- [ ] Homepage: `index, follow, max-image-preview:large, max-snippet:-1` ✅
- [ ] `/noticias`: `index, follow, max-image-preview:large, max-snippet:-1` ✅
- [ ] `/categoria/$slug`: `index, follow, max-image-preview:large, max-snippet:-1` ✅
- [ ] `/noticia/$slug`: `index, follow, max-image-preview:large` ✅
- [ ] `/autor/$slug`: `index, follow, max-image-preview:large, max-snippet:-1` ✅
- [ ] `/tag/$slug`: `index, follow, max-image-preview:large, max-snippet:-1` ✅

---

## 🧪 Testing & Validation

### Schema Validation
1. **Homepage**
   - [ ] Organization schema válido
   - [ ] WebSite schema con SearchAction válido
   - [ ] No errores en validator.schema.org

2. **Listados**
   - [ ] ItemList schema válido en /noticias
   - [ ] ItemList schema válido en /categoria/[slug]
   - [ ] Preview correcto en Rich Results Test

3. **Páginas de Autor**
   - [ ] Person schema válido
   - [ ] worksFor Organization presente
   - [ ] Preview correcto como "profile"

### Performance Testing
- [ ] Google PageSpeed Insights: Mobile > 90
- [ ] Google PageSpeed Insights: Desktop > 95
- [ ] LCP < 2.5s
- [ ] INP < 200ms
- [ ] CLS < 0.1
- [ ] Imágenes AVIF cargando correctamente
- [ ] Peso de imágenes reducido vs antes

### Google Search Console
- [ ] Sitemap enviado y procesado sin errores
- [ ] Coverage report: 0 errores
- [ ] Rich Results: NewsArticle detectado
- [ ] Rich Results: BreadcrumbList detectado
- [ ] Rich Results: ItemList detectado (puede tardar)
- [ ] Rich Results: Person schema detectado
- [ ] Mobile Usability: 0 errores

---

## 📊 Expected Results

### Imágenes
- ✅ -50% peso con AVIF (vs JPEG)
- ✅ -30% peso con WebP (vs JPEG)
- ✅ Fallback automático para navegadores antiguos
- ✅ LCP mejorado (primera imagen prioritaria)

### SEO
- ✅ Rich snippets en listados (carrusel)
- ✅ Páginas de autor con authority signals (Person schema)
- ✅ max-image-preview permite imágenes grandes en resultados
- ✅ max-snippet permite extractos completos

### Indexación
- ✅ Canonical URLs evitan contenido duplicado 100%
- ✅ Google indexa listados con ItemList
- ✅ Google reconoce autores con Person schema

---

## 📝 Pending Items (Backend Required)

### Modelo de Autor Mejorado
**Necesita agregar campos al backend:**
```typescript
interface Author {
  name: string
  slug: string
  photo?: string // ← AGREGAR
  jobTitle?: string // ← AGREGAR (ej: "Reportero Senior", "Editor")
  bio?: string // ← AGREGAR (200+ palabras para E-E-A-T)
  twitter?: string // ← AGREGAR
  linkedin?: string // ← AGREGAR
  facebook?: string // ← AGREGAR
}
```

### Generación de Imágenes AVIF/WebP
**2 opciones:**

**Opción A: CDN con transformación automática**
- Cloudflare Images
- imgix
- AWS CloudFront + Lambda@Edge
- → Genera AVIF/WebP on-the-fly con query params

**Opción B: Backend genera al subir**
- Al subir imagen, generar 3 versiones:
  - `image.avif` (mejor compresión)
  - `image.webp` (buena compresión)
  - `image.jpg` (fallback)
- Librerías: Sharp (Node.js), Pillow (Python)

---

## 🎯 KPIs - FASE 2

| Métrica | Baseline | Objetivo |
|---------|----------|----------|
| **PageSpeed (Mobile)** | [Medir] | >90 |
| **PageSpeed (Desktop)** | [Medir] | >95 |
| **LCP** | [Medir] | <2.5s |
| **Peso Imágenes** | [Medir] | -40% con AVIF |
| **Rich Results** | 1 tipo (NewsArticle) | 4 tipos (+ BreadcrumbList, ItemList, Person) |

---

**Última actualización:** 2025-01-15
**Fase:** 2 de 3
**Status:** ✅ COMPLETADA (Pendiente: GSC Integration + generación AVIF/WebP en backend)
