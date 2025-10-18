# 🔍 DIAGNÓSTICO COMPLETO: Flujo de Publicación en Redes Sociales

**Fecha**: 18 de octubre 2025
**Estado**: ANÁLISIS PROFUNDO SIN MODIFICACIONES

---

## 📊 RESUMEN EJECUTIVO

El sistema tiene **ERRORES CRÍTICOS** en la capa de publicación a redes sociales debido a:
1. **DESAJUSTE ARQUITECTÓNICO** entre schemas FacebookPost vs TwitterPost
2. **CAMPOS INCORRECTOS** al leer PublishedNoticia
3. **CAMPOS FALTANTES** al crear posts en BD
4. **INCOMPATIBILIDAD DE TIPOS** en métodos de optimización

---

## 🔄 FLUJO ACTUAL COMPLETO

### **1. Inicio del Flujo**
```
📍 publish.service.ts:252
```
**Entrada**: `PublishNoticiaDto` con `contentId` (AIContentGeneration)

**Proceso**:
1. Lee `AIContentGeneration` de BD (línea 79-82)
2. Crea `PublishedNoticia` con datos transformados (líneas 100-200)
3. **Llama a social media** (línea 252):
   ```typescript
   await this.socialMediaPublishingService.publishToSocialMedia(
     publishedNoticia,  // ← PublishedNoticiaDocument
     siteObjectIds,
     { platforms, optimizeContent }
   );
   ```

---

### **2. Orquestador Social Media**
```
📍 social-media-publishing.service.ts:95
```

**Entrada**: `noticia` (tipo: `PublishedNoticiaDocument`)

**Estructura real de PublishedNoticia**:
```typescript
{
  _id: ObjectId,
  contentId: ObjectId,              // → referencia a AIContentGeneration
  originalNoticiaId?: ObjectId,     // → referencia a ExtractedNoticia
  title: string,                     // ❌ NO "titulo"
  content: string,                   // ❌ NO "contenido" ni "generatedContent"
  featuredImage?: {                  // ❌ NO "imagenDestacada"
    original: string,
    thumbnail: string,
    medium: string,
    large: string,                   // ← Esta es la imagen principal
    alt: string,
    width: number,
    height: number,
    s3Key: string
  },
  slug: string,
  summary: string,
  category: ObjectId,
  tags: string[],
  keywords: string[],
  // ...más campos
}
```

---

## 🔴 PROBLEMA 1: Lectura Incorrecta de Campos (Facebook)

### **Ubicación**: `social-media-publishing.service.ts:231`

```typescript
// ❌ INCORRECTO
let postContent = noticia.generatedContent || noticia.titulo;
```

**Error**:
- `PublishedNoticia` NO tiene campo `generatedContent`
- `PublishedNoticia` NO tiene campo `titulo`

**Campos reales**:
- ✅ `noticia.content` (contenido HTML completo)
- ✅ `noticia.title` (título)

**Impacto**: `postContent` siempre será `undefined`

---

## 🔴 PROBLEMA 2: optimizeContentForFacebook() - Campos Incorrectos

### **Ubicación**: `facebook-publishing.service.ts:217-222`

```typescript
// ❌ INCORRECTO
const baseContent =
  content.contenido ||           // ❌ NO EXISTE en PublishedNoticia
  content.generatedContent ||    // ✅ Solo en AIContentGeneration
  content.titulo ||              // ❌ NO EXISTE en PublishedNoticia
  content.generatedTitle ||      // ✅ Solo en AIContentGeneration
  '';
```

**Correcto sería**:
```typescript
const baseContent =
  content.content ||             // ✅ PublishedNoticia
  content.generatedContent ||    // ✅ AIContentGeneration
  content.title ||               // ✅ PublishedNoticia
  content.generatedTitle ||      // ✅ AIContentGeneration
  '';
```

**Impacto**: `baseContent` siempre será `''`, mostrando warning:
```
⚠️ No content found for optimization: 68f3dafccd35653999ff2a4e
```

---

## 🔴 PROBLEMA 3: Creación de FacebookPost - SCHEMA MISMATCH CRÍTICO

### **Ubicación**: `social-media-publishing.service.ts:237-250`

