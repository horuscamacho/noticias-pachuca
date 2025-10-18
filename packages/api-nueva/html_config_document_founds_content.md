# 📋 CONFIGURACIÓN DE SITIOS DE EXTRACCIÓN - ANÁLISIS HTML

Documento generado automáticamente analizando los archivos HTML de `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/webs`

---

## 1. AMHIDALGO

**Archivo analizado**: `amhidalgo.html`

**URL comentada en el archivo**: `https://www.am.com.mx/zona-metropolitana/`

**Dominio real detectado en el HTML**: `https://www.noticiasenfasis.com.mx`

### Selectores detectados para LISTADO:
```css
/* URLs de artículos */
.td_module_mega_menu a[rel="bookmark"]
.entry-title a

/* Título desde listado */
h3.entry-title a

/* Imagen desde listado */
img.entry-thumb
.td-module-thumb img

/* Categoría */
.td-post-category
```

### URLs de ejemplo encontradas:
```
https://www.noticiasenfasis.com.mx/banca-en-mexico-implementa-nuevo-limite-de-transferencias-mtu/
https://www.noticiasenfasis.com.mx/mexico-enfrentara-a-argentina-en-cuartos-de-final-del-mundial-de-chile/
https://www.noticiasenfasis.com.mx/pachuca-femenil-aplasta-5-0-al-atletico-san-luis-y-sigue-firme-en-la-cima-del-apertura-2025/
https://www.noticiasenfasis.com.mx/las-tuzas-del-pachuca-buscan-recuperar-el-liderato-ante-atletico-de-san-luis/
https://www.noticiasenfasis.com.mx/trump-declara-el-fin-de-la-era-del-terror-tras-inicio-de-acuerdo-de-paz/
```

### URL del listado propuesta:
**⚠️ REQUIERE VALIDACIÓN**: `https://www.am.com.mx/zona-metropolitana/`
(Comentario vs HTML real: `noticiasenfasis.com.mx`)

---

## 2. CRITERIOHIDALGO

**Archivo analizado**: `criteriohidalgo.html`

**URL detectada en meta tags**: `https://criteriohidalgo.com/noticias/hidalgo`

**Dominio base**: `https://criteriohidalgo.com`

**Tipo de sitio**: Next.js con GraphQL - Datos en formato JSON embebido

### Estructura de datos (JSON/GraphQL):
```json
{
  "__typename": "Post",
  "databaseId": 923067,
  "title": "...",
  "date": "2025-10-03T19:54:28",
  "slug": "tizayuca-cuantas-infracciones...",
  "featuredImage": {
    "node": {
      "sourceUrl": "https://cdn-cubimetrix.sfo3.cdn.digitaloceanspaces.com/..."
    }
  },
  "excerpt": "...",
  "categories": { ... },
  "authors": { ... }
}
```

### Selectores/Método de extracción:
- **Tipo**: Parseo de JSON embebido en `<script id="__NEXT_DATA__">`
- **URL de artículo**: `baseUrl + "/noticias/" + slug`
- **Título**: `post.title`
- **Fecha**: `post.date`
- **Imagen**: `post.featuredImage.node.sourceUrl`
- **Excerpt**: `post.excerpt`
- **Categorías**: `post.categories.edges[].node.name`
- **Autor**: `post.authors.edges[].node.name`

### URLs de ejemplo encontradas (construidas):
```
https://criteriohidalgo.com/noticias/tizayuca-cuantas-infracciones-de-transito-se-registraron-en-julio-agosto-y-septiembre
https://criteriohidalgo.com/noticias/adios-a-amigue-companere-nine-y-todes-en-escuelas-de-el-salvador
https://criteriohidalgo.com/noticias/crisis-sanitaria-gaza-personas-amputadas-guerra
https://criteriohidalgo.com/noticias/destaca-cuautepec-de-hinojosa-por-conservacion-de-polinizadores
https://criteriohidalgo.com/noticias/convoca-ihe-a-concurso-de-canto-infantil
```

### URL del listado propuesta:
`https://criteriohidalgo.com/noticias/hidalgo`

---

