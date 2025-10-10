# 📋 DOCUMENTO DE CONTEXTO - Pantalla Outlet Individual

**Proyecto:** Mobile Expo Dashboard - Pachuca Noticias
**Fecha:** 2025-10-09
**Desarrollador:** Jarvis para Coyotito
**Última actualización:** 2025-10-09 19:45 (Investigación completa de notificaciones y logs)

---

## ⚠️ CAMBIO IMPORTANTE EN EL ALCANCE

### **NUEVA FUNCIONALIDAD: Extracción Completa con Notificaciones en Tiempo Real**

El botón "Comenzar Extracción" en la pantalla de outlet ahora debe:

1. **Extraer TODAS las URLs** del sitio (scraping de listado)
2. **Extraer TODO el contenido** de cada URL encontrada (scraping de contenido)
3. **Notificar progreso en tiempo real** vía WebSocket/Push Notifications
4. **Mostrar logs en vivo** en la pantalla usando un componente de logs

---

## 🔍 HALLAZGOS DEL ANÁLISIS

### 1. ARQUITECTURA ACTUAL DEL PROYECTO MOBILE-EXPO

#### **Estructura de Capas**
```
Componentes (UI)
    ↓ usan
Hooks con React Query (useGeneratorPro)
    ↓ llaman
Servicios API (generatorProApi)
    ↓ usan
ApiClient (HTTP + Auth con token automático)
    ↓ transforma con
Mappers (API ↔ App)
```

#### **Patrón de Organización**
- **Servicios:** `/src/services/{module}/{module}Api.ts`
- **Hooks:** `/src/hooks/use{Module}.ts`
- **Mappers:** `/src/utils/mappers.ts` (clases estáticas)
- **Pantallas:** `/app/(protected)/(tabs)/` y `/app/(protected)/{module}/`

#### **Stack Tecnológico**
- **Routing:** Expo Router (file-based)
- **State Management:** @tanstack/react-query + zustand
- **HTTP Client:** Axios con ApiClient singleton
- **UI Components:** react-native-reusables (shadcn-like)
- **Styling:** NativeWind (Tailwind CSS)
- **Auth:** Token automático en headers via interceptores

---

### 2. BACKEND DASH-COYOTE - ENDPOINTS DISPONIBLES

#### **Obtener Outlet Individual**
❌ **NO EXISTE** endpoint `GET /api/generator-pro/websites/:id`

✅ **SOLUCIÓN:** Usar endpoint existente con filtro:
```
GET /api/generator-pro/websites?active=true
```
Y filtrar en el cliente por ID/slug.

#### **Estructura del Response (NewsWebsiteConfig)**
```typescript
{
  id: string;
  name: string;
  baseUrl: string;
  listingUrl: string;
  testUrl: string;
  isActive: boolean;

  // FRECUENCIAS (en minutos)
  extractionFrequency: number;        // Default: 60
  contentGenerationFrequency: number; // Default: 120
  publishingFrequency: number;        // Default: 30

  // SELECTORES
  listingSelectors: {
    titleSelector: string;
    linkSelector: string;
    dateSelector: string;
    thumbnailSelector: string;
    summarySelector: string;
  };

  contentSelectors: {
    titleSelector: string;
    contentSelector: string;
    authorSelector: string;
    dateSelector: string;
    imageSelector: string;
    categorySelector: string;
    tagsSelector: string;
  };

  // CONFIGURACIÓN
  extractionSettings: {
    maxRetries: number;
    timeout: number;
    waitBetweenRequests: number;
  };

  // ESTADÍSTICAS
  statistics: {
    totalUrlsExtracted: number;
    successfulExtractions: number;
    failedExtractions: number;
    totalContentGenerated: number;
    totalPublished: number;
    lastExtractionDuration: number;
  };

  // TIMESTAMPS
  lastExtractionRun: Date | null;
  lastGenerationRun: Date | null;
  lastPublishingRun: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### **Endpoints de Acciones Rápidas**

| Acción | Endpoint | Método | Body |
|--------|----------|--------|------|
| **Comenzar Extracción** | `/api/generator-pro/websites/:id/extract-urls-and-save` | POST | `{}` |
| **Pausar Outlet** | `/api/generator-pro/system/control` | POST | `{ action: "pause", websiteId: "..." }` |
| **Reanudar Outlet** | `/api/generator-pro/system/control` | POST | `{ action: "resume", websiteId: "..." }` |
| **Actualizar Frecuencias** | `/api/generator-pro/websites/:id` | PUT | `{ extractionFrequency, contentGenerationFrequency, publishingFrequency }` |
| **Forzar Ejecución** | `/api/generator-pro/websites/:id/force-schedule` | POST | `{}` |

---

### 3. COMPONENTES UI DISPONIBLES (react-native-reusables)

#### **Ya instalados en el proyecto:**
- ✅ Card (Header, Title, Description, Content, Footer)
- ✅ Button (variantes: default, secondary, destructive, outline, ghost)
- ✅ Checkbox
- ✅ Text

#### **Por instalar:**
- ⬜ Input (edición de frecuencias)
- ⬜ Label (accesibilidad)
- ⬜ Switch (toggle isActive)
- ⬜ Badge (estados visuales)
- ⬜ Separator (divisores)
- ⬜ AlertDialog (confirmaciones)
- ⬜ Toast (feedback)
- ⬜ Skeleton (loading states)

---

### 4. PATRÓN IDENTIFICADO EN EXTRACT.TSX

```tsx
// 1. Hook con React Query
const { data: websites, isLoading } = useWebsiteConfigs();

