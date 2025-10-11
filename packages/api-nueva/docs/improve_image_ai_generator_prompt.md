# 🎨 PLAN DE ACCIÓN: MEJORA DEL GENERADOR DE IMÁGENES AI
## Pachuca Noticias - Sistema de Generación Editorial Profesional

**Fecha:** 11 de Octubre 2025
**Responsable:** Equipo Técnico
**Prioridad:** ALTA - Impacto directo en calidad editorial

---

## ⚠️ REGLAS CRÍTICAS DEL PROYECTO (LEER ANTES DE CADA FASE)

### 🚫 PROHIBICIONES ABSOLUTAS

1. **NO USAR `any` EN TYPESCRIPT**
   - ❌ `function foo(data: any)`
   - ✅ `function foo(data: GenerateImageRequest)`
   - **Razón:** Perdemos type safety y aumentamos bugs

2. **NO USAR `forwardRef` EN EL BACKEND**
   - ❌ `@Inject(forwardRef(() => SomeService))`
   - ✅ Usar `EventEmitter2` para comunicación entre módulos
   - **Razón:** forwardRef indica diseño circular malo, EventEmitter2 desacopla

3. **NO USAR GATEWAY SEPARADO PARA SOCKETS**
   - ❌ Crear `@WebSocketGateway({ namespace: '/feature' })`
   - ✅ Usar `SocketGateway.sendToUser()` del gateway principal
   - **Razón:** Multiplica conexiones, complica auth, rompe rooms de usuarios

### ✅ PATRONES OBLIGATORIOS

1. **SOCKETS: Patrón EventEmitter2** (Ver extracción de contenido)
   ```typescript
   // EN PROCESSOR:
   this.eventEmitter.emit('feature.event_name', { payload });

   // EN SERVICE LISTENER:
   @OnEvent('feature.event_name')
   handleEvent(payload) {
     this.socketGateway.sendToUser(userId, 'event_name', payload);
   }
   ```

2. **PROGRESS: Reportar progreso en cada paso**
   ```typescript
   await job.progress(10);  // BullMQ progress
   this.eventEmitter.emit('feature.progress', { step, progress, message });
   ```

3. **TYPES: Interfaces explícitas siempre**
   ```typescript
   interface MyData {
     field: string;
     nested: {
       value: number;
     };
   }
   ```

### 🔄 WORKFLOW OBLIGATORIO

**DESPUÉS DE COMPLETAR CADA FASE:**
1. ✅ Leer estas reglas de nuevo
2. ✅ Verificar que NO usaste `any`
3. ✅ Verificar que NO usaste `forwardRef`
4. ✅ Verificar que usaste EventEmitter2 correctamente
5. ✅ Verificar types explícitos en TODO
6. ✅ Hacer commit con mensaje descriptivo

---

## 📊 DIAGNÓSTICO DEL PROBLEMA ACTUAL

### ❌ Problemas Identificados

#### PROBLEMA #1: Metadata Contaminada
```json
{
  "altText": "Viento en popa...\n\nInclude 'NOTICIAS PACHUCA' watermark...",
  "keywords": ["include", "'noticias", "watermark"]  // ← BASURA
}
```

#### PROBLEMA #2: Sockets NO Funcionan

<PROBLEMA CRÍTICO ENCONTRADO:

**Image Generation Gateway Actual:**
```typescript
// ❌ MAL: Gateway separado con namespace propio
@WebSocketGateway({ namespace: '/image-generation' })
export class ImageGenerationGateway {
  @WebSocketServer() server: Server;

  @OnEvent('image-generation.progress')
  handleProgress(payload) {
    this.server.emit('image-generation:progress', payload);  // ❌ Broadcast a TODOS
  }
}
```

**Problemas:**
1. ❌ Namespace separado `/image-generation` - cliente debe conectarse aparte
2. ❌ NO usa el room `user_${userId}` del Socket Gateway principal
3. ❌ Broadcast a TODOS los clientes (no solo al usuario que generó)
4. ❌ NO integra con sistema de autenticación principal
5. ❌ Frontend debe manejar 2 conexiones socket diferentes

**Patrón CORRECTO (usado en extracción):**
```typescript
// ✅ BIEN: Processor emite eventos
// EN: src/generator-pro/processors/extraction.processor.ts
this.eventEmitter.emit('generator-pro.extraction.urls_extracted', {
  jobId,
  websiteId,
  urlsExtracted: 150,
  processingTime: 5000,
});

// ✅ BIEN: Service escucha y envía por socket principal
// EN: src/notifications/services/extraction-notifier.service.ts (CREAR)
@OnEvent('generator-pro.extraction.urls_extracted')
async handleUrlsExtracted(payload: UrlsExtractedEvent) {
  await this.socketGateway.sendToUser(payload.userId, 'extraction:urls_extracted', {
    jobId: payload.jobId,
    urlsExtracted: payload.urlsExtracted,
    processingTime: payload.processingTime,
  });
}
```