## 3. CRONICAHGO

**Archivo analizado**: `cronicahgo.html` (1,713 líneas)

**URL detectada**: `https://www.cronicahidalgo.com`

**Dominio base**: `https://www.cronicahidalgo.com`

**Tipo de sitio**: WordPress tradicional

### Selectores detectados para LISTADO:
```css
/* URLs de artículos (formato ?p=ID) */
a[href*="cronicahidalgo.com/?p="]

/* Títulos en histórico tipo marquesina */
#marquee a

/* Historias principales */
.story h1 a
.story h2 a

/* Imágenes */
.story img

/* Categoría */
.categoria a

/* Excerpt/Resumen */
.entry
```

### URLs de ejemplo encontradas:
```
https://www.cronicahidalgo.com/?p=521983
https://www.cronicahidalgo.com/?p=521987
https://www.cronicahidalgo.com/?p=521978
https://www.cronicahidalgo.com/?p=521976
https://www.cronicahidalgo.com/2025/10/15/avanzan-acciones-para-liberacion-de-caminos/
https://www.cronicahidalgo.com/2025/10/15/miguel-tello-va-a-sierra-gorda-para-atender-contingencia/
```

### URLs alternativas detectadas:
- **RSS Feed**: `https://www.cronicahidalgo.com/feed/`
- **WP-JSON API**: `https://www.cronicahidalgo.com/wp-json/`

### URL del listado propuesta:
`https://www.cronicahidalgo.com` (página principal) o `https://www.cronicahidalgo.com/feed/` (RSS)

---

## 4. EFFETA

**Archivo analizado**: `effeta.html` (5,994 líneas)

**URL detectada**: `https://www.effeta.info/`

**Dominio base**: `https://www.effeta.info`

**Tipo de sitio**: WordPress con tema ColorNews

### Selectores detectados para LISTADO:
```css
/* URLs de artículos */
.single-article .entry-title a
.article-content h3.entry-title a

/* Título */
h3.entry-title a

/* Imagen */
.single-article figure img

/* Fecha */
time.entry-date

/* Autor */
.author.vcard a

/* Categoría */
.cat-links a

/* Excerpt/Resumen */
.entry-content p
```

### URLs de ejemplo encontradas:
```
https://www.effeta.info/hidalgo-rutas-de-la-transformacion-retomaran-actividades-a-finales-de-octubre/
https://www.effeta.info/hidalgo-entre-los-estados-beneficiados-con-obras-federales-clave-sheinbaum/
https://www.effeta.info/diez-municipios-de-hidalgo-actualizan-bandos-de-policia-y-gobierno-con-respaldo-estatal/
https://www.effeta.info/palestina-protesta-pachuca-parque-cultural-hidalguense-david-ben-gurion-pibeh-gaza-derechos-humanos-activismo-pintas-soplete/
https://www.effeta.info/operativo-moto-segura-en-pachuca-lleva-a-399-motocicletas-al-corralon/
```

### URLs alternativas detectadas:
- **RSS Feed**: `https://www.effeta.info/feed/`

### URL del listado propuesta:
`https://www.effeta.info/` (página principal) o `https://www.effeta.info/feed/` (RSS)

---

## 5. ELSOLHGO

**Archivo**: `elsolhgo.html` (5,901 líneas) | **URL**: `https://elhidalgodigital.com/category/estado/` | **Dominio**: `https://elhidalgodigital.com` | **Tipo**: WordPress
**URL propuesta**: `https://elhidalgodigital.com` o `https://elhidalgodigital.com/category/estado/` o `https://elhidalgodigital.com/feed/`

---

## 6. ELUNIVERSALHIDALGO

**Archivo**: `eluniversalhidalgo.html` (1,607 líneas) | **URL**: `https://www.eluniversalhidalgo.com.mx/municipios/` | **Dominio**: `https://www.eluniversalhidalgo.com.mx` | **Tipo**: Sitio dinámico (Marfeel SDK)
**URL propuesta**: `https://www.eluniversalhidalgo.com.mx/municipios/` o `https://www.eluniversalhidalgo.com.mx`