// 2. Mutación para acciones
const extractUrlsAndSave = useExtractUrlsAndSave();

// 3. Handler
const handleExtractUrls = async (websiteId: string) => {
  const result = await extractUrlsAndSave.mutateAsync(websiteId);
  // Navegar o mostrar resultado
};

// 4. Renderizado con Cards
{websites.map((website) => (
  <Card key={website.id}>
    <CardHeader>
      <CardTitle>{website.name}</CardTitle>
      <CardDescription>{website.baseUrl}</CardDescription>
    </CardHeader>
    <CardContent>
      {/* Stats y badges */}
    </CardContent>
    <CardFooter>
      <Button onPress={() => handleExtractUrls(website.id)}>
        Extraer URLs
      </Button>
    </CardFooter>
  </Card>
))}
```

---

## 🔌 SISTEMA DE NOTIFICACIONES Y WEBSOCKETS (YA IMPLEMENTADO)

### **BACKEND - Sistema Completo**

#### **1. Socket.IO Gateway**
**Archivo:** `/packages/api-nueva/src/notifications/gateways/socket.gateway.ts`

**Características:**
- ✅ Adaptador Redis para escalabilidad
- ✅ Autenticación JWT + Session Cookies
- ✅ Rooms por usuario: `user_{userId}`
- ✅ CORS configurado

**Conexión desde cliente:**
```typescript
// Headers requeridos
{
  'Authorization': 'Bearer {JWT_TOKEN}',
  'x-platform': 'mobile',
  'x-device-id': '{unique_device_id}',
  'x-device-os': 'iOS' | 'Android',
  'x-expo-push-token': '{expo_push_token}'
}
```

**Métodos públicos:**
```typescript
socketGateway.sendToUser(userId, event, data)        // Envía a todos los dispositivos del usuario
socketGateway.sendToUserSessions(userId, sessionIds, event, data)  // Envía a sesiones específicas
```

#### **2. NotificationRouter (Auto-routing inteligente)**
**Archivo:** `/packages/api-nueva/src/notifications/services/notification-router.service.ts`

**Estrategia AUTO:**
- **Mobile en foreground + socket activo** → Socket.IO
- **Mobile en background + tiene expo token** → Push Notification
- **Web** → Siempre Socket.IO

**Métodos:**
```typescript
notificationRouter.sendToAllDevices(userId, notification)  // Recomendado
notificationRouter.sendOnlySocket(userId, notification)
notificationRouter.sendOnlyPush(userId, notification)
```

#### **3. Tipos de Notificaciones Disponibles**
**Archivo:** `/packages/api-nueva/src/notifications/schemas/notification-queue.schema.ts`

**Relevantes para Generator-Pro:**
```typescript
// ⭐ YA EXISTEN para Facebook (podemos reutilizar patrón)
FACEBOOK_EXTRACTION_STARTED = 'facebook-extraction-started'
FACEBOOK_EXTRACTION_PROGRESS = 'facebook-extraction-progress'
FACEBOOK_EXTRACTION_COMPLETED = 'facebook-extraction-completed'
FACEBOOK_EXTRACTION_FAILED = 'facebook-extraction-failed'