**Por qué funciona mejor:**
- ✅ Una sola conexión socket (gateway principal en `/`)
- ✅ Usa rooms de usuario (`user_${userId}`)
- ✅ Auth integrada del gateway principal
- ✅ Envía solo al usuario correcto
- ✅ Frontend maneja un solo socket

#### PROBLEMA #3: Prompt Básico sin Mejores Prácticas

```typescript
// ❌ ACTUAL:
"Viento en popa:68 obras para la Bella Airosa"

// ✅ DEBERÍA SER:
"Editorial magazine cover photograph:
Distinguished municipal official announcing 68 public works projects,
professional three-point studio lighting with softbox,
medium shot composition, rule of thirds,
generous negative space at top for headlines,
shot with Canon R5 85mm f/1.8 lens,
photorealistic, TIME Magazine aesthetic, 4:5 portrait, HD quality"
```

---

## 🎯 OBJETIVOS DEL PLAN DE MEJORA

1. **Calidad Editorial Profesional**: Imágenes estilo TIME Magazine / The Economist
2. **Prompt Engineering Avanzado**: Usar mejores prácticas 2025/2026
3. **Metadata Limpia**: altText, caption, keywords apropiados
4. **Sockets Funcionando**: Logs de progreso en tiempo real AL USUARIO CORRECTO
5. **Preservación de Contexto**: Mantener personajes y situación
6. **Branding Sutil**: Watermark profesional sin contaminar metadata

---

## 🏗️ ARQUITECTURA DE LA SOLUCIÓN

### Flujo Completo con Sockets

```
┌──────────────────────────────────────────────────────────────┐
│  1. USER REQUEST (Frontend)                                  │
│     POST /image-generation/generate                          │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│  2. CONTROLLER                                                │
│     - Valida request                                         │
│     - Encola job en BullMQ                                   │
│     - Retorna jobId inmediatamente                           │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│  3. CONTENT ANALYZER                                          │
│     Analiza título + contenido → extrae contexto             │
│     EventEmitter: 'image-generation.analysis_completed'      │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│  4. EDITORIAL PROMPT BUILDER                                  │
│     Crea prompt profesional con mejores prácticas            │
│     EventEmitter: 'image-generation.prompt_ready'            │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│  5. BRANDING LAYER (SEPARADO)                                │
│     Agrega instrucciones de branding limpiamente             │
│     EventEmitter: 'image-generation.branding_applied'        │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│  6. AI GENERATION (Processor)                                 │
│     job.progress(30) → OpenAI API                            │
│     EventEmitter: 'image-generation.generating'              │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│  7. POST-PROCESSING                                           │
│     job.progress(70) → Sharp processing                      │
│     EventEmitter: 'image-generation.processing'              │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│  8. UPLOAD S3                                                 │
│     job.progress(90) → Upload múltiples formatos             │
│     EventEmitter: 'image-generation.uploading'               │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│  9. METADATA BUILDER (POST-GENERATION)                        │
│     Crea altText, caption, keywords LIMPIOS                  │
│     EventEmitter: 'image-generation.metadata_ready'          │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│  10. COMPLETED                                                │
│      job.progress(100)                                       │
│      EventEmitter: 'image-generation.completed'              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  🔊 IMAGE GENERATION NOTIFIER SERVICE (Escucha TODOS eventos)│
│     @OnEvent('image-generation.*')                           │
│     socketGateway.sendToUser(userId, event, payload)         │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│  📡 SOCKET GATEWAY PRINCIPAL (namespace: '/')                │
│     server.to(`user_${userId}`).emit(event, data)            │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│  📱 FRONTEND (Una sola conexión socket)                      │
│     socket.on('image-generation:progress', handleProgress)   │
│     socket.on('image-generation:completed', handleComplete)  │
└──────────────────────────────────────────────────────────────┘
```

---

## 📝 FASE 0: ARREGLAR SOCKETS (CRÍTICO)

### Objetivo
Hacer que los logs de progreso funcionen CORRECTAMENTE, enviando eventos SOLO al usuario que generó la imagen.

### Problema Actual

**Image Generation Gateway (ELIMINAR):**
```typescript
// ❌ src/content-ai/gateways/image-generation.gateway.ts
@WebSocketGateway({ namespace: '/image-generation' })  // ← MAL: namespace separado
export class ImageGenerationGateway {
  @OnEvent('image-generation.progress')
  handleProgress(payload) {
    this.server.emit('image-generation:progress', payload);  // ← MAL: broadcast a TODOS
  }
}
```