---

## 7. ENFASIS

**Archivo**: `enfasis.html` (18,177 líneas) | **URL**: `https://www.noticiasenfasis.com.mx/` | **Dominio**: `https://www.noticiasenfasis.com.mx` | **Tipo**: WordPress (Newspaper theme)
**Ejemplo URLs**: `https://www.noticiasenfasis.com.mx/sheinbaum-agradece-al-sector-empresarial-por-apoyo-a-damnificados/`
**URL propuesta**: `https://www.noticiasenfasis.com.mx/` o `https://www.noticiasenfasis.com.mx/feed/`

---

## 8. FOCUSHIDALGO

**Archivo analizado**: `focushidalgo.html` (56,113 líneas)

**URL detectada**: `https://www.focushidalgopachuca.com`

**Dominio base**: `https://www.focushidalgopachuca.com`

**Tipo de sitio**: Wix (sitio dinámico con widgets de blog)

### Método de extracción recomendado:
- **RSS Feed**: `https://www.focushidalgopachuca.com/blog-feed.xml`

### Razón:
Sitio Wix con HTML extremadamente complejo (56k+ líneas de CSS/JS generado). El contenido se carga dinámicamente mediante widgets de Wix. La mejor forma de extraer contenido es mediante el RSS feed proporcionado.

### Structured Data detectado:
```json
{
  "@context": "https://schema.org/",
  "@type": "LocalBusiness",
  "name": "focushidalgo",
  "url": "https://www.focushidalgopachuca.com",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "MX",
    "addressLocality": "Pachuca",
    "addressRegion": "Hgo.",
    "postalCode": "42088"
  },
  "telephone": "+ 7711034219"
}
```

### URL del listado propuesta:
`https://www.focushidalgopachuca.com/blog-feed.xml` (RSS - RECOMENDADO)

---

## 9. HIDALGONOTICIAS

**Archivo analizado**: `hidalgonoticias.html` (8,177 líneas)

**URL detectada**: `https://hidalgonoticias.com/`

**Dominio base**: `https://hidalgonoticias.com`

**Tipo de sitio**: WordPress (tema Zox News)

### Método de extracción recomendado:
- **RSS Feed**: `https://hidalgonoticias.com/feed/`
- **WP-JSON API**: `https://hidalgonoticias.com/wp-json/`

### Categorías detectadas:
- `https://hidalgonoticias.com/gobierno/`
- `https://hidalgonoticias.com/municipios/`
- `https://hidalgonoticias.com/policiaca/`
- `https://hidalgonoticias.com/nacionales/`
- `https://hidalgonoticias.com/internacionales/`

### URL del listado propuesta:
`https://hidalgonoticias.com/` (página principal) o `https://hidalgonoticias.com/feed/` (RSS - RECOMENDADO)

---

## 10. LAJORNADAHIDALGO

**Archivo analizado**: `lajornadahidalgo.html` (8,978 líneas)

**URL detectada**: `https://lajornadahidalgo.com`

**Dominio base**: `https://lajornadahidalgo.com`

**Tipo de sitio**: Next.js con Marfeel SDK (sitio dinámico)

### Método de extracción:
Sitio moderno con Next.js que carga contenido dinámicamente. Similar a criteriohidalgo, el contenido se puede obtener mediante scraping de la página principal o buscando endpoints de API internos.

### API detectada:
- **Endpoint interno**: `https://lajornadahidalgo.com/api/read?url=...`
- **Marfeel SDK**: Account ID 7641

### URL del listado propuesta:
`https://lajornadahidalgo.com` (requiere extracción dinámica o análisis de API)

---

## 11. LATINUS

**Archivo analizado**: `latinus.html` (4,121 líneas)

**URL detectada**: `https://latinus.us/mexico/`

**Dominio base**: `https://latinus.us`

**Tipo de sitio**: Sitio custom con Bootstrap (orientado a audiencia de habla inglesa)

### Selectores detectados:
- **Clase body**: `listado portada secc_2`
- Sitio estructurado con Bootstrap y plantillas personalizadas