// Eventos de contenido (ya implementados)
'content:generation-started'
'content:generation-completed'
'content:generation-failed'
```

#### **4. Integración con Generator-Pro (Parcial)**
**Archivo:** `/packages/api-nueva/src/generator-pro/controllers/generator-pro.controller.ts`

**Ya implementado (líneas 1759, 1967, 1987):**
- ✅ `content:generation-started`
- ✅ `content:generation-completed`
- ✅ `content:generation-failed`

**Falta implementar:**
- ❌ Eventos de extracción de URLs
- ❌ Eventos de progreso de scraping
- ❌ Endpoint que ejecute extracción completa (URLs + Contenido)

---

### **MOBILE - Sistema Completo**

#### **1. SocketService (Singleton)**
**Archivo:** `/src/features/socket/services/SocketService.ts`

**Características:**
- ✅ Auto-conexión con JWT
- ✅ Reconexión automática (5 intentos)
- ✅ Invalidación de queries en eventos
- ✅ TypeScript con SocketEventMap

**Eventos que escucha:**
```typescript
'connect', 'disconnect', 'connect_error'
'notification'  // -> invalida ['notifications']
'message'       // -> invalida ['messages', roomId]
```

**Cómo agregar nuevos listeners:**
```typescript
// Opción 1: En SocketService (línea 85)
this.socket.on('scraping:progress', (data) => {
  this.queryClient.invalidateQueries({ queryKey: ['scraping-logs'] })
})

// Opción 2: En hook personalizado
const socket = SocketService.getInstance(queryClient)
socket.socket?.on('scraping:found', handleFound)
```

#### **2. PushNotificationService (Singleton)**
**Archivo:** `/src/features/socket/services/PushNotificationService.ts`

**Características:**
- ✅ Expo Notifications integrado
- ✅ Permisos y tokens automáticos
- ✅ Listeners de foreground/background
- ✅ Navegación a `actionUrl` al tocar notificación

#### **3. Hooks Disponibles**

**useSocket():**
```typescript
const { isConnected, connect, disconnect, joinRoom, leaveRoom } = useSocket()
```

**useNotifications():**
```typescript
const {
  notifications,
  unreadCount,
  pushToken,
  hasPermission,
  setupNotifications,
  requestPermissions
} = useNotifications()
```

#### **4. Stores (Zustand)**

**socketStore:**
```typescript
{
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error',
  isOnline: boolean,
  latency: number,
  roomsJoined: string[]
}
```

**notificationStore:**
```typescript
{
  notifications: Notification[],  // Máximo 50
  unreadCount: number,
  pushToken: string | null,
  permissionStatus: PermissionStatus
}
```

---

## 📜 COMPONENTE DE LOGS EN TIEMPO REAL

### **@legendapp/list (YA INSTALADO)**

**Versión:** v2.0.6
**Tipo:** Drop-in replacement de FlatList con mejor performance

**Características PERFECTAS para logs:**
- ✅ `maintainScrollAtEnd={true}` - Auto-scroll al final
- ✅ `recycleItems` - Reciclaje de componentes
- ✅ Items de altura dinámica
- ✅ 100% JavaScript (sin dependencias nativas)

**Archivo a crear:** `/components/ui/log-list.tsx`

**Uso:**
```tsx
<LogList
  logs={logs}           // LogItem[]
  maxHeight={400}
  autoScroll={true}
/>