```typescript
// ❌ INCORRECTO
const facebookPost = await this.facebookPostModel.create({
  publishedNoticiaId: noticia._id,  // ❌ ESTE CAMPO NO EXISTE EN SCHEMA
  siteId: site._id,
  facebookConfigId: page.publishingConfigId || undefined,
  pageId: page.pageId,
  pageName: page.pageName,
  postContent,
  originalTitle: noticia.titulo,    // ❌ Debe ser noticia.title
  mediaUrls: noticia.imagenDestacada ? [noticia.imagenDestacada] : [],  // ❌ Incorrecto
  scheduledAt,
  status: 'scheduled',
});
```

### **Schema Real de GeneratorProFacebookPost**:

**Campos REQUIRED**:
```typescript
@Prop({ required: true, type: Types.ObjectId, ref: 'ExtractedNoticia' })
originalNoticiaId: Types.ObjectId;  // ✅ FALTA en create()

@Prop({ required: true, type: Types.ObjectId, ref: 'AIContentGeneration' })
generatedContentId: Types.ObjectId; // ✅ FALTA en create()

@Prop({ required: true, type: Types.ObjectId, ref: 'Site' })
siteId: Types.ObjectId;             // ✅ Sí se pasa

@Prop({ required: true, trim: true })
postContent: string;                // ✅ Sí se pasa
```

**Error de validación Mongoose**:
```
GeneratorProFacebookPost validation failed:
  generatedContentId: Path `generatedContentId` is required.,
  originalNoticiaId: Path `originalNoticiaId` is required.
```

### **Mapeo Correcto debería ser**:
```typescript
const facebookPost = await this.facebookPostModel.create({
  // ✅ Campos REQUIRED que FALTAN:
  originalNoticiaId: noticia.originalNoticiaId,  // De PublishedNoticia
  generatedContentId: noticia.contentId,         // De PublishedNoticia

  // ✅ Campos correctos:
  siteId: site._id,
  pageId: page.pageId,
  pageName: page.pageName,
  postContent,

  // ✅ Campos con nombres corregidos:
  originalTitle: noticia.title,                           // NO titulo
  mediaUrls: noticia.featuredImage?.large ?
    [noticia.featuredImage.large] : [],                   // NO imagenDestacada

  scheduledAt,
  status: 'scheduled',
});
```

---

## 🔴 PROBLEMA 4: Creación de TwitterPost - Mismos Errores de Campos

### **Ubicación**: `social-media-publishing.service.ts:339-352`

```typescript
// ❌ INCORRECTO
const twitterPost = await this.twitterPostModel.create({
  publishedNoticiaId: noticia._id,      // ✅ Este campo SÍ existe en TwitterPost
  siteId: site._id,
  twitterConfigId: account.publishingConfigId || undefined,
  accountId: account.accountId,
  username: account.username,
  tweetContent,
  originalTitle: noticia.titulo,        // ❌ Debe ser noticia.title
  mediaUrls: noticia.imagenDestacada ? [noticia.imagenDestacada] : [],  // ❌ Incorrecto
  scheduledAt,
  status: 'scheduled',
});
```

**Corrección necesaria**:
```typescript
const twitterPost = await this.twitterPostModel.create({
  publishedNoticiaId: noticia._id,      // ✅ Correcto
  siteId: site._id,
  accountId: account.accountId,
  username: account.username,
  tweetContent,
  originalTitle: noticia.title,          // ✅ Corregir
  mediaUrls: noticia.featuredImage?.large ?
    [noticia.featuredImage.large] : [],  // ✅ Corregir
  scheduledAt,
  status: 'scheduled',
});
```

---

## 🔴 PROBLEMA 5: optimizeContentForTwitter() - Campos Incorrectos

### **Ubicación**: `twitter-publishing.service.ts:222-227`

**Mismo error que Facebook**:
```typescript
// ❌ INCORRECTO
const baseContent =
  content.contenido ||           // ❌ NO EXISTE
  content.generatedContent ||    // ✅ Solo en AIContentGeneration
  content.titulo ||              // ❌ NO EXISTE
  content.generatedTitle ||      // ✅ Solo en AIContentGeneration
  '';
```