### Nota:
Sitio de noticias sobre México orientado a audiencia estadounidense/internacional. El HTML carga desde `/mexico/` como sección principal.

### URL del listado propuesta:
`https://latinus.us/mexico/` (página de sección México)

---

## 12. LASILLAROTAHGO

**Archivo analizado**: `lasillarotahgo.html` (7,759 líneas)

**URL detectada**: `https://lasillarota.com/hidalgo/`

**Dominio base**: `https://lasillarota.com`

**Tipo de sitio**: Sitio custom con Bootstrap (mismo sistema que latinus)

### Selectores detectados para LISTADO y ARTÍCULOS:
```css
/* Artículos */
article.article-v2

/* Título */
h2.titulo a

/* Volanta/Categoría */
h3.volanta

/* Excerpt/Bajada */
.bajada p
.t5-bajada

/* Imagen */
figure picture img

/* Enlaces de artículos */
a[href*="/hidalgo/"]

/* Autor */
.autor .nombredeautor
```

### URLs de artículos ejemplo:
```
https://lasillarota.com/hidalgo/estado/2025/10/15/juan-trabajo-anos-en-eu-para-construir-su-casa-que-hoy-se-derrumba-por-lluvias-de-priscilla-562625.html
https://lasillarota.com/hidalgo/estado/2025/10/15/actualizacion-suben-22-los-muertos-por-las-lluvias-en-hidalgo-562553.html
```

### Secciones detectadas:
- `/hidalgo/estado/`
- `/hidalgo/local/`
- `/hidalgo/reportajes/`
- `/hidalgo/opinion/`
- `/hidalgo/vida/`

### URL del listado propuesta:
`https://lasillarota.com/hidalgo/` (página principal de la sección Hidalgo)

---

## 13. PACHUCABRILLA

**Archivo analizado**: `pachucabrilla.html` (9,690 líneas)

**URL detectada**: `https://pachucabrilla.com/category/pachuca/`

**Dominio base**: `https://pachucabrilla.com`

**Tipo de sitio**: WordPress (tema NewsCard v4.0.0)

### Selectores detectados para LISTADO y ARTÍCULOS:
```css
/* Contenedor de artículo */
.post-boxed

/* URLs de artículos */
h3.entry-title a[href]

/* Título */
h3.entry-title a

/* Imagen */
.post-img-wrap a.post-img
/* Nota: imagen en background-image: url('...') */
.featured-post-img a.post-img

/* Categoría */
.cat-links a

/* Fecha */
.entry-meta .date a

/* Autor */
.by-author.vcard.author a
```

### URLs de artículos ejemplo:
```
https://pachucabrilla.com/orquesta-sinfonica-estado-hidalgo-presentara-feria-pachuca/
https://pachucabrilla.com/orquesta-sinfonica-estado-mexico-concierto-pachuca/
https://pachucabrilla.com/void-espectaculo-internacional-wim-vandekeybus-pachuca/
https://pachucabrilla.com/ballet-folklorico-actividades-festival-cultural-san-francisco/
https://pachucabrilla.com/bronco-teatro-pueblo-feria-pachuca-2025/
```

### Método de extracción alternativo:
- **RSS Feed**: `https://pachucabrilla.com/feed/`
- **RSS de categoría**: `https://pachucabrilla.com/category/pachuca/feed/`
- **WP-JSON API**: `https://pachucabrilla.com/wp-json/`

### Structured Data detectado:
- **Yoast SEO plugin**: v25.6
- **CollectionPage**: Categoría Pachuca
- **BreadcrumbList**: Navegación estructurada
- **Organization**: Pachuca Brilla con redes sociales

### URL del listado propuesta:
`https://pachucabrilla.com/` (página principal) o `https://pachucabrilla.com/feed/` (RSS - RECOMENDADO)

---

## 14. PLAZAJUAREZ

**Archivo analizado**: `plazajuarez.html` (20,811 líneas)

**URL detectada**: `https://plazajuarez.mx/`

**Dominio base**: `https://plazajuarez.mx`

**Tipo de sitio**: WordPress (tema Newspaper v12.7.1 con tagDiv Composer)

