# 🎯 RAPIDAPI FACEBOOK ASYNC EXTRACTION CONTEXTO 2025

## 📊 HALLAZGOS DE LA INVESTIGACIÓN

### ❌ PROBLEMAS IDENTIFICADOS

1. **EXTRACCIÓN SIMULADA EN LUGAR DE REAL**
   - `extract-page-posts-async` línea 387: `setTimeout` en lugar de Bull Queue real
   - `getPagePosts()` en servicio: NO hace llamadas reales a RapidAPI
   - Posts extraídos NO se guardan en colección `RapidAPIFacebookPost`
   - Solo simula extracción pero no persiste datos

2. **FALTA INTEGRACIÓN CON SISTEMA DE NOTIFICACIONES**
   - Línea 399: `// TODO: Emit WebSocket event with results` - sin implementar
   - Sistema dual Socket.IO + Push existe pero NO está conectado
   - Cliente frontend NO recibe notificaciones de progreso
   - No hay feedback en tiempo real del estado de extracción

3. **BULL QUEUE NO IMPLEMENTADO**
   - Comentario línea 385: `// TODO: Implement actual job queue (Bull/BullMQ)`
   - Sin procesamiento background real
   - No hay manejo de jobs, retry, o tracking de estado
   - Timeout falso en lugar de job queue

4. **FALTA SCHEMA PARA JOBS TRACKING**
   - No existe `RapidAPIExtractionJob` schema para rastrear jobs
   - Sin estados: pending, processing, completed, failed
   - No hay jobId real para tracking del progreso

5. **CLIENTE RAPIDAPI MOCK**
   - `RapidAPIFacebookService.getPagePosts()` probablemente retorna data falsa
   - Sin headers de autenticación RapidAPI real
   - No maneja rate limits ni quotas
   - Falta integración con API real de Facebook Scraper

6. **FRONTEND DESCONECTADO**
   - `useRapidAPIPages.ts` no tiene conexión Socket.IO
   - No escucha eventos de extracción async
   - Sin progress indicators en tiempo real
   - Usuario no sabe cuándo termina la extracción

### ✅ COMPONENTES DISPONIBLES PERO NO CONECTADOS

**Sistema de Notificaciones Existente:**
- ✅ `SocketGateway` en `/src/notifications/gateways/socket.gateway.ts`
- ✅ `NotificationRouterService` con `sendOnlySocket()`, `sendToAllDevices()`
- ✅ Rooms por usuario: `user_${userId}`
- ✅ Autenticación JWT/session funcionando

**Schemas y Módulos:**
- ✅ `RapidAPIFacebookPost` schema existe y está bien tipado
- ✅ `RapidAPIFacebookPage` con stats tracking
- ✅ NotificationsModule ya importado en app

---

## 🔧 CHECKLIST DE MICROTAREAS

### 🚨 REGLAS OBLIGATORIAS
- ✅ **PROHIBIDO** usar `any` en TypeScript
- ✅ **PROHIBIDO** usar `forwardRef` - usar EventEmitter2 si hay dependencias circulares
- ✅ **PROHIBIDO** hacer `yarn start` o `yarn start:dev` - solo hacer build
- ✅ **OBLIGATORIO** verificar Redis cache y flush si es necesario
- ✅ **OBLIGATORIO** leer este contexto antes de cada tarea
- ✅ **OBLIGATORIO** marcar tarea terminada antes de empezar siguiente
- ✅ **OBLIGATORIO** anotar cualquier desviación del plan en este documento

---

### 📝 TAREA 1: CREAR SCHEMA PARA JOBS TRACKING
- [ ] Crear `/src/rapidapi-facebook/schemas/rapidapi-extraction-job.schema.ts`
- [ ] Definir estados: `'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'`
- [ ] Campos: `jobId`, `pageId`, `userId`, `configId`, `status`, `progress`, `error`, `createdAt`, `startedAt`, `completedAt`
- [ ] Agregar al module imports
- [ ] Hacer build para verificar tipos

### 📝 TAREA 2: IMPLEMENTAR BULL QUEUE REAL
- [ ] Instalar `@nestjs/bull` y `bull` dependencias
- [ ] Crear `/src/rapidapi-facebook/queues/extraction-queue.module.ts`
- [ ] Registrar queue: `BullModule.forRoot()` con Redis config
- [ ] Crear processor: `/src/rapidapi-facebook/processors/extraction.processor.ts`
- [ ] Importar en RapidAPIFacebookModule

### 📝 TAREA 3: INTEGRAR NOTIFICATIONROUTERSERVICE
- [ ] Inyectar `NotificationRouterService` en `RapidAPIFacebookController`
- [ ] Importar `NotificationsModule` en `RapidAPIFacebookModule`
- [ ] Crear método `notifyExtractionProgress()` en controller
- [ ] Usar `sendOnlySocket()` para notificaciones web
- [ ] Agregar userId a endpoints que lo requieren