**Correcto**:
```typescript
const baseContent =
  content.content ||             // ✅ PublishedNoticia
  content.generatedContent ||    // ✅ AIContentGeneration
  content.title ||               // ✅ PublishedNoticia
  content.generatedTitle ||      // ✅ AIContentGeneration
  '';
```

---

## 🔴 PROBLEMA 6: Fallback Incorrectos en Línea 149

### **Ubicación**: `social-media-publishing.service.ts:149`

```typescript
// ❌ INCORRECTO
title: noticia.titulo || noticia.title,
```

**Problema**: Primero busca `titulo` (no existe), luego `title`

**Correcto**:
```typescript
title: noticia.title,  // PublishedNoticia solo tiene "title"
```

---

## 🔴 PROBLEMA 7: Fallback en optimizeContentForFacebook (línea 247)

### **Ubicación**: `facebook-publishing.service.ts:247`

```typescript
// ❌ INCORRECTO
return content.contenido || content.generatedContent || content.titulo || content.generatedTitle || 'Sin contenido disponible';
```

**Correcto**:
```typescript
return content.content || content.generatedContent || content.title || content.generatedTitle || 'Sin contenido disponible';
```

---

## 🔴 PROBLEMA 8: Fallback en optimizeContentForTwitter (línea 252)

### **Ubicación**: `twitter-publishing.service.ts:252`

**Mismo error que Facebook**:
```typescript
// ❌ INCORRECTO
const fallback = content.contenido || content.generatedContent || content.titulo || content.generatedTitle || 'Sin contenido disponible';
```

**Correcto**:
```typescript
const fallback = content.content || content.generatedContent || content.title || content.generatedTitle || 'Sin contenido disponible';
```

---

## 🔴 PROBLEMA 9: DESAJUSTE ARQUITECTÓNICO CRÍTICO

### **Comparación de Schemas**:

| Campo | GeneratorProFacebookPost | TwitterPost |
|-------|--------------------------|-------------|
| Referencia a PublishedNoticia | ❌ NO EXISTE | ✅ `publishedNoticiaId` (REQUIRED) |
| Referencia a ExtractedNoticia | ✅ `originalNoticiaId` (REQUIRED) | ❌ NO EXISTE |
| Referencia a AIContentGeneration | ✅ `generatedContentId` (REQUIRED) | ❌ NO EXISTE |

### **Problema**:
- `FacebookPost` fue diseñado para el flujo Generator-Pro OLD:
  ```
  ExtractedNoticia → AIContentGeneration → FacebookPost
  ```

- `TwitterPost` fue diseñado para el flujo nuevo:
  ```
  ExtractedNoticia → AIContentGeneration → PublishedNoticia → TwitterPost
  ```

### **Consecuencia**:
- **Facebook** REQUIERE `originalNoticiaId` + `generatedContentId`
- **Twitter** REQUIERE `publishedNoticiaId`

Pero el servicio intenta usar ambos con `PublishedNoticia`, creando incompatibilidad.

---

## 📝 RESUMEN DE ERRORES POR ARCHIVO

### **social-media-publishing.service.ts**:
- ❌ Línea 149: `noticia.titulo` → debe ser `noticia.title`
- ❌ Línea 231: `noticia.generatedContent || noticia.titulo` → debe ser `noticia.content || noticia.title`
- ❌ Línea 238: Campo `publishedNoticiaId` NO EXISTE en GeneratorProFacebookPost
- ❌ Línea 238: FALTAN `originalNoticiaId` y `generatedContentId` (REQUIRED)
- ❌ Línea 246: `noticia.titulo` → debe ser `noticia.title`
- ❌ Línea 247: `noticia.imagenDestacada` → debe ser `noticia.featuredImage?.large`
- ❌ Línea 327: `noticia.generatedContent || noticia.titulo` → debe ser `noticia.content || noticia.title`
- ❌ Línea 348: `noticia.titulo` → debe ser `noticia.title`
- ❌ Línea 349: `noticia.imagenDestacada` → debe ser `noticia.featuredImage?.large`

### **facebook-publishing.service.ts**:
- ❌ Línea 218: `content.contenido` → debe ser `content.content`
- ❌ Línea 220: `content.titulo` → debe ser `content.title`
- ❌ Línea 247: `content.contenido` → debe ser `content.content`
- ❌ Línea 247: `content.titulo` → debe ser `content.title`