### Selectores detectados para LISTADO y ARTÍCULOS:
```css
/* Contenedor de módulo/artículo */
.td_module_flex
.td_module_wrap

/* URLs de artículos */
h3.entry-title.td-module-title a[href]

/* Título */
h3.entry-title.td-module-title a

/* Imagen */
.td-module-thumb a.td-image-wrap span.entry-thumb
/* Nota: imagen en background-image: url('...') o data-img-url attribute */

/* Categoría */
a.td-post-category

/* Fecha */
time.entry-date.td-module-date
/* Nota: tiene atributo datetime="2025-10-15T18:37:24-06:00" */

/* Autor */
.td-post-author-name a
```

### URLs de artículos ejemplo:
```
https://plazajuarez.mx/acciones-de-rescate-para-el-agro-en-metztitlan-por-instruccion-de-julio-menchaca/
https://plazajuarez.mx/detienen-a-dos-presuntos-asaltantes-en-cuautepec-uno-lesionado/
https://plazajuarez.mx/tula-de-allende-invita-al-concierto-de-agradecimiento-de-sergio-maya-ganador-de-mexico-canta/
https://plazajuarez.mx/saderh-informa-sobre-las-actividades-realizada-para-el-mejoramiento-de-sonas-afectas-por-inundaciones/
https://plazajuarez.mx/estudiantes-de-utvm-fortalecen-su-frances-con-degustacion-gastronomica/
```

### Método de extracción alternativo:
- **RSS Feed**: `https://plazajuarez.mx/feed/`
- **WP-JSON API**: `https://plazajuarez.mx/wp-json/`

### Structured Data detectado:
- **Yoast SEO plugin**: v26.1.1
- **WebPage** + **WebSite** schemas
- **Descripción**: "La historia de cada dia"
- **Social Media**: Facebook @diarioplazajuarez, Twitter @diaplazajuarez

### URL del listado propuesta:
`https://plazajuarez.mx/` (página principal) o `https://plazajuarez.mx/feed/` (RSS - RECOMENDADO)

---

## 15. PUNTOXPUNTO

**Archivo analizado**: `puntoxpunto.html` (6,208 líneas)

**URL detectada**: `https://puntoporpuntonoticias.mx/`

**Dominio base**: `https://puntoporpuntonoticias.mx`

**Tipo de sitio**: WordPress (tema SmartMag con Elementor)

### Selectores detectados para LISTADO y ARTÍCULOS:
```css
/* Contenedor de artículo */
article.l-post.list-post
article.l-post.small-post
article.l-post.grid-post
article.l-post.grid-overlay

/* URLs de artículos */
h2.is-title.post-title a[href]
h4.is-title.post-title a[href]

/* Título */
h2.is-title.post-title a
h4.is-title.post-title a

/* Imagen */
.image-link span.img.bg-cover
/* Nota: imagen en data-bgsrc attribute y background-image: url('...') style */

/* Fecha */
time.post-date
/* Nota: tiene atributo datetime="2025-10-07T17:33:09-06:00" */

/* Excerpt/Resumen */
div.excerpt p
```

### URLs de artículos ejemplo:
```
https://puntoporpuntonoticias.mx/legisladores-aprueban-dictamen-de-proteccion-a-maestras-y-maestros-frente-a-la-violencia-en-el-entorno-escolar/
https://puntoporpuntonoticias.mx/diputada-guadalupe-cruz-acusada-de-robo-de-identidad-y-falsificacion-de-documentos-solicita-licencia/
https://puntoporpuntonoticias.mx/las-empresas-de-la-4t-han-sido-denunciadas/
https://puntoporpuntonoticias.mx/asesinan-a-david-cohen-el-abogado-que-represento-a-billy-alvarez-fue-baleado-afuera-del-poder-judicial/
https://puntoporpuntonoticias.mx/adelantan-la-entrega-de-recursos-de-programas-sociales-para-familias-en-zonas-afectadas/
```

### Método de extracción alternativo:
- **RSS Feed** (si existe): `https://puntoporpuntonoticias.mx/feed/`
- **WP-JSON API**: `https://puntoporpuntonoticias.mx/wp-json/`

