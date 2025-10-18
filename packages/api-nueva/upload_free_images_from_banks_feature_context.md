# 📸 FEATURE: Upload Manual de Imágenes al Image Bank

**Fecha**: 18 de octubre 2025
**Objetivo**: Permitir subir imágenes manualmente desde la app móvil con metadata completo y citado correcto de fuentes

---

## 📋 ÍNDICE

1. [Requisitos Funcionales](#requisitos-funcionales)
2. [Estándares de Citado de Imágenes](#estándares-de-citado-de-imágenes)
3. [Cambios en Schema](#cambios-en-schema)
4. [Arquitectura Técnica](#arquitectura-técnica)
5. [Plan de Implementación por Fases](#plan-de-implementación-por-fases)
6. [Resumen Ejecutivo](#resumen-ejecutivo)

---

## 🎯 REQUISITOS FUNCIONALES

### RF-01: Upload Manual de Imágenes
- Usuario puede seleccionar **1 o más imágenes** desde la galería del teléfono
- Subir mediante `multipart/form-data`
- Procesamiento: resize a 4 tamaños (original, thumbnail, medium, large)
- Upload a S3 con estructura organizada
- Metadata EXIF/IPTC/XMP removida

### RF-02: Metadata Manual
Usuario debe poder ingresar:
- **Author** (NUEVO) - Fuente/crédito de la imagen
- **Keywords** - Input con botón `+` (NO separado por comas)
- **Tags** - Input con botón `+` (NO separado por comas)
- **Caption** - Descripción editorial
- **AltText** - Texto alternativo accesibilidad
- **Categories** - Selección múltiple

### RF-03: Citado Correcto de Fuentes
Según el origen de la imagen, mostrar formato correcto de citado:
- Wikipedia
- Unsplash/Pexels (stock gratuito)
- Captura de video de redes sociales
- Captura de pantalla de redes sociales
- Foto propia

### RF-04: Banco de Imágenes Mejorado
- Filtrar por keywords (texto libre)
- Filtrar por author
- Filtrar por categories
- Mostrar preview del author/fuente en cada imagen

### RF-05: Integración en Publicación
- Desde pantalla de publicación, abrir banco de imágenes
- Filtrar y seleccionar imagen
- Imagen se asigna como `featuredImage`

---

## 📚 ESTÁNDARES DE CITADO DE IMÁGENES

### 1. Wikipedia (Wikimedia Commons)

**Formato**:
```
Author/Contributor Name. (Year). Image title [Digital image].
Wikimedia Commons. Retrieved from https://commons.wikimedia.org/...
```

**Ejemplo**:
```
Pepe González. (2024). Palacio de Gobierno de Hidalgo [Digital image].
Wikimedia Commons. Retrieved from https://commons.wikimedia.org/wiki/File:Palacio.jpg

Licencia: CC BY-SA 4.0
```

**Campos para guardar**:
- `author`: "Pepe González / Wikimedia Commons"
- `sourceUrl`: "https://commons.wikimedia.org/wiki/File:Palacio.jpg"
- `license`: "CC BY-SA 4.0"
- `attribution`: "Pepe González. (2024). Palacio de Gobierno de Hidalgo [Digital image]. Wikimedia Commons."

---

### 2. Stock Photos Gratuitos (Unsplash, Pexels)

**Formato Unsplash**:
```
Photo by [Photographer Name] on Unsplash
URL: https://unsplash.com/photos/...
```

**Formato Pexels**:
```
Photo by [Photographer Name] from Pexels
URL: https://www.pexels.com/photo/...
```

**Ejemplo**:
```
Photo by María López on Unsplash
https://unsplash.com/photos/abc123

Licencia: Unsplash License (gratis para uso comercial)
```

**Campos**:
- `author`: "María López / Unsplash"
- `sourceUrl`: "https://unsplash.com/photos/abc123"
- `license`: "Unsplash License"
- `attribution`: "Photo by María López on Unsplash"

---

### 3. Captura de Video de Redes Sociales

**Formato**:
```
Captura de video de [@Username]. (Año, Mes Día). [Plataforma].
Obtenido de [URL]
```

**Ejemplo**:
```
Captura de video de @GobiernoHidalgo. (2025, Oct 17). Facebook.
Obtenido de https://facebook.com/GobHidalgo/videos/123456

Uso: Cobertura informativa (Fair Use - fines periodísticos)
```

**Campos**:
- `author`: "@GobiernoHidalgo / Facebook"
- `sourceUrl`: "https://facebook.com/GobHidalgo/videos/123456"
- `license`: "Fair Use - Cobertura periodística"
- `attribution`: "Captura de video de @GobiernoHidalgo. (2025, Oct 17). Facebook."
- `captureType`: "video_screenshot"

---

### 4. Captura de Pantalla de Redes Sociales

**Formato**:
```
Captura de publicación de [@Username]. (Año, Mes Día). [Plataforma].
Obtenido de [URL]
```

**Ejemplo**:
```
Captura de publicación de @AlcaldePachuca. (2025, Oct 17). X (Twitter).
Obtenido de https://x.com/AlcaldePachuca/status/123456

Uso: Cobertura informativa (Fair Use - fines periodísticos)
```

**Campos**:
- `author`: "@AlcaldePachuca / X (Twitter)"
- `sourceUrl`: "https://x.com/AlcaldePachuca/status/123456"
- `license`: "Fair Use - Cobertura periodística"
- `attribution`: "Captura de publicación de @AlcaldePachuca. (2025, Oct 17). X (Twitter)."
- `captureType`: "social_screenshot"

---

### 5. Foto Propia / Staff

**Formato**:
```
Foto por [Nombre del Fotógrafo/Staff]. Noticias Pachuca.
```

**Ejemplo**:
```
Foto por Juan Pérez. Noticias Pachuca.
```

**Campos**:
- `author`: "Juan Pérez / Noticias Pachuca"
- `sourceUrl`: null
- `license`: "Copyright © Noticias Pachuca"
- `attribution`: "Foto por Juan Pérez. Noticias Pachuca."
- `captureType`: "staff_photo"

---

### 6. Agencia de Noticias

**Formato**:
```
[Agencia]. ([Fotógrafo si aplica]). (Año, Mes Día).
[Título de la imagen]. [Ciudad].
```

**Ejemplo**:
```
Reuters. (José Martínez). (2025, Oct 17).
Manifestación en Pachuca. Hidalgo, México.

Uso: Licencia de agencia / Fair Use periodístico
```

**Campos**:
- `author`: "José Martínez / Reuters"
- `sourceUrl`: null
- `license`: "Licencia Reuters"
- `attribution`: "Reuters. (José Martínez). (2025, Oct 17). Manifestación en Pachuca."
- `captureType`: "news_agency"

---

## 🗄️ CAMBIOS EN SCHEMA

### ImageBank Schema - Nuevos Campos

**Archivo**: `/packages/api-nueva/src/image-bank/schemas/image-bank.schema.ts`

```typescript
// ========================================
// 📸 AUTHOR Y ATTRIBUTION (NUEVO)
// ========================================

@Prop({ trim: true })
author?: string; // "Pepe González / Wikimedia Commons"

@Prop({ trim: true })
license?: string; // "CC BY-SA 4.0", "Unsplash License", "Fair Use", etc.

@Prop({ trim: true })
attribution?: string; // Texto completo de atribución formateado

@Prop({
  enum: ['wikipedia', 'unsplash', 'pexels', 'video_screenshot', 'social_screenshot', 'staff_photo', 'news_agency', 'other'],
  default: 'other'
})
captureType?: string; // Tipo de captura/fuente

@Prop({ trim: true })
photographerName?: string; // Nombre del fotógrafo (si aplica)

// NOTA: sourceUrl ya existe en el schema actual
```

### Índices Adicionales

```typescript
// Buscar por author
ImageBankSchema.index({ author: 1 });

// Buscar por tipo de captura
ImageBankSchema.index({ captureType: 1 });

// Text search incluir author y attribution
ImageBankSchema.index({
  altText: 'text',
  caption: 'text',
  keywords: 'text',
  author: 'text',      // NUEVO
  attribution: 'text'  // NUEVO
});
```

---

## 🏗️ ARQUITECTURA TÉCNICA

### Backend - Nuevo Endpoint

```
POST /image-bank/upload
Content-Type: multipart/form-data

Request:
{
  files: File[],                    // 1 o más imágenes
  outlet: string,
  author?: string,
  license?: string,
  attribution?: string,
  captureType?: string,
  photographerName?: string,
  keywords: string[],               // Array JSON
  tags: string[],                   // Array JSON
  categories: string[],             // Array JSON
  altText?: string,
  caption?: string,
  quality?: 'high' | 'medium' | 'low'
}

Response:
{
  success: boolean,
  uploadedImages: ImageBankDocument[],
  totalUploaded: number,
  errors: Array<{ filename: string, error: string }>
}
```

### Backend - Services

#### ImageBankUploadService (NUEVO)

```typescript
class ImageBankUploadService {
  /**
   * Procesa múltiples archivos de imagen
   * @param files - Array de archivos (Express.Multer.File[])
   * @param metadata - Metadata común para todas las imágenes
   * @returns Array de ImageBank creados
   */
  async uploadMultiple(
    files: Express.Multer.File[],
    metadata: UploadImageMetadata
  ): Promise<ImageBankDocument[]>

  /**
   * Valida archivo de imagen
   * - Formato: jpeg, png, webp
   * - Tamaño: max 10MB
   * - Dimensiones: min 400x400px
   */
  private validateImageFile(file: Express.Multer.File): void

  /**
   * Procesa una imagen individual
   * - Resize a 4 tamaños
   * - Remover metadata EXIF
   * - Upload a S3
   * - Crear ImageBank entry
   */
  private processImage(
    file: Express.Multer.File,
    metadata: UploadImageMetadata
  ): Promise<ImageBankDocument>
}
```

### Frontend - Nuevos Componentes

#### 1. TagArrayInput Component

**Ubicación**: `/mobile-expo/components/ui/tag-array-input.tsx`

```typescript
interface TagArrayInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label: string;
  placeholder?: string;
  maxTags?: number;
}

// Funcionalidad:
// - Input de texto
// - Botón "+" para agregar tag
// - Lista de tags con botón "X" para eliminar
// - Validación: no duplicados, max tags
```

#### 2. AuthorInput Component

**Ubicación**: `/mobile-expo/components/image-bank/author-input.tsx`

```typescript
interface AuthorInputProps {
  value: {
    author?: string;
    license?: string;
    attribution?: string;
    captureType?: string;
    photographerName?: string;
    sourceUrl?: string;
  };
  onChange: (value: AuthorData) => void;
}

// Funcionalidad:
// - Select de captureType (dropdown con opciones)
// - Según captureType, muestra inputs relevantes
// - Genera attribution automáticamente
// - Muestra preview del citado
```

#### 3. ImageUploadScreen

**Ubicación**: `/mobile-expo/app/(protected)/image-bank/upload.tsx`

```typescript
// Funcionalidad:
// - Selector de múltiples imágenes (expo-image-picker)
// - Preview de imágenes seleccionadas
// - Formulario con:
//   - TagArrayInput para keywords
//   - TagArrayInput para tags
//   - AuthorInput
//   - Input de caption
//   - Input de altText
//   - Multi-select de categories
//   - Select de quality
// - Botón "Upload" con progress
// - Manejo de errores por imagen
```

### Frontend - Hooks

#### useUploadImages

**Ubicación**: `/mobile-expo/src/hooks/useUploadImages.ts`

```typescript
interface UseUploadImagesReturn {
  uploadImages: (
    files: ImagePickerAsset[],
    metadata: UploadImageMetadata
  ) => Promise<UploadImageResponse>;
  isUploading: boolean;
  progress: number;
  error: Error | null;
}

export function useUploadImages(): UseUploadImagesReturn
```

### Frontend - API Service

#### imageBankApi.uploadImages

**Ubicación**: `/mobile-expo/src/services/api/imageBankApi.ts`

```typescript
uploadImages: async (
  files: ImagePickerAsset[],
  metadata: UploadImageMetadata
): Promise<UploadImageResponse> => {
  const formData = new FormData();

  // Agregar archivos
  files.forEach((file, index) => {
    formData.append('files', {
      uri: file.uri,
      type: file.mimeType || 'image/jpeg',
      name: file.fileName || `image_${index}.jpg`
    } as any);
  });

  // Agregar metadata
  formData.append('outlet', metadata.outlet);
  formData.append('keywords', JSON.stringify(metadata.keywords));
  // ... etc

  const response = await rawClient.post<UploadImageResponse>(
    '/image-bank/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        // Calcular porcentaje
      }
    }
  );

  return response.data;
}
```

---

## 📋 PLAN DE IMPLEMENTACIÓN POR FASES

### ⚙️ CONVENCIONES

- ✅ = Tarea completada
- 🟡 = En progreso
- ⬜ = Pendiente
- 🔧 = Requiere build del backend
- 📱 = Solo frontend

---

## FASE 0: Preparación y Diseño

**Objetivo**: Validar diseño y preparar ambiente

### Tareas:
- ⬜ Revisar documento completo
- ⬜ Validar requisitos con usuario
- ⬜ Confirmar estándares de citado
- ⬜ Crear branch: `feature/manual-image-upload`

**Criterios de Aceptación**:
- Usuario aprueba plan de implementación
- Branch creado y pusheado

**Build Backend**: ❌ No

---

## FASE 1: Backend - Schema y DTOs

**Objetivo**: Actualizar ImageBank schema y crear DTOs

### Tareas Backend:

#### 1.1 Actualizar ImageBank Schema
**Archivo**: `/packages/api-nueva/src/image-bank/schemas/image-bank.schema.ts`

```typescript
// Agregar campos nuevos:
- ⬜ @Prop author?: string
- ⬜ @Prop license?: string
- ⬜ @Prop attribution?: string
- ⬜ @Prop captureType?: string (enum)
- ⬜ @Prop photographerName?: string

// Agregar índices:
- ⬜ ImageBankSchema.index({ author: 1 })
- ⬜ ImageBankSchema.index({ captureType: 1 })
- ⬜ Actualizar text index para incluir author y attribution
```

#### 1.2 Crear DTOs de Upload
**Archivo**: `/packages/api-nueva/src/image-bank/dto/upload-image.dto.ts` (NUEVO)

```typescript
- ⬜ Crear UploadImageMetadataDto con validaciones
  - outlet: string (required)
  - author?: string (optional)
  - license?: string (optional)
  - attribution?: string (optional)
  - captureType?: CaptureTypeEnum (optional)
  - photographerName?: string (optional)
  - keywords: string[] (optional, @IsArray, @IsString({ each: true }))
  - tags: string[] (optional, @IsArray, @IsString({ each: true }))
  - categories: string[] (optional, @IsArray, @IsString({ each: true }))
  - altText?: string (optional, @MaxLength(200))
  - caption?: string (optional, @MaxLength(500))
  - quality?: QualityEnum (optional, default: 'medium')

- ⬜ Crear UploadImageResponseDto
  - success: boolean
  - uploadedImages: ImageBankDocument[]
  - totalUploaded: number
  - errors: Array<{ filename: string, error: string }>

- ⬜ Crear CaptureTypeEnum
  - wikipedia, unsplash, pexels, video_screenshot,
    social_screenshot, staff_photo, news_agency, other
```

**Criterios de Aceptación**:
- Schema actualizado con campos nuevos
- Índices creados
- DTOs creados con validaciones

**Build Backend**: 🔧 SÍ (cambios en schema)

**Comando Build**:
```bash
cd /Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/api-nueva
yarn build
```

---

## FASE 2: Backend - Service de Upload

**Objetivo**: Crear servicio para procesar archivos subidos

### Tareas Backend:

#### 2.1 Crear ImageBankUploadService
**Archivo**: `/packages/api-nueva/src/image-bank/services/image-bank-upload.service.ts` (NUEVO)

```typescript
- ⬜ Inyectar dependencias:
  - ImageBankModel
  - ConfigService (para S3 config)
  - Logger
  - EventEmitter2

- ⬜ Implementar validateImageFile()
  - Validar formato: jpeg, png, webp
  - Validar tamaño: max 10MB
  - Usar sharp para leer dimensiones
  - Validar dimensiones mínimas: 400x400px
  - Lanzar BadRequestException si falla

- ⬜ Implementar processImage()
  - Leer archivo con sharp
  - Resize a 4 tamaños:
    • original: max 1920px (mantener aspect ratio)
    • thumbnail: 400x250px (crop center)
    • medium: 800x500px (crop center)
    • large: 1200x630px (crop center)
  - Remover metadata EXIF/IPTC/XMP
  - Convertir a WebP con calidad optimizada
  - Generar s3BaseKey: image-bank/{outlet}/{year}/{month}/{uuid}/
  - Upload a S3 con S3UploadService
  - Crear ImageBank document
  - Emitir evento: 'image-bank.uploaded'
  - Retornar ImageBankDocument

- ⬜ Implementar uploadMultiple()
  - Iterar sobre files
  - Para cada file:
    • Validar archivo
    • Procesar imagen (try/catch)
    • Si falla, agregar a errors array
    • Si success, agregar a uploadedImages array
  - Retornar UploadImageResponseDto
  - Logger de estadísticas (total, success, failed)
```

#### 2.2 Actualizar ImageBankModule
**Archivo**: `/packages/api-nueva/src/image-bank/image-bank.module.ts`

```typescript
- ⬜ Agregar ImageBankUploadService a providers
- ⬜ Exportar ImageBankUploadService
```

**Criterios de Aceptación**:
- ImageBankUploadService creado con todos los métodos
- Validaciones funcionando correctamente
- Upload a S3 funcionando
- Eventos emitidos correctamente

**Build Backend**: 🔧 SÍ

**Comando Build**:
```bash
cd /Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/api-nueva
yarn build
```

---

## FASE 3: Backend - Endpoint de Upload

**Objetivo**: Crear endpoint para recibir archivos

### Tareas Backend:

#### 3.1 Configurar Multer
**Archivo**: `/packages/api-nueva/src/image-bank/config/multer.config.ts` (NUEVO)

```typescript
- ⬜ Crear configuración de Multer:
  - storage: memoryStorage() (procesar en memoria)
  - limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  - fileFilter: validar mimeType (image/jpeg, image/png, image/webp)

- ⬜ Exportar multerConfig
```

#### 3.2 Crear Endpoint
**Archivo**: `/packages/api-nueva/src/image-bank/controllers/image-bank.controller.ts`

```typescript
- ⬜ Importar:
  - @UseInterceptors(FilesInterceptor)
  - @UploadedFiles()
  - ImageBankUploadService

- ⬜ Agregar endpoint:
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload manual de imágenes',
    description: 'Sube 1 o más imágenes con metadata manual'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' }
        },
        outlet: { type: 'string' },
        author: { type: 'string' },
        license: { type: 'string' },
        attribution: { type: 'string' },
        captureType: {
          type: 'string',
          enum: ['wikipedia', 'unsplash', 'pexels', ...]
        },
        keywords: { type: 'array', items: { type: 'string' } },
        tags: { type: 'array', items: { type: 'string' } },
        categories: { type: 'array', items: { type: 'string' } },
        altText: { type: 'string' },
        caption: { type: 'string' },
        quality: { type: 'string', enum: ['low', 'medium', 'high'] }
      }
    }
  })
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() metadata: UploadImageMetadataDto
  ): Promise<UploadImageResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Parsear arrays de JSON strings
    if (typeof metadata.keywords === 'string') {
      metadata.keywords = JSON.parse(metadata.keywords as string);
    }
    if (typeof metadata.tags === 'string') {
      metadata.tags = JSON.parse(metadata.tags as string);
    }
    if (typeof metadata.categories === 'string') {
      metadata.categories = JSON.parse(metadata.categories as string);
    }

    return await this.imageBankUploadService.uploadMultiple(files, metadata);
  }
```

#### 3.3 Actualizar Filtros Existentes
**Archivo**: `/packages/api-nueva/src/image-bank/dto/image-bank.dto.ts`

```typescript
- ⬜ Actualizar ImageBankFiltersDto:
  - Agregar author?: string
  - Agregar captureType?: string
```

**Archivo**: `/packages/api-nueva/src/image-bank/services/image-bank.service.ts`

```typescript
- ⬜ Actualizar findWithFilters():
  - Agregar filtro por author (if filters.author)
  - Agregar filtro por captureType (if filters.captureType)
```

**Criterios de Aceptación**:
- Endpoint funciona con Postman/Thunder Client
- Acepta múltiples archivos
- Metadata se parsea correctamente
- Respuesta incluye imágenes creadas y errores (si aplica)
- Filtros actualizados funcionan

**Build Backend**: 🔧 SÍ

**Comando Build**:
```bash
cd /Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/api-nueva
yarn build
```

**Testing Manual**:
```bash
# Probar con curl o Postman
curl -X POST http://localhost:4000/api/image-bank/upload \
  -H "Authorization: Bearer <token>" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.jpg" \
  -F "outlet=noticiaspachuca.com" \
  -F "author=Juan Pérez / Noticias Pachuca" \
  -F "keywords=[\"hidalgo\", \"política\"]" \
  -F "tags=[\"gobierno\"]" \
  -F "caption=Evento en Pachuca"
```

---

## FASE 4: Frontend - Componentes UI Base

**Objetivo**: Crear componentes reutilizables de UI

### Tareas Frontend:

#### 4.1 TagArrayInput Component
**Archivo**: `/packages/mobile-expo/components/ui/tag-array-input.tsx` (NUEVO)

```typescript
- ⬜ Crear interface TagArrayInputProps:
  - value: string[]
  - onChange: (tags: string[]) => void
  - label: string
  - placeholder?: string
  - maxTags?: number (default: 10)
  - disabled?: boolean

- ⬜ Implementar componente:
  - Estado local: inputValue (string)
  - Input de texto con placeholder
  - Botón "+" para agregar tag
    • Validar que inputValue no esté vacío
    • Validar que no sea duplicado
    • Validar que no exceda maxTags
    • Agregar a array y limpiar input
  - Lista de tags con FlatList
    • Cada tag muestra texto + botón "X"
    • Botón "X" elimina tag del array
  - Estilos consistentes con diseño actual
```

#### 4.2 AuthorInput Component
**Archivo**: `/packages/mobile-expo/components/image-bank/author-input.tsx` (NUEVO)

```typescript
- ⬜ Crear interface AuthorData:
  - author?: string
  - license?: string
  - attribution?: string
  - captureType?: CaptureType
  - photographerName?: string
  - sourceUrl?: string

- ⬜ Crear interface AuthorInputProps:
  - value: AuthorData
  - onChange: (data: AuthorData) => void

- ⬜ Implementar componente:
  - Select de captureType (CompactRadioGroup o similar)
    • Opciones:
      - Wikipedia
      - Unsplash
      - Pexels
      - Captura de Video (Redes)
      - Captura de Pantalla (Redes)
      - Foto Propia/Staff
      - Agencia de Noticias
      - Otra

  - Inputs condicionales según captureType:

    SI captureType === 'wikipedia':
      - Input: photographerName
      - Input: sourceUrl (URL de Wikimedia)
      - Auto-generar: author = "{photographerName} / Wikimedia Commons"
      - Auto-generar: license = "CC BY-SA 4.0"

    SI captureType === 'unsplash' o 'pexels':
      - Input: photographerName
      - Input: sourceUrl
      - Auto-generar: author = "{photographerName} / {platform}"
      - Auto-generar: license = "{platform} License"

    SI captureType === 'video_screenshot' o 'social_screenshot':
      - Input: username (ej: @GobiernoHidalgo)
      - Input: platform (Facebook, X, Instagram, TikTok)
      - Input: sourceUrl
      - Auto-generar: author = "{username} / {platform}"
      - Auto-generar: license = "Fair Use - Cobertura periodística"

    SI captureType === 'staff_photo':
      - Input: photographerName
      - Auto-generar: author = "{photographerName} / Noticias Pachuca"
      - Auto-generar: license = "Copyright © Noticias Pachuca"

    SI captureType === 'news_agency':
      - Input: agencyName (Reuters, AP, EFE, etc.)
      - Input: photographerName (opcional)
      - Auto-generar: author = "{photographerName} / {agency}" o "{agency}"
      - Auto-generar: license = "Licencia {agency}"

  - Preview de attribution (texto formateado, read-only)
  - Estilos consistentes
```

**Criterios de Aceptación**:
- TagArrayInput funciona correctamente
  - Agrega tags sin duplicados
  - Elimina tags
  - Respeta maxTags
- AuthorInput genera attribution correctamente según tipo
- Componentes siguen estilos del proyecto

**Build Backend**: ❌ No

---

## FASE 5: Frontend - Pantalla de Upload

**Objetivo**: Crear pantalla principal de upload

### Tareas Frontend:

#### 5.1 Crear Pantalla
**Archivo**: `/packages/mobile-expo/app/(protected)/image-bank/upload.tsx` (NUEVO)

```typescript
- ⬜ Importar dependencias:
  - expo-image-picker
  - TagArrayInput
  - AuthorInput
  - useUploadImages hook
  - React Hook Form (si se usa)

- ⬜ Implementar lógica de selección de imágenes:
  - Botón "Seleccionar Imágenes"
  - Abrir ImagePicker con launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1
    })
  - Guardar en estado: selectedImages (ImagePickerAsset[])
  - Mostrar preview grid de imágenes seleccionadas
    • Thumbnail de cada imagen
    • Botón "X" para eliminar de selección

- ⬜ Implementar formulario:
  - Input: Outlet (select o autocomplete con outlets del user)
  - AuthorInput component
  - TagArrayInput: Keywords
  - TagArrayInput: Tags
  - Multi-select: Categories
  - Input: Caption (textarea)
  - Input: AltText (input)
  - Select: Quality (low/medium/high)

- ⬜ Botón "Upload":
  - Disabled si no hay imágenes seleccionadas
  - Mostrar loading state mientras sube
  - Mostrar progress bar (useUploadImages.progress)
  - Al completar:
    • Mostrar success message con total subido
    • Mostrar errores (si aplica) en lista
    • Limpiar formulario
    • Navegar a banco de imágenes

- ⬜ Manejo de errores:
  - Mostrar toast/alert con mensaje de error
  - No limpiar formulario si falla
```

#### 5.2 Agregar Navegación
**Archivo**: `/packages/mobile-expo/app/(protected)/image-bank/_layout.tsx`

```typescript
- ⬜ Agregar stack screen para 'upload'
- ⬜ Configurar headerTitle: "Subir Imágenes"
```

**Archivo**: `/packages/mobile-expo/app/(protected)/image-bank/index.tsx`

```typescript
- ⬜ Agregar botón FAB o header button:
  - Icon: "upload" o "plus"
  - Al presionar: navigate('upload')
```

**Criterios de Aceptación**:
- Pantalla permite seleccionar múltiples imágenes
- Formulario muestra todos los campos
- Preview de imágenes funciona
- Navegación funciona

**Build Backend**: ❌ No

---

## FASE 6: Frontend - Hook y API Service

**Objetivo**: Conectar pantalla con backend

### Tareas Frontend:

#### 6.1 Actualizar API Service
**Archivo**: `/packages/mobile-expo/src/services/api/imageBankApi.ts`

```typescript
- ⬜ Crear interface UploadImageMetadata:
  - outlet: string
  - author?: string
  - license?: string
  - attribution?: string
  - captureType?: string
  - photographerName?: string
  - keywords?: string[]
  - tags?: string[]
  - categories?: string[]
  - altText?: string
  - caption?: string
  - quality?: 'low' | 'medium' | 'high'

- ⬜ Crear interface UploadImageResponse:
  - success: boolean
  - uploadedImages: ImageBankDocument[]
  - totalUploaded: number
  - errors: Array<{ filename: string, error: string }>

- ⬜ Agregar método uploadImages:
  uploadImages: async (
    files: ImagePickerAsset[],
    metadata: UploadImageMetadata
  ): Promise<UploadImageResponse> => {
    const formData = new FormData();

    // Agregar archivos
    files.forEach((file, index) => {
      const filename = file.fileName || `image_${index}.jpg`;
      const type = file.mimeType || 'image/jpeg';

      formData.append('files', {
        uri: file.uri,
        type: type,
        name: filename
      } as any);
    });

    // Agregar metadata
    formData.append('outlet', metadata.outlet);

    if (metadata.author) {
      formData.append('author', metadata.author);
    }
    if (metadata.license) {
      formData.append('license', metadata.license);
    }
    if (metadata.attribution) {
      formData.append('attribution', metadata.attribution);
    }
    if (metadata.captureType) {
      formData.append('captureType', metadata.captureType);
    }
    if (metadata.photographerName) {
      formData.append('photographerName', metadata.photographerName);
    }

    // Arrays como JSON strings
    if (metadata.keywords) {
      formData.append('keywords', JSON.stringify(metadata.keywords));
    }
    if (metadata.tags) {
      formData.append('tags', JSON.stringify(metadata.tags));
    }
    if (metadata.categories) {
      formData.append('categories', JSON.stringify(metadata.categories));
    }

    if (metadata.altText) {
      formData.append('altText', metadata.altText);
    }
    if (metadata.caption) {
      formData.append('caption', metadata.caption);
    }
    if (metadata.quality) {
      formData.append('quality', metadata.quality);
    }

    const rawClient = ApiClient.getRawClient();

    const response = await rawClient.post<UploadImageResponse>(
      '/image-bank/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            // Emitir progreso (usar event emitter o callback)
          }
        }
      }
    );

    console.log('[imageBankApi] Images uploaded:', response.data.totalUploaded);

    return response.data;
  }
```

#### 6.2 Crear Hook useUploadImages
**Archivo**: `/packages/mobile-expo/src/hooks/useUploadImages.ts` (NUEVO)

```typescript
- ⬜ Importar:
  - useState
  - imageBankApi
  - useQueryClient (para invalidar queries)

- ⬜ Crear interface UseUploadImagesReturn:
  - uploadImages: (files, metadata) => Promise<UploadImageResponse>
  - isUploading: boolean
  - progress: number
  - error: Error | null
  - reset: () => void

- ⬜ Implementar hook:
  export function useUploadImages(): UseUploadImagesReturn {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<Error | null>(null);
    const queryClient = useQueryClient();

    const uploadImages = async (
      files: ImagePickerAsset[],
      metadata: UploadImageMetadata
    ): Promise<UploadImageResponse> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const response = await imageBankApi.uploadImages(files, metadata);

        // Invalidar queries del image bank
        await queryClient.invalidateQueries(['image-bank']);

        setProgress(100);

        return response;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    };

    const reset = () => {
      setIsUploading(false);
      setProgress(0);
      setError(null);
    };

    return {
      uploadImages,
      isUploading,
      progress,
      error,
      reset
    };
  }
```

#### 6.3 Conectar Hook con Pantalla
**Archivo**: `/packages/mobile-expo/app/(protected)/image-bank/upload.tsx`

```typescript
- ⬜ Usar hook en componente:
  const { uploadImages, isUploading, progress, error } = useUploadImages();

- ⬜ En handleUpload:
  const response = await uploadImages(selectedImages, formData);

  if (response.success) {
    Alert.alert(
      'Éxito',
      `${response.totalUploaded} imágenes subidas correctamente`
    );

    if (response.errors.length > 0) {
      console.warn('Errores en algunas imágenes:', response.errors);
    }

    // Navegar a banco de imágenes
    router.push('/(protected)/image-bank');
  }

- ⬜ Mostrar progress bar:
  {isUploading && (
    <ProgressBar progress={progress / 100} />
  )}
```

**Criterios de Aceptación**:
- Hook funciona correctamente
- Upload se ejecuta con éxito
- Progress se actualiza
- Errores se manejan correctamente
- Queries se invalidan correctamente

**Build Backend**: ❌ No

---

## FASE 7: Frontend - Mejoras en Banco de Imágenes

**Objetivo**: Mejorar filtros y mostrar author

### Tareas Frontend:

#### 7.1 Actualizar Tipos
**Archivo**: `/packages/mobile-expo/src/features/image-bank/types/image.types.ts`

```typescript
- ⬜ Actualizar interface ImageBank:
  - Agregar author?: string
  - Agregar license?: string
  - Agregar attribution?: string
  - Agregar captureType?: string
  - Agregar photographerName?: string
```

#### 7.2 Actualizar Pantalla de Banco
**Archivo**: `/packages/mobile-expo/app/(protected)/image-bank/index.tsx`

```typescript
- ⬜ Agregar filtros adicionales:
  - Input de búsqueda por author
  - Select de captureType

- ⬜ Actualizar cards de imagen:
  - Mostrar author debajo del thumbnail (si existe)
  - Mostrar icono según captureType:
    • wikipedia: 📚
    • unsplash/pexels: 📷
    • video_screenshot: 🎥
    • social_screenshot: 📱
    • staff_photo: 🏢
    • news_agency: 📰
```

#### 7.3 Pantalla de Detalle
**Archivo**: `/packages/mobile-expo/app/(protected)/image-bank/[id].tsx`

```typescript
- ⬜ Mostrar sección de Attribution:
  - Título: "Créditos"
  - Author (bold)
  - License
  - Attribution (texto completo formateado)
  - Source URL (link clickeable)
  - Botón "Copiar Attribution" (copiar al clipboard)
```

**Criterios de Aceptación**:
- Filtros funcionan correctamente
- Cards muestran author
- Detalle muestra toda la información de attribution
- Copy to clipboard funciona

**Build Backend**: ❌ No

---

## FASE 8: Frontend - Integración en Publicación

**Objetivo**: Usar banco de imágenes en pantalla de publicar noticia

### Tareas Frontend:

#### 8.1 Selector de Imagen en Publicación
**Archivo**: `/packages/mobile-expo/app/(protected)/generated/[id]/publish.tsx` (o similar)

```typescript
- ⬜ Agregar botón "Seleccionar Imagen Destacada"
  - Al presionar, mostrar modal/bottom sheet con:
    • Búsqueda rápida (input)
    • Filtros (keywords, author, categories)
    • Grid de imágenes del banco
    • Al seleccionar imagen:
      - Guardar imageBankId
      - Mostrar preview de imagen seleccionada
      - Cerrar modal

- ⬜ Preview de imagen seleccionada:
  - Mostrar thumbnail
  - Mostrar author/caption
  - Botón "Cambiar" (abre modal nuevamente)
  - Botón "Quitar" (limpia selección)

- ⬜ Al publicar noticia:
  - Enviar imageBankId como featuredImage
```

**Criterios de Aceptación**:
- Modal de selección funciona
- Búsqueda y filtros funcionan
- Imagen se asigna correctamente
- PublishedNoticia se crea con featuredImage correcto

**Build Backend**: ❌ No

---

## 🎯 RESUMEN EJECUTIVO

### Scope General

Esta feature permite **subir imágenes manualmente** desde la app móvil al Image Bank, con **metadata completo** y **citado correcto de fuentes**, para cumplir con estándares periodísticos y legales.

---

### Cambios Principales

#### Backend (3 Fases)
1. **FASE 1**: Schema + DTOs
   - Agregar 5 campos nuevos a ImageBank
   - Crear DTOs de upload con validaciones
   - 🔧 Build requerido

2. **FASE 2**: Upload Service
   - Crear ImageBankUploadService
   - Procesar múltiples archivos
   - Resize, upload S3, crear entries
   - 🔧 Build requerido

3. **FASE 3**: Endpoint + Filtros
   - POST /image-bank/upload (multipart)
   - Actualizar filtros existentes (author, captureType)
   - 🔧 Build requerido

#### Frontend (5 Fases)
4. **FASE 4**: Componentes UI
   - TagArrayInput (keywords/tags con botón +)
   - AuthorInput (citado automático según tipo)

5. **FASE 5**: Pantalla de Upload
   - Selección múltiple de imágenes
   - Formulario completo
   - Preview de imágenes

6. **FASE 6**: Hook + API
   - useUploadImages hook
   - imageBankApi.uploadImages
   - Upload con progress

7. **FASE 7**: Mejoras en Banco
   - Filtros por author
   - Mostrar attribution
   - Copy to clipboard

8. **FASE 8**: Integración
   - Selector en pantalla de publicación
   - Asignar featuredImage

---

### Métricas de Esfuerzo

| Fase | Tipo | Archivos Nuevos | Archivos Modificados | Builds | Tiempo Estimado |
|------|------|----------------|---------------------|--------|-----------------|
| 0 | Prep | 0 | 0 | 0 | 15 min |
| 1 | Backend | 1 | 1 | 1 | 45 min |
| 2 | Backend | 1 | 1 | 1 | 1.5h |
| 3 | Backend | 1 | 2 | 1 | 1h |
| 4 | Frontend | 2 | 0 | 0 | 2h |
| 5 | Frontend | 2 | 1 | 0 | 2h |
| 6 | Frontend | 1 | 2 | 0 | 1.5h |
| 7 | Frontend | 0 | 3 | 0 | 1h |
| 8 | Frontend | 0 | 1 | 0 | 1h |
| **TOTAL** | - | **8** | **11** | **3** | **~11h** |

---

### Validaciones Clave

#### Backend
✅ Schema actualizado correctamente
✅ DTOs con validaciones clase-validator
✅ Service procesa y sube a S3
✅ Endpoint acepta multipart/form-data
✅ Multer configurado con límites
✅ Sin `any` types
✅ Sin `forwardRef`
✅ EventEmitter2 para eventos

#### Frontend
✅ TagArrayInput NO usa comas
✅ AuthorInput genera attribution automáticamente
✅ Upload múltiple funciona
✅ Progress bar se actualiza
✅ Errores se manejan por imagen
✅ Mapeos correctos API ↔ App
✅ Hooks envuelven lógica
✅ Queries se invalidan correctamente

---

### Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Archivos muy grandes | Media | Alto | Validación de 10MB max, resize automático |
| Formato no soportado | Baja | Medio | Validación de mimeType en Multer |
| Falla en S3 upload | Baja | Alto | Try/catch, agregar a errors array |
| Metadata incompleto | Media | Bajo | Campos opcionales, solo outlet required |
| Progress no se actualiza | Baja | Bajo | onUploadProgress callback bien configurado |

---

### Dependencias Externas

**Backend**:
- `@nestjs/platform-express` (ya existe)
- `multer` (ya existe)
- `sharp` (ya existe)
- `@aws-sdk/client-s3` (ya existe)

**Frontend**:
- `expo-image-picker` (instalar si no existe)
- `react-native-reanimated` (ya existe)
- `@tanstack/react-query` (ya existe)

---

### Criterios de Éxito

✅ Usuario puede subir 1-10 imágenes simultáneamente
✅ Metadata completo se guarda correctamente
✅ Attribution se genera automáticamente según tipo
✅ Imágenes aparecen en banco inmediatamente
✅ Filtros por author funcionan
✅ Selector en publicación funciona
✅ Sin errores en consola
✅ Sin types `any`
✅ Performance < 5 segundos por imagen

---

### Siguiente Paso

**ESPERAR APROBACIÓN DEL USUARIO** antes de proceder con FASE 1.

**Comando para empezar**:
```bash
git checkout -b feature/manual-image-upload
```

---

**FIN DEL DOCUMENTO**