### 📝 TAREA 4: IMPLEMENTAR EXTRACCIÓN REAL CON RAPIDAPI
- [ ] Configurar HttpService con headers RapidAPI en `RapidAPIFacebookService`
- [ ] Headers: `X-RapidAPI-Key`, `X-RapidAPI-Host: facebook-scraper-api.p.rapidapi.com`
- [ ] Environment vars: `RAPIDAPI_KEY`, `RAPIDAPI_FACEBOOK_HOST`
- [ ] Implementar llamada real a `/page/posts` endpoint
- [ ] Manejar rate limits y timeouts

### 📝 TAREA 5: PERSISTENCE DE POSTS EXTRAÍDOS
- [ ] Crear método `saveExtractedPosts()` en service
- [ ] Mapear respuesta RapidAPI → `RapidAPIFacebookPost` schema
- [ ] Deduplicación por `facebookPostId`
- [ ] Actualizar stats en página: `totalPostsExtracted`, `lastSuccessfulExtraction`
- [ ] Usar transacciones para consistency

### 📝 TAREA 6: REEMPLAZAR SETTIMEOUT CON BULL QUEUE
- [ ] Eliminar `setTimeout` de línea 387 en controller
- [ ] Usar `extractionQueue.add()` para crear job real
- [ ] Processor debe: llamar RapidAPI → mapear posts → guardar → notificar
- [ ] Retornar jobId real para tracking
- [ ] Manejar errores y retry logic

### 📝 TAREA 7: SOCKET EVENTS PARA EXTRACCIÓN
- [ ] Definir eventos: `extraction-started`, `extraction-progress`, `extraction-completed`, `extraction-failed`
- [ ] Emitir evento start al crear job
- [ ] Emitir progress durante procesamiento
- [ ] Emitir completed/failed al terminar
- [ ] Incluir datos: jobId, pageId, postsExtracted, errors

### 📝 TAREA 8: FRONTEND SOCKET.IO CLIENT
- [ ] Crear hook `useSocketConnection()` en `/dash-coyote/src/hooks/`
- [ ] Conectar con backend Socket.IO
- [ ] Escuchar eventos de extracción en `useRapidAPIPages`
- [ ] Mostrar progress indicators en tabla
- [ ] Toast notifications para success/error

### 📝 TAREA 9: UX TIEMPO REAL
- [ ] Progress bar en tabla durante extracción activa
- [ ] Disable botón "Extraer" durante job activo
- [ ] Show spinner con progress percentage
- [ ] Auto-refresh data al completar extracción
- [ ] Toast con summary de posts extraídos

### 📝 TAREA 10: BUILD FINAL Y VERIFICACIÓN
- [ ] Hacer build del backend: `yarn build`
- [ ] Verificar que no hay errores de tipado
- [ ] Probar flujo completo: trigger → job → notificación → UI update
- [ ] Verificar que posts se guardan en BD
- [ ] Confirmar que socket events llegan al frontend

---

## 📋 LOG DE DESVIACIONES

*(Pendiente de completar durante implementación)*

---

## 🎯 FLUJO OBJETIVO FINAL

### 🔄 **Extracción Async Completa:**

1. **👤 Usuario click "Extraer Posts"**
2. **🚀 Frontend:** `extractPostsAsync(pageId, configId)`
3. **📡 Backend:** Crear job en Bull Queue
4. **🔔 Socket:** Emit `extraction-started` → Frontend
5. **⚡ Processor:** Llamar RapidAPI → Parse → Guardar posts
6. **📊 Progress:** Emit `extraction-progress` durante proceso
7. **✅ Complete:** Emit `extraction-completed` + stats
8. **🔄 Frontend:** Auto-refresh table + toast notification

### 🎮 **UX Esperada:**
- ✅ **Respuesta inmediata**: "Extracción iniciada" (no wait 30 segundos)
- ✅ **Progress real-time**: Progress bar con percentage
- ✅ **Notificación final**: Toast con "X posts extraídos exitosamente"
- ✅ **Data persistente**: Posts guardados en BD y consultables
- ✅ **Estado visual**: Button disabled durante job activo

### 🔌 **Socket Events Schema:**
```typescript
// extraction-started
{ jobId: string, pageId: string, expectedPosts: number }

// extraction-progress
{ jobId: string, progress: number, postsProcessed: number }

// extraction-completed
{ jobId: string, postsExtracted: number, duration: number, errors: string[] }

// extraction-failed
{ jobId: string, error: string, retryCount: number }
```

## 🎯 OBJETIVO FINAL
- ✅ Extracción real de posts via RapidAPI
- ✅ Jobs async con Bull Queue
- ✅ Notificaciones Socket.IO en tiempo real
- ✅ Posts persistidos en MongoDB
- ✅ UX transparente con feedback inmediato
- ✅ Sin timeouts bloqueantes, todo async
- ✅ Error handling robusto con retry
- ✅ Build exitoso sin `any` types