# 🐛 BUG: Generación de Imágenes con IA - Análisis Real del Código

**Fecha:** 13 Octubre 2025
**Autor:** Jarvis (Claude Code)
**Estado:** Análisis completo - Esperando luz verde para implementación

---

## 📋 TABLA DE CONTENIDOS
1. [QUÉ TENEMOS (Estado Actual del Código)](#1-qué-tenemos-estado-actual-del-código)
2. [QUÉ QUEREMOS (Objetivos del Fix)](#2-qué-queremos-objetivos-del-fix)
3. [PROBLEMAS IDENTIFICADOS](#3-problemas-identificados)
4. [PLAN DE IMPLEMENTACIÓN](#4-plan-de-implementación)
5. [REGLAS DE IMPLEMENTACIÓN](#5-reglas-de-implementación)

---

## 1. QUÉ TENEMOS (Estado Actual del Código)

### 1.1 BACKEND - API (NestJS)

#### ✅ LO QUE FUNCIONA:

**1. OpenAI Adapter** (`openai.adapter.ts`)
- ✅ Líneas 406-468: Método `generateImage()` funcional usando `/images/generations`
- ✅ Líneas 475-550: Método `editImage()` EXISTE y está bien implementado usando `/images/edits`
- ✅ Costo calculado correctamente (línea 672-689)
- ✅ Manejo de FormData para multipart (línea 485-510)
- ✅ Conversión de Buffer a Blob correcta (línea 488-489)

**2. Image Generation Processor** (`image-generation.processor.ts`)
- ✅ Línea 38: Emite evento `image-generation.started` vía EventEmitter2
- ✅ Línea 46: Emite progreso usando `emitProgress()` privado
- ✅ Línea 173: Emite evento `image-generation.completed`
- ✅ Línea 193: Emite evento `image-generation.failed`
- ✅ Línea 230: Método `emitProgress()` con estructura correcta
- ✅ Post-processing completo: 12 variantes (4 tamaños × 3 formatos)
- ✅ Upload a S3 automático

**3. Image Generation Service** (`image-generation.service.ts`)
- ✅ Línea 152-153: Campos `sourceImageId` y `sourceImageUrl` se guardan en BD
- ✅ Línea 169-181: Job data incluye todos los campos necesarios
- ✅ Análisis de contenido funcional (ContentAnalyzerService)
- ✅ Prompt editorial profesional (EditorialPromptService)

**4. Image Generation Notifier** (`image-generation-notifier.service.ts`)
- ✅ Línea 43: @OnEvent escucha `IMAGE_GENERATION_EVENTS.STARTED`
- ✅ Línea 73: @OnEvent escucha `IMAGE_GENERATION_EVENTS.PROGRESS`
- ✅ Línea 98: @OnEvent escucha `IMAGE_GENERATION_EVENTS.COMPLETED`
- ✅ Línea 123: @OnEvent escucha `IMAGE_GENERATION_EVENTS.FAILED`
- ✅ Línea 48: Usa `socketGateway.sendToUser()` correctamente
- ✅ Eventos con prefijo `image-generation:*` (línea 50, 80, 105, 130)

**5. Socket Gateway** (`socket.gateway.ts`)
- ✅ Línea 356: Método público `sendToUser()` funcional
- ✅ Línea 102: Join a room `user_${userId}` automático
- ✅ Redis Adapter configurado (línea 49-60)
- ✅ Autenticación JWT funcional

**6. Events Definitions** (`image-generation.events.ts`)
- ✅ Todos los eventos tipados correctamente
- ✅ Interfaces exportadas: Started, Progress, Completed, Failed

#### ❌ LO QUE NO FUNCIONA:

**1. NO se usa `editImage()` cuando hay imagen de referencia**
- ❌ Línea 61 de `processor.ts`: SIEMPRE llama `provider.generateImage()`
- ❌ NO verifica si hay `sourceImageId` o `sourceImageUrl` en job.data
- ❌ Campo `sourceImageId` existe en schema (línea 152 service) pero se ignora
- ❌ Campo `sourceImageUrl` existe en schema (línea 153 service) pero se ignora

**2. Service NO descarga imagen de referencia**
- ❌ `generateNewsImage()` NO descarga imagen si hay `sourceImageId`
- ❌ NO pasa buffer de imagen al job data
- ❌ Job data NO incluye campo para `referenceImageBuffer`

---

### 1.2 MOBILE - App (React Native + Expo)

#### ✅ LO QUE FUNCIONA:

**1. Socket Types** (`socket.types.ts`)
- ✅ Línea 107-137: Interfaces de eventos YA EXISTEN:
  - `ImageGenerationStartedEvent`
  - `ImageGenerationProgressEvent`
  - `ImageGenerationCompletedEvent`
  - `ImageGenerationFailedEvent`
- ✅ Línea 235-238: Eventos en `SocketEventMap` YA DEFINIDOS:
  - `image-generation:started`
  - `image-generation:progress`
  - `image-generation:completed`
  - `image-generation:failed`

**2. Socket Service** (`SocketService.ts`)
- ✅ Singleton funcional (línea 19-24)
- ✅ Conexión automática con JWT (línea 42-43)
- ✅ Headers correctos (`x-platform: mobile`, `x-device-id`)
- ✅ Método `emit()` tipado (línea 154)

**3. useContentGenerationSocket Hook** (`useContentGenerationSocket.ts`)
- ✅ **PATRÓN PERFECTO PARA SEGUIR**:
  - Línea 23: Set de `processingIds`
  - Línea 26-41: Métodos `addProcessingId()` y `removeProcessingId()`
  - Línea 65: `SocketService.getInstance(queryClient)`
  - Línea 77-81: Handler con logging
  - Línea 89-99: Invalidar queries de React Query
  - Línea 114-116: Registrar listeners con `socket.on()`
  - Línea 121-126: Cleanup con `socket.off()`
  - Línea 131-133: Return `{ processingIds, isProcessing }`

**4. Image Generation API** (`imageGenerationApi.ts`)
- ✅ Línea 39: Usa `ApiClient.getRawClient()` correctamente
- ✅ Línea 40: Mappers bidireccionales funcionan
- ✅ Línea 47: Timeout de 120s para requests largos
- ✅ Todos los endpoints funcionan (getById, getGenerations, getJobStatus, etc.)

**5. useImageGeneration Hook** (`useImageGeneration.ts`)
- ✅ Mutation hook funcional
- ✅ Línea 34: Invalidate queries después de mutate
- ✅ Error handling correcto

#### ❌ LO QUE NO FUNCIONA:

**1. NO existe hook `useImageGenerationSocket`**
- ❌ NO hay equivalente a `useContentGenerationSocket` para imágenes
- ❌ Pantallas NO escuchan eventos `image-generation:*`
- ❌ NO hay estado de progreso en tiempo real

**2. SocketService NO expone socket**
- ❌ Línea 11 de `SocketService.ts`: `socket` es `private`
- ❌ Para usar `socket.on()` necesitamos acceso público
- ❌ Necesitamos agregar getter `get socket()` público

**3. NO hay pantallas identificadas**
- ❌ Directorio `features/image-bank/screens` no existe
- ❌ Necesito encontrar dónde está la UI de generación de imágenes
- ❌ No sé dónde integrar el hook cuando esté listo

---

## 2. QUÉ QUEREMOS (Objetivos del Fix)

### 2.1 BACKEND

**OBJETIVO 1: Usar imagen de referencia cuando esté disponible**
- ✅ Si `sourceImageId` presente → descargar de ImageBank
- ✅ Si `sourceImageUrl` presente → descargar de URL
- ✅ Convertir a PNG con alpha channel (requerido por OpenAI)
- ✅ Pasar buffer al processor
- ✅ Processor usa `editImage()` en vez de `generateImage()`

**OBJETIVO 2: Eventos socket ya funcionan**
- ✅ Notifier service YA funciona correctamente
- ✅ SocketGateway YA reenvía eventos
- ✅ NO necesitamos modificar esta parte
- ✅ Solo agregar logs si es necesario

---

### 2.2 MOBILE

**OBJETIVO 1: Crear hook para progreso en tiempo real**
- ✅ `useImageGenerationSocket` siguiendo patrón de `useContentGenerationSocket`
- ✅ Escuchar eventos `image-generation:*`
- ✅ Mantener Set de `processingGenerations`
- ✅ Invalidar queries automáticamente

**OBJETIVO 2: Exponer socket en SocketService**
- ✅ Cambiar `private socket` a getter público
- ✅ Mantener encapsulación pero permitir acceso a listeners

**OBJETIVO 3: Integrar en UI**
- ✅ Encontrar pantallas de generación de imágenes
- ✅ Integrar hook con loading states
- ✅ Mostrar progreso en tiempo real
- ✅ Manejar errores visualmente

---

## 3. PROBLEMAS IDENTIFICADOS

### Problema 1: Backend ignora imagen de referencia

**Ubicación:** `image-generation.processor.ts:61`

**Código actual:**
```typescript
const result = await provider.generateImage({
  prompt,
  quality,
  size,
  outputFormat: 'png',
});
```

**Por qué falla:**
- Siempre usa `/images/generations` (NO acepta imágenes)
- Campos `sourceImageId` y `sourceImageUrl` del job.data NO se usan
- Service NO descarga la imagen antes de encolar job

**Solución:**
1. Service debe descargar imagen si hay `sourceImageId`/`sourceImageUrl`
2. Convertir a Buffer y validar formato PNG
3. Pasar buffer en job data
4. Processor debe detectar si hay buffer y usar `editImage()`

---

### Problema 2: SocketService no expone socket

**Ubicación:** `SocketService.ts:11`

**Código actual:**
```typescript
private socket: Socket | null = null
```

**Por qué falla:**
- Hooks necesitan hacer `socket.on()` para registrar listeners
- Socket es privado, no accesible desde fuera
- No podemos seguir el patrón de `useContentGenerationSocket`

**Solución:**
Agregar getter público:
```typescript
get socket(): Socket | null {
  return this.socket
}
```

---

### Problema 3: NO hay hook para eventos de image generation

**Ubicación:** Falta crear archivo

**Por qué falla:**
- Eventos del backend llegan correctamente
- Mobile NO tiene nadie escuchando
- Pantallas NO se actualizan en tiempo real
- Puede causar crashes si llega evento sin handler

**Solución:**
Crear `useImageGenerationSocket.ts` siguiendo patrón exacto de `useContentGenerationSocket.ts`

---

## 4. PLAN DE IMPLEMENTACIÓN

---

### FASE 1: Backend - Soportar Imagen de Referencia (3-4 horas)

**Archivos a modificar:**
1. `openai.adapter.ts` - Agregar método wrapper
2. `image-generation.service.ts` - Descargar imagen
3. `image-generation-queue.service.ts` - Agregar campo buffer
4. `image-generation.processor.ts` - Usar editImage cuando corresponda

#### Micro-tareas:

##### 1.1 Agregar campo `referenceImageBuffer` a job data

- [ ] **1.1.1** Modificar interface `ImageGenerationJobData` en `image-generation-queue.service.ts`
  ```typescript
  export interface ImageGenerationJobData {
    // ... campos existentes
    referenceImageBuffer?: Buffer; // NUEVO
  }
  ```

##### 1.2 Service: Descargar imagen de referencia

- [ ] **1.2.1** Agregar método `downloadReferenceImage()` en `image-generation.service.ts`
  - Si `sourceImageId` → buscar en ImageBank
  - Si `sourceImageUrl` → fetch de URL
  - Validar que sea imagen válida
  - Convertir a PNG con sharp si no lo es
  - Retornar Buffer

- [ ] **1.2.2** Modificar `generateNewsImage()` para usar nuevo método
  - Línea ~169: Antes de encolar job, llamar a `downloadReferenceImage()`
  - Si hay buffer, incluirlo en job data
  - Logging claro: "Using reference image from ImageBank/URL"

##### 1.3 Processor: Detectar y usar editImage

- [ ] **1.3.1** Modificar `handleImageGeneration()` en `image-generation.processor.ts`
  - Línea ~61: Extraer `referenceImageBuffer` de job.data
  - Si existe buffer:
    ```typescript
    const result = await provider.editImage({
      imageBuffer: referenceImageBuffer,
      prompt,
      size,
    });
    ```
  - Si NO existe buffer (caso actual):
    ```typescript
    const result = await provider.generateImage({
      prompt,
      quality,
      size,
      outputFormat: 'png',
    });
    ```
  - Logging: "Using /images/edits" vs "Using /images/generations"

##### Build y Test

- [ ] **1.4** Build de API
  ```bash
  cd packages/api-nueva
  yarn build
  ```

- [ ] **1.5** Test manual con Postman
  - Request SIN `sourceImageId` → debe usar /generations
  - Request CON `sourceImageId` válido → debe usar /edits
  - Verificar logs muestran endpoint correcto

**Criterio de éxito:**
- ✅ Build compila sin errores
- ✅ Logs dicen "Using /images/edits" cuando hay sourceImageId
- ✅ Logs dicen "Using /images/generations" cuando NO hay
- ✅ Imagen generada usa referencia como inspiración (visual test)

**Tiempo estimado:** 3-4 horas

---

### FASE 2: Mobile - Exponer Socket en SocketService (15 minutos)

**Archivo a modificar:**
1. `SocketService.ts`

#### Micro-tareas:

- [ ] **2.1** Agregar getter público para socket
  - Línea ~200 (después de `get connectionState`):
  ```typescript
  /**
   * Get socket instance for registering custom listeners
   * Used by hooks like useImageGenerationSocket
   */
  get socket(): Socket | null {
    return this.socket
  }
  ```

**Criterio de éxito:**
- ✅ TypeScript compila sin errores
- ✅ `socketService.socket` es accesible desde hooks

**Tiempo estimado:** 15 minutos

---

### FASE 3: Mobile - Crear Hook useImageGenerationSocket (2 horas)

**Archivo a crear:**
1. `useImageGenerationSocket.ts`

#### Micro-tareas:

##### 3.1 Crear archivo y estructura base

- [ ] **3.1.1** Crear `packages/mobile-expo/src/hooks/useImageGenerationSocket.ts`
- [ ] **3.1.2** Copiar estructura completa de `useContentGenerationSocket.ts`
- [ ] **3.1.3** Renombrar:
  - `ContentGenerationSocketOptions` → `ImageGenerationSocketOptions`
  - `processingIds` se mantiene igual
  - Eventos: `image-generation:started|progress|completed|failed`

##### 3.2 Implementar callbacks

- [ ] **3.2.1** Tipos de opciones:
  ```typescript
  interface ImageGenerationSocketOptions {
    onGenerationStarted?: (data: SocketAPI.ImageGenerationStartedEvent) => void;
    onGenerationProgress?: (data: SocketAPI.ImageGenerationProgressEvent) => void;
    onGenerationCompleted?: (data: SocketAPI.ImageGenerationCompletedEvent) => void;
    onGenerationFailed?: (data: SocketAPI.ImageGenerationFailedEvent) => void;
  }
  ```

##### 3.3 Implementar handlers

- [ ] **3.3.1** Handler `handleGenerationStarted`:
  - Agregar `generationId` a `processingIds`
  - Llamar callback opcional
  - Logging: `📨 [Socket Event] image-generation:started`

- [ ] **3.3.2** Handler `handleGenerationProgress`:
  - Solo logging (NO agregar/remover de Set)
  - Llamar callback opcional
  - Logging: `📊 [Socket Event] Progress: ${progress}%`

- [ ] **3.3.3** Handler `handleGenerationCompleted`:
  - Remover `generationId` de `processingIds`
  - Invalidar queries:
    ```typescript
    queryClient.invalidateQueries({ queryKey: imageGenerationKeys.lists() });
    queryClient.invalidateQueries({ queryKey: imageGenerationKeys.detail(generationId) });
    queryClient.invalidateQueries({ queryKey: imageGenerationKeys.stats() });
    ```
  - Llamar callback opcional
  - Logging: `✅ [Socket Event] image-generation:completed`

- [ ] **3.3.4** Handler `handleGenerationFailed`:
  - Remover `generationId` de `processingIds`
  - Invalidar queries de lists
  - Llamar callback opcional
  - Logging: `❌ [Socket Event] image-generation:failed`

##### 3.4 Registrar y limpiar listeners

- [ ] **3.4.1** useEffect con dependencies correctas:
  ```typescript
  useEffect(() => {
    const socketService = SocketService.getInstance(queryClient);
    const socket = socketService.socket;

    if (!socket) {
      console.warn('⚠️ [useImageGenerationSocket] Socket not available');
      return;
    }

    socket.on('image-generation:started', handleGenerationStarted);
    socket.on('image-generation:progress', handleGenerationProgress);
    socket.on('image-generation:completed', handleGenerationCompleted);
    socket.on('image-generation:failed', handleGenerationFailed);

    return () => {
      socket.off('image-generation:started', handleGenerationStarted);
      socket.off('image-generation:progress', handleGenerationProgress);
      socket.off('image-generation:completed', handleGenerationCompleted);
      socket.off('image-generation:failed', handleGenerationFailed);
    };
  }, [queryClient, addProcessingId, removeProcessingId, ...callbacks]);
  ```

##### 3.5 Return values

- [ ] **3.5.1** Return objeto:
  ```typescript
  return {
    processingIds,
    isProcessing: (id: string) => processingIds.has(id)
  };
  ```

**Criterio de éxito:**
- ✅ TypeScript compila sin errores
- ✅ Hook se puede importar sin problemas
- ✅ NO hay warnings de useEffect dependencies
- ✅ Logging muestra eventos llegando

**Tiempo estimado:** 2 horas

---

### FASE 4: Mobile - Integrar Hook en UI (2-3 horas)

**Archivos a identificar y modificar:**
- Pantallas de generación de imágenes (por encontrar)

#### Micro-tareas:

##### 4.1 Encontrar pantallas

- [ ] **4.1.1** Buscar archivos:
  ```bash
  find packages/mobile-expo/src -name "*[Ii]mage*[Gg]enerat*" -o -name "*[Aa]i*[Ii]mage*"
  ```

- [ ] **4.1.2** Identificar:
  - Pantalla de generación (formulario)
  - Pantalla de detalle de generación
  - Lista de generaciones

##### 4.2 Integrar en pantalla de detalle

- [ ] **4.2.1** Importar hook:
  ```typescript
  import { useImageGenerationSocket } from '@/src/hooks/useImageGenerationSocket';
  ```

- [ ] **4.2.2** Usar hook con callbacks:
  ```typescript
  const { isProcessing } = useImageGenerationSocket({
    onGenerationCompleted: (data) => {
      refetch(); // Refetch generation detail
    },
    onGenerationFailed: (data) => {
      Alert.alert('Error', data.error);
    }
  });
  ```

- [ ] **4.2.3** Mostrar loading state:
  ```typescript
  {isProcessing(generationId) && (
    <ActivityIndicator />
  )}
  ```

##### 4.3 Integrar en lista (opcional)

- [ ] **4.3.1** Mostrar badge "Procesando" en items siendo generados
- [ ] **4.3.2** Actualizar automáticamente cuando complete

**Criterio de éxito:**
- ✅ Pantalla compila sin errores
- ✅ Loading se muestra cuando genera
- ✅ Al completar, se actualiza automáticamente
- ✅ Al fallar, se muestra error
- ✅ NO hay crashes

**Tiempo estimado:** 2-3 horas

---

### FASE 5: Testing Manual Completo (2-3 horas)

#### Micro-tareas:

##### 5.1 Test Backend

- [ ] **5.1.1** Levantar servicios:
  ```bash
  docker-compose up -d
  cd packages/api-nueva && yarn start:dev
  ```

- [ ] **5.1.2** Test con Postman:
  - POST /image-generation/generate SIN `sourceImageId`
  - Verificar logs: "Using /images/generations"
  - POST /image-generation/generate CON `sourceImageId` válido
  - Verificar logs: "Using /images/edits"
  - Verificar logs de notifier: "Sending started/progress/completed"

##### 5.2 Test Mobile

- [ ] **5.2.1** Configurar mobile para local:
  - Apuntar a `http://localhost:4000/api`
  - Verificar socket conecta

- [ ] **5.2.2** Test flujo completo:
  - Generar imagen SIN referencia
  - Verificar progreso en tiempo real
  - Verificar imagen se muestra al completar
  - Generar imagen CON referencia (desde imagen del banco)
  - Verificar usa referencia como inspiración
  - Verificar progreso en tiempo real

##### 5.3 Test casos edge

- [ ] **5.3.1** Generar y cerrar app inmediatamente
- [ ] **5.3.2** Generar y salir de pantalla
- [ ] **5.3.3** Generar múltiples imágenes simultáneas
- [ ] **5.3.4** Simular fallo de red durante generación

**Criterio de éxito:**
- ✅ TODOS los casos pasan sin crashes
- ✅ Progreso se muestra correctamente
- ✅ Imágenes con referencia usan la inspiración
- ✅ Eventos socket NO causan crashes
- ✅ Performance aceptable (< 30s total)

**Tiempo estimado:** 2-3 horas

---

## 5. REGLAS DE IMPLEMENTACIÓN

### 5.1 Código

1. **NO usar `any`**
   - Todos los tipos explícitos
   - Usar `unknown` si realmente no se conoce
   - Type guards antes de usar

2. **NO usar `forwardRef`**
   - Backend YA usa EventEmitter2 correctamente
   - NO tocar esta arquitectura
   - Mobile usa hooks estándar

3. **Seguir patrón mobile**
   - `ApiClient.getRawClient()`
   - Mappers bidireccionales
   - Namespaces API/App separados

4. **Logging consistente**
   - Backend: `this.logger.log/error/warn`
   - Mobile: `console.log` con prefijo `[HookName]`
   - Formato: `"🔥 [ServiceName] Mensaje"`

5. **Error handling exhaustivo**
   - Try-catch en todos los puntos críticos
   - Errores claros y legibles
   - NO dejar que un error rompa todo

6. **TypeScript estricto**
   - `strict: true` debe pasar
   - NO usar `@ts-ignore`
   - Preferir interfaces sobre types

### 5.2 Testing

1. **Solo testing manual** (por ahora)
   - Documentar casos ejecutados
   - Validar cada micro-tarea
   - NO testing unitario en esta fase

2. **Regression testing**
   - Después de cada fase, verificar funcionalidad anterior
   - NO introducir bugs nuevos

### 5.3 Git

1. **Commits pequeños**
   - Un commit por micro-tarea
   - Formato: `feat(image-gen): descripción`
   - NO commits gigantes

2. **Branch dedicado**
   - `fix/image-generation-reference-images`
   - NO pushear a main hasta completar

### 5.4 Builds

1. **Build después de cada fase backend**
   - Verificar compila sin errores
   - Verificar arranca correctamente
   - Logs sin errores

2. **NO builds innecesarios**
   - Si solo cambia mobile, NO rebuild API

---

## 📊 TIEMPO TOTAL ESTIMADO

| Fase | Descripción | Tiempo |
|------|-------------|--------|
| FASE 1 | Backend - Soporte imagen referencia | 3-4h |
| FASE 2 | Mobile - Exponer socket | 15min |
| FASE 3 | Mobile - Hook socket | 2h |
| FASE 4 | Mobile - Integrar UI | 2-3h |
| FASE 5 | Testing manual | 2-3h |
| **TOTAL** | | **10-12h** |

**Distribución recomendada:**
- **Día 1:** FASE 1 completa (3-4h)
- **Día 2:** FASE 2 + FASE 3 (2-3h)
- **Día 3:** FASE 4 + FASE 5 (4-6h)

---

## ✅ CHECKLIST FINAL

- [ ] FASE 1: Backend soporta imagen de referencia
- [ ] FASE 2: SocketService expone socket
- [ ] FASE 3: Hook useImageGenerationSocket creado
- [ ] FASE 4: Hook integrado en UI
- [ ] FASE 5: Testing manual completo
- [ ] Build de API funciona
- [ ] Mobile compila sin errores
- [ ] NO hay crashes
- [ ] Documentación actualizada
- [ ] Branch listo para merge

---

**FIN DEL DOCUMENTO**

---

*Este documento está basado en análisis REAL del código. NO mover código hasta recibir luz verde de Coyotito.*