### **twitter-publishing.service.ts**:
- ❌ Línea 223: `content.contenido` → debe ser `content.content`
- ❌ Línea 225: `content.titulo` → debe ser `content.title`
- ❌ Línea 252: `content.contenido` → debe ser `content.content`
- ❌ Línea 252: `content.titulo` → debe ser `content.title`

---

## 🎯 SOLUCIONES REQUERIDAS

### **SOLUCIÓN 1: Alinear FacebookPost con PublishedNoticia**

**Opción A - Modificar Schema** (RECOMENDADO):
Agregar campo `publishedNoticiaId` a `GeneratorProFacebookPost`:
```typescript
@Prop({ type: Types.ObjectId, ref: 'PublishedNoticia' })
publishedNoticiaId?: Types.ObjectId;

// Hacer opcionales los campos antiguos:
@Prop({ required: false, type: Types.ObjectId, ref: 'ExtractedNoticia' })
originalNoticiaId?: Types.ObjectId;

@Prop({ required: false, type: Types.ObjectId, ref: 'AIContentGeneration' })
generatedContentId?: Types.ObjectId;
```

**Opción B - Modificar Service**:
Pasar `originalNoticiaId` y `generatedContentId` desde `PublishedNoticia`:
```typescript
const facebookPost = await this.facebookPostModel.create({
  originalNoticiaId: noticia.originalNoticiaId,
  generatedContentId: noticia.contentId,
  siteId: site._id,
  // ...resto
});
```

### **SOLUCIÓN 2: Corregir TODOS los Nombres de Campos**

Buscar y reemplazar en:
- `social-media-publishing.service.ts`
- `facebook-publishing.service.ts`
- `twitter-publishing.service.ts`

| Buscar | Reemplazar |
|--------|-----------|
| `noticia.titulo` | `noticia.title` |
| `noticia.contenido` | `noticia.content` |
| `noticia.generatedContent` | `noticia.content` (cuando sea PublishedNoticia) |
| `noticia.imagenDestacada` | `noticia.featuredImage?.large` |
| `content.titulo` | `content.title` |
| `content.contenido` | `content.content` |

### **SOLUCIÓN 3: Actualizar Lógica de Fallback**

Cambiar TODOS los fallbacks para considerar el orden correcto:
```typescript
// Para PublishedNoticia + AIContentGeneration:
const baseContent =
  content.content ||           // PublishedNoticia
  content.generatedContent ||  // AIContentGeneration
  content.title ||             // PublishedNoticia
  content.generatedTitle ||    // AIContentGeneration
  '';
```

---

## 📋 CHECKLIST DE CORRECCIONES

### **Alta Prioridad (Bloquean funcionalidad)**:
- [ ] Agregar `publishedNoticiaId` a `GeneratorProFacebookPost` schema
- [ ] Corregir creación de `FacebookPost` en `social-media-publishing.service.ts:237-250`
- [ ] Corregir campos en `optimizeContentForFacebook()` líneas 218-220
- [ ] Corregir campos en `optimizeContentForTwitter()` líneas 223-225

### **Media Prioridad (Causan warnings/errors)**:
- [ ] Corregir todos los `noticia.titulo` → `noticia.title`
- [ ] Corregir todos los `noticia.imagenDestacada` → `noticia.featuredImage?.large`
- [ ] Corregir fallbacks en línea 247 (Facebook)
- [ ] Corregir fallbacks en línea 252 (Twitter)

### **Baja Prioridad (Optimizaciones)**:
- [ ] Eliminar fallback `noticia.titulo || noticia.title` en línea 149
- [ ] Agregar validaciones de tipo TypeScript
- [ ] Documentar el flujo correcto

---

## 🔍 PRUEBAS NECESARIAS DESPUÉS DE CORRECCIONES

1. **Test Unitario**: Crear mock de `PublishedNoticia` y verificar mapeo
2. **Test de Integración**: Publicar noticia completa a Facebook + Twitter
3. **Verificar en BD**: Confirmar que documentos se crean correctamente
4. **Verificar Logs**: No debe haber warnings de "No content found"

---

**FIN DEL DIAGNÓSTICO**