// Agregar logs
addLog('success', '✓ Encontradas: 20 URLs')
addLog('loading', '⏳ Extrayendo: https://example.com/noticia-1')
addLog('success', '✓ Extraído: "Título de la noticia"')
addLog('error', '✗ Error: Timeout en extracción')
```

**Tipos de logs:**
- `success` (verde, ícono ✓)
- `loading` (amarillo, spinner animado)
- `error` (rojo, ícono ⚠)
- `info` (gris, sin ícono)

---

## 🤖 MOBILE-DEVELOPER AGENT

**Instalado en:** `/usr/local/bin/mobile-developer`
**System prompt:** `/Users/horuscamachoavila/.claude-code-templates/agents/mobile-developer.md`

**Especialización:**
- React Native/Flutter component architecture
- Native module integration (iOS/Android)
- Offline-first data synchronization
- Push notifications and deep linking
- App performance and bundle optimization
- App store submission requirements

**Uso en este proyecto:**
```bash
mobile-developer "implementar pantalla de outlet con logs en tiempo real"
```

**Enfoque:**
1. Platform-aware pero code-sharing first
2. Responsive design para todos los tamaños de pantalla
3. Eficiencia de batería y red
4. Look & feel nativo con convenciones de plataforma
5. Testing exhaustivo en dispositivos

---

## 🎯 PLAN DE IMPLEMENTACIÓN ACTUALIZADO

### **FASE 1: Backend - Endpoint de Extracción Completa + Notificaciones**
**Objetivo:** Crear endpoint que extraiga URLs + Contenido y notifique progreso en tiempo real

#### Tareas:
1. **Crear tipos de notificación para extracciones**
   - Archivo: `/packages/api-nueva/src/notifications/schemas/notification-queue.schema.ts`
   - Agregar: `OUTLET_EXTRACTION_STARTED`, `OUTLET_EXTRACTION_PROGRESS`, `OUTLET_EXTRACTION_COMPLETED`, `OUTLET_EXTRACTION_FAILED`

2. **Crear endpoint de extracción completa**
   - Archivo: `/packages/api-nueva/src/generator-pro/controllers/generator-pro.controller.ts`
   - Ruta: `POST /api/generator-pro/websites/:id/extract-all`
   - Lógica:
     1. Extraer URLs (emitir evento `started`)
     2. Por cada URL extraída: emitir evento `progress` con estado
     3. Extraer contenido de cada URL
     4. Emitir evento `completed` con totales

3. **Integrar notificaciones en el flujo**
   - Usar `notificationRouter.sendToAllDevices(userId, notification)`
   - Emitir eventos de socket directamente con `socketGateway.sendToUser()`
   - Eventos a emitir:
     ```typescript
     'outlet:extraction-started' -> { outletId, expectedUrls }
     'outlet:extraction-progress' -> { outletId, urlsFound, currentUrl, contentExtracted, currentTitle, percentage }
     'outlet:extraction-completed' -> { outletId, totalUrls, totalContent, duration }
     'outlet:extraction-failed' -> { outletId, error }
     ```

4. **Agregar manejo de errores y timeouts**
   - Try-catch en cada extracción de contenido
   - Continuar con siguiente URL si falla una
   - Emitir progreso incluso con fallos

5. **Verificar compilación del backend**
   - Comando: `cd packages/api-nueva && yarn build`
   - Resolver dependencias circulares con EventEmitter2 si es necesario

---

### **FASE 2: Mobile - Infraestructura de Outlet**
**Objetivo:** Crear tipos, mappers, servicio API y hooks necesarios

#### Tareas:
1. **Crear tipos TypeScript para Outlet**
   - Archivo: `/src/types/outlet.types.ts`
   - Interfaces: `OutletConfig`, `OutletStatistics`, `UpdateFrequenciesDto`, `ExtractionProgress`, `LogItem`

2. **Crear OutletMapper**
   - Archivo: `/src/utils/mappers.ts` (agregar clase)
   - Métodos: `toApp()`, `toAPI()`, `toUpdateDto()`, `extractionProgressToApp()`

3. **Crear servicio outletApi**
   - Archivo: `/src/services/outlets/outletApi.ts`
   - Funciones:
     - `getOutlets()` - GET /websites
     - `updateFrequencies()` - PUT /websites/:id
     - `startFullExtraction()` - POST /websites/:id/extract-all ⭐ NUEVO
     - `pauseOutlet()` - POST /system/control { action: 'pause' }
     - `resumeOutlet()` - POST /system/control { action: 'resume' }

4. **Crear hooks con React Query**
   - Archivo: `/src/hooks/useOutlets.ts`
   - Hooks:
     - `useOutletById(id)` - Query con filtro local
     - `useUpdateFrequencies()` - Mutation
     - `useStartFullExtraction()` - Mutation ⭐ NUEVO
     - `usePauseOutlet()` - Mutation
     - `useResumeOutlet()` - Mutation

5. **Extender tipos de Socket**
   - Archivo: `/src/features/socket/types/socket.types.ts`
   - Agregar a `SocketEventMap`:
     ```typescript
     'outlet:extraction-started': ExtractionStartedEvent
     'outlet:extraction-progress': ExtractionProgressEvent
     'outlet:extraction-completed': ExtractionCompletedEvent
     'outlet:extraction-failed': ExtractionFailedEvent
     ```

---

### **FASE 3: Componente LogList para Logs en Tiempo Real**
**Objetivo:** Crear componente reutilizable de logs usando @legendapp/list

#### Tareas:
1. **Crear componente LogList**
   - Archivo: `/components/ui/log-list.tsx`
   - Props: `logs: LogItem[]`, `maxHeight?: number`, `autoScroll?: boolean`
   - Tipos de log: `success`, `loading`, `error`, `info`
   - Íconos: Check (verde), Loader2 (amarillo, animado), AlertCircle (rojo)
   - Usar `maintainScrollAtEnd={true}` para auto-scroll

2. **Crear hook useExtractionLogs**
   - Archivo: `/src/hooks/useExtractionLogs.ts`
   - State: `logs: LogItem[]`
   - Método: `addLog(type, message)`
   - Integrar con socket listeners de extracción
   - Limpiar logs cuando se desmonta o se inicia nueva extracción

3. **Integrar socket listeners**
   - En el hook, escuchar eventos:
     ```typescript
     socket.on('outlet:extraction-started', ({ expectedUrls }) => {
       addLog('info', `🚀 Extracción iniciada - ${expectedUrls} URLs esperadas`)
     })

     socket.on('outlet:extraction-progress', ({ urlsFound, currentUrl, currentTitle, contentExtracted }) => {
       if (urlsFound > previousUrlsFound) {
         addLog('success', `✓ Encontradas: ${urlsFound} URLs`)
       }
       if (currentUrl) {
         addLog('loading', `⏳ Extrayendo: ${currentUrl}`)
       }
       if (currentTitle) {
         addLog('success', `✓ Extraído: "${currentTitle}"`)
       }
     })

     socket.on('outlet:extraction-completed', ({ totalUrls, totalContent, duration }) => {
       addLog('success', `✅ Completado - ${totalContent}/${totalUrls} contenidos extraídos en ${duration}s`)
     })

     socket.on('outlet:extraction-failed', ({ error }) => {
       addLog('error', `❌ Error: ${error}`)
     })
     ```

4. **Agregar soporte para Lucide icons**
   - Ya está instalado `lucide-react-native`
   - Usar: `Check`, `Loader2`, `AlertCircle`

5. **Testing del componente**
   - Probar auto-scroll con muchos logs
   - Probar animación de Loader2
   - Probar colores según tipo

---

### **FASE 4: Instalación de Componentes UI**
**Objetivo:** Instalar componentes faltantes de react-native-reusables

#### Tareas:
1. **Instalar Input + Label**
   - Comando: `npx @react-native-reusables/cli@latest add input label`

2. **Instalar Switch + Badge**
   - Comando: `npx @react-native-reusables/cli@latest add switch badge`

3. **Instalar Separator + Skeleton**
   - Comando: `npx @react-native-reusables/cli@latest add separator skeleton`

4. **Instalar AlertDialog + Toast**
   - Comando: `npx @react-native-reusables/cli@latest add alert-dialog toast`

5. **Verificar que compilen correctamente**
   - No levantar servidor, solo verificar tipos

---

### **FASE 5: Desarrollo de Pantalla Outlet Detail**
**Objetivo:** Crear la pantalla `/app/(protected)/outlet/[slug].tsx`

#### Tareas:
1. **Crear estructura base del componente**
   - Archivo: `/app/(protected)/outlet/[slug].tsx`
   - Layout: ScrollView + Cards con secciones
   - Obtener `id` de params: `const { id } = useLocalSearchParams<{ id: string }>()`

2. **Implementar sección Header**
   - Mostrar: nombre, baseUrl, badge de estado (activo/inactivo)
   - Componentes: Card, CardHeader, CardTitle, Badge

3. **Implementar sección de Estadísticas**
   - Mostrar: statistics del outlet (URLs extraídas, contenido generado, etc.)
   - Componentes: Card, grid de stats

4. **Implementar sección de Logs en Tiempo Real** ⭐ NUEVO
   - Mostrar: LogList con progreso de extracción
   - Componentes: Card, LogList
   - Hook: useExtractionLogs()
   - Solo visible cuando `isExtracting === true`
   - Altura: 300-400px con scroll automático

5. **Implementar sección de Configuración de Frecuencias**
   - Inputs numéricos para: extractionFrequency, contentGenerationFrequency, publishingFrequency
   - Componentes: Card, Input, Label
   - Validación: min 1, max 1440 minutos

6. **Implementar Switch de Estado Activo**
   - Toggle para isActive
   - Componentes: Switch, Label

---

### **FASE 6: Implementación de Acciones Rápidas**
**Objetivo:** Crear sección de botones de acción con confirmaciones

#### Tareas:
1. **Botón "Comenzar Extracción Completa"** ⭐ MODIFICADO
   - Hook: `useStartFullExtraction()` (nuevo hook que llama al endpoint /extract-all)
   - Mostrar LogList al iniciar
   - Deshabilitar durante extracción
   - Feedback: Toast de inicio + logs en tiempo real
   - Al completar: Toast de éxito + invalidación de cache

2. **Botón "Pausar Outlet"**
   - Hook: `usePauseOutlet()`
   - Confirmación: AlertDialog
   - Feedback: Toast + invalidación de cache

3. **Botón "Reanudar Outlet"**
   - Hook: `useResumeOutlet()`
   - Feedback: Toast + invalidación de cache

4. **Botón "Guardar Cambios" (frecuencias)**
   - Hook: `useUpdateFrequencies()`
   - Validación antes de enviar
   - Feedback: Toast + invalidación de cache

5. **Layout de botones**
   - Organización: Grid 2x2 o flex-row
   - Variantes: default, secondary, destructive
   - Botón de extracción: variant="default", size="lg", con ícono

---

### **FASE 7: Estados de Carga y Errores**
**Objetivo:** Implementar UX para loading y error states

#### Tareas:
1. **Loading state inicial**
   - Mostrar Skeleton mientras carga el outlet
   - Componentes: Skeleton con dimensiones apropiadas

2. **Loading state de acciones**
   - Deshabilitar botones durante mutaciones
   - Mostrar ActivityIndicator en botones
   - Deshabilitar inputs durante guardado

3. **Estado de extracción activa** ⭐ NUEVO
   - Variable: `isExtracting` (basada en logs.length > 0 y último log no es completed/failed)
   - Deshabilitar todos los botones excepto "Ver Logs"
   - Mostrar badge "Extrayendo..." en header
   - Persistir estado incluso si se sale de la pantalla (usar zustand)

4. **Error state**
   - Mostrar mensaje cuando el outlet no existe
   - Botón de retry
   - Componentes: Card con mensaje centrado

5. **Toast notifications**
   - Configurar ToastProvider en layout si no existe
   - Toasts para todas las acciones exitosas/fallidas
   - Toast especial al completar extracción con totales

6. **Manejo de navegación desde extract.tsx**
   - Agregar onPress a las cards existentes
   - Pasar id via router.push(): `router.push(\`/(protected)/outlet/\${website.id}\`)`

---

### **FASE 8: Testing y Refinamiento**
**Objetivo:** Probar flujo completo y ajustar detalles

#### Tareas:
1. **Probar navegación desde extract.tsx**
   - Verificar que se pase el ID correctamente
   - Verificar que cargue los datos del outlet

2. **Probar extracción completa con logs** ⭐ CRÍTICO
   - Iniciar extracción desde botón
   - Verificar que aparezcan logs en tiempo real
   - Verificar auto-scroll del LogList
   - Verificar que los eventos de socket lleguen correctamente
   - Probar en foreground y background (notificaciones push)
   - Verificar que se actualicen las estadísticas al completar

3. **Probar cada acción rápida**
   - Pausar, reanudar outlet
   - Verificar que actualicen la UI

4. **Probar edición de frecuencias**
   - Validación de inputs
   - Guardado exitoso
   - Invalidación de cache

5. **Probar estados de error**
   - Outlet no encontrado
   - Error de red durante extracción
   - Timeout
   - Fallo parcial de contenido

6. **Probar notificaciones**
   - Verificar que lleguen push notifications en background
   - Verificar que se muestren toasts en foreground
   - Verificar que tocar la notificación navegue correctamente

7. **Verificar compilación final del backend**
   - Comando: `cd packages/api-nueva && yarn build`
   - Resolver cualquier error de tipos
   - Verificar que no haya dependencias circulares

---

## 📊 ESTRUCTURA DE ARCHIVOS A CREAR/MODIFICAR

### **Nuevos archivos:**

**Backend:**
```
api-nueva/
└── src/
    ├── notifications/schemas/
    │   └── notification-queue.schema.ts       📝 MODIFICAR (agregar tipos OUTLET_EXTRACTION_*)
    └── generator-pro/controllers/
        └── generator-pro.controller.ts        📝 MODIFICAR (agregar endpoint /extract-all)
```

**Mobile:**
```
mobile-expo/
├── src/
│   ├── types/
│   │   └── outlet.types.ts                    ✨ NUEVO
│   ├── services/
│   │   └── outlets/
│   │       └── outletApi.ts                   ✨ NUEVO
│   ├── hooks/
│   │   ├── useOutlets.ts                      ✨ NUEVO
│   │   └── useExtractionLogs.ts               ✨ NUEVO ⭐
│   ├── features/socket/types/
│   │   └── socket.types.ts                    📝 MODIFICAR (agregar eventos outlet:*)
│   └── utils/
│       └── mappers.ts                         📝 MODIFICAR (agregar OutletMapper)
├── app/
│   └── (protected)/
│       └── outlet/
│           └── [id].tsx                       ✨ NUEVO
└── components/ui/
    ├── log-list.tsx                           ✨ NUEVO ⭐
    ├── input.tsx                              ✨ INSTALAR
    ├── label.tsx                              ✨ INSTALAR
    ├── switch.tsx                             ✨ INSTALAR
    ├── badge.tsx                              ✨ INSTALAR
    ├── separator.tsx                          ✨ INSTALAR
    ├── alert-dialog.tsx                       ✨ INSTALAR
    ├── toast.tsx                              ✨ INSTALAR
    └── skeleton.tsx                           ✨ INSTALAR
```

### **Archivos a modificar:**
```
mobile-expo/
├── app/(protected)/(tabs)/extract.tsx         📝 Agregar navegación a outlet detail (onPress en Card)
└── app/(protected)/_layout.tsx                📝 Agregar ToastProvider si no existe

api-nueva/
└── src/
    ├── notifications/schemas/
    │   └── notification-queue.schema.ts       📝 Agregar enums OUTLET_EXTRACTION_*
    └── generator-pro/controllers/
        └── generator-pro.controller.ts        📝 Agregar método extractAll() con notificaciones
```

---

## 🚨 RESTRICCIONES Y CONSIDERACIONES

### **TypeScript**
- ❌ **PROHIBIDO usar `any`**
- ✅ Tipar todas las responses de API
- ✅ Interfaces explícitas para todos los DTOs
- ✅ Tipar eventos de Socket con `SocketEventMap`

### **Backend (api-nueva)**
- ❌ **PROHIBIDO levantar servidor**
- ✅ Solo hacer build para verificar compilación: `yarn build`
- ✅ Si hay errores de dependencias circulares, usar EventEmitter2
- ✅ Usar `forwardRef` para resolver referencias circulares en tipos
- ✅ Notificaciones: usar `notificationRouter.sendToAllDevices()` para auto-routing
- ✅ WebSocket: usar `socketGateway.sendToUser()` para eventos en tiempo real

### **Validaciones**
- Frecuencias: min 1 minuto, max 1440 minutos (24 horas)
- Inputs numéricos: solo permitir números enteros positivos
- Estado activo/inactivo: solo cambiar con confirmación
- URLs extraídas: validar que sean válidas antes de procesar

### **Cache Invalidation**
- Invalidar `generatorProKeys.websites()` después de cada mutación exitosa
- Usar `queryClient.invalidateQueries()` en onSuccess de mutations
- Invalidar al recibir eventos de socket de extracción completada

### **Notificaciones y WebSocket**
- ✅ Sistema ya implementado y funcional
- ✅ Auto-routing: Socket en foreground, Push en background
- ✅ Usar eventos tipados en `SocketEventMap`
- ✅ Listeners: agregar en hook personalizado o en SocketService
- ✅ Cleanup: siempre hacer `socket.off()` en useEffect cleanup

### **Logs en Tiempo Real**
- ✅ Usar `@legendapp/list` (ya instalado)
- ✅ `maintainScrollAtEnd={true}` para auto-scroll
- ✅ Límite de logs: 100 (para no saturar memoria)
- ✅ Limpiar logs al iniciar nueva extracción
- ✅ Persistir logs en zustand si se sale de la pantalla (opcional)

---

## 🎨 DISEÑO UX PROPUESTO

### **Layout de la Pantalla**
```
┌─────────────────────────────────────┐
│  < Volver    Outlet Detail          │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 📰 Nombre del Outlet        🟢  │ │
│ │ https://outlet.com               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Estadísticas                    │ │
│ │ ─────────────────────────────── │ │
│ │ URLs: 1,234 | Generadas: 567   │ │
│ │ Publicadas: 345 | Fallos: 12   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Configuración de Frecuencias    │ │
│ │ ─────────────────────────────── │ │
│ │ Extracción:     [60] minutos    │ │
│ │ Generación:    [120] minutos    │ │
│ │ Publicación:    [30] minutos    │ │
│ │                                 │ │
│ │ Outlet Activo          [ON/OFF] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Acciones Rápidas                │ │
│ │ ─────────────────────────────── │ │
│ │ [🚀 Comenzar] [⏸️  Pausar]      │ │
│ │ [▶️  Reanudar]  [💾 Guardar]    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🔧 COMANDOS IMPORTANTES

### **Backend (api-nueva)**
```bash
cd packages/api-nueva
yarn build  # Verificar compilación después de cambios
```

### **Mobile (mobile-expo)**
```bash
cd packages/mobile-expo

# Instalar componentes UI
npx @react-native-reusables/cli@latest add input
npx @react-native-reusables/cli@latest add label
npx @react-native-reusables/cli@latest add switch
npx @react-native-reusables/cli@latest add badge
npx @react-native-reusables/cli@latest add separator
npx @react-native-reusables/cli@latest add alert-dialog
npx @react-native-reusables/cli@latest add toast
npx @react-native-reusables/cli@latest add skeleton
```

---

## 📈 MÉTRICAS DE ÉXITO

- ✅ Navegación fluida desde extract.tsx a outlet/[id].tsx
- ✅ Carga de datos del outlet correcto
- ✅ **Extracción completa funcional (URLs + Contenido)** ⭐
- ✅ **Logs en tiempo real visibles durante extracción** ⭐
- ✅ **Notificaciones push en background funcionando** ⭐
- ✅ **Auto-scroll del LogList al agregar logs** ⭐
- ✅ Edición de frecuencias funcional con validación
- ✅ Acciones rápidas (pausar, reanudar) operativas
- ✅ Feedback claro con toasts en todas las acciones
- ✅ Loading states y error states implementados
- ✅ Sin errores de TypeScript (no `any`)
- ✅ Backend compila sin errores
- ✅ Eventos de socket tipados correctamente
- ✅ Sistema de notificaciones integrado correctamente

---

**FIN DEL DOCUMENTO DE CONTEXTO**
