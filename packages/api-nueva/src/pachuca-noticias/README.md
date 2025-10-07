# 📰 Pachuca Noticias Module

Sistema de publicación de contenido generado por IA al sitio público **noticias-pachuca.com**.

---

## 📋 Índice

1. [Descripción](#descripción)
2. [Arquitectura](#arquitectura)
3. [Schemas](#schemas)
4. [Endpoints](#endpoints)
5. [Servicios](#servicios)
6. [Eventos](#eventos)
7. [Ejemplos de Uso](#ejemplos-de-uso)
8. [Variables de Entorno](#variables-de-entorno)
9. [Troubleshooting](#troubleshooting)

---

## 📖 Descripción

El módulo **pachuca-noticias** gestiona la publicación de contenido generado por IA desde el dashboard hacia el sitio público.

### Flujo de Publicación

```
AIContentGeneration (completed)
         ↓
  PublishService
         ↓ (procesa imágenes, genera slug)
         ↓
  PublishedNoticia (guardado en BD)
         ↓
  Evento: noticia.published
         ↓
  Web Pública (SSR en public-noticias)
```

### Características Principales

- ✅ **Relación 1:1**: Un contenido generado → Una noticia publicada (validación de duplicados)
- ✅ **Procesamiento de Imágenes**: Descarga, optimización (Sharp), 4 tamaños (WebP)
- ✅ **Slugs Únicos**: SEO-friendly con UUID para garantizar unicidad
- ✅ **SEO Completo**: Meta tags, Open Graph, Twitter Cards, Schema.org NewsArticle
- ✅ **S3 Integration**: Upload de imágenes con naming organizado por fecha
- ✅ **EventEmitter2**: Eventos para integración con otros módulos

---

## 🏗️ Arquitectura

### Estructura de Directorios

```
src/pachuca-noticias/
├── controllers/
│   └── pachuca-noticias.controller.ts    # REST endpoints
├── services/
│   ├── publish.service.ts                # Lógica principal de publicación
│   ├── image-processor.service.ts        # Descarga y optimización de imágenes
│   └── slug-generator.service.ts         # Generación de slugs únicos
├── schemas/
│   └── published-noticia.schema.ts       # Schema Mongoose
├── dto/
│   ├── publish-noticia.dto.ts           # DTO para publicar
│   ├── update-noticia.dto.ts            # DTO para actualizar
│   └── query-noticias.dto.ts            # DTO para queries
├── events/
│   └── noticia-events.ts                # EventEmitter2 events
├── pachuca-noticias.module.ts           # NestJS module
└── README.md                            # Este archivo
```

### Dependencias

- **Mongoose**: Persistencia de datos
- **Sharp**: Procesamiento de imágenes (resize, WebP conversion)
- **EventEmitter2**: Sistema de eventos
- **AwsS3CoreService**: Upload a S3 (módulo `files`)
- **AppConfigService**: Configuración global (módulo `config`)

---

## 📄 Schemas

### PublishedNoticia

Schema completo para noticias publicadas en el sitio público.

```typescript
{
  // Relaciones
  contentId: ObjectId;              // Ref: AIContentGeneration (unique)
  originalNoticiaId?: ObjectId;     // Ref: ExtractedNoticia (opcional)

  // Contenido
  slug: string;                     // URL-friendly, unique
  title: string;
  content: string;                  // HTML sanitizado
  summary: string;                  // 2-3 líneas (max 300 chars)
  extendedSummary?: string;         // 4-6 párrafos

  // Imágenes (S3)
  featuredImage: {
    original: string;               // URL CDN
    thumbnail: string;              // 400x250px
    medium: string;                 // 800x500px
    large: string;                  // 1200x630px (OG)
    alt: string;
    width: number;
    height: number;
    s3Key: string;
  };

  // Taxonomía
  category: string;                 // lowercase
  tags: string[];
  keywords: string[];
  author?: string;

  // SEO
  seo: {
    metaTitle: string;
    metaDescription: string;
    focusKeyword: string;
    canonicalUrl: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    ogType: 'article';
    ogUrl: string;
    ogLocale: 'es_MX';
    twitterCard: 'summary_large_image';
    twitterTitle: string;
    twitterDescription: string;
    twitterImage: string;
    structuredData: Record<string, unknown>;
  };

  // Fechas
  publishedAt: Date;
  originalPublishedAt?: Date;
  lastModifiedAt: Date;
  scheduledPublishAt?: Date;

  // Estado
  status: 'draft' | 'scheduled' | 'published' | 'unpublished' | 'archived';
  isFeatured: boolean;
  isBreaking: boolean;
  priority: number;                 // 1-10

  // Stats
  stats: {
    views?: number;
    readTime?: number;
    shares?: number;
    avgScrollDepth?: number;
    bounceRate?: number;
  };

  // Social Media Copies (NO SE USA EN FASE 1)
  socialMediaCopies?: {...};
  socialMediaPublishing?: {...};

  // Metadata
  publishingMetadata: {
    publishedBy: ObjectId | undefined;
    publishedFrom: 'dashboard' | 'api' | 'scheduled';
    imageSource: 'original' | 'uploaded' | 'generated';
    processingTime?: number;
    version: number;
  };

  errors: string[];
  warnings: string[];

  createdAt: Date;
  updatedAt: Date;
}
```

### Índices

```typescript
// Únicos
{ slug: 1 } (unique)

// Queries comunes
{ status: 1, publishedAt: -1 }
{ category: 1, publishedAt: -1 }
{ status: 1, category: 1, publishedAt: -1 }
{ isFeatured: 1, publishedAt: -1 }
{ isBreaking: 1, publishedAt: -1 }

// Búsqueda de texto
{ title: 'text', summary: 'text', content: 'text' }
```

---

## 🌐 Endpoints

### Base URL
```
http://localhost:4000/api/pachuca-noticias
```

---

### POST `/publish`

Publica una noticia desde contenido generado por IA.

**Request Body:**
```json
{
  "contentId": "507f1f77bcf86cd799439011",
  "useOriginalImage": true,
  "customImageUrl": "https://example.com/image.jpg",
  "isFeatured": false,
  "isBreaking": false,
  "scheduledPublishAt": "2025-10-10T10:00:00Z"
}
```

**Response: 201 Created**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "contentId": "507f1f77bcf86cd799439011",
  "slug": "migrantes-hidalgo-trabajo-oportunidades-abc12345",
  "title": "Migrantes en Hidalgo encuentran oportunidades de trabajo",
  "content": "<p>Contenido HTML completo...</p>",
  "summary": "Resumen corto de 2-3 líneas",
  "featuredImage": {
    "original": "https://cdn.example.com/noticias/2025/10/slug/original.webp",
    "thumbnail": "https://cdn.example.com/noticias/2025/10/slug/thumbnail.webp",
    "medium": "https://cdn.example.com/noticias/2025/10/slug/medium.webp",
    "large": "https://cdn.example.com/noticias/2025/10/slug/large.webp",
    "alt": "Migrantes trabajando en Hidalgo",
    "width": 1920,
    "height": 1080,
    "s3Key": "noticias/2025/10/slug/original.webp"
  },
  "category": "política",
  "tags": ["migración", "hidalgo", "empleo"],
  "seo": {
    "metaTitle": "Migrantes en Hidalgo encuentran oportunidades",
    "metaDescription": "Resumen SEO optimizado...",
    "canonicalUrl": "https://noticias-pachuca.com/noticia/migrantes-hidalgo-abc12345",
    ...
  },
  "status": "published",
  "publishedAt": "2025-10-05T10:30:00.000Z",
  "createdAt": "2025-10-05T10:30:00.000Z",
  "updatedAt": "2025-10-05T10:30:00.000Z"
}
```

**Errores:**
- `400 Bad Request`: Contenido ya publicado, imagen no disponible, DTO inválido
- `404 Not Found`: Contenido generado no encontrado

---

### GET `/`

Lista noticias publicadas con paginación y filtros.

**Query Params:**
```
?page=1
&limit=20
&status=published
&category=política
&isFeatured=true
&isBreaking=false
&search=migrantes
&sortBy=publishedAt
&sortOrder=desc
```

**Response: 200 OK**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "slug": "migrantes-hidalgo-abc12345",
      "title": "Migrantes en Hidalgo...",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### GET `/slug/:slug`

Obtiene una noticia por slug (usado por frontend público SSR).

**Request:**
```
GET /slug/migrantes-hidalgo-trabajo-oportunidades-abc12345
```

**Response: 200 OK**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "slug": "migrantes-hidalgo-trabajo-oportunidades-abc12345",
  ...
}
```

**Errores:**
- `404 Not Found`: Slug no existe

---

### GET `/:id`

Obtiene una noticia por ID.

**Response: 200 OK**
```json
{ ... }
```

---

### PATCH `/:id`

Actualiza una noticia existente.

**Request Body:**
```json
{
  "title": "Nuevo título actualizado",
  "isFeatured": true,
  "priority": 8
}
```

**Response: 200 OK**
```json
{ ... }
```

---

### DELETE `/:id/unpublish`

Despublica una noticia (cambia status a `unpublished`).

**Response: 200 OK**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "status": "unpublished",
  ...
}
```

---

## ⚙️ Servicios

### PublishService

**Responsabilidad**: Orquestación completa del proceso de publicación.

**Métodos principales:**

#### `publishNoticia(dto: PublishNoticiaDto): Promise<PublishedNoticiaDocument>`

Proceso de 10 pasos:
1. Validar que no exista noticia publicada con ese `contentId`
2. Obtener `AIContentGeneration` completo (con populate de `originalContentId`)
3. Generar slug único SEO-friendly
4. Procesar imágenes (descargar → optimizar → upload S3)
5. Generar canonical URL
6. Generar structured data (Schema.org NewsArticle)
7. Crear registro `PublishedNoticia`
8. Actualizar `AIContentGeneration.publishingInfo`
9. Calcular tiempo de procesamiento
10. Emitir evento `noticia.published`

**Tiempo estimado**: 2-5 segundos (depende del tamaño de imagen)

#### `unpublishNoticia(slug: string): Promise<PublishedNoticiaDocument>`

Cambia status a `unpublished` y emite evento `noticia.unpublished`.

#### `getNoticiaBySlug(slug: string): Promise<PublishedNoticiaDocument | null>`

Busca por slug (usado por frontend público).

#### `queryNoticias(query: QueryNoticiasDto): Promise<{ data, pagination }>`

Lista con filtros y paginación.

---

### ImageProcessorService

**Responsabilidad**: Descarga, optimización y upload de imágenes a S3.

**Métodos principales:**

#### `processAndUploadImage(imageUrl: string, slug: string, altText: string): Promise<ProcessedImage>`

Proceso:
1. Descargar imagen desde URL externa (con manejo de redirects)
2. Obtener metadata con Sharp (width, height, format)
3. Generar 4 versiones en WebP:
   - **Original**: Max 1920px ancho, quality 90%
   - **Large**: 1200x630px (perfect para OG), quality 90%
   - **Medium**: 800x500px, quality 85%
   - **Thumbnail**: 400x250px, quality 80%
4. Upload a S3 con naming: `noticias/YYYY/MM/slug/{size}.webp`
5. Retornar URLs CDN públicas

**S3 Metadata:**
```typescript
{
  contentType: 'image/webp',
  cacheControl: 'public, max-age=31536000', // 1 año
  metadata: {
    alt: altText,
    slug: slug
  }
}
```

#### `validateImageUrl(url: string): Promise<boolean>`

Valida que URL sea imagen válida:
- Formato soportado (jpg, png, webp, etc)
- Dimensiones mínimas: 200x200px
- Tamaño máximo: 10MB

---

### SlugGeneratorService

**Responsabilidad**: Generación de slugs únicos SEO-friendly.

**Métodos principales:**

#### `generateUniqueSlug(title: string): Promise<string>`

Proceso:
1. Limpiar título:
   - Lowercase
   - Remover acentos (NFD normalize)
   - Solo a-z, 0-9, guiones
   - Max 60 caracteres
2. Agregar UUID corto (8 chars aleatorios)
3. Verificar unicidad en BD (por seguridad)
4. Retornar slug: `titulo-de-la-noticia-abc12345`

**Formato final**: `[titulo-limpio]-[uuid8]`

**Ejemplos**:
```
"Migrantes en Hidalgo" → "migrantes-en-hidalgo-a1b2c3d4"
"¡México campeón!" → "mexico-campeon-x7y8z9w0"
"COVID-19: Nuevas medidas" → "covid-19-nuevas-medidas-m5n6o7p8"
```

---

## 📡 Eventos

### `noticia.published`

Emitido cuando una noticia es publicada exitosamente.

**Payload:**
```typescript
{
  noticiaId: Types.ObjectId;
  slug: string;
  title: string;
  category: string;
  publishedAt: Date;
}
```

**Uso:**
```typescript
// Listener en otro módulo
@OnEvent('noticia.published')
handleNoticiaPublished(payload: NoticiaPublishedEvent) {
  this.logger.log(`Nueva noticia publicada: ${payload.title}`);
  // Enviar notificación, invalidar cache, etc.
}
```

---

### `noticia.unpublished`

Emitido cuando una noticia es despublicada.

**Payload:**
```typescript
{
  noticiaId: Types.ObjectId;
  slug: string;
}
```

---

## 💡 Ejemplos de Uso

### Publicar una noticia (cURL)

```bash
curl -X POST http://localhost:4000/api/pachuca-noticias/publish \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "507f1f77bcf86cd799439011",
    "useOriginalImage": true,
    "isFeatured": false,
    "isBreaking": false
  }'
```

---

### Listar noticias publicadas

```bash
curl "http://localhost:4000/api/pachuca-noticias?page=1&limit=10&status=published&category=política"
```

---

### Obtener noticia por slug

```bash
curl "http://localhost:4000/api/pachuca-noticias/slug/migrantes-hidalgo-abc12345"
```

---

### Despublicar noticia

```bash
curl -X DELETE "http://localhost:4000/api/pachuca-noticias/507f1f77bcf86cd799439012/unpublish"
```

---

### Desde Frontend (React Query)

```typescript
// Hook de publicación
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const usePublishNoticia = () => {
  return useMutation({
    mutationFn: async (data: PublishNoticiaDto) => {
      const response = await apiClient.post('/pachuca-noticias/publish', data);
      return response.data;
    },
    onSuccess: (publishedNoticia) => {
      console.log('✅ Noticia publicada:', publishedNoticia.slug);
    },
  });
};

// Uso en componente
const { mutate, isPending } = usePublishNoticia();

const handlePublish = () => {
  mutate({
    contentId: '507f1f77bcf86cd799439011',
    useOriginalImage: true,
  });
};
```

---

## 🔧 Variables de Entorno

Asegúrate de tener configuradas estas variables en `.env`:

```bash
# AWS S3 (requerido para upload de imágenes)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET=pachuca-noticias-media
S3_CUSTOM_URL=https://cdn.noticias-pachuca.com

# MongoDB (requerido)
MONGODB_URI=mongodb://localhost:27017/pachuca-noticias

# App Config
NODE_ENV=development
PORT=4000
```

---

## 🐛 Troubleshooting

### Error: "Esta noticia ya está publicada con slug: ..."

**Causa**: Intentas publicar un `contentId` que ya tiene una noticia publicada.

**Solución**:
- Verifica en BD si existe `PublishedNoticia` con ese `contentId`
- Si quieres republicar, primero despublica o borra el registro anterior

---

### Error: "No hay imagen original disponible"

**Causa**: El contenido original (`ExtractedNoticia`) no tiene imágenes y seleccionaste `useOriginalImage: true`.

**Solución**:
- Usar `useOriginalImage: false` y proporcionar `customImageUrl`
- O asegurarte que el scraping extrajo imágenes correctamente

---

### Error: "Failed to download image: 404"

**Causa**: La URL de imagen no es válida o ya no existe.

**Solución**:
- Verificar que la URL sea accesible
- Usar una imagen alternativa con `customImageUrl`

---

### Imágenes no se ven en S3

**Causa**: URLs de S3 no son públicas o CDN no está configurado.

**Solución**:
1. Verificar que el bucket S3 tiene permisos públicos de lectura
2. Verificar que `S3_CUSTOM_URL` apunta a tu CDN/CloudFront
3. Probar URL directamente en navegador

---

### Slugs duplicados (muy raro)

**Causa**: Colisión de UUID (probabilidad < 0.0001%).

**Solución**: El servicio automáticamente regenera con nuevo UUID. Si persiste, revisar lógica de `SlugGeneratorService`.

---

### Contenido HTML se muestra sin formato en frontend

**Causa**: Frontend no está renderizando HTML sanitizado correctamente.

**Solución**:
```typescript
// En React, usar dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: noticia.content }} />
```

---

### EventEmitter2 no emite eventos

**Causa**: EventEmitterModule no está importado en AppModule.

**Solución**:
```typescript
// app.module.ts
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    // ...
  ]
})
```

---

## 📊 Métricas y Monitoreo

### Logs importantes

```bash
# Publicación exitosa
✅ Noticia publicada: migrantes-hidalgo-abc12345 (3245ms)

# Descarga de imagen
📥 Descargando imagen: https://example.com/image.jpg
📊 Imagen original: 1920x1080, jpeg
✅ Imagen procesada y subida: noticias/2025/10/slug/original.webp

# Despublicación
📴 Noticia despublicada: migrantes-hidalgo-abc12345
```

### Estadísticas recomendadas

- Tiempo promedio de publicación
- Tasa de error en descarga de imágenes
- Total de noticias publicadas por día
- Noticias destacadas vs normales
- Categorías más publicadas

---

## 🚀 Próximas Mejoras (Fase 2+)

- [ ] **Caché**: Redis cache para endpoints de listado (TTL 5 min)
- [ ] **Rate Limiting**: Máximo 10 publicaciones por minuto
- [ ] **Webhooks**: Notificar a sistemas externos cuando se publica
- [ ] **Sitemap XML**: Generación dinámica
- [ ] **RSS Feed**: Feed de últimas noticias
- [ ] **Programación**: Publicación programada con scheduledPublishAt
- [ ] **Versionamiento**: Sistema de versiones para ediciones
- [ ] **Audit Log**: Registro de todas las acciones (quién, cuándo, qué)

---

**📅 Última actualización:** 5 Octubre 2025
**👤 Mantenido por:** Coyotito
**📧 Soporte:** Ver issues en repo principal
