# ANALISIS ARQUITECTURA BACKEND: Creacion de Contenido Original Manual

**Fecha:** 2025-10-21
**Proyecto:** Noticias Pachuca - API Nueva
**Objetivo:** Implementar creacion de contenido original manual con MODO URGENT y MODO NORMAL

---

## INDICE

1. [Analisis de Esquemas MongoDB](#1-analisis-de-esquemas-mongodb)
2. [Analisis de Servicios](#2-analisis-de-servicios)
3. [Analisis de Endpoints y DTOs](#3-analisis-de-endpoints-y-dtos)
4. [Diagramas de Flujo](#4-diagramas-de-flujo)
5. [Plan de Implementacion Backend](#5-plan-de-implementacion-backend)
6. [Consideraciones de Arquitectura](#6-consideraciones-de-arquitectura)

---

## 1. ANALISIS DE ESQUEMAS MONGODB

### 1.1 SCHEMA EXISTENTE: `ExtractedNoticia`

**Proposito Actual:** Almacena noticias extraidas de sitios web mediante scraping.

**Campos Clave:**
- `sourceUrl` (required): URL original de la noticia
- `domain`: Dominio extraido
- `title`, `content`, `images`: Contenido extraido
- `extractedAt`: Timestamp de extraccion
- `status`: 'pending' | 'extracted' | 'failed' | 'processing'
- `websiteConfigId`: Referencia a NewsWebsiteConfig

**Problema:** Este schema esta diseñado para contenido SCRAPEADO, no contenido ORIGINAL manual.

### 1.2 DECISION ARQUITECTURAL: Crear Nuevo Schema `UserGeneratedContent`

**Razon:** Separar concerns entre contenido scrapeado vs contenido original manual.

**Ubicacion:** `/src/generator-pro/schemas/user-generated-content.schema.ts`

**Propuesta de Schema:**

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserGeneratedContentDocument = UserGeneratedContent & Document;

/**
 * 🖊️ Schema para contenido original creado manualmente por usuarios
 * Maneja MODO URGENT (breaking news) y MODO NORMAL (publicacion manual)
 */
@Schema({ timestamps: true })
export class UserGeneratedContent {
  // ========================================
  // 📝 CONTENIDO ORIGINAL (INPUT DEL USUARIO)
  // ========================================

  @Prop({ required: true, trim: true })
  originalTitle: string; // Titulo proporcionado por el usuario

  @Prop({ required: true })
  originalContent: string; // Contenido proporcionado por el usuario

  @Prop({ type: [String], default: [] })
  uploadedImageUrls: string[]; // URLs de imagenes subidas (S3)

  @Prop({ type: [String], default: [] })
  uploadedVideoUrls: string[]; // URLs de videos subidos (S3)

  // ========================================
  // 🚨 MODO DE PUBLICACION
  // ========================================

  @Prop({
    required: true,
    enum: ['urgent', 'normal'],
    index: true,
  })
  mode: 'urgent' | 'normal'; // Modo de publicacion

  @Prop({
    enum: ['breaking', 'noticia', 'blog'],
    index: true,
  })
  publicationType?: 'breaking' | 'noticia' | 'blog'; // Solo para MODO NORMAL

  // ========================================
  // ⏰ GESTION DE URGENT MODE (2 HORAS)
  // ========================================

  @Prop({ default: false })
  isUrgent: boolean; // Flag rapido para queries

  @Prop()
  urgentCreatedAt?: Date; // Cuando se creo en modo urgent

  @Prop()
  urgentAutoCloseAt?: Date; // Cuando debe auto-cerrarse (urgentCreatedAt + 2h)

  @Prop({ default: false })
  urgentAutoClosed: boolean; // Si ya se aplico el auto-cierre

  @Prop()
  urgentClosedAt?: Date; // Cuando se cerro manualmente o automaticamente

  @Prop({ enum: ['auto', 'manual'], trim: true })
  urgentClosureType?: 'auto' | 'manual'; // Tipo de cierre

  @Prop({ type: String })
  urgentClosureMessage?: string; // Mensaje de cierre añadido

  // ========================================
  // 🔗 RELACIONES
  // ========================================

  @Prop({ type: Types.ObjectId, ref: 'AIContentGeneration' })
  generatedContentId?: Types.ObjectId; // Contenido procesado por IA

  @Prop({ type: Types.ObjectId, ref: 'PublishedNoticia' })
  publishedNoticiaId?: Types.ObjectId; // Noticia publicada (si aplica)

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId; // Usuario que creo el contenido

  // ========================================
  // 🌐 OUTLET/SOURCE (OPCIONAL)
  // ========================================

  @Prop({ type: Types.ObjectId, ref: 'NewsWebsiteConfig' })
  outletId?: Types.ObjectId; // Outlet "usernews" o null

  @Prop({ trim: true })
  customOutletName?: string; // Nombre personalizado del outlet

  // ========================================
  // 📊 ESTADO Y WORKFLOW
  // ========================================

  @Prop({
    enum: ['draft', 'pending_ai', 'ai_processing', 'ai_completed', 'published', 'failed', 'closed'],
    default: 'draft',
    index: true,
  })
  status: 'draft' | 'pending_ai' | 'ai_processing' | 'ai_completed' | 'published' | 'failed' | 'closed';

  @Prop({ default: false })
  isPublished: boolean; // Si ya fue publicado

  @Prop()
  publishedAt?: Date; // Cuando se publico

  // ========================================
  // 🤖 CONFIGURACION DE PROCESAMIENTO IA
  // ========================================

  @Prop({ type: Object })
  aiProcessingConfig?: {
    targetWordCount?: number; // 300-500 para urgent, 500-700 para normal
    agentId?: Types.ObjectId; // Content agent a usar
    templateId?: Types.ObjectId; // Template a usar
    generateAggressiveCopys?: boolean; // true para urgent
    includeClosingText?: boolean; // "Contenido en desarrollo..."
  };

  // ========================================
  // 📱 SOCIAL MEDIA (SOLO PARA URGENT)
  // ========================================

  @Prop({ type: Object })
  urgentSocialMediaTracking?: {
    publishedToFacebook?: boolean;
    publishedToTwitter?: boolean;
    facebookPostIds?: string[];
    twitterTweetIds?: string[];
    publishedAt?: Date;
  };

  // ========================================
  // 🔄 ACTUALIZACIONES (PARA URGENT)
  // ========================================

  @Prop({ default: 0 })
  updateCount: number; // Numero de actualizaciones manuales

  @Prop({ type: [Object], default: [] })
  updateHistory: Array<{
    updatedAt: Date;
    updatedBy?: Types.ObjectId;
    previousContent: string;
    newContent: string;
    reason?: string;
  }>;

  // ========================================
  // ❌ ERRORES Y VALIDACIONES
  // ========================================

  @Prop({ type: [String], default: [] })
  errors: string[];

  @Prop({ type: [String], default: [] })
  warnings: string[];

  // ========================================
  // 📋 METADATA
  // ========================================

  @Prop({ type: Object })
  metadata?: {
    source?: string; // Origen: 'dashboard', 'api', 'mobile_app'
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const UserGeneratedContentSchema = SchemaFactory.createForClass(UserGeneratedContent);

// ========================================
// 📇 INDICES
// ========================================

UserGeneratedContentSchema.index({ mode: 1 });
UserGeneratedContentSchema.index({ status: 1 });
UserGeneratedContentSchema.index({ isUrgent: 1 });
UserGeneratedContentSchema.index({ urgentAutoClosed: 1 });
UserGeneratedContentSchema.index({ urgentAutoCloseAt: 1 }); // Para scheduler
UserGeneratedContentSchema.index({ createdBy: 1 });
UserGeneratedContentSchema.index({ createdAt: -1 });
UserGeneratedContentSchema.index({ isPublished: 1 });

// Indice compuesto para urgent content pendiente de cierre
UserGeneratedContentSchema.index({
  isUrgent: 1,
  urgentAutoClosed: 1,
  urgentAutoCloseAt: 1,
});

// Indice para queries de dashboard
UserGeneratedContentSchema.index({
  status: 1,
  mode: 1,
  createdAt: -1,
});
```

### 1.3 MODIFICACIONES A SCHEMAS EXISTENTES

#### 1.3.1 `AIContentGeneration` Schema - SIN CAMBIOS MAYORES

**Razon:** El schema ya soporta contenido sin `originalContentId` (opcional).

**Campos Existentes que Usaremos:**
- `originalTitle`, `originalContent`, `originalSourceUrl` (ya existen como opcionales)
- `status`: 'pending' | 'generating' | 'completed' | 'failed' | 'reviewing' | 'approved' | 'rejected'
- `socialMediaCopies`: ya soporta Facebook/Twitter
- `generationMetadata`: tracking de tokens, costo, etc.

**NUEVO Campo Necesario:**

```typescript
@Prop({ type: Types.ObjectId, ref: 'UserGeneratedContent' })
userGeneratedContentId?: Types.ObjectId; // Referencia a contenido manual
```

#### 1.3.2 `PublishedNoticia` Schema - MODIFICACION MENOR

**Campo Existente:** `contentType: 'breaking_news' | 'normal_news' | 'blog' | 'evergreen'`

**NUEVO Campo Necesario:**

```typescript
@Prop({ default: false })
isUrgentContent: boolean; // Si proviene de UserGeneratedContent modo urgent

@Prop()
urgentMetadata?: {
  originalUserContentId?: Types.ObjectId; // Referencia a UserGeneratedContent
  autoClosedAt?: Date;
  closureType?: 'auto' | 'manual';
  updateCount?: number;
};
```

#### 1.3.3 Outlet "usernews" - ESTRATEGIA

**Opcion 1 (RECOMENDADA):** Hacer `NewsWebsiteConfig.websiteConfigId` OPCIONAL en otros schemas.

**Opcion 2:** Crear un `NewsWebsiteConfig` especial llamado "User News":
```json
{
  "name": "User News",
  "baseUrl": "internal://usernews",
  "listingUrl": "internal://usernews",
  "isActive": true,
  "isInternalOutlet": true
}
```

**Recomendacion:** Usar Opcion 1 (campo opcional) porque es mas limpio y evita crear outlets ficticios.

---

## 2. ANALISIS DE SERVICIOS

### 2.1 NUEVO SERVICIO: `UserContentService`

**Ubicacion:** `/src/generator-pro/services/user-content.service.ts`

**Responsabilidades:**
1. Crear contenido original (urgent y normal)
2. Validar input del usuario
3. Subir imagenes/videos a S3
4. Triggear procesamiento IA
5. Gestionar actualizaciones de urgent content

**Metodos Principales:**

```typescript
@Injectable()
export class UserContentService {
  constructor(
    @InjectModel(UserGeneratedContent.name)
    private userContentModel: Model<UserGeneratedContentDocument>,
    private readonly eventEmitter: EventEmitter2,
    private readonly fileUploadService: FileUploadService,
    private readonly aiGenerationService: AIGenerationService,
  ) {}

  /**
   * Crear contenido URGENT
   */
  async createUrgentContent(dto: CreateUrgentContentDto): Promise<UserGeneratedContentDocument>;

  /**
   * Crear contenido NORMAL
   */
  async createNormalContent(dto: CreateNormalContentDto): Promise<UserGeneratedContentDocument>;

  /**
   * Actualizar contenido urgent (reemplazar con nueva informacion)
   */
  async updateUrgentContent(
    contentId: string,
    dto: UpdateUrgentContentDto,
  ): Promise<UserGeneratedContentDocument>;

  /**
   * Cerrar manualmente contenido urgent
   */
  async closeUrgentContent(
    contentId: string,
    closureMessage?: string,
  ): Promise<UserGeneratedContentDocument>;

  /**
   * Obtener contenido por ID
   */
  async getContentById(contentId: string): Promise<UserGeneratedContentDocument>;

  /**
   * Listar contenido urgent "en progreso"
   */
  async getUrgentContentInProgress(): Promise<UserGeneratedContentDocument[]>;
}
```

### 2.2 NUEVO SERVICIO: `UrgentContentSchedulerService`

**Ubicacion:** `/src/generator-pro/services/urgent-content-scheduler.service.ts`

**Responsabilidades:**
1. Scheduler para auto-cerrar contenido urgent despues de 2 horas
2. Aplicar mensaje de cierre automatico
3. Actualizar status a 'closed'

**Implementacion usando `@nestjs/schedule`:**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UrgentContentSchedulerService {
  private readonly logger = new Logger(UrgentContentSchedulerService.name);

  constructor(
    @InjectModel(UserGeneratedContent.name)
    private userContentModel: Model<UserGeneratedContentDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Ejecutar cada 5 minutos para buscar contenido urgent pendiente de cierre
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processUrgentAutoClose(): Promise<void> {
    this.logger.log('🕐 Ejecutando auto-cierre de contenido urgent...');

    const now = new Date();

    // Buscar contenido urgent que debe cerrarse
    const urgentContents = await this.userContentModel.find({
      isUrgent: true,
      urgentAutoClosed: false,
      urgentAutoCloseAt: { $lte: now },
      status: { $nin: ['closed', 'failed'] },
    });

    this.logger.log(`📋 Encontrados ${urgentContents.length} contenidos para auto-cierre`);

    for (const content of urgentContents) {
      await this.applyAutoClose(content);
    }
  }

  /**
   * Aplicar auto-cierre a un contenido urgent
   */
  private async applyAutoClose(
    content: UserGeneratedContentDocument,
  ): Promise<void> {
    try {
      const closureMessage =
        '\n\n---\n\n**Actualización**: Al cierre de este bloque informativo no se recibieron actualizaciones por parte de los involucrados.';

      // Actualizar contenido generado (AIContentGeneration)
      if (content.generatedContentId) {
        // Aqui se actualizaria el contenido generado
        // await this.aiContentModel.findByIdAndUpdate(...)
      }

      // Actualizar UserGeneratedContent
      content.urgentAutoClosed = true;
      content.urgentClosedAt = new Date();
      content.urgentClosureType = 'auto';
      content.urgentClosureMessage = closureMessage;
      content.status = 'closed';

      await content.save();

      // Emitir evento
      this.eventEmitter.emit('user-content.urgent.auto-closed', {
        contentId: content._id,
        closedAt: content.urgentClosedAt,
      });

      this.logger.log(`✅ Auto-cerrado: ${content._id}`);
    } catch (error) {
      this.logger.error(`❌ Error auto-cerrando ${content._id}: ${error.message}`);
    }
  }
}
```

### 2.3 SERVICIO EXISTENTE: `GeneratorProPromptBuilderService` - MODIFICACION

**Modificacion Necesaria:** Añadir metodo para generar prompts especificos para contenido manual.

```typescript
/**
 * Construir prompt para contenido URGENT (mas corto, mas agresivo)
 */
async buildUrgentContentPrompt(
  userContent: UserGeneratedContentDocument,
): Promise<string> {
  // Prompt optimizado para:
  // - Redaccion 300-500 palabras
  // - Tono urgente
  // - Copys sociales agresivos
  // - Incluir "Contenido en desarrollo..."
}

/**
 * Construir prompt para contenido NORMAL manual
 */
async buildNormalUserContentPrompt(
  userContent: UserGeneratedContentDocument,
  publicationType: 'breaking' | 'noticia' | 'blog',
): Promise<string> {
  // Prompt optimizado segun tipo de publicacion
}
```

### 2.4 SERVICIO EXISTENTE: `SocialMediaPublishingService` - SIN CAMBIOS

**Razon:** El servicio ya maneja publicacion a Facebook/Twitter, solo necesitamos llamarlo correctamente.

### 2.5 NUEVO SERVICIO: `FileUploadService`

**Ubicacion:** `/src/files/services/file-upload.service.ts` (si no existe, crear)

**Responsabilidades:**
1. Subir imagenes a S3
2. Subir videos a S3
3. Validar tipos de archivo
4. Generar URLs publicas

**Metodos:**

```typescript
@Injectable()
export class FileUploadService {
  async uploadImage(file: Express.Multer.File): Promise<string>; // Retorna URL S3
  async uploadVideo(file: Express.Multer.File): Promise<string>; // Retorna URL S3
  async validateImageFile(file: Express.Multer.File): boolean;
  async validateVideoFile(file: Express.Multer.File): boolean;
}
```

---

## 3. ANALISIS DE ENDPOINTS Y DTOS

### 3.1 NUEVO CONTROLLER: `UserContentController`

**Ubicacion:** `/src/generator-pro/controllers/user-content.controller.ts`

**Endpoints Propuestos:**

#### 3.1.1 POST `/generator-pro/user-content/urgent`

**Descripcion:** Crear contenido URGENT (breaking news / ultima hora)

**DTO:**

```typescript
import { IsString, IsNotEmpty, IsOptional, IsArray, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUrgentContentDto {
  @ApiProperty({ description: 'Titulo del contenido urgent' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Contenido original proporcionado por el usuario' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'URLs de imagenes (opcionales)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ description: 'URLs de videos (opcionales)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  videoUrls?: string[];

  @ApiPropertyOptional({ description: 'IDs de sitios donde publicar' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  siteIds?: string[];
}
```

**Flujo:**
1. Validar DTO
2. Crear `UserGeneratedContent` con `mode: 'urgent'`
3. Subir archivos a S3 (si se proporcionaron)
4. Calcular `urgentAutoCloseAt` (now + 2 horas)
5. Triggear procesamiento IA con prompt "urgent"
6. Auto-publicar INMEDIATAMENTE
7. Retornar respuesta

**Response:**

```typescript
export class UserContentResponseDto {
  id: string;
  mode: 'urgent' | 'normal';
  status: string;
  originalTitle: string;
  generatedContentId?: string;
  publishedNoticiaId?: string;
  urgentAutoCloseAt?: Date;
  createdAt: Date;
}
```

#### 3.1.2 POST `/generator-pro/user-content/normal`

**Descripcion:** Crear contenido NORMAL (publicacion manual)

**DTO:**

```typescript
export class CreateNormalContentDto {
  @ApiProperty({ description: 'Titulo del contenido' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Contenido original' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Tipo de publicacion',
    enum: ['breaking', 'noticia', 'blog'],
  })
  @IsEnum(['breaking', 'noticia', 'blog'])
  publicationType: 'breaking' | 'noticia' | 'blog';

  @ApiPropertyOptional({ description: 'URLs de imagenes' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ description: 'URLs de videos' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  videoUrls?: string[];

  @ApiPropertyOptional({ description: 'IDs de sitios donde publicar' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  siteIds?: string[];

  @ApiPropertyOptional({ description: 'Auto-publicar inmediatamente' })
  @IsOptional()
  @IsBoolean()
  autoPublish?: boolean; // default: false
}
```

**Flujo:**
1. Validar DTO
2. Crear `UserGeneratedContent` con `mode: 'normal'`
3. Subir archivos a S3
4. Triggear procesamiento IA con prompt "normal"
5. Si `autoPublish: true` → publicar inmediatamente
6. Si `autoPublish: false` → quedar en estado `ai_completed` para revision manual

#### 3.1.3 PATCH `/generator-pro/user-content/urgent/:id`

**Descripcion:** Actualizar contenido URGENT con nueva informacion

**DTO:**

```typescript
export class UpdateUrgentContentDto {
  @ApiProperty({ description: 'Nuevo contenido' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Razon de la actualizacion' })
  @IsOptional()
  @IsString()
  reason?: string;
}
```

**Flujo:**
1. Validar que el contenido exista y sea urgent
2. Guardar version anterior en `updateHistory`
3. Actualizar contenido
4. Re-procesar con IA
5. Re-publicar actualizacion

#### 3.1.4 POST `/generator-pro/user-content/urgent/:id/close`

**Descripcion:** Cerrar manualmente contenido URGENT

**DTO:**

```typescript
export class CloseUrgentContentDto {
  @ApiPropertyOptional({ description: 'Mensaje de cierre personalizado' })
  @IsOptional()
  @IsString()
  closureMessage?: string;
}
```

#### 3.1.5 GET `/generator-pro/user-content/urgent/in-progress`

**Descripcion:** Listar contenido urgent "en progreso" (para el tab del frontend)

**Response:** Array de `UserContentResponseDto`

#### 3.1.6 GET `/generator-pro/user-content/:id`

**Descripcion:** Obtener contenido por ID

**Response:** `UserContentResponseDto` completo

### 3.2 ENDPOINT DE UPLOAD DE ARCHIVOS

**Ubicacion:** Puede ir en `UserContentController` o en un `FilesController` separado

#### 3.2.1 POST `/generator-pro/user-content/upload/image`

**Implementacion:**

```typescript
@Post('upload/image')
@UseInterceptors(FileInterceptor('file'))
async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
  const url = await this.fileUploadService.uploadImage(file);
  return { url };
}
```

#### 3.2.2 POST `/generator-pro/user-content/upload/video`

Similar al anterior pero para videos.

---

## 4. DIAGRAMAS DE FLUJO

### 4.1 FLUJO MODO URGENT (Breaking News)

```
┌─────────────────────────────────────────────────────────────────┐
│                     MODO URGENT - FLUJO COMPLETO                │
└─────────────────────────────────────────────────────────────────┘

[Usuario Dashboard]
       |
       | POST /user-content/urgent
       | { title, content, imageUrls?, siteIds? }
       |
       v
[UserContentController]
       |
       | createUrgentContent(dto)
       |
       v
[UserContentService]
       |
       |-- 1. Validar input
       |-- 2. Subir imagenes a S3 (si hay)
       |-- 3. Crear UserGeneratedContent
       |       - mode: 'urgent'
       |       - isUrgent: true
       |       - urgentCreatedAt: NOW
       |       - urgentAutoCloseAt: NOW + 2 HORAS
       |       - status: 'pending_ai'
       |
       v
[EventEmitter.emit('user-content.created')]
       |
       |--------- FORK 1: PROCESAMIENTO IA -------->
       |                                            |
       |                                            v
       |                                [AIGenerationService]
       |                                            |
       |                                            |-- buildUrgentContentPrompt()
       |                                            |   - Prompt para 300-500 palabras
       |                                            |   - Copys sociales AGRESIVOS
       |                                            |   - Incluir "Contenido en desarrollo"
       |                                            |
       |                                            |-- generateContent()
       |                                            |   - Llamar a OpenAI/Claude
       |                                            |   - Generar titulo optimizado
       |                                            |   - Generar contenido corto
       |                                            |   - Generar copys Facebook/Twitter
       |                                            |
       |                                            |-- Crear AIContentGeneration
       |                                            |   - status: 'completed'
       |                                            |   - socialMediaCopies con emojis
       |                                            |
       |                                            v
       |                                [EventEmitter.emit('ai-content.generated')]
       |                                            |
       |--------- FORK 2: AUTO-PUBLICACION -------> |
                                                    v
                                        [PublishService]
                                                    |
                                                    |-- publishNoticia()
                                                    |   - contentType: 'breaking_news'
                                                    |   - isUrgentContent: true
                                                    |   - status: 'published'
                                                    |
                                                    |-- Crear PublishedNoticia
                                                    |
                                                    v
                                        [EventEmitter.emit('noticia.published')]
                                                    |
                                                    |
       |--------- FORK 3: PUBLICACION SOCIAL -----> |
                                                    v
                                        [SocialMediaPublishingService]
                                                    |
                                                    |-- publishToFacebook()
                                                    |   - Usar copys agresivos
                                                    |   - Marcar como ULTIMO MOMENTO
                                                    |
                                                    |-- publishToTwitter()
                                                    |
                                                    v
                                                [PUBLICADO]

┌─────────────────────────────────────────────────────────────────┐
│                   AUTO-CIERRE DESPUES DE 2 HORAS                │
└─────────────────────────────────────────────────────────────────┘

[UrgentContentSchedulerService]
       |
       | @Cron(EVERY_5_MINUTES)
       |
       v
[Buscar UserGeneratedContent donde:]
  - isUrgent: true
  - urgentAutoClosed: false
  - urgentAutoCloseAt <= NOW
       |
       v
[Para cada contenido encontrado:]
       |
       |-- Si NO hay actualizacion manual:
       |   |
       |   |-- Añadir mensaje de cierre:
       |   |   "Al cierre de este bloque informativo no se recibieron
       |   |    actualizaciones por parte de los involucrados"
       |   |
       |   |-- Actualizar AIContentGeneration
       |   |   - Append mensaje al generatedContent
       |   |
       |   |-- Actualizar PublishedNoticia
       |   |   - Append mensaje al content
       |   |
       |   |-- Marcar como cerrado:
       |       - urgentAutoClosed: true
       |       - urgentClosedAt: NOW
       |       - urgentClosureType: 'auto'
       |       - status: 'closed'
       |
       v
  [EventEmitter.emit('user-content.urgent.auto-closed')]
```

### 4.2 FLUJO MODO NORMAL (Publicacion Manual)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODO NORMAL - FLUJO COMPLETO                 │
└─────────────────────────────────────────────────────────────────┘

[Usuario Dashboard]
       |
       | POST /user-content/normal
       | { title, content, publicationType, autoPublish?, siteIds? }
       |
       v
[UserContentController]
       |
       | createNormalContent(dto)
       |
       v
[UserContentService]
       |
       |-- 1. Validar input
       |-- 2. Subir imagenes/videos a S3
       |-- 3. Crear UserGeneratedContent
       |       - mode: 'normal'
       |       - publicationType: 'breaking' | 'noticia' | 'blog'
       |       - status: 'pending_ai'
       |
       v
[EventEmitter.emit('user-content.created')]
       |
       v
[AIGenerationService]
       |
       |-- buildNormalUserContentPrompt(publicationType)
       |   - Prompt segun tipo:
       |     * breaking: Tono urgente, 500 palabras
       |     * noticia: Tono formal, 600 palabras
       |     * blog: Tono conversacional, 700 palabras
       |
       |-- generateContent()
       |   - Generar contenido optimizado
       |   - Generar copys sociales normales
       |
       |-- Crear AIContentGeneration
       |   - status: 'completed'
       |
       v
[Actualizar UserGeneratedContent]
  - status: 'ai_completed'
  - generatedContentId: <id>
       |
       |
       |--- SI autoPublish = true:
       |        |
       |        v
       |   [PublishService.publishNoticia()]
       |        |
       |        v
       |   [PublishedNoticia creada]
       |        |
       |        v
       |   [SocialMediaPublishingService]
       |        |
       |        v
       |   [PUBLICADO]
       |
       |
       |--- SI autoPublish = false:
                |
                v
           [Quedar en estado 'ai_completed']
                |
                v
           [Usuario revisa en dashboard]
                |
                |--- SI aprueba:
                |        |
                |        | POST /pachuca-noticias/publish
                |        |
                |        v
                |   [PublishService.publishNoticia()]
                |        |
                |        v
                |   [PUBLICADO]
                |
                |--- SI rechaza:
                         |
                         | PATCH /user-content/:id
                         | { content: 'nuevo contenido' }
                         |
                         v
                    [Re-procesar con IA]
```

### 4.3 FLUJO DE ACTUALIZACION URGENT

```
┌─────────────────────────────────────────────────────────────────┐
│              ACTUALIZACION DE CONTENIDO URGENT                  │
└─────────────────────────────────────────────────────────────────┘

[Usuario Dashboard]
  (Contenido urgent ya publicado hace 30 minutos)
       |
       | PATCH /user-content/urgent/:id
       | { content: 'NUEVO contenido actualizado', reason: '...' }
       |
       v
[UserContentController]
       |
       v
[UserContentService.updateUrgentContent()]
       |
       |-- 1. Validar que contenido exista y sea urgent
       |-- 2. Validar que NO este auto-cerrado
       |-- 3. Guardar version anterior en updateHistory[]
       |-- 4. Actualizar originalContent con nuevo texto
       |-- 5. Incrementar updateCount
       |
       v
[EventEmitter.emit('user-content.urgent.updated')]
       |
       v
[AIGenerationService]
       |
       |-- Re-generar contenido con nuevo texto
       |-- Actualizar AIContentGeneration existente
       |
       v
[PublishService]
       |
       |-- Actualizar PublishedNoticia existente
       |   - Reemplazar content con nuevo texto generado
       |   - lastModifiedAt: NOW
       |
       v
[SocialMediaPublishingService] (OPCIONAL)
       |
       |-- Publicar UPDATE en redes sociales
       |   (o no publicar, depende de la estrategia)
       |
       v
  [CONTENIDO ACTUALIZADO]
```

---

## 5. PLAN DE IMPLEMENTACION BACKEND

### FASE 1: SCHEMAS Y MODELOS (2-3 horas)

**Tarea 1.1:** Crear `UserGeneratedContent` Schema
- Ubicacion: `/src/generator-pro/schemas/user-generated-content.schema.ts`
- Incluir todos los campos definidos en seccion 1.2
- Crear indices

**Tarea 1.2:** Modificar `AIContentGeneration` Schema
- Añadir campo `userGeneratedContentId?: Types.ObjectId`

**Tarea 1.3:** Modificar `PublishedNoticia` Schema
- Añadir campo `isUrgentContent: boolean`
- Añadir campo `urgentMetadata?: {...}`

**Tarea 1.4:** Registrar schemas en modulos
- Actualizar `GeneratorProModule`
- Actualizar `PachucaNoticiasModule`

---

### FASE 2: SERVICIOS CORE (4-5 horas)

**Tarea 2.1:** Crear `FileUploadService`
- Ubicacion: `/src/files/services/file-upload.service.ts`
- Metodos: `uploadImage()`, `uploadVideo()`, `validateImageFile()`, `validateVideoFile()`
- Configurar S3 client
- Validar tipos MIME
- Generar URLs publicas

**Tarea 2.2:** Crear `UserContentService`
- Ubicacion: `/src/generator-pro/services/user-content.service.ts`
- Implementar metodos:
  - `createUrgentContent(dto)`
  - `createNormalContent(dto)`
  - `updateUrgentContent(id, dto)`
  - `closeUrgentContent(id, message?)`
  - `getContentById(id)`
  - `getUrgentContentInProgress()`

**Tarea 2.3:** Crear `UrgentContentSchedulerService`
- Ubicacion: `/src/generator-pro/services/urgent-content-scheduler.service.ts`
- Implementar cron job `@Cron(EVERY_5_MINUTES)`
- Implementar `processUrgentAutoClose()`
- Implementar `applyAutoClose(content)`

**Tarea 2.4:** Modificar `GeneratorProPromptBuilderService`
- Añadir metodo `buildUrgentContentPrompt(userContent)`
- Añadir metodo `buildNormalUserContentPrompt(userContent, publicationType)`
- Templates especificos para contenido manual

---

### FASE 3: INTEGRACION CON IA (3-4 horas)

**Tarea 3.1:** Modificar `AIGenerationService` (o crear metodo especifico)
- Metodo: `generateFromUserContent(userContent)`
- Input: `UserGeneratedContent`
- Output: `AIContentGeneration`
- Llamar a `GeneratorProPromptBuilderService` segun modo
- Configurar `targetWordCount` segun modo:
  - Urgent: 300-500 palabras
  - Normal: 500-700 palabras

**Tarea 3.2:** Implementar generacion de copys agresivos para urgent
- Modificar `SocialMediaCopyGeneratorService` si es necesario
- Añadir validacion de copys "agresivos" vs "normales"

**Tarea 3.3:** Implementar texto de cierre automatico
- En `buildUrgentContentPrompt()` incluir:
  ```
  "Al final del contenido generado, añade EXACTAMENTE este texto:
  '---
  Contenido en desarrollo - Informacion en actualizacion'"
  ```

---

### FASE 4: ENDPOINTS Y CONTROLADORES (3-4 horas)

**Tarea 4.1:** Crear DTOs
- `CreateUrgentContentDto`
- `CreateNormalContentDto`
- `UpdateUrgentContentDto`
- `CloseUrgentContentDto`
- `UserContentResponseDto`
- Ubicacion: `/src/generator-pro/dto/user-content.dto.ts`

**Tarea 4.2:** Crear `UserContentController`
- Ubicacion: `/src/generator-pro/controllers/user-content.controller.ts`
- Implementar endpoints:
  - `POST /user-content/urgent`
  - `POST /user-content/normal`
  - `PATCH /user-content/urgent/:id`
  - `POST /user-content/urgent/:id/close`
  - `GET /user-content/urgent/in-progress`
  - `GET /user-content/:id`

**Tarea 4.3:** Implementar endpoints de upload
- `POST /user-content/upload/image`
- `POST /user-content/upload/video`
- Usar `@UseInterceptors(FileInterceptor('file'))`

**Tarea 4.4:** Añadir validacion y guards
- `@UseGuards(JwtAuthGuard)`
- Validacion de DTOs
- Manejo de errores

---

### FASE 5: AUTO-PUBLICACION (2-3 horas)

**Tarea 5.1:** Integrar con `PublishService`
- En `UserContentService.createUrgentContent()`:
  - Despues de generar IA → llamar `publishService.publishNoticia()`
  - Pasar `contentType: 'breaking_news'`
  - Pasar `isUrgentContent: true`

**Tarea 5.2:** Integrar con `SocialMediaPublishingService`
- Despues de publicar noticia → publicar en redes sociales
- Usar copys generados por IA
- Marcar en `urgentSocialMediaTracking`

**Tarea 5.3:** Implementar auto-publicacion en modo normal
- Si `autoPublish: true` → publicar inmediatamente
- Si `autoPublish: false` → dejar en estado `ai_completed`

---

### FASE 6: SISTEMA DE AUTO-CIERRE (2-3 horas)

**Tarea 6.1:** Configurar `@nestjs/schedule` module
- Verificar que este importado en `AppModule`

**Tarea 6.2:** Implementar logica de auto-cierre
- En `UrgentContentSchedulerService.processUrgentAutoClose()`:
  - Buscar contenido urgent pendiente de cierre
  - Para cada uno, aplicar mensaje de cierre
  - Actualizar `AIContentGeneration`
  - Actualizar `PublishedNoticia`
  - Marcar como cerrado

**Tarea 6.3:** Implementar actualizacion de contenido publicado
- Metodo para append mensaje de cierre a `PublishedNoticia.content`
- Actualizar `lastModifiedAt`

**Tarea 6.4:** Testing de scheduler
- Crear contenido urgent de prueba con `urgentAutoCloseAt: NOW + 1 min`
- Verificar que se cierre automaticamente

---

### FASE 7: EVENTOS Y NOTIFICACIONES (1-2 horas)

**Tarea 7.1:** Emitir eventos en puntos clave
- `user-content.created`
- `user-content.urgent.created`
- `user-content.ai.completed`
- `user-content.published`
- `user-content.urgent.updated`
- `user-content.urgent.auto-closed`
- `user-content.urgent.manually-closed`

**Tarea 7.2:** Implementar listeners (opcional)
- Para logging
- Para notificaciones WebSocket al frontend
- Para analytics

---

### FASE 8: TESTING Y VALIDACION (2-3 horas)

**Tarea 8.1:** Testing de endpoints
- Test de creacion urgent
- Test de creacion normal
- Test de actualizacion urgent
- Test de cierre manual

**Tarea 8.2:** Testing de auto-cierre
- Crear contenido urgent
- Esperar 2 horas (o modificar tiempo para testing)
- Verificar que se cierre automaticamente

**Tarea 8.3:** Testing de flujo completo
- Crear urgent → IA → publicar → redes sociales → auto-cierre
- Crear normal → IA → revisar → publicar

**Tarea 8.4:** Validacion de errores
- Contenido invalido
- Imagenes muy grandes
- Videos no soportados
- Permisos de usuario

---

### FASE 9: DOCUMENTACION (1 hora)

**Tarea 9.1:** Documentar endpoints en Swagger
- Añadir decoradores `@ApiOperation`, `@ApiResponse`
- Ejemplos de DTOs

**Tarea 9.2:** Documentar schemas
- Comentarios en campos importantes

**Tarea 9.3:** Crear README de features
- Explicar modo urgent vs normal
- Explicar auto-cierre
- Ejemplos de uso

---

## 6. CONSIDERACIONES DE ARQUITECTURA

### 6.1 EVITAR DEPENDENCIAS CIRCULARES

**Problema Potencial:**
```
UserContentService -> AIGenerationService -> PublishService
PublishService -> UserContentService (para actualizar estado)
```

**Solucion: EventEmitter2**

```typescript
// En UserContentService
async createUrgentContent(dto) {
  const userContent = await this.userContentModel.create({...});

  // NO llamar directamente a AIGenerationService
  // Emitir evento
  this.eventEmitter.emit('user-content.created', {
    userContentId: userContent._id,
    mode: 'urgent',
  });

  return userContent;
}

// En AIGenerationService (listener)
@OnEvent('user-content.created')
async handleUserContentCreated(payload) {
  const userContent = await this.userContentModel.findById(payload.userContentId);
  await this.generateFromUserContent(userContent);
}

// En PublishService (listener)
@OnEvent('ai-content.completed')
async handleAIContentCompleted(payload) {
  if (payload.isUrgent) {
    await this.autoPublishUrgentContent(payload.contentId);
  }
}
```

**Ventajas:**
- NO dependencias circulares
- Arquitectura desacoplada
- Facil de testear
- Facil de extender

### 6.2 GESTION DE AUTO-CIERRE

**Opcion 1 (RECOMENDADA): @nestjs/schedule + Cron Job**

```typescript
@Cron(CronExpression.EVERY_5_MINUTES)
async processUrgentAutoClose() {
  // Buscar contenido pendiente de cierre
}
```

**Ventajas:**
- Simple
- Confiable
- No requiere infraestructura adicional
- Se ejecuta en el mismo proceso de NestJS

**Opcion 2 (ALTERNATIVA): Bull Queue con delay**

```typescript
// Al crear urgent content
await this.urgentCloseQueue.add(
  'auto-close',
  { userContentId },
  { delay: 2 * 60 * 60 * 1000 } // 2 horas
);
```

**Desventajas:**
- Mas complejo
- Requiere Redis
- Puede perder jobs si Redis se reinicia

**Recomendacion:** Usar Opcion 1 (Cron Job) por simplicidad.

### 6.3 OUTLET "usernews" - ESTRATEGIA

**Opcion 1 (RECOMENDADA): Campo Opcional**

Hacer `NewsWebsiteConfig.websiteConfigId` opcional en todos los schemas.

```typescript
// En UserGeneratedContent
@Prop({ type: Types.ObjectId, ref: 'NewsWebsiteConfig' })
outletId?: Types.ObjectId; // OPCIONAL - null para user content

// En AIContentGeneration
// Ya es opcional, no cambios necesarios

// En PublishedNoticia
// originalNoticiaId ya es opcional
```

**Ventajas:**
- Mas limpio
- No crea outlets ficticios
- Facil de identificar contenido manual

**Opcion 2 (ALTERNATIVA): Crear Outlet Especial**

Seed de outlet "User News":

```typescript
{
  name: 'User News',
  baseUrl: 'internal://usernews',
  listingUrl: 'internal://usernews',
  isActive: true,
  isInternalOutlet: true,
  // ...
}
```

**Desventajas:**
- Mas complejo
- Outlet ficticio que nunca se scrapeara
- Puede confundir

**Recomendacion:** Usar Opcion 1 (campo opcional).

### 6.4 PROCESAMIENTO DE IMAGENES/VIDEOS

**Flujo:**

1. Usuario sube archivo via `/upload/image` o `/upload/video`
2. `FileUploadService` valida archivo
3. Subir a S3 con path: `user-content/{year}/{month}/{contentId}/original.jpg`
4. Generar thumbnails (para imagenes)
5. Retornar URL publica
6. Usuario incluye URL en el DTO de creacion

**Alternativa:** Subir archivos junto con el contenido (multipart form-data)

```typescript
@Post('urgent')
@UseInterceptors(FilesInterceptor('images', 5))
async createUrgent(
  @Body() dto: CreateUrgentContentDto,
  @UploadedFiles() images: Express.Multer.File[]
) {
  // Procesar archivos aqui
}
```

**Recomendacion:** Usar endpoints separados de upload por simplicidad.

### 6.5 SEGURIDAD Y VALIDACION

**Validaciones Necesarias:**

1. **Tamaño de archivos:**
   - Imagenes: max 10MB
   - Videos: max 100MB

2. **Tipos MIME permitidos:**
   - Imagenes: `image/jpeg`, `image/png`, `image/webp`
   - Videos: `video/mp4`, `video/webm`

3. **Longitud de contenido:**
   - Titulo: 10-200 caracteres
   - Contenido: min 100 caracteres

4. **Rate limiting:**
   - Max 10 contenidos urgent por hora
   - Max 50 contenidos normal por dia

5. **Autenticacion:**
   - Solo usuarios autenticados con rol `admin` o `editor`

**Implementacion:**

```typescript
// En DTOs
@MinLength(10)
@MaxLength(200)
title: string;

@MinLength(100)
content: string;

// En controller
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@Throttle(10, 60 * 60) // 10 requests por hora
async createUrgentContent(...)
```

### 6.6 PERFORMANCE Y ESCALABILIDAD

**Consideraciones:**

1. **Indices en MongoDB:**
   - Index en `isUrgent`, `urgentAutoClosed`, `urgentAutoCloseAt` para queries del scheduler
   - Index en `status`, `mode`, `createdAt` para dashboard

2. **Caching:**
   - Cachear lista de contenido urgent "in progress"
   - Invalidar cache al crear/actualizar/cerrar

3. **Paginacion:**
   - Endpoints de listado deben soportar paginacion

4. **Concurrencia:**
   - Usar transacciones de MongoDB si se actualiza multiples colecciones
   - Optimistic locking para actualizaciones concurrentes

**Ejemplo de Cache:**

```typescript
async getUrgentContentInProgress(): Promise<UserGeneratedContentDocument[]> {
  const cacheKey = 'urgent-content:in-progress';

  let cached = await this.cacheManager.get<UserGeneratedContentDocument[]>(cacheKey);
  if (cached) return cached;

  const contents = await this.userContentModel.find({
    isUrgent: true,
    urgentAutoClosed: false,
    status: { $in: ['ai_completed', 'published'] },
  }).sort({ createdAt: -1 });

  await this.cacheManager.set(cacheKey, contents, 60); // 1 min TTL
  return contents;
}
```

### 6.7 TESTING STRATEGY

**Unit Tests:**
- `UserContentService` metodos
- `UrgentContentSchedulerService.applyAutoClose()`
- `GeneratorProPromptBuilderService` prompts

**Integration Tests:**
- Flujo completo urgent: crear → IA → publicar → auto-cerrar
- Flujo completo normal: crear → IA → revisar → publicar
- Actualizacion de urgent content

**E2E Tests:**
- POST /user-content/urgent → GET /user-content/:id → verificar auto-publicacion
- POST /user-content/normal con autoPublish:false → verificar estado ai_completed

### 6.8 MONITORING Y LOGGING

**Eventos a Monitorear:**

1. Contenido urgent creado
2. Contenido urgent auto-cerrado
3. Contenido urgent actualizado manualmente
4. Fallo en procesamiento IA
5. Fallo en auto-publicacion

**Logs Importantes:**

```typescript
this.logger.log(`🚨 Contenido URGENT creado: ${userContent._id}`);
this.logger.log(`⏰ Auto-cierre programado para: ${userContent.urgentAutoCloseAt}`);
this.logger.log(`✅ Contenido urgent auto-cerrado: ${userContent._id}`);
this.logger.error(`❌ Error procesando contenido ${userContent._id}: ${error.message}`);
```

**Metricas:**

- Total contenidos urgent creados hoy
- Total contenidos auto-cerrados hoy
- Tiempo promedio de procesamiento IA
- Tasa de exito de auto-publicacion

---

## RESUMEN EJECUTIVO

### SCHEMAS NUEVOS
1. `UserGeneratedContent` - Schema principal para contenido manual

### SCHEMAS MODIFICADOS
1. `AIContentGeneration` - Añadir `userGeneratedContentId`
2. `PublishedNoticia` - Añadir `isUrgentContent` y `urgentMetadata`

### SERVICIOS NUEVOS
1. `UserContentService` - CRUD de contenido manual
2. `UrgentContentSchedulerService` - Auto-cierre de urgent content
3. `FileUploadService` - Upload de imagenes/videos a S3

### SERVICIOS MODIFICADOS
1. `GeneratorProPromptBuilderService` - Añadir prompts para contenido manual

### ENDPOINTS NUEVOS
1. `POST /generator-pro/user-content/urgent` - Crear urgent
2. `POST /generator-pro/user-content/normal` - Crear normal
3. `PATCH /generator-pro/user-content/urgent/:id` - Actualizar urgent
4. `POST /generator-pro/user-content/urgent/:id/close` - Cerrar urgent
5. `GET /generator-pro/user-content/urgent/in-progress` - Listar urgent activos
6. `GET /generator-pro/user-content/:id` - Obtener por ID
7. `POST /generator-pro/user-content/upload/image` - Upload imagen
8. `POST /generator-pro/user-content/upload/video` - Upload video

### ESTIMACION TOTAL DE TIEMPO
- **FASE 1:** Schemas - 2-3 horas
- **FASE 2:** Servicios Core - 4-5 horas
- **FASE 3:** Integracion IA - 3-4 horas
- **FASE 4:** Endpoints - 3-4 horas
- **FASE 5:** Auto-publicacion - 2-3 horas
- **FASE 6:** Auto-cierre - 2-3 horas
- **FASE 7:** Eventos - 1-2 horas
- **FASE 8:** Testing - 2-3 horas
- **FASE 9:** Documentacion - 1 hora

**TOTAL:** 20-30 horas (2.5-4 dias de trabajo)

### DEPENDENCIAS TECNICAS
- `@nestjs/schedule` - Para cron jobs
- Configuracion S3 existente para upload de archivos
- `EventEmitter2` (ya disponible) para evitar dependencias circulares

### RIESGOS Y MITIGACIONES

**Riesgo 1:** Auto-cierre no se ejecuta a tiempo
- **Mitigacion:** Cron job cada 5 minutos, logs detallados, alertas

**Riesgo 2:** Dependencias circulares
- **Mitigacion:** Usar EventEmitter2 en toda comunicacion entre servicios

**Riesgo 3:** Procesamiento IA falla
- **Mitigacion:** Retry logic, manejo de errores, fallback a contenido original

**Riesgo 4:** Upload de archivos grandes satura servidor
- **Mitigacion:** Validacion de tamaño, rate limiting, streaming a S3

---

**FIN DEL ANALISIS**