### Structured Data detectado:
- **Yoast SEO plugin**: v26.0
- **WebPage** + **WebSite** schemas
- **Social Media**: Facebook @puntoxpunto.noticias, Twitter @puntoporpuntomx

### URL del listado propuesta:
`https://puntoporpuntonoticias.mx/` (página principal) o `https://puntoporpuntonoticias.mx/feed/` (RSS)

---

## 16. QUADRATINHIDALGO

**Archivo analizado**: `quadratinhidalgo.html` (3,774 líneas)

**URL detectada**: `https://hidalgo.quadratin.com.mx/municipios/`

**Dominio base**: `https://hidalgo.quadratin.com.mx`

**Tipo de sitio**: WordPress (tema Quadratin 2022)

### Selectores detectados para LISTADO y ARTÍCULOS:
```css
/* Contenedor de artículo */
article.q-notice

/* URLs de artículos */
article.q-notice > a[href]
/* Nota: el segundo enlace dentro del article contiene la URL del artículo */

/* Título */
article.q-notice h4

/* Imagen */
article.q-notice figure img

/* Fecha/Hora */
.note-time time
/* Nota: formato "15 Octubre 2025, 10:33" */

/* Categoría/Tag */
.tag-container .tag

/* Excerpt */
.q-notice__excerpt
```

### URLs de artículos ejemplo:
```
https://hidalgo.quadratin.com.mx/sucesos/reportan-50-desaparecidos-y-danos-en-29-municipios-de-hidalgo-por-lluvias/
https://hidalgo.quadratin.com.mx/principal/nuevo-derrumbe-bloquea-carretera-que-conecta-nicolas-flores-en-hidalgo/
https://hidalgo.quadratin.com.mx/sucesos/hombre-muere-abatido-en-central-de-autobuses-de-tulancingo/
https://hidalgo.quadratin.com.mx/municipios/pronostica-smn-lluvias-y-vientos-para-hidalgo-y-el-centro-del-pais/
https://hidalgo.quadratin.com.mx/municipios/registra-ieeh-8-promoventes-para-revocacion-de-mandato/
```

### Método de extracción alternativo:
- **RSS Feed**: `https://hidalgo.quadratin.com.mx/municipios/feed/`
- **WP-JSON API**: `https://hidalgo.quadratin.com.mx/wp-json/`

### Structured Data detectado:
- **Yoast SEO plugin**: v25.8
- **CollectionPage**: Categoría Municipios
- **BreadcrumbList**: Navegación estructurada
- **Descripción**: "Noticias de Hidalgo"

### URL del listado propuesta:
`https://hidalgo.quadratin.com.mx/municipios/` (categoría Municipios) o `https://hidalgo.quadratin.com.mx/municipios/feed/` (RSS)

---

## 17. SINTESIS

**Archivo analizado**: `sintesis.html` (1,618 líneas)

**URL detectada**: `https://sintesis.com.mx/hidalgo/category/capital/`

**Dominio base**: `https://sintesis.com.mx/hidalgo/`

**Tipo de sitio**: WordPress (tema Newspaper v7.6.1)

### Selectores detectados para LISTADO y ARTÍCULOS:
```css
/* Contenedor de artículo - listado normal */
.td_module_4.td_module_wrap
.td_module_wrap

/* Contenedor de artículo - mega menu */
.td_module_mega_menu.td_mod_mega_menu

/* Contenedor - big grid */
.td_module_mx12.td-big-grid-post

/* URLs de artículos */
h3.entry-title.td-module-title a[href]

/* Título */
h3.entry-title.td-module-title a

/* Imagen */
.td-module-thumb a img.entry-thumb

/* Categoría */
a.td-post-category

/* Autor */
.td-post-author-name a

/* Fecha */
time.entry-date.td-module-date
/* Nota: tiene atributo datetime="2025-10-09T20:55:34+00:00" */

/* Excerpt/Resumen */
.td-excerpt
```