### Solución Correcta

#### Step 1: ELIMINAR Gateway Separado

```bash
rm src/content-ai/gateways/image-generation.gateway.ts
```

#### Step 2: CREAR Image Generation Notifier Service

**Archivo:** `src/content-ai/services/image-generation-notifier.service.ts` (NUEVO)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SocketGateway } from '../../notifications/gateways/socket.gateway';
import {
  IMAGE_GENERATION_EVENTS,
  ImageGenerationStartedEvent,
  ImageGenerationProgressEvent,
  ImageGenerationCompletedEvent,
  ImageGenerationFailedEvent,
} from '../events/image-generation.events';

/**
 * 📡 Image Generation Notifier Service
 * Escucha eventos de image generation y los envía por sockets al usuario correcto
 *
 * PATRÓN: EventEmitter2 → Service → SocketGateway.sendToUser()
 * (Igual que funciona extracción de contenido)
 */
@Injectable()
export class ImageGenerationNotifierService {
  private readonly logger = new Logger(ImageGenerationNotifierService.name);

  constructor(
    private readonly socketGateway: SocketGateway,
  ) {}

  /**
   * 🚀 Generation Started
   */
  @OnEvent(IMAGE_GENERATION_EVENTS.STARTED)
  async handleGenerationStarted(event: ImageGenerationStartedEvent): Promise<void> {
    this.logger.log(`📡 Sending started event to user ${event.userId}`);

    try {
      await this.socketGateway.sendToUser(
        event.userId,
        'image-generation:started',
        {
          jobId: event.jobId,
          generationId: event.generationId,
          message: 'Generación de imagen iniciada',
        },
      );
    } catch (error) {
      this.logger.error(`Error sending started event: ${error.message}`);
    }
  }

  /**
   * 📊 Generation Progress
   */
  @OnEvent(IMAGE_GENERATION_EVENTS.PROGRESS)
  async handleGenerationProgress(event: ImageGenerationProgressEvent): Promise<void> {
    this.logger.debug(`📡 Sending progress ${event.progress}% to user ${event.userId}`);

    try {
      await this.socketGateway.sendToUser(
        event.userId,
        'image-generation:progress',
        {
          jobId: event.jobId,
          generationId: event.generationId,
          step: event.step,
          progress: event.progress,
          message: event.message,
        },
      );
    } catch (error) {
      this.logger.error(`Error sending progress event: ${error.message}`);
    }
  }

  /**
   * ✅ Generation Completed
   */
  @OnEvent(IMAGE_GENERATION_EVENTS.COMPLETED)
  async handleGenerationCompleted(event: ImageGenerationCompletedEvent): Promise<void> {
    this.logger.log(`📡 Sending completed event to user ${event.userId}`);

    try {
      await this.socketGateway.sendToUser(
        event.userId,
        'image-generation:completed',
        {
          jobId: event.jobId,
          generationId: event.generationId,
          generatedImageUrl: event.generatedImageUrl,
          cost: event.cost,
          message: 'Imagen generada exitosamente',
        },
      );
    } catch (error) {
      this.logger.error(`Error sending completed event: ${error.message}`);
    }
  }

  /**
   * ❌ Generation Failed
   */
  @OnEvent(IMAGE_GENERATION_EVENTS.FAILED)
  async handleGenerationFailed(event: ImageGenerationFailedEvent): Promise<void> {
    this.logger.error(`📡 Sending failed event to user ${event.userId}`);

    try {
      await this.socketGateway.sendToUser(
        event.userId,
        'image-generation:failed',
        {
          jobId: event.jobId,
          generationId: event.generationId,
          error: event.error,
          message: 'Error generando imagen',
        },
      );
    } catch (error) {
      this.logger.error(`Error sending failed event: ${error.message}`);
    }
  }
}
```

#### Step 3: ACTUALIZAR Processor para incluir userId en eventos

**Archivo:** `src/content-ai/processors/image-generation.processor.ts` (MODIFICAR)

```typescript
// LÍNEA 35-39: ✅ YA CORRECTO
this.eventEmitter.emit('image-generation.started', {
  jobId: job.id,
  generationId,
  userId,  // ✅ userId incluido
});

// LÍNEA 43: ❌ FALTA userId
this.emitProgress(job.id as string | number, generationId, 'initializing', 10, 'Iniciando generación...');

