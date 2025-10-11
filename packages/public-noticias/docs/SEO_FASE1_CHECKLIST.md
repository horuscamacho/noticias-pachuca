# ✅ CHECKLIST FASE 1 - SEO IMPLEMENTATION

## 📋 Pre-Launch Verification

### Sitemap XML
- [ ] Sitemap accesible en `http://localhost:3022/sitemap.xml` (dev)
- [ ] Sitemap accesible en `https://noticiaspachuca.com/sitemap.xml` (producción)
- [ ] Sitemap incluye TODAS las noticias publicadas
- [ ] Sitemap incluye todas las categorías
- [ ] Sitemap incluye páginas estáticas (editorial, contacto, etc.)
- [ ] News tags presentes en artículos < 2 días
- [ ] XML válido (sin errores de sintaxis)
- [ ] Sitemap enviado a Google Search Console

### Homepage SEO
- [ ] Homepage tiene meta title completo
- [ ] Homepage tiene meta description
- [ ] Homepage tiene meta keywords
- [ ] Open Graph tags completos (og:title, og:description, og:image, og:url)
- [ ] Twitter Card tags completos
- [ ] Canonical URL presente
- [ ] Organization schema presente
- [ ] WebSite schema con SearchAction presente
- [ ] Meta robots configurado correctamente
- [ ] Validar schemas en https://validator.schema.org

### BreadcrumbList Schema
- [ ] `/categoria/$slug` tiene BreadcrumbList
- [ ] `/noticia/$slug` tiene BreadcrumbList
- [ ] `/autor/$slug` tiene BreadcrumbList
- [ ] `/tag/$slug` tiene BreadcrumbList
- [ ] Validar breadcrumbs en https://search.google.com/test/rich-results
- [ ] Breadcrumbs visibles en preview de Google

### Canonical URLs
- [ ] Homepage tiene canonical
- [ ] `/categoria/$slug` tiene canonical
- [ ] `/noticia/$slug` tiene canonical (ya estaba)
- [ ] `/autor/$slug` tiene canonical
- [ ] `/tag/$slug` tiene canonical

### Meta Robots
- [ ] Homepage: `index, follow, max-image-preview:large, max-snippet:-1`
- [ ] Categorías: `index, follow`
- [ ] Noticias: `index, follow, max-image-preview:large` (ya estaba)
- [ ] Autores: `index, follow`
- [ ] Tags: `index, follow`

### robots.txt
- [ ] Sitemap reference presente: `Sitemap: https://noticiaspachuca.com/sitemap.xml`
- [ ] Páginas de paginación bloqueadas (`/*?page=`)
- [ ] Búsquedas bloqueadas (`/busqueda/*`)
- [ ] Login/registro bloqueado
- [ ] Crawl-delay configurado para bots agresivos
- [ ] Probar: `curl https://noticiaspachuca.com/robots.txt`

### Build & Deploy
- [ ] `yarn build` sin errores
- [ ] No hay errores de TypeScript
- [ ] Sitemap se genera correctamente en build
- [ ] Deploy a producción exitoso
- [ ] Verificar sitemap en producción

---

## 📝 Datos Pendientes (Actualizar cuando estén disponibles)

### Información de Contacto
- [ ] Email de contacto: `contacto@noticiaspachuca.com` ← PLACEHOLDER
- [ ] Teléfono (si aplica): `_______________`
- [ ] Dirección física (si aplica): `_______________`

### Redes Sociales
- [ ] Facebook: `https://facebook.com/noticiaspachuca` ← PLACEHOLDER
- [ ] Twitter/X: `https://twitter.com/noticiaspachuca` ← PLACEHOLDER
- [ ] Instagram: `https://instagram.com/noticiaspachuca` ← PLACEHOLDER
- [ ] LinkedIn (opcional): `_______________`

### Imágenes para SEO
- [ ] OG Image Homepage: `og-image-home.jpg` (1200x630px) ← CREAR
- [ ] Logo para schema: `logo-600x60.png` (600x60px) ← CREAR
- [ ] Favicon completo (16x16, 32x32, 180x180, 192x192, 512x512)

---

## 🧪 Testing Tools

### Validation Tools
1. **Schema Markup Validator**
   - URL: https://validator.schema.org
   - Test: Homepage, Categoría, Noticia, Autor

2. **Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Test: NewsArticle, BreadcrumbList, Organization

3. **Google Search Console**
   - Enviar sitemap.xml
   - Verificar propiedad del sitio
   - Revisar Coverage report

4. **Meta Tags Debugger**
   - Facebook: https://developers.facebook.com/tools/debug/
   - Twitter: https://cards-dev.twitter.com/validator
   - LinkedIn: https://www.linkedin.com/post-inspector/

---

## 🎯 Expected Results After Deploy

- ✅ Sitemap discoverable por Google Bot
- ✅ Homepage indexable con Organization schema
- ✅ Rich snippets en noticias (imagen, fecha, autor)
- ✅ Breadcrumbs en resultados de búsqueda
- ✅ 0 contenido duplicado
- ✅ Elegibilidad para Google News

---

**Última actualización:** 2025-01-15
**Fase:** 1 de 3
**Status:** ✅ COMPLETADA