### URLs de artículos ejemplo:
```
https://sintesis.com.mx/hidalgo/2025/10/09/considera-ieeh-casi-186-mdp-para-realizar-revocacion-de-mandato/
https://sintesis.com.mx/hidalgo/2025/10/09/caen-80-en-operativo-alcoholimetro-durante-feria-san-francisco-2025/
https://sintesis.com.mx/hidalgo/2025/10/07/colocan-primera-piedra-de-nueva-sucursal-walmart-en-pachuca/
https://sintesis.com.mx/hidalgo/2025/10/04/lanzan-nueva-marca-turistica-pachuca-lo-tiene/
https://sintesis.com.mx/hidalgo/2025/10/04/demandan-mayor-difusion-para-proceso-de-solicitud-de-revocacion-de-mandato/
```

### Categorías detectadas:
- `/category/politica/`
- `/category/justicia/`
- `/category/gobierno/`
- `/category/municipios/`
- `/category/capital/`
- `/category/cultura/`
- `/category/deportes/`

### Método de extracción alternativo:
- **RSS Feed general**: `https://sintesis.com.mx/hidalgo/feed/`
- **RSS por categoría**: `https://sintesis.com.mx/hidalgo/category/capital/feed/`
- **WP-JSON API**: `https://sintesis.com.mx/hidalgo/wp-json/`

### Structured Data detectado:
- **Yoast SEO plugin**: v5.3.1
- **WebSite** schema con SearchAction
- **Social Media**: Facebook (Síntesis Hidalgo), Instagram @sintesisweb, Twitter @SintesisHgo, Youtube @sintesishidalgo

### URL del listado propuesta:
`https://sintesis.com.mx/hidalgo/` (página principal) o `https://sintesis.com.mx/hidalgo/feed/` (RSS - RECOMENDADO)

---

## 18. TENDENCIASLIST

**Archivo analizado**: `tendenciaslist.html` (14,309 líneas)

**URL detectada**: `https://www.trendencias.com/categoria/belleza`

**Dominio base**: `https://www.trendencias.com`

**Tipo de sitio**: Sitio dinámico con Marfeel SDK (enfoque: moda y belleza)

### Selectores detectados para LISTADO y ARTÍCULOS:
```css
/* Contenedor de artículo */
article.recent-abstract.abstract-article

/* Contenedor de imagen */
.abstract-figure
.base-asset-image

/* URLs de artículos */
.abstract-figure a[href]
.abstract-title a[href]

/* Título */
h2.abstract-title a

/* Imagen */
.base-asset-image img
/* Nota: Usa srcset con múltiples tamaños (375w, 500w) */

/* Categoría */
a.abstract-taxonomy

/* Autor */
a.abstract-author

/* Fecha */
time.abstract-date
/* Nota: tiene atributo datetime="2025-09-25T17:52:17Z" y texto "Hace X días" */

/* Footer/Metadata */
footer.abstract-byline
```

### URLs de artículos ejemplo:
```
https://www.trendencias.com/belleza/colonia-nivea-que-huele-como-su-crema-lata-azul-triunfa-mujeres-su-olor-a-limpio-elegante
https://www.trendencias.com/belleza/adios-a-unas-larguisimas-unas-cortas-estan-moda-asi-se-llevan-forma-elegante
https://www.trendencias.com/belleza/este-tinte-pelo-que-recomienda-peluquero-david-lorente-a-sus-clientas-para-verse-jovenes
https://www.trendencias.com/belleza/nueve-colores-unas-que-rejuvenecen-cuando-hemos-pasado-40
https://www.trendencias.com/belleza/10-manicuras-ocho-tonos-verde-color-tendencia-otono-2025
```

### Datos estructurados detectados:
```json
{
  "@context": "https://schema.org/",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "url": "https://www.trendencias.com/belleza/..."
    }
  ]
}
```

### Nota importante:
**⚠️ SITIO NO RELACIONADO CON HIDALGO**: Este sitio es de moda, belleza y lifestyle de nivel nacional/internacional. No parece tener contenido específico sobre Hidalgo o Pachuca. Posiblemente fue incluido por error en el análisis o requiere validación sobre su relevancia para el proyecto.