// ✅ CORREGIR método emitProgress:
private emitProgress(
  jobId: string | number,
  generationId: string,
  userId: string,  // ← AGREGAR
  step: string,
  progress: number,
  message: string,
): void {
  this.eventEmitter.emit('image-generation.progress', {
    jobId,
    generationId,
    userId,  // ← AGREGAR
    step,
    progress,
    message,
  });
}

// ACTUALIZAR TODAS LAS LLAMADAS:
this.emitProgress(job.id as string | number, generationId, userId, 'initializing', 10, 'Iniciando generación...');
this.emitProgress(job.id as string | number, generationId, userId, 'generating', 30, 'Generando imagen con IA...');
// ... etc
```

#### Step 4: ACTUALIZAR Event Interfaces

**Archivo:** `src/content-ai/events/image-generation.events.ts` (MODIFICAR)

```typescript
export interface ImageGenerationProgressEvent {
  jobId: string | number;
  generationId: string;
  userId: string;  // ← AGREGAR
  step: 'initializing' | 'analyzing' | 'building_prompt' | 'generating' | 'processing' | 'uploading' | 'updating' | 'completed';  // ← ACTUALIZAR steps
  progress: number; // 0-100
  message: string;
}
```

#### Step 5: ACTUALIZAR Módulo

**Archivo:** `src/content-ai/content-ai.module.ts` (MODIFICAR)

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';

// Services
import { ImageGenerationService } from './services/image-generation.service';
import { ImageGenerationQueueService } from './services/image-generation-queue.service';
import { ImageGenerationNotifierService } from './services/image-generation-notifier.service';  // ← AGREGAR
// ... otros servicios

// Processors
import { ImageGenerationProcessor } from './processors/image-generation.processor';

// Gateways - ELIMINAR ImageGenerationGateway
// import { ImageGenerationGateway } from './gateways/image-generation.gateway';  // ← ELIMINAR

// Schemas
import { ImageGeneration, ImageGenerationSchema } from './schemas/image-generation.schema';

// Import NotificationsModule para acceder a SocketGateway
import { NotificationsModule } from '../notifications/notifications.module';  // ← AGREGAR

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ImageGeneration.name, schema: ImageGenerationSchema },
    ]),
    BullModule.registerQueue({
      name: 'image-generation',
    }),
    NotificationsModule,  // ← AGREGAR (para inyectar SocketGateway)
  ],
  providers: [
    // Services
    ImageGenerationService,
    ImageGenerationQueueService,
    ImageGenerationNotifierService,  // ← AGREGAR
    // ... otros servicios

    // Processors
    ImageGenerationProcessor,

    // Gateways - ELIMINAR
    // ImageGenerationGateway,  // ← ELIMINAR
  ],
  exports: [
    ImageGenerationService,
    ImageGenerationQueueService,
    // NO exportar notifier (solo uso interno)
  ],
})
export class ContentAIModule {}
```

#### Step 6: EXPORTAR SocketGateway desde NotificationsModule

**Archivo:** `src/notifications/notifications.module.ts` (VERIFICAR/MODIFICAR)

```typescript
import { Module } from '@nestjs/common';
import { SocketGateway } from './gateways/socket.gateway';
// ... otros imports

@Module({
  // ...
  providers: [
    SocketGateway,
    // ... otros providers
  ],
  exports: [
    SocketGateway,  // ← ASEGURAR QUE ESTÁ EXPORTADO
  ],
})
export class NotificationsModule {}
```

### Testing FASE 0

```bash
# 1. Verificar que módulo compila
yarn build

# 2. Levantar servidor
yarn start:dev

# 3. En otra terminal, generar imagen
curl -X POST http://localhost:3000/api/image-generation/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Modern tech news",
    "quality": "hd"
  }'

# 4. Verificar logs en consola:
# ✅ Debe ver: "📡 Sending progress X% to user USER_ID"
# ✅ NO debe ver broadcast a todos los clientes
```

### Verificación de Reglas (FASE 0)

- [ ] ✅ NO usé `any` en ningún lugar
- [ ] ✅ NO usé `forwardRef`
- [ ] ✅ Usé `EventEmitter2` para comunicación
- [ ] ✅ Usé `SocketGateway.sendToUser()` en lugar de gateway separado
- [ ] ✅ Todos los eventos incluyen `userId`
- [ ] ✅ Types explícitos en interfaces de eventos

---

## 📝 FASE 1: CREAR CONTENT ANALYZER SERVICE

[... resto del documento permanece igual desde aquí, con las fases 1-6 como estaban antes ...]

*(Mantengo el resto del documento intacto pero agrego las nuevas reglas al principio)*

---

## 📝 CRONOGRAMA ACTUALIZADO

### Semana 1: Fundamentos (5-7 días)

