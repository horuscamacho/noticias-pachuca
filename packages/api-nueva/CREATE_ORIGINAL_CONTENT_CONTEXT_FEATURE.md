# CREACIÓN DE CONTENIDO ORIGINAL MANUAL - CONTEXTO Y PLAN DE IMPLEMENTACIÓN

**Fecha:** 21 de Octubre, 2025
**Proyecto:** Noticias Pachuca
**Feature:** Manual Content Creation (Urgent + Normal Mode)
**Documentos de Referencia:**
- Backend Analysis: `CREATE_ORIGINAL_CONTENT_BACKEND_ANALYSIS.md`
- Frontend Analysis: `CREATE_ORIGINAL_CONTENT_FRONTEND_ANALYSIS.md`
- Flujo Actual: `SCRAPING_FLOW_DIAGRAMS.md`

---

## TABLA DE CONTENIDOS

1. [Contexto de la Funcionalidad](#1-contexto-de-la-funcionalidad)
2. [Análisis Consolidado](#2-análisis-consolidado)
3. [Plan de Implementación por Fases](#3-plan-de-implementación-por-fases)
4. [Diagramas de Flujo](#4-diagramas-de-flujo)
5. [Cronograma Estimado](#5-cronograma-estimado)
6. [Criterios de Aceptación](#6-criterios-de-aceptación)

---

## 1. CONTEXTO DE LA FUNCIONALIDAD

### 1.1 Problemática Actual

Actualmente el sistema solo permite generar contenido a partir de noticias extraídas (scraping). No existe forma de:
- Crear contenido original manualmente
- Publicar noticias de última hora rápidamente
- Gestionar noticias en desarrollo que requieren actualizaciones

### 1.2 Solución Propuesta

Implementar un sistema de creación de contenido original manual con **DOS MODOS** de operación:

#### MODO 1: URGENT (Breaking News / Última Hora)

**Características:**
- Usuario proporciona: título, contenido, imágenes/videos (opcional)
- IA procesa con **redacción CORTA** (300-500 palabras max)
- Se marca con bandera `urgent: true`
- **Auto-publicación INMEDIATA** sin intervención manual
- **Copys de redes sociales MÁS AGRESIVOS** para maximizar engagement
- Texto final incluye: "**Contenido en desarrollo** - Información en actualización"

**Flujo de 2 Horas:**
- Al crear: Se publica inmediatamente y aparece en cintillo "ÚLTIMO MOMENTO"
- Durante 2 horas: Aparece en tab "Noticias en Progreso"
- **Opción A - SIN actualización después de 2h:**
  - Sistema auto-cierra la noticia
  - IA agrega párrafo final: "Al cierre de este bloque informativo no se recibieron actualizaciones por parte de los involucrados"
  - Se remueve del cintillo pero permanece publicada
- **Opción B - CON actualización antes de 2h:**
  - Usuario reemplaza contenido con nueva información
  - IA re-procesa y re-publica
  - Timer de 2 horas se reinicia

**Ubicación en UI:**
- Cintillo "ÚLTIMO MOMENTO" en página principal (rotativo)
- Tab "Noticias en Progreso" en app móvil
- Se muestran con badge/bandera de "URGENTE"

#### MODO 2: NORMAL (Publicación Manual)

**Características:**
- Usuario proporciona: título, contenido, imágenes/videos
- IA procesa con **redacción NORMAL** (500-700 palabras)
- Usuario decide tipo de publicación:
  - **Breaking**: Publicación inmediata con notificación push
  - **Noticia**: Publicación normal con difusión en redes
  - **Post de Blog**: Publicación sin difusión inmediata
- **NO tiene outlet asociado** (contenido original de usuario)
- Proceso de publicación 80% igual al flujo actual

**Diferencias con flujo actual:**
- No viene de scraping, viene de input manual del usuario
- Campos `sourceUrl` y `domain` son opcionales/null
- Se puede crear outlet especial "UserNews" o dejar campos opcionales

### 1.3 Casos de Uso

**Caso 1: Noticia de Última Hora**
```
Usuario detecta incidente en curso (inundación, accidente, evento importante)
→ Crea contenido URGENT con datos iniciales
→ Sistema publica inmediatamente
→ Aparece en cintillo rotativo
→ Después de 2 horas: Usuario actualiza con más información O sistema cierra automáticamente
```

**Caso 2: Contenido Exclusivo**
```
Usuario tiene entrevista exclusiva o contenido original
→ Crea contenido NORMAL
→ Sube imágenes/videos propios
→ Decide publicar como "Noticia"
→ Sistema procesa con IA y publica normalmente
```

**Caso 3: Post de Blog**
```
Usuario quiere publicar opinión o análisis
→ Crea contenido NORMAL tipo "Blog"
→ No se envía a redes sociales inmediatamente
→ Queda disponible en sitio web
```

---

## 2. ANÁLISIS CONSOLIDADO

### 2.1 Backend - Componentes Principales

#### Schemas MongoDB Nuevos/Modificados

**NUEVO: `UserGeneratedContent`**
```typescript
{
  // Contenido original
  originalTitle: string;
  originalContent: string;
  uploadedImageUrls: string[];
  uploadedVideoUrls: string[];

  // Modo de publicación
  mode: 'urgent' | 'normal';
  publicationType?: 'breaking' | 'noticia' | 'blog';

  // Gestión de URGENT
  isUrgent: boolean;
  urgentCreatedAt?: Date;
  urgentAutoCloseAt?: Date; // urgentCreatedAt + 2 horas
  urgentClosed: boolean;
  urgentClosedAt?: Date;
  urgentClosedBy?: 'user' | 'system';

  // Contenido procesado por IA
  generatedContentId?: ObjectId; // Ref a AIContentGeneration
  publishedNoticiaId?: ObjectId; // Ref a PublishedNoticia

  // Metadata
  createdBy: ObjectId; // Ref a User
  status: 'draft' | 'processing' | 'published' | 'closed';
}
```

**MODIFICADO: `AIContentGeneration`**
- Agregar campo `urgent: boolean`
- Agregar campo `urgentCopyStyle: 'aggressive' | 'normal'`

**MODIFICADO: `PublishedNoticia`**
- Agregar campo `isUrgent: boolean`
- Agregar índice para queries rápidas de contenido urgent

#### Servicios Nuevos

1. **`UserContentService`** - `/src/generator-pro/services/user-content.service.ts`
   - CRUD de contenido generado por usuario
   - Lógica de creación urgent vs normal
   - Integración con `FileUploadService`

2. **`FileUploadService`** - `/src/generator-pro/services/file-upload.service.ts`
   - Upload de imágenes/videos a S3
   - Validación de archivos (tipo, tamaño)
   - Generación de URLs públicas

3. **`UrgentContentSchedulerService`** - `/src/generator-pro/services/urgent-content-scheduler.service.ts`
   - Cron job cada 5 minutos
   - Detecta contenido urgent que cumplió 2 horas
   - Auto-cierra con IA si no hay actualizaciones

#### Endpoints Nuevos

```typescript
POST   /api/generator-pro/user-content/urgent      // Crear urgent
POST   /api/generator-pro/user-content/normal      // Crear normal
PUT    /api/generator-pro/user-content/urgent/:id  // Actualizar urgent
POST   /api/generator-pro/user-content/close/:id   // Cerrar urgent manualmente
GET    /api/generator-pro/user-content/urgent/active // Listar urgent activos
POST   /api/generator-pro/user-content/upload      // Upload de archivos
```

### 2.2 Frontend - Componentes Principales

#### Arquitectura Frontend Actual

**Stack:**
- React Native + Expo Router
- TanStack Query para data fetching
- Zustand para estado global UI
- Socket.io para tiempo real

**Patrón:**
```
Services → Mappers → Hooks (TanStack Query) → Components
```

#### Componentes Nuevos

1. **`OriginalContentFormFields.tsx`** - Formulario de creación
2. **`CreateOriginalContentModal.tsx`** - Modal con formulario
3. **`UrgentNewsList.tsx`** - Lista de noticias en progreso
4. **`UrgentBanner.tsx`** - Cintillo rotativo
5. **`EditUrgentContentModal.tsx`** - Modal de actualización

#### Hooks Custom con TanStack Query

```typescript
useCreateUrgentContent()   // Crear urgent
useCreateNormalContent()   // Crear normal
useUpdateUrgentContent()   // Actualizar urgent
useCloseUrgentContent()    // Cerrar urgent
useActiveUrgentNews()      // Listar urgent activos
useUploadFiles()           // Upload archivos
useUrgentContentSocket()   // Socket para tiempo real
```

#### Navegación

**Nueva Tab:** `app/(protected)/(tabs)/urgent-news.tsx`
- Muestra noticias urgent activas
- Timer visible con cuenta regresiva a 2 horas
- Botón "Actualizar" para cada noticia

**Modificar Tab:** `app/(protected)/(tabs)/generate.tsx`
- Agregar botón FAB "+Crear Noticia"
- Abre modal `CreateOriginalContentModal`

---

## 3. PLAN DE IMPLEMENTACIÓN POR FASES

### FASE 1: Backend - Schemas y DTOs (4-6 horas)

**Objetivo:** Crear la estructura de datos en MongoDB y DTOs de validación.

**Duración Estimada:** 4-6 horas
**Dependencias:** Ninguna

#### Checklist de Tareas:

**Schemas:**
- [ ] Crear `/src/generator-pro/schemas/user-generated-content.schema.ts`
  - [ ] Definir interface `UserGeneratedContent`
  - [ ] Agregar decoradores `@Prop()` con validaciones
  - [ ] Crear índices para `isUrgent`, `status`, `urgentAutoCloseAt`
  - [ ] Exportar `UserGeneratedContentDocument` type

- [ ] Modificar `/src/generator-pro/schemas/ai-content-generation.schema.ts`
  - [ ] Agregar campo `urgent: boolean` (opcional)
  - [ ] Agregar campo `urgentCopyStyle: 'aggressive' | 'normal'` (opcional)

- [ ] Modificar `/src/noticias/schemas/published-noticia.schema.ts`
  - [ ] Agregar campo `isUrgent: boolean` con default `false`
  - [ ] Agregar índice compuesto `{ isUrgent: 1, publishedAt: -1 }`

**DTOs:**
- [ ] Crear `/src/generator-pro/dto/create-urgent-content.dto.ts`
  ```typescript
  export class CreateUrgentContentDto {
    @IsString() @IsNotEmpty() originalTitle: string;
    @IsString() @IsNotEmpty() originalContent: string;
    @IsArray() @IsOptional() uploadedImageUrls?: string[];
    @IsArray() @IsOptional() uploadedVideoUrls?: string[];
  }
  ```

- [ ] Crear `/src/generator-pro/dto/create-normal-content.dto.ts`
  ```typescript
  export class CreateNormalContentDto extends CreateUrgentContentDto {
    @IsEnum(['breaking', 'noticia', 'blog']) publicationType: string;
  }
  ```

- [ ] Crear `/src/generator-pro/dto/update-urgent-content.dto.ts`
  ```typescript
  export class UpdateUrgentContentDto {
    @IsString() @IsNotEmpty() newContent: string;
    @IsArray() @IsOptional() newImageUrls?: string[];
  }
  ```

- [ ] Crear `/src/generator-pro/dto/upload-file.dto.ts`
  ```typescript
  export class UploadFileDto {
    @IsString() @IsNotEmpty() fileName: string;
    @IsString() @IsNotEmpty() mimeType: string;
    @IsNumber() @Max(10 * 1024 * 1024) fileSize: number; // max 10MB
  }
  ```

**Módulos:**
- [ ] Modificar `/src/generator-pro/generator-pro.module.ts`
  - [ ] Importar `MongooseModule.forFeature([{ name: UserGeneratedContent.name, schema: UserGeneratedContentSchema }])`

**Archivos a Modificar/Crear:**
- `src/generator-pro/schemas/user-generated-content.schema.ts` - CREAR
- `src/generator-pro/schemas/ai-content-generation.schema.ts` - MODIFICAR
- `src/noticias/schemas/published-noticia.schema.ts` - MODIFICAR
- `src/generator-pro/dto/create-urgent-content.dto.ts` - CREAR
- `src/generator-pro/dto/create-normal-content.dto.ts` - CREAR
- `src/generator-pro/dto/update-urgent-content.dto.ts` - CREAR
- `src/generator-pro/dto/upload-file.dto.ts` - CREAR
- `src/generator-pro/generator-pro.module.ts` - MODIFICAR

**Build y Verificación:**
```bash
cd packages/api-nueva
npm run build
# Verificar que no hay errores de TypeScript
# NO levantar el servidor, solo verificar que compile
```

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás la estructura de datos completa en MongoDB y todos los DTOs de validación listos. Podrás verificar que los schemas están bien definidos y que TypeScript compila sin errores. Esta es la base sobre la que se construirán los servicios.

---

### FASE 2: Backend - FileUploadService (3-4 horas)

**Objetivo:** Implementar servicio de upload de archivos a S3/almacenamiento.

**Duración Estimada:** 3-4 horas
**Dependencias:** FASE 1 completada

#### Checklist de Tareas:

- [ ] Instalar dependencias necesarias
  ```bash
  npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer
  npm install -D @types/multer
  ```

- [ ] Crear `/src/generator-pro/services/file-upload.service.ts`
  - [ ] Inyectar dependencias: `ConfigService`, `Logger`
  - [ ] Método `uploadImage(file: Express.Multer.File): Promise<string>`
  - [ ] Método `uploadVideo(file: Express.Multer.File): Promise<string>`
  - [ ] Método `deleteFile(url: string): Promise<void>`
  - [ ] Validaciones: tipo MIME, tamaño máximo
  - [ ] Generación de nombres únicos con timestamp + UUID
  - [ ] Upload a S3 bucket configurado en `.env`

- [ ] Crear configuración de S3 en `.env`
  ```env
  AWS_S3_BUCKET=noticias-pachuca-uploads
  AWS_S3_REGION=us-east-1
  AWS_ACCESS_KEY_ID=xxx
  AWS_SECRET_ACCESS_KEY=xxx
  ```

- [ ] Agregar `FileUploadService` a `generator-pro.module.ts`
  - [ ] En `providers: [FileUploadService]`
  - [ ] En `exports: [FileUploadService]` para usar en otros módulos

**Código de Ejemplo:**
```typescript
@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get('AWS_S3_BUCKET');
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    // Validar tipo MIME
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de imagen no permitido');
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Imagen muy grande (max 5MB)');
    }

    // Generar nombre único
    const fileName = `images/${Date.now()}-${randomUUID()}.${file.mimetype.split('/')[1]}`;

    // Upload a S3
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await this.s3Client.send(command);

    // Retornar URL pública
    return `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;
  }

  async uploadVideo(file: Express.Multer.File): Promise<string> {
    // Similar a uploadImage pero con validaciones de video
    const allowedTypes = ['video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de video no permitido');
    }

    // Validar tamaño (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      throw new BadRequestException('Video muy grande (max 50MB)');
    }

    const fileName = `videos/${Date.now()}-${randomUUID()}.${file.mimetype.split('/')[1]}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await this.s3Client.send(command);

    return `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;
  }
}
```

**Archivos a Modificar/Crear:**
- `src/generator-pro/services/file-upload.service.ts` - CREAR
- `src/generator-pro/generator-pro.module.ts` - MODIFICAR
- `.env` - MODIFICAR (agregar vars de AWS)

**Build y Verificación:**
```bash
npm run build
# Verificar que FileUploadService compila sin errores
```

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás un servicio funcional de upload de archivos a S3. Podrás subir imágenes y videos, validar tipos y tamaños, y obtener URLs públicas. Este servicio se usará en el endpoint de upload y en la creación de contenido.

---

### FASE 3: Backend - UserContentService (6-8 horas)

**Objetivo:** Crear servicio principal para gestión de contenido generado por usuario.

**Duración Estimada:** 6-8 horas
**Dependencias:** FASE 1 y FASE 2 completadas

#### Checklist de Tareas:

- [ ] Crear `/src/generator-pro/services/user-content.service.ts`
  - [ ] Inyectar dependencias:
    - [ ] `@InjectModel(UserGeneratedContent.name) private userContentModel`
    - [ ] `@InjectModel(AIContentGeneration.name) private aiContentModel`
    - [ ] `FileUploadService`
    - [ ] `GeneratorProPromptBuilderService`
    - [ ] `ProviderFactoryService`
    - [ ] `EventEmitter2`
    - [ ] `Logger`

**Métodos Principales:**

- [ ] `createUrgentContent(dto: CreateUrgentContentDto, userId: string): Promise<UserGeneratedContentDocument>`
  - [ ] Crear documento en `UserGeneratedContent` con mode='urgent', isUrgent=true
  - [ ] Calcular `urgentAutoCloseAt` = now + 2 horas
  - [ ] Emitir evento `content.urgent.created` con EventEmitter2
  - [ ] Procesar con IA usando prompt CORTO (300-500 palabras)
  - [ ] Generar copys AGRESIVOS para redes sociales
  - [ ] Auto-publicar inmediatamente
  - [ ] Retornar documento creado

- [ ] `createNormalContent(dto: CreateNormalContentDto, userId: string): Promise<UserGeneratedContentDocument>`
  - [ ] Crear documento en `UserGeneratedContent` con mode='normal'
  - [ ] Procesar con IA usando prompt NORMAL (500-700 palabras)
  - [ ] Generar copys normales para redes sociales
  - [ ] Según `publicationType`:
    - [ ] 'breaking' → Auto-publicar con notificación push
    - [ ] 'noticia' → Auto-publicar sin notificación
    - [ ] 'blog' → Guardar sin publicar (publicación manual después)
  - [ ] Retornar documento creado

- [ ] `updateUrgentContent(id: string, dto: UpdateUrgentContentDto, userId: string): Promise<UserGeneratedContentDocument>`
  - [ ] Buscar contenido urgent por ID
  - [ ] Verificar que NO esté cerrado (`urgentClosed: false`)
  - [ ] Actualizar `originalContent` con `dto.newContent`
  - [ ] Re-procesar con IA (nueva versión)
  - [ ] Re-publicar
  - [ ] **REINICIAR timer:** `urgentAutoCloseAt` = now + 2 horas
  - [ ] Emitir evento `content.urgent.updated`
  - [ ] Retornar documento actualizado

- [ ] `closeUrgentContent(id: string, closedBy: 'user' | 'system', userId?: string): Promise<UserGeneratedContentDocument>`
  - [ ] Buscar contenido urgent por ID
  - [ ] Marcar como cerrado: `urgentClosed: true`, `urgentClosedAt: now`, `urgentClosedBy`
  - [ ] Si `closedBy === 'system'`:
    - [ ] Generar párrafo de cierre con IA:
      - Prompt: "Agrega un párrafo final al contenido indicando que al cierre del bloque informativo no se recibieron actualizaciones"
    - [ ] Actualizar contenido publicado con párrafo de cierre
  - [ ] Emitir evento `content.urgent.closed`
  - [ ] Retornar documento

- [ ] `getActiveUrgentContent(): Promise<UserGeneratedContentDocument[]>`
  - [ ] Query: `{ isUrgent: true, urgentClosed: false, status: 'published' }`
  - [ ] Ordenar por `urgentCreatedAt` DESC
  - [ ] Incluir tiempo restante para auto-cierre
  - [ ] Retornar lista

**EventEmitter2 Events:**
```typescript
// Emitir eventos en lugar de llamar directamente a otros servicios
this.eventEmitter.emit('content.urgent.created', {
  userContentId: doc._id,
  userId,
  urgentAutoCloseAt: doc.urgentAutoCloseAt,
});

this.eventEmitter.emit('content.urgent.updated', {
  userContentId: doc._id,
  userId,
});

this.eventEmitter.emit('content.urgent.closed', {
  userContentId: doc._id,
  closedBy,
});
```

**Archivos a Modificar/Crear:**
- `src/generator-pro/services/user-content.service.ts` - CREAR
- `src/generator-pro/generator-pro.module.ts` - MODIFICAR (agregar UserContentService a providers)

**Build y Verificación:**
```bash
npm run build
# Verificar que UserContentService compila
```

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás el servicio core que maneja toda la lógica de creación, actualización y cierre de contenido urgente y normal. Usarás EventEmitter2 para evitar dependencias circulares. El servicio estará listo para ser usado por los endpoints del controller.

---

### FASE 4: Backend - UrgentContentSchedulerService (4-5 horas)

**Objetivo:** Implementar auto-cierre de contenido urgent después de 2 horas.

**Duración Estimada:** 4-5 horas
**Dependencias:** FASE 3 completada

#### Checklist de Tareas:

- [ ] Instalar dependencia de scheduling
  ```bash
  npm install @nestjs/schedule
  ```

- [ ] Modificar `/src/app.module.ts`
  - [ ] Importar `ScheduleModule.forRoot()` en `imports`

- [ ] Crear `/src/generator-pro/services/urgent-content-scheduler.service.ts`
  - [ ] Inyectar dependencias:
    - [ ] `@InjectModel(UserGeneratedContent.name) private userContentModel`
    - [ ] `UserContentService`
    - [ ] `Logger`

**Método Principal:**

- [ ] Decorar con `@Cron('*/5 * * * *')` para ejecutar cada 5 minutos
- [ ] Método `handleUrgentContentAutoClosure(): Promise<void>`
  - [ ] Query: Buscar contenido con:
    ```typescript
    {
      isUrgent: true,
      urgentClosed: false,
      urgentAutoCloseAt: { $lte: new Date() },
      status: 'published'
    }
    ```
  - [ ] Para cada documento encontrado:
    - [ ] Llamar `userContentService.closeUrgentContent(id, 'system')`
    - [ ] Log: `Contenido urgent ${id} auto-cerrado después de 2 horas`
  - [ ] Emitir evento `scheduler.urgent.auto-closed` con lista de IDs cerrados

**Código de Ejemplo:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserGeneratedContent, UserGeneratedContentDocument } from '../schemas/user-generated-content.schema';
import { UserContentService } from './user-content.service';

@Injectable()
export class UrgentContentSchedulerService {
  private readonly logger = new Logger(UrgentContentSchedulerService.name);

  constructor(
    @InjectModel(UserGeneratedContent.name)
    private readonly userContentModel: Model<UserGeneratedContentDocument>,
    private readonly userContentService: UserContentService,
  ) {}

  /**
   * Cron job que se ejecuta cada 5 minutos
   * Cierra automáticamente contenido urgent que cumplió 2 horas sin actualización
   */
  @Cron('*/5 * * * *')
  async handleUrgentContentAutoClosure(): Promise<void> {
    this.logger.debug('Ejecutando auto-cierre de contenido urgent...');

    const now = new Date();

    // Buscar contenido urgent que debe cerrarse
    const expiredContent = await this.userContentModel.find({
      isUrgent: true,
      urgentClosed: false,
      urgentAutoCloseAt: { $lte: now },
      status: 'published',
    }).exec();

    if (expiredContent.length === 0) {
      this.logger.debug('No hay contenido urgent para cerrar');
      return;
    }

    this.logger.log(`Encontrados ${expiredContent.length} contenidos urgent para auto-cerrar`);

    // Cerrar cada uno
    const closedIds: string[] = [];
    for (const content of expiredContent) {
      try {
        await this.userContentService.closeUrgentContent(
          content._id.toString(),
          'system',
        );
        closedIds.push(content._id.toString());
        this.logger.log(`✅ Contenido urgent ${content._id} auto-cerrado exitosamente`);
      } catch (error) {
        this.logger.error(`❌ Error al auto-cerrar contenido ${content._id}: ${error.message}`);
      }
    }

    this.logger.log(`Auto-cierre completado: ${closedIds.length}/${expiredContent.length} exitosos`);
  }
}
```

- [ ] Agregar `UrgentContentSchedulerService` a `generator-pro.module.ts`
  - [ ] En `providers: [UrgentContentSchedulerService]`

**Archivos a Modificar/Crear:**
- `src/app.module.ts` - MODIFICAR (importar ScheduleModule)
- `src/generator-pro/services/urgent-content-scheduler.service.ts` - CREAR
- `src/generator-pro/generator-pro.module.ts` - MODIFICAR

**Build y Verificación:**
```bash
npm run build
# Verificar que el scheduler compila sin errores
```

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás un cron job que automáticamente cierra contenido urgent después de 2 horas sin actualización. El job se ejecuta cada 5 minutos, encuentra contenido expirado, y llama al método de cierre del UserContentService. Esto garantiza que las noticias en desarrollo se cierren automáticamente si no hay actualizaciones.

---

### FASE 5: Backend - Endpoints y Controller (6-8 horas)

**Objetivo:** Crear endpoints REST para crear, actualizar, listar y cerrar contenido.

**Duración Estimada:** 6-8 horas
**Dependencias:** FASES 1, 2, 3, 4 completadas

#### Checklist de Tareas:

- [ ] Modificar `/src/generator-pro/controllers/generator-pro.controller.ts`
  - [ ] Inyectar `UserContentService` y `FileUploadService`

**Endpoints a Crear:**

- [ ] **POST /api/generator-pro/user-content/urgent** - Crear contenido urgent
  ```typescript
  @Post('user-content/urgent')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear contenido URGENT (última hora)' })
  @ApiResponse({ status: 201, description: 'Contenido urgent creado y publicado' })
  async createUrgentContent(
    @Body() dto: CreateUrgentContentDto,
    @CurrentUser('userId') userId: string,
  ): Promise<{ content: UserGeneratedContentDocument }> {
    this.logger.log(`🚨 Creating URGENT content by user: ${userId}`);
    const content = await this.userContentService.createUrgentContent(dto, userId);
    this.logger.log(`✅ URGENT content created and published: ${content._id}`);
    return { content };
  }
  ```

- [ ] **POST /api/generator-pro/user-content/normal** - Crear contenido normal
  ```typescript
  @Post('user-content/normal')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear contenido NORMAL (publicación manual)' })
  @ApiResponse({ status: 201, description: 'Contenido normal creado' })
  async createNormalContent(
    @Body() dto: CreateNormalContentDto,
    @CurrentUser('userId') userId: string,
  ): Promise<{ content: UserGeneratedContentDocument }> {
    this.logger.log(`📝 Creating NORMAL content by user: ${userId}`);
    const content = await this.userContentService.createNormalContent(dto, userId);
    this.logger.log(`✅ NORMAL content created: ${content._id}`);
    return { content };
  }
  ```

- [ ] **PUT /api/generator-pro/user-content/urgent/:id** - Actualizar contenido urgent
  ```typescript
  @Put('user-content/urgent/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar contenido URGENT con nueva información' })
  @ApiResponse({ status: 200, description: 'Contenido urgent actualizado' })
  async updateUrgentContent(
    @Param('id') id: string,
    @Body() dto: UpdateUrgentContentDto,
    @CurrentUser('userId') userId: string,
  ): Promise<{ content: UserGeneratedContentDocument }> {
    this.logger.log(`🔄 Updating URGENT content ${id} by user: ${userId}`);
    const content = await this.userContentService.updateUrgentContent(id, dto, userId);
    this.logger.log(`✅ URGENT content updated: ${id}`);
    return { content };
  }
  ```

- [ ] **POST /api/generator-pro/user-content/close/:id** - Cerrar contenido urgent manualmente
  ```typescript
  @Post('user-content/close/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar contenido URGENT manualmente' })
  @ApiResponse({ status: 200, description: 'Contenido urgent cerrado' })
  async closeUrgentContent(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<{ content: UserGeneratedContentDocument }> {
    this.logger.log(`🔒 Closing URGENT content ${id} by user: ${userId}`);
    const content = await this.userContentService.closeUrgentContent(id, 'user', userId);
    this.logger.log(`✅ URGENT content closed: ${id}`);
    return { content };
  }
  ```

- [ ] **GET /api/generator-pro/user-content/urgent/active** - Listar contenido urgent activo
  ```typescript
  @Get('user-content/urgent/active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar contenido URGENT activo (en progreso)' })
  @ApiResponse({ status: 200, description: 'Lista de contenido urgent activo' })
  async getActiveUrgentContent(): Promise<{ content: UserGeneratedContentDocument[] }> {
    this.logger.log('📋 Fetching active URGENT content');
    const content = await this.userContentService.getActiveUrgentContent();
    this.logger.log(`✅ Found ${content.length} active URGENT content`);
    return { content };
  }
  ```

- [ ] **POST /api/generator-pro/user-content/upload** - Upload de archivos
  ```typescript
  @Post('user-content/upload')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 archivos
  @ApiOperation({ summary: 'Upload de imágenes/videos' })
  @ApiResponse({ status: 201, description: 'Archivos subidos exitosamente' })
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    this.logger.log(`📤 Uploading ${files.length} files`);

    const urls: string[] = [];
    for (const file of files) {
      if (file.mimetype.startsWith('image/')) {
        const url = await this.fileUploadService.uploadImage(file);
        urls.push(url);
      } else if (file.mimetype.startsWith('video/')) {
        const url = await this.fileUploadService.uploadVideo(file);
        urls.push(url);
      } else {
        throw new BadRequestException(`Tipo de archivo no soportado: ${file.mimetype}`);
      }
    }

    this.logger.log(`✅ Uploaded ${urls.length} files`);
    return { urls };
  }
  ```

**Configurar Multer:**
- [ ] Instalar `@nestjs/platform-express` si no está
- [ ] Configurar límites de tamaño en `main.ts`:
  ```typescript
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  ```

**Archivos a Modificar/Crear:**
- `src/generator-pro/controllers/generator-pro.controller.ts` - MODIFICAR
- `src/main.ts` - MODIFICAR (configurar límites)

**Build y Verificación:**
```bash
npm run build
# Verificar que todos los endpoints compilan
```

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás todos los endpoints REST listos para ser consumidos por el frontend. Podrás crear contenido urgent y normal, actualizar, cerrar y listar contenido activo. También tendrás el endpoint de upload de archivos funcionando. Los endpoints están documentados con Swagger y tienen validaciones con DTOs.

---

### FASE 6: Backend - Integración con IA (8-10 horas)

**Objetivo:** Modificar prompts de IA para generar contenido urgent (corto y agresivo) vs normal.

**Duración Estimada:** 8-10 horas
**Dependencias:** FASES anteriores completadas

#### Checklist de Tareas:

- [ ] Modificar `/src/generator-pro/services/generator-pro-prompt-builder.service.ts`
  - [ ] Agregar método `buildUrgentPrompt(input: { title: string; content: string }): { systemPrompt: string; userPrompt: string }`
    - [ ] System Prompt: Incluir restricciones anti-formato + instrucciones de brevedad
    - [ ] User Prompt: "Genera contenido URGENTE de 300-500 palabras con tono de última hora"
    - [ ] Agregar al final: "Incluye al final: **Contenido en desarrollo** - Información en actualización"

  - [ ] Agregar método `buildNormalPrompt(input: { title: string; content: string }): { systemPrompt: string; userPrompt: string }`
    - [ ] Reutilizar lógica actual con prompts de 500-700 palabras

  - [ ] Agregar método `buildAggressiveSocialCopies(): string`
    - [ ] Instrucciones para generar copys MÁS AGRESIVOS:
      ```
      COPYS PARA URGENT (AGRESIVOS):
      - Hook FUERTE que genere URGENCIA ("🚨 ÚLTIMA HORA", "⚠️ AHORA MISMO", "🔴 EN VIVO")
      - Usar palabras de impacto: "URGENTE", "BREAKING", "ALERTA"
      - Emojis relevantes para llamar atención
      - Llamado a acción DIRECTO: "Lee ahora", "Entérate ya", "No te lo pierdas"
      ```

- [ ] Modificar `UserContentService.createUrgentContent()`
  - [ ] Usar `buildUrgentPrompt()` en lugar de `buildPrompt()`
  - [ ] Usar `buildAggressiveSocialCopies()` para redes sociales

- [ ] Crear método `generateClosingParagraph(content: string): Promise<string>`
  - [ ] Prompt específico para generar párrafo de cierre:
    ```typescript
    const closingPrompt = `
    Agrega un párrafo final al siguiente contenido indicando que:
    - Al cierre del bloque informativo no se recibieron nuevas actualizaciones
    - La información permanece como se publicó inicialmente
    - Mantén un tono profesional y periodístico

    Contenido actual:
    ${content}

    Genera SOLO el párrafo de cierre (2-3 oraciones).
    `;
    ```
  - [ ] Usar en `closeUrgentContent()` cuando `closedBy === 'system'`

**Ejemplo de Prompts:**

```typescript
private buildUrgentPrompt(input: { title: string; content: string }): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `${this.buildAntiFormatRestriction()}

🚨 MODO URGENT - ÚLTIMA HORA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Eres un editor de noticias de última hora. Tu objetivo es informar RÁPIDO y CLARO.

CARACTERÍSTICAS DEL CONTENIDO URGENT:
• BREVEDAD: 300-500 palabras MÁXIMO
• PRECISIÓN: Solo lo esencial, sin relleno
• URGENCIA: Tono que transmite inmediatez
• DESARROLLO: Información puede estar incompleta, eso es normal
• FORMATO: HTML enriquecido pero CORTO

AL FINAL DEL CONTENIDO SIEMPRE INCLUYE:
<p><strong>Contenido en desarrollo</strong> - Información en actualización</p>

${this.buildEnrichedGuidelines()}
${this.buildAggressiveSocialCopies()}
`;

  const userPrompt = `Genera una nota de ÚLTIMA HORA basada en:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📰 TÍTULO:
${input.title}

📄 INFORMACIÓN DISPONIBLE:
${input.content}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 INSTRUCCIONES:
- Redacta en 300-500 palabras (CORTO, es última hora)
- Enfócate en QUÉ pasó, DÓNDE, CUÁNDO
- Si falta información, indícalo claramente ("Se desconoce...", "Aún no se confirma...")
- Usa negritas en datos clave pero SIN EXCESOS
- Incluye al final el texto de "Contenido en desarrollo"
- Genera copys de redes sociales MÁS AGRESIVOS (hooks fuertes, urgencia, emojis)

📦 RESPUESTA FINAL - JSON:
{
  "title": "Título urgente y directo",
  "content": "Contenido HTML de 300-500 palabras con el texto de desarrollo al final",
  "keywords": ["palabras", "clave"],
  "tags": ["tags", "relevantes"],
  "category": "Categoría",
  "summary": "Resumen breve",
  "socialMediaCopies": {
    "facebook": {
      "hook": "🚨 ÚLTIMA HORA en [lugar]",
      "copy": "Copy agresivo de 40-80 palabras con urgencia",
      "emojis": ["🚨", "⚠️"],
      "hookType": "Scary",
      "estimatedEngagement": "high"
    },
    "twitter": {
      "tweet": "🔴 AHORA: Tweet urgente de 200-240 caracteres",
      "hook": "BREAKING",
      "emojis": ["🔴", "🚨"],
      "hookType": "Scary",
      "threadIdeas": ["Contexto", "Actualizaciones", "Impacto"]
    }
  }
}`;

  return { systemPrompt, userPrompt };
}
```

**Archivos a Modificar/Crear:**
- `src/generator-pro/services/generator-pro-prompt-builder.service.ts` - MODIFICAR
- `src/generator-pro/services/user-content.service.ts` - MODIFICAR

**Build y Verificación:**
```bash
npm run build
# Verificar que los prompts compilan
```

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás prompts específicos para contenido urgent (corto y agresivo) vs contenido normal (largo y pausado). La IA generará contenido adaptado al modo seleccionado, con copys de redes sociales acordes al nivel de urgencia. También tendrás la funcionalidad de auto-cierre con párrafo generado por IA.

---

### FASE 7: Frontend - Types, Mappers y API Service (4-5 horas)

**Objetivo:** Crear la capa de tipos, mappers y servicios API para el frontend.

**Duración Estimada:** 4-5 horas
**Dependencias:** Backend completo (FASES 1-6)

#### Checklist de Tareas:

**Types:**
- [ ] Crear `/src/types/original-content.types.ts`
  ```typescript
  export type ContentMode = 'urgent' | 'normal';
  export type PublicationType = 'breaking' | 'noticia' | 'blog';
  export type ContentStatus = 'draft' | 'processing' | 'published' | 'closed';

  export interface UserGeneratedContent {
    id: string;
    originalTitle: string;
    originalContent: string;
    uploadedImageUrls: string[];
    uploadedVideoUrls: string[];
    mode: ContentMode;
    publicationType?: PublicationType;
    isUrgent: boolean;
    urgentCreatedAt?: Date;
    urgentAutoCloseAt?: Date;
    urgentClosed: boolean;
    urgentClosedAt?: Date;
    urgentClosedBy?: 'user' | 'system';
    status: ContentStatus;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface CreateUrgentContentRequest {
    originalTitle: string;
    originalContent: string;
    uploadedImageUrls?: string[];
    uploadedVideoUrls?: string[];
  }

  export interface CreateNormalContentRequest extends CreateUrgentContentRequest {
    publicationType: PublicationType;
  }

  export interface UpdateUrgentContentRequest {
    newContent: string;
    newImageUrls?: string[];
  }
  ```

**Mapper:**
- [ ] Crear `/src/services/mappers/original-content.mapper.ts`
  ```typescript
  import { UserGeneratedContent } from '@/types/original-content.types';

  export class OriginalContentMapper {
    static toCamelCase(snakeCase: any): UserGeneratedContent {
      return {
        id: snakeCase._id || snakeCase.id,
        originalTitle: snakeCase.original_title || snakeCase.originalTitle,
        originalContent: snakeCase.original_content || snakeCase.originalContent,
        uploadedImageUrls: snakeCase.uploaded_image_urls || snakeCase.uploadedImageUrls || [],
        uploadedVideoUrls: snakeCase.uploaded_video_urls || snakeCase.uploadedVideoUrls || [],
        mode: snakeCase.mode,
        publicationType: snakeCase.publication_type || snakeCase.publicationType,
        isUrgent: snakeCase.is_urgent ?? snakeCase.isUrgent ?? false,
        urgentCreatedAt: snakeCase.urgent_created_at ? new Date(snakeCase.urgent_created_at) : undefined,
        urgentAutoCloseAt: snakeCase.urgent_auto_close_at ? new Date(snakeCase.urgent_auto_close_at) : undefined,
        urgentClosed: snakeCase.urgent_closed ?? snakeCase.urgentClosed ?? false,
        urgentClosedAt: snakeCase.urgent_closed_at ? new Date(snakeCase.urgent_closed_at) : undefined,
        urgentClosedBy: snakeCase.urgent_closed_by || snakeCase.urgentClosedBy,
        status: snakeCase.status,
        createdAt: new Date(snakeCase.created_at || snakeCase.createdAt),
        updatedAt: new Date(snakeCase.updated_at || snakeCase.updatedAt),
      };
    }

    static toSnakeCase(camelCase: CreateUrgentContentRequest | CreateNormalContentRequest | UpdateUrgentContentRequest): any {
      if ('newContent' in camelCase) {
        // UpdateUrgentContentRequest
        return {
          new_content: camelCase.newContent,
          new_image_urls: camelCase.newImageUrls,
        };
      } else if ('publicationType' in camelCase) {
        // CreateNormalContentRequest
        return {
          original_title: camelCase.originalTitle,
          original_content: camelCase.originalContent,
          uploaded_image_urls: camelCase.uploadedImageUrls,
          uploaded_video_urls: camelCase.uploadedVideoUrls,
          publication_type: camelCase.publicationType,
        };
      } else {
        // CreateUrgentContentRequest
        return {
          original_title: camelCase.originalTitle,
          original_content: camelCase.originalContent,
          uploaded_image_urls: camelCase.uploadedImageUrls,
          uploaded_video_urls: camelCase.uploadedVideoUrls,
        };
      }
    }
  }
  ```

**API Service:**
- [ ] Crear `/src/services/api/original-content.api.ts`
  ```typescript
  import apiClient from './client';
  import { OriginalContentMapper } from '../mappers/original-content.mapper';
  import type {
    UserGeneratedContent,
    CreateUrgentContentRequest,
    CreateNormalContentRequest,
    UpdateUrgentContentRequest,
  } from '@/types/original-content.types';

  export const originalContentApi = {
    createUrgent: async (data: CreateUrgentContentRequest): Promise<UserGeneratedContent> => {
      const payload = OriginalContentMapper.toSnakeCase(data);
      const response = await apiClient.post('/generator-pro/user-content/urgent', payload);
      return OriginalContentMapper.toCamelCase(response.data.content);
    },

    createNormal: async (data: CreateNormalContentRequest): Promise<UserGeneratedContent> => {
      const payload = OriginalContentMapper.toSnakeCase(data);
      const response = await apiClient.post('/generator-pro/user-content/normal', payload);
      return OriginalContentMapper.toCamelCase(response.data.content);
    },

    updateUrgent: async (id: string, data: UpdateUrgentContentRequest): Promise<UserGeneratedContent> => {
      const payload = OriginalContentMapper.toSnakeCase(data);
      const response = await apiClient.put(`/generator-pro/user-content/urgent/${id}`, payload);
      return OriginalContentMapper.toCamelCase(response.data.content);
    },

    closeUrgent: async (id: string): Promise<UserGeneratedContent> => {
      const response = await apiClient.post(`/generator-pro/user-content/close/${id}`);
      return OriginalContentMapper.toCamelCase(response.data.content);
    },

    getActiveUrgent: async (): Promise<UserGeneratedContent[]> => {
      const response = await apiClient.get('/generator-pro/user-content/urgent/active');
      return response.data.content.map(OriginalContentMapper.toCamelCase);
    },

    uploadFiles: async (files: File[]): Promise<string[]> => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await apiClient.post('/generator-pro/user-content/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data.urls;
    },
  };
  ```

**Archivos a Crear:**
- `src/types/original-content.types.ts` - CREAR
- `src/services/mappers/original-content.mapper.ts` - CREAR
- `src/services/api/original-content.api.ts` - CREAR

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás la capa de tipos TypeScript, mappers para convertir snake_case ↔ camelCase, y el servicio API que consume los endpoints del backend. Esta capa es la base para crear los hooks custom con TanStack Query en la siguiente fase.

---

### FASE 8: Frontend - Hooks con TanStack Query (3-4 horas)

**Objetivo:** Crear hooks custom con TanStack Query para manejo de estado del servidor.

**Duración Estimada:** 3-4 horas
**Dependencias:** FASE 7 completada

#### Checklist de Tareas:

- [ ] Crear `/src/hooks/useCreateUrgentContent.ts`
  ```typescript
  import { useMutation, useQueryClient } from '@tanstack/react-query';
  import { originalContentApi } from '@/services/api/original-content.api';
  import type { CreateUrgentContentRequest } from '@/types/original-content.types';

  export function useCreateUrgentContent() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: CreateUrgentContentRequest) => originalContentApi.createUrgent(data),
      onSuccess: () => {
        // Invalidar queries para refrescar listas
        queryClient.invalidateQueries({ queryKey: ['urgent-content', 'active'] });
        queryClient.invalidateQueries({ queryKey: ['generated-content'] });
      },
    });
  }
  ```

- [ ] Crear `/src/hooks/useCreateNormalContent.ts`
  ```typescript
  import { useMutation, useQueryClient } from '@tanstack/react-query';
  import { originalContentApi } from '@/services/api/original-content.api';
  import type { CreateNormalContentRequest } from '@/types/original-content.types';

  export function useCreateNormalContent() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: CreateNormalContentRequest) => originalContentApi.createNormal(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['generated-content'] });
      },
    });
  }
  ```

- [ ] Crear `/src/hooks/useUpdateUrgentContent.ts`
  ```typescript
  import { useMutation, useQueryClient } from '@tanstack/react-query';
  import { originalContentApi } from '@/services/api/original-content.api';
  import type { UpdateUrgentContentRequest } from '@/types/original-content.types';

  export function useUpdateUrgentContent() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateUrgentContentRequest }) =>
        originalContentApi.updateUrgent(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['urgent-content', 'active'] });
      },
    });
  }
  ```

- [ ] Crear `/src/hooks/useCloseUrgentContent.ts`
  ```typescript
  import { useMutation, useQueryClient } from '@tanstack/react-query';
  import { originalContentApi } from '@/services/api/original-content.api';

  export function useCloseUrgentContent() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => originalContentApi.closeUrgent(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['urgent-content', 'active'] });
      },
    });
  }
  ```

- [ ] Crear `/src/hooks/useActiveUrgentNews.ts`
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { originalContentApi } from '@/services/api/original-content.api';

  export function useActiveUrgentNews() {
    return useQuery({
      queryKey: ['urgent-content', 'active'],
      queryFn: () => originalContentApi.getActiveUrgent(),
      refetchInterval: 30000, // Refetch cada 30 segundos
      staleTime: 15000, // Considerar stale después de 15 segundos
    });
  }
  ```

- [ ] Crear `/src/hooks/useUploadFiles.ts`
  ```typescript
  import { useMutation } from '@tanstack/react-query';
  import { originalContentApi } from '@/services/api/original-content.api';

  export function useUploadFiles() {
    return useMutation({
      mutationFn: (files: File[]) => originalContentApi.uploadFiles(files),
    });
  }
  ```

- [ ] Crear `/src/hooks/useUrgentContentSocket.ts` (para tiempo real)
  ```typescript
  import { useEffect } from 'react';
  import { useQueryClient } from '@tanstack/react-query';
  import { socketService } from '@/services/socket.service';

  export function useUrgentContentSocket() {
    const queryClient = useQueryClient();

    useEffect(() => {
      // Conectar socket
      socketService.connect();

      // Escuchar eventos de contenido urgent
      socketService.on('content:urgent:created', () => {
        queryClient.invalidateQueries({ queryKey: ['urgent-content', 'active'] });
      });

      socketService.on('content:urgent:updated', () => {
        queryClient.invalidateQueries({ queryKey: ['urgent-content', 'active'] });
      });

      socketService.on('content:urgent:closed', () => {
        queryClient.invalidateQueries({ queryKey: ['urgent-content', 'active'] });
      });

      // Cleanup
      return () => {
        socketService.off('content:urgent:created');
        socketService.off('content:urgent:updated');
        socketService.off('content:urgent:closed');
      };
    }, [queryClient]);
  }
  ```

**Archivos a Crear:**
- `src/hooks/useCreateUrgentContent.ts` - CREAR
- `src/hooks/useCreateNormalContent.ts` - CREAR
- `src/hooks/useUpdateUrgentContent.ts` - CREAR
- `src/hooks/useCloseUrgentContent.ts` - CREAR
- `src/hooks/useActiveUrgentNews.ts` - CREAR
- `src/hooks/useUploadFiles.ts` - CREAR
- `src/hooks/useUrgentContentSocket.ts` - CREAR

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás todos los hooks custom listos para usar en componentes. Los hooks usan TanStack Query para manejo de cache, invalidación automática, y optimistic updates. También tendrás el hook de socket para actualizaciones en tiempo real cuando se cree, actualice o cierre contenido urgent.

---

### FASE 9: Frontend - Formulario y Modal de Creación (6-8 horas)

**Objetivo:** Crear componente de formulario y modal para crear contenido urgent/normal.

**Duración Estimada:** 6-8 horas
**Dependencias:** FASE 8 completada

#### Checklist de Tareas:

Ver documentos de análisis para código completo de componentes.

**Archivos a Crear:**
- `src/components/original-content/OriginalContentFormFields.tsx` - CREAR
- `src/components/original-content/CreateOriginalContentModal.tsx` - CREAR
- `src/components/original-content/ImageUploadSection.tsx` - CREAR

**Resumen Ejecutivo de la Fase:**
Al completar esta fase tendrás un formulario completo con validación, upload de imágenes/videos, toggle urgent/normal, y selector de tipo de publicación. El modal se puede abrir desde un botón FAB y permite crear contenido fácilmente.

---

### FASE 10: Frontend - Tab "Noticias en Progreso" (4-5 horas)

**Objetivo:** Crear nueva tab que muestra noticias urgent activas con timer y botón de actualización.

**Duración Estimada:** 4-5 horas
**Dependencias:** FASES 7, 8, 9 completadas

Ver documento de análisis frontend para implementación detallada.

---

### FASE 11: Frontend - Cintillo "ÚLTIMO MOMENTO" (3-4 horas)

**Objetivo:** Modificar/crear cintillo rotativo que muestra noticias urgent en página principal.

**Duración Estimada:** 3-4 horas
**Dependencias:** FASES anteriores completadas

Ver documento de análisis frontend para implementación detallada.

---

### FASE 12: Testing Manual y Build Final (2-3 horas)

**Objetivo:** Probar todo el flujo end-to-end y hacer build final.

**Duración Estimada:** 2-3 horas
**Dependencias:** TODAS las fases anteriores

#### Checklist de Tareas:

**Backend:**
- [ ] Build del backend: `npm run build`
- [ ] Verificar que no hay errores de TypeScript
- [ ] Revisar logs del scheduler (cron job)

**Frontend:**
- [ ] Build del frontend: `npm run build` (Expo)
- [ ] Probar en simulador iOS y Android

**Testing Manual End-to-End:**

**Test 1: Crear Contenido URGENT**
- [ ] Abrir app móvil
- [ ] Ir a tab "Contenidos"
- [ ] Click en botón FAB "+Crear Noticia"
- [ ] Llenar formulario:
  - Título: "Accidente en carretera México-Pachuca"
  - Contenido: "Se reporta accidente múltiple..."
  - Activar toggle "URGENT"
  - Subir 1-2 imágenes
- [ ] Enviar formulario
- [ ] Verificar que aparece en tab "Noticias en Progreso"
- [ ] Verificar que aparece en cintillo "ÚLTIMO MOMENTO"
- [ ] Verificar timer de 2 horas activo

**Test 2: Actualizar Contenido URGENT**
- [ ] Desde tab "Noticias en Progreso"
- [ ] Click en noticia creada
- [ ] Click en botón "Actualizar"
- [ ] Agregar nuevo contenido
- [ ] Enviar
- [ ] Verificar que timer se reinició

**Test 3: Auto-cierre de Contenido URGENT**
- [ ] Esperar 2 horas (o modificar timer a 2 minutos para testing)
- [ ] Verificar que cron job detecta contenido expirado
- [ ] Verificar que agrega párrafo de cierre
- [ ] Verificar que se remueve de tab "En Progreso"
- [ ] Verificar que se remueve del cintillo

**Test 4: Crear Contenido NORMAL**
- [ ] Crear noticia sin toggle "URGENT"
- [ ] Seleccionar tipo "Noticia"
- [ ] Enviar
- [ ] Verificar que se procesa normalmente
- [ ] Verificar que NO aparece en urgent

**Resumen Ejecutivo de la Fase:**
Al completar esta fase habrás probado manualmente todo el flujo y verificado que funciona correctamente. Habrás hecho builds exitosos de backend y frontend. El sistema estará listo para despliegue en producción.

---

## 4. DIAGRAMAS DE FLUJO

### 4.1 Flujo MODO URGENT (Breaking News)

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO MODO URGENT                        │
└─────────────────────────────────────────────────────────────┘

Usuario en App Móvil
  │
  ▼
[Click en botón FAB "+Crear Noticia"]
  │
  ▼
[Modal de Creación se Abre]
  │
  ▼
[Llenar Formulario]
├─ Título: "Accidente en carretera"
├─ Contenido: "Se reporta accidente múltiple..."
├─ Toggle URGENT: ✅ ACTIVADO
└─ Subir imágenes (opcional)
  │
  ▼
[Click en "Crear y Publicar"]
  │
  ▼
┌─────────────────────────────────────┐
│ Frontend: useCreateUrgentContent()  │
│ POST /user-content/urgent           │
└────────────┬────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│ Backend: UserContentService.createUrgentContent()      │
├────────────────────────────────────────────────────────┤
│ 1. Crear documento en UserGeneratedContent            │
│    - mode: 'urgent'                                    │
│    - isUrgent: true                                    │
│    - urgentCreatedAt: now                              │
│    - urgentAutoCloseAt: now + 2 horas                  │
│    - status: 'processing'                              │
│                                                        │
│ 2. Procesar con IA                                     │
│    - Usar buildUrgentPrompt() (300-500 palabras)      │
│    - Generar copys AGRESIVOS para redes               │
│    - Agregar texto "Contenido en desarrollo..."       │
│                                                        │
│ 3. Auto-publicar INMEDIATAMENTE                        │
│    - Crear AIContentGeneration (urgent: true)          │
│    - Crear PublishedNoticia (isUrgent: true)           │
│    - Publicar en redes sociales con copys agresivos    │
│                                                        │
│ 4. Emitir eventos                                      │
│    - EventEmitter2: 'content.urgent.created'           │
│    - Socket.io: 'content:urgent:created'               │
│                                                        │
│ 5. Actualizar status a 'published'                     │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│ Frontend Recibe Respuesta              │
│ - Muestra notificación de éxito        │
│ - Invalida queries con React Query     │
│ - Cierra modal                          │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│ Contenido Publicado Aparece en:                        │
├────────────────────────────────────────────────────────┤
│ 1. Tab "Noticias en Progreso"                          │
│    - Lista con timer visible (2h restantes)            │
│    - Botón "Actualizar"                                │
│                                                        │
│ 2. Cintillo "ÚLTIMO MOMENTO" (Página principal)        │
│    - Banner rotativo con badge "URGENTE"               │
│    - Auto-actualización cada 30 segundos               │
│                                                        │
│ 3. Redes Sociales                                      │
│    - Facebook: Copy agresivo con emojis 🚨⚠️          │
│    - Twitter: Tweet con "🔴 AHORA:"                    │
└────────────────────────────────────────────────────────┘

             │
             │ [TIMER DE 2 HORAS CORRIENDO]
             │
             ▼
┌─────────────────────────────────────────┐
│ Opciones después de publicar:           │
└─────────────────────────────────────────┘
             │
             ├─────────────┬─────────────┐
             │             │             │
             ▼             ▼             ▼
    [SIN actualización] [Usuario      [Usuario
     (después de 2h)     actualiza]    cierra
                                       manualmente]
             │             │             │
             ▼             ▼             ▼
   ┌─────────────────┐ ┌─────────────┐ ┌────────────┐
   │ AUTO-CIERRE     │ │ ACTUALIZAR  │ │ CERRAR     │
   │ (Sistema)       │ │             │ │ (User)     │
   └────┬────────────┘ └──────┬──────┘ └─────┬──────┘
        │                     │               │
        ▼                     ▼               ▼
   Cron job cada 5 min   PUT /urgent/:id  POST /close/:id
   detecta expirado      - Re-procesa IA  - Marca como
   - Llama closeUrgent   - Re-publica       cerrado
   - IA genera párrafo   - REINICIA timer - Remueve de
     de cierre                               cintillo
   - Actualiza noticia
   - Marca como cerrado
   - Remueve de cintillo
```

### 4.2 Flujo MODO NORMAL (Publicación Manual)

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO MODO NORMAL                        │
└─────────────────────────────────────────────────────────────┘

Usuario en App Móvil
  │
  ▼
[Click en botón FAB "+Crear Noticia"]
  │
  ▼
[Modal de Creación se Abre]
  │
  ▼
[Llenar Formulario]
├─ Título: "Entrevista exclusiva con..."
├─ Contenido: "Contenido de la entrevista..."
├─ Toggle URGENT: ❌ DESACTIVADO
├─ Tipo: Radio button "Noticia" seleccionado
└─ Subir imágenes/videos
  │
  ▼
[Click en "Crear y Publicar"]
  │
  ▼
┌─────────────────────────────────────┐
│ Frontend: useCreateNormalContent()  │
│ POST /user-content/normal           │
└────────────┬────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│ Backend: UserContentService.createNormalContent()      │
├────────────────────────────────────────────────────────┤
│ 1. Crear documento en UserGeneratedContent            │
│    - mode: 'normal'                                    │
│    - isUrgent: false                                   │
│    - publicationType: 'noticia' | 'breaking' | 'blog'  │
│    - status: 'processing'                              │
│                                                        │
│ 2. Procesar con IA                                     │
│    - Usar buildNormalPrompt() (500-700 palabras)      │
│    - Generar copys NORMALES para redes                │
│                                                        │
│ 3. Publicar según tipo                                 │
│    - 'breaking': Auto-publica con notificación push    │
│    - 'noticia': Auto-publica sin notificación          │
│    - 'blog': Guarda sin publicar (manual después)      │
│                                                        │
│ 4. Emitir eventos                                      │
│    - EventEmitter2: 'content.normal.created'           │
│                                                        │
│ 5. Actualizar status a 'published' o 'draft'           │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│ Frontend Recibe Respuesta              │
│ - Muestra notificación de éxito        │
│ - Invalida queries                      │
│ - Cierra modal                          │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│ Contenido Publicado Aparece en:                        │
├────────────────────────────────────────────────────────┤
│ 1. Tab "Generados"                                     │
│    - Lista normal de contenido generado                │
│    - NO aparece en "Noticias en Progreso"              │
│    - NO aparece en cintillo                            │
│                                                        │
│ 2. Redes Sociales (si tipo != 'blog')                  │
│    - Facebook: Copy normal                             │
│    - Twitter: Tweet normal                             │
└────────────────────────────────────────────────────────┘
```

---

## 5. CRONOGRAMA ESTIMADO

| Fase | Descripción | Duración | Dependencias | Build Requerido |
|------|-------------|----------|--------------|-----------------|
| **FASE 1** | Backend - Schemas y DTOs | 4-6 horas | Ninguna | ✅ npm run build |
| **FASE 2** | Backend - FileUploadService | 3-4 horas | FASE 1 | ✅ npm run build |
| **FASE 3** | Backend - UserContentService | 6-8 horas | FASE 1, 2 | ✅ npm run build |
| **FASE 4** | Backend - Scheduler Service | 4-5 horas | FASE 3 | ✅ npm run build |
| **FASE 5** | Backend - Endpoints y Controller | 6-8 horas | FASE 1-4 | ✅ npm run build |
| **FASE 6** | Backend - Integración con IA | 8-10 horas | FASE 1-5 | ✅ npm run build |
| **FASE 7** | Frontend - Types y API Service | 4-5 horas | FASE 1-6 | ❌ |
| **FASE 8** | Frontend - Hooks TanStack Query | 3-4 horas | FASE 7 | ❌ |
| **FASE 9** | Frontend - Formulario y Modal | 6-8 horas | FASE 8 | ❌ |
| **FASE 10** | Frontend - Tab Noticias en Progreso | 4-5 horas | FASE 7-9 | ❌ |
| **FASE 11** | Frontend - Cintillo ÚLTIMO MOMENTO | 3-4 horas | FASE 7-10 | ❌ |
| **FASE 12** | Testing Manual y Build Final | 2-3 horas | TODAS | ✅ Build completo |

**TOTAL ESTIMADO:** 53-72 horas (6.5-9 días de trabajo efectivo)

---

## 6. CRITERIOS DE ACEPTACIÓN

### Por Fase:

**FASE 1:** ✅
- [ ] Schemas compilan sin errores
- [ ] DTOs validando correctamente
- [ ] Build exitoso

**FASE 2:** ✅
- [ ] FileUploadService sube archivos a S3
- [ ] Validaciones de tipo y tamaño funcionan
- [ ] URLs públicas generadas correctamente

**FASE 3:** ✅
- [ ] UserContentService crea urgent y normal
- [ ] Eventos de EventEmitter2 emitidos
- [ ] No hay dependencias circulares

**FASE 4:** ✅
- [ ] Cron job se ejecuta cada 5 minutos
- [ ] Detecta contenido expirado correctamente
- [ ] Llama a closeUrgentContent() exitosamente

**FASE 5:** ✅
- [ ] Todos endpoints responden correctamente
- [ ] DTOs validando requests
- [ ] Upload de archivos funcionando

**FASE 6:** ✅
- [ ] Prompts urgent generan 300-500 palabras
- [ ] Prompts normal generan 500-700 palabras
- [ ] Copys agresivos generados para urgent
- [ ] Párrafo de cierre generado correctamente

**FASE 7:** ✅
- [ ] Types TypeScript definidos
- [ ] Mapper convirtiendo correctamente
- [ ] API Service consumiendo endpoints

**FASE 8:** ✅
- [ ] Hooks custom funcionando
- [ ] TanStack Query invalidando cache
- [ ] Socket hook escuchando eventos

**FASE 9:** ✅
- [ ] Formulario valida campos
- [ ] Upload de imágenes funciona
- [ ] Modal abre y cierra correctamente

**FASE 10:** ✅
- [ ] Tab muestra noticias urgent
- [ ] Timer cuenta regresiva visible
- [ ] Botón actualizar funciona

**FASE 11:** ✅
- [ ] Cintillo muestra noticias urgent
- [ ] Auto-actualización cada 30 segundos
- [ ] Badge "URGENTE" visible

**FASE 12:** ✅
- [ ] Flujo completo urgent funciona
- [ ] Flujo completo normal funciona
- [ ] Auto-cierre después de 2 horas funciona
- [ ] Builds exitosos backend y frontend

---

## 7. RESTRICCIONES TÉCNICAS

### Backend

❌ **PROHIBIDO:**
- Usar `forwardRef` para resolver dependencias circulares
- Usar `any` en TypeScript
- Modificar outlets existentes para forzar contenido manual

✅ **OBLIGATORIO:**
- Usar `EventEmitter2` para comunicación entre servicios
- Tipado estricto en TypeScript
- Hacer build después de cada fase backend
- Campos `sourceUrl` y `domain` opcionales en schemas

### Frontend

✅ **OBLIGATORIO:**
- Seguir patrón Services → Mappers → Hooks → Components
- Usar TanStack Query para data fetching
- Usar Socket.io para actualizaciones en tiempo real
- Implementación custom de formularios (sin React Hook Form)

---

## 8. DOCUMENTOS DE REFERENCIA

- **Backend Analysis:** `/packages/api-nueva/CREATE_ORIGINAL_CONTENT_BACKEND_ANALYSIS.md`
- **Frontend Analysis:** `/CREATE_ORIGINAL_CONTENT_FRONTEND_ANALYSIS.md`
- **Flujo Actual:** `/packages/api-nueva/SCRAPING_FLOW_DIAGRAMS.md`

---

**FIN DEL PLAN DE IMPLEMENTACIÓN**

Este documento debe ser usado como guía paso a paso. Cada fase debe completarse secuencialmente y verificarse con build antes de continuar a la siguiente.