### URL del listado propuesta:
`https://www.trendencias.com/categoria/belleza` (si es relevante para el proyecto)

---

## 19. ZUNOTICIA

**Archivo analizado**: `zunoticia.html` (5,203 líneas)

**URL detectada**: `https://www.zunoticia.com/noticias-de-hidalgo/category/estado/`

**Dominio base**: `https://www.zunoticia.com/noticias-de-hidalgo/`

**Tipo de sitio**: WordPress (tema Twenty Twenty One v2.3 con Elementor y plugin AnWP Post Grid)

### Selectores detectados para LISTADO y ARTÍCULOS:
```css
/* Contenedor de artículo */
.anwp-pg-post-teaser
.anwp-pg-post-teaser--layout-d
.anwp-pg-post-teaser--inner-cover-link

/* Contenedor de imagen */
.anwp-pg-post-teaser__thumbnail

/* Imagen */
.anwp-pg-post-teaser__thumbnail-img
img.anwp-pg-post-teaser__thumbnail-img

/* URLs de artículos */
.anwp-pg-post-teaser a.anwp-link-without-effects[href]
.anwp-pg-post-teaser__title a.anwp-link-without-effects

/* Título */
.anwp-pg-post-teaser__title a

/* Fecha publicación */
time.anwp-pg-published
/* Nota: tiene atributo datetime="2025-10-15T18:27:03-06:00" */

/* Fecha actualización */
time.anwp-pg-updated
/* Nota: tiene atributo datetime="2025-10-15T18:27:04-06:00" */

/* Excerpt/Resumen */
.anwp-pg-post-teaser__excerpt

/* Contenedor de contenido */
.anwp-pg-post-teaser__content

/* Grid de posts */
.anwp-pg-classic-grid
.anwp-pg-posts-wrapper
```

### URLs de artículos ejemplo:
```
https://www.zunoticia.com/noticias-de-hidalgo/2025/10/15/fueron-localizadas-dos-personas-con-vida/
https://www.zunoticia.com/noticias-de-hidalgo/2025/10/15/sebiso-implementa-acciones-inmediatas-para-apoyar-a-las-familias-afectadas/
https://www.zunoticia.com/noticias-de-hidalgo/2025/10/15/saderh-establecio-como-ruta-prioritaria-de-atencion-a-zona-de-metztitlan/
https://www.zunoticia.com/noticias-de-hidalgo/2025/10/15/secretaria-de-gobernacion-y-gobernador-menchaca-supervisan-logistica-de-envio-de-viveres/
https://www.zunoticia.com/noticias-de-hidalgo/2025/10/15/sipdus-continua-con-el-retiro-de-derrumbes-y-deslaves-en-caminos-y-carreteras/
```

### Categorías detectadas en navegación:
- `/category/estado/`
- `/category/siierra-gorda/`
- `/category/jacala/`

### Método de extracción alternativo:
- **RSS Feed general**: `https://www.zunoticia.com/noticias-de-hidalgo/feed/`
- **RSS por categoría**: `https://www.zunoticia.com/noticias-de-hidalgo/category/estado/feed/`
- **WP-JSON API**: `https://www.zunoticia.com/noticias-de-hidalgo/wp-json/`

### Plugins detectados:
- **Elementor**: Constructor de páginas
- **Elementor Pro**: Versión PRO
- **AnWP Post Grid for Elementor**: Plugin para grids de posts (v1.3.3)
- **Master Addons**: Extensiones adicionales para Elementor
- **Mashsharer**: Plugin para compartir en redes sociales (v4.0.47)

### Redes sociales detectadas:
- **Facebook**: https://www.facebook.com/ZunoticiaHgo/
- **Twitter**: https://twitter.com/zunoticiahgo?lang=es
- **Youtube**: https://www.youtube.com/channel/UCB4sMud9EinERUf-HgARuQA

### URL del listado propuesta:
`https://www.zunoticia.com/noticias-de-hidalgo/category/estado/` (categoría Estado) o `https://www.zunoticia.com/noticias-de-hidalgo/feed/` (RSS - RECOMENDADO)

---