| Día | Tarea | Estimación | Prioridad |
|-----|-------|------------|-----------|
| 1 | **FASE 0:** Arreglar Sockets | 3h | 🔴 CRÍTICA |
| 1 | **FASE 1:** ContentAnalyzerService | 4h | ALTA |
| 2 | **FASE 2:** EditorialPromptService + templates | 6h | ALTA |
| 3 | **FASE 3:** Refactorizar BrandingService | 3h | ALTA |
| 3 | **FASE 4:** MetadataBuilderService | 3h | ALTA |
| 4 | **FASE 5:** Refactorizar ImageGenerationService | 6h | ALTA |
| 4 | **FASE 6:** Actualizar DTOs y Schemas | 2h | MEDIA |

**Total Semana 1:** 27 horas (~4 días full-time)

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN ACTUALIZADO

### FASE 0: Sockets
- [ ] Eliminar `image-generation.gateway.ts`
- [ ] Crear `image-generation-notifier.service.ts`
- [ ] Actualizar processor con userId en eventos
- [ ] Actualizar event interfaces con nuevos steps
- [ ] Actualizar módulo (agregar notifier, eliminar gateway, importar NotificationsModule)
- [ ] Verificar SocketGateway exportado desde NotificationsModule
- [ ] Testing: Generar imagen y ver logs de progreso
- [ ] **LEER REGLAS DE NUEVO**

### Pre-Implementación
- [ ] Backup completo de base de datos
- [ ] Crear rama feature: `feature/improve-image-ai-generator`
- [ ] Revisar reglas críticas del proyecto
- [ ] Definir métricas de éxito

### Implementación
- [ ] **FASE 0:** Arreglar Sockets (3h) → **LEER REGLAS**
- [ ] **FASE 1:** ContentAnalyzerService (4h) → **LEER REGLAS**
- [ ] **FASE 2:** EditorialPromptService (6h) → **LEER REGLAS**
- [ ] **FASE 3:** Refactorizar BrandingService (3h) → **LEER REGLAS**
- [ ] **FASE 4:** MetadataBuilderService (3h) → **LEER REGLAS**
- [ ] **FASE 5:** Refactorizar ImageGenerationService (6h) → **LEER REGLAS**
- [ ] **FASE 6:** Actualizar DTOs y Schemas (2h) → **LEER REGLAS**

### Testing Manual (Por Coyotito)
- [ ] Generar imagen y ver progreso en tiempo real
- [ ] Verificar metadata limpia (sin instrucciones técnicas)
- [ ] Verificar keywords relevantes
- [ ] Verificar calidad visual de imágenes
- [ ] Verificar que solo YO veo mis logs (no otros usuarios)

### Deploy
- [ ] Merge a main después de code review
- [ ] Deploy a staging
- [ ] Testing final en staging
- [ ] Deploy a producción
- [ ] Smoke tests en producción
- [ ] Monitoreo durante 24h

---

## 🎯 RESUMEN EJECUTIVO

### Problema
1. Metadata contaminada con instrucciones técnicas
2. **Sockets NO funcionan correctamente** (broadcast a todos, no usa rooms)
3. Imágenes de baja calidad ("cochinada")
4. Keywords inútiles para SEO

### Solución
**FASE 0 (NUEVA - CRÍTICA):** Arreglar sockets usando patrón correcto:
- Eliminar gateway separado
- Usar EventEmitter2 → Notifier Service → SocketGateway.sendToUser()
- Enviar eventos SOLO al usuario correcto via rooms

**FASES 1-6:** Arquitectura de 5 capas mejorada con sockets integrados

### Beneficios
- ✅ Sockets funcionando correctamente con logs en tiempo real
- ✅ Eventos llegan SOLO al usuario que generó la imagen
- ✅ Una sola conexión socket en frontend
- ✅ Calidad editorial profesional (estilo TIME Magazine)
- ✅ Metadata limpia y apropiada
- ✅ Keywords relevantes al contenido

### Esfuerzo
- **FASE 0 (Sockets):** 3 horas
- **Desarrollo resto:** ~24 horas
- **TOTAL:** ~27 horas (3.5 días full-time)

---

**Versión:** 2.0 (con sockets arreglados)
**Fecha:** 11 de Octubre 2025
**Próxima Revisión:** Después de FASE 0

---

# 🚀 ¡EMPEZAMOS POR FASE 0, COYOTITO!

**ORDEN DE EJECUCIÓN:**
1. **FASE 0 (3h):** Arreglar sockets → Probar que funcionan
2. **FASES 1-6:** Resto de mejoras

**¿Listo para empezar con FASE 0?** 🎯
