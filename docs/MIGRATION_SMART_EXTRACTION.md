# 📋 Guía de Migración: Smart Extraction System

**Fecha**: 15 de Octubre, 2025
**Versión**: 1.0.0
**Autor**: Jarvis (Claude Code)

---

## 🎯 Resumen de Cambios

El sistema de extracción automática de URLs ha sido completamente renovado para resolver problemas críticos de scheduling y tracking.

### ✅ Sistema NUEVO (Recomendado)

- **`SmartExtractionSchedulerService`**: Scheduling inteligente con `OnModuleInit`
- **`UrlExtractionService`**: Extracción con detección de duplicados
- **`ExtractedUrlTracking`**: Schema para trackear URLs procesadas
- **`UrlExtractionLog`**: Logs detallados de cada extracción
- **`ExtractionManagementController`**: Endpoints REST para gestión manual

### ⚠️ Sistema ANTIGUO (Deprecado)

- **`GeneratorProSchedulerService.scheduleExtractionJobs()`**: Cron cada 5 minutos (DESHABILITADO)
- **`GeneratorProOrchestratorService.initializeWebsiteCycles()`**: Ciclo de extracción con `setInterval` (DESHABILITADO)

---

## 🔴 Problemas Resueltos

### 1. **Scheduling No Consideraba Última Extracción**

**Problema ANTES**:
```
- lastExtractionRun: 3:00 PM
- extractionFrequency: 60 minutos
- Servidor arranca: 3:45 PM
❌ Programaba en 60 min (4:45 PM) en lugar de 15 min (4:00 PM)
```

**Solución AHORA**:
```typescript
// SmartExtractionSchedulerService.onModuleInit()
const nextExecution = lastRun + frequency; // 3:00 + 60 = 4:00
const delay = nextExecution - NOW; // 4:00 - 3:45 = 15 min
✅ Programa en 15 minutos correctamente
```

### 2. **Actualización Prematura de Timestamps**

**Problema ANTES**:
```typescript
// ❌ Actualizaba al ENCOLAR, no al EJECUTAR
await queueService.addExtractionJob(...);
await websiteModel.update({ lastExtractionRun: new Date() }); // MAL
```

**Solución AHORA**:
```typescript
// ✅ Actualiza solo DESPUÉS de ejecución exitosa
const result = await urlExtractionService.extractUrls(websiteId);
if (result.success) {
  await websiteModel.update({ lastExtractionRun: new Date() }); // BIEN
}
```

### 3. **Sin Detección de URLs Duplicadas**

**Problema ANTES**:
- Cada extracción procesaba TODAS las URLs del listado
- No había tracking de URLs ya extraídas

**Solución AHORA**:
```typescript
// ExtractedUrlTracking con urlHash único
const urlHash = sha256(url);
const exists = await urlTrackingModel.findOne({ websiteConfigId, urlHash });

if (exists) {
  // URL duplicada, actualizar lastSeenAt
  await exists.updateLastSeen();
} else {
  // URL nueva, crear tracking
  await urlTrackingModel.create({ url, urlHash, status: 'discovered' });
}
```

### 4. **Logs Incompletos**

**Problema ANTES**:
- Solo logs de contenido extraído
- No logs de URLs desde listados

**Solución AHORA**:
- **`UrlExtractionLog`**: Total URLs, nuevas, duplicadas, tiempo, errores
- **`ExtractedUrlTracking`**: Estado completo de cada URL

---

## 📦 Componentes del Nuevo Sistema

### 1. **Schemas**

#### `ExtractedUrlTracking`
```typescript
// packages/api-nueva/src/generator-pro/schemas/extracted-url-tracking.schema.ts

{
  websiteConfigId: ObjectId,
  url: string,
  urlHash: string, // SHA-256 para búsquedas rápidas
  status: 'discovered' | 'queued' | 'processing' | 'completed' | 'failed',
  firstDiscoveredAt: Date,
  lastSeenAt: Date,
  timesDiscovered: number,
  allowReExtraction: boolean,
  nextReExtractionAllowedAt: Date
}
```

#### `UrlExtractionLog`
```typescript
// packages/api-nueva/src/generator-pro/schemas/url-extraction-log.schema.ts

{
  websiteConfigId: ObjectId,
  status: 'success' | 'partial' | 'failed',
  totalUrlsFound: number,
  newUrls: number,
  duplicateUrls: number,
  processingTime: number,
  method: 'cheerio' | 'puppeteer',
  errorMessage?: string,
  sampleUrls: string[]
}
```

### 2. **Servicios**

#### `SmartExtractionSchedulerService`
```typescript
// packages/api-nueva/src/generator-pro/services/smart-extraction-scheduler.service.ts

@Injectable()
export class SmartExtractionSchedulerService implements OnModuleInit {
  async onModuleInit() {
    // Calcula próximas ejecuciones al iniciar servidor
    for (const website of activeWebsites) {
      await this.scheduleWebsiteExtraction(website);
    }
  }

  private calculateNextExecution(lastRun, frequency) {
    // Si lastRun = 3:00 PM, frequency = 60 min
    // Retorna 4:00 PM
    return lastRun + (frequency * 60 * 1000);
  }
}
```

#### `UrlExtractionService`
```typescript
// packages/api-nueva/src/generator-pro/services/url-extraction.service.ts

@Injectable()
export class UrlExtractionService {
  async extractUrls(websiteId: ObjectId) {
    // 1. Extraer URLs con Cheerio o Puppeteer
    const urls = await this.extractWithCheerio(website);

    // 2. Procesar URLs y detectar duplicados
    const result = await this.processExtractedUrls(website, urls);

    // 3. Crear log detallado
    await this.createExtractionLog(website, result);

    return result;
  }
}
```

### 3. **Controller**

#### `ExtractionManagementController`
```typescript
// packages/api-nueva/src/generator-pro/controllers/extraction-management.controller.ts

@Controller('generator-pro/extraction')
export class ExtractionManagementController {
  // POST /generator-pro/extraction/trigger/:websiteId
  async triggerExtraction(websiteId: string) { ... }

  // GET /generator-pro/extraction/status/:websiteId
  async getStatus(websiteId: string) { ... }

  // POST /generator-pro/extraction/pause/:websiteId
  async pauseExtraction(websiteId: string) { ... }

  // POST /generator-pro/extraction/resume/:websiteId
  async resumeExtraction(websiteId: string) { ... }

  // GET /generator-pro/extraction/logs/:websiteId
  async getLogs(websiteId: string) { ... }

  // GET /generator-pro/extraction/urls/:websiteId
  async getTrackedUrls(websiteId: string) { ... }
}
```

---

## 🚀 Pasos de Migración

### ✅ Paso 1: Verificar Módulos Importados

El `GeneratorProModule` ya tiene todo importado:

```typescript
// packages/api-nueva/src/generator-pro/generator-pro.module.ts

imports: [
  ReportsModule, // Para PuppeteerManagerService ✅
  ...
],
```

### ✅ Paso 2: Schemas Registrados

```typescript
MongooseModule.forFeature([
  { name: ExtractedUrlTracking.name, schema: ExtractedUrlTrackingSchema }, ✅
  { name: UrlExtractionLog.name, schema: UrlExtractionLogSchema }, ✅
]),
```

### ✅ Paso 3: Servicios en Providers

```typescript
providers: [
  UrlExtractionService, ✅
  SmartExtractionSchedulerService, ✅
  ...
],
```

### ✅ Paso 4: Controller Registrado

```typescript
controllers: [
  ExtractionManagementController, ✅
  ...
],
```

---

## 🔧 Uso del Nuevo Sistema

### 1. **Scheduling Automático**

El sistema se inicializa automáticamente al levantar el servidor:

```typescript
// SmartExtractionSchedulerService.onModuleInit() se ejecuta automáticamente
// No requiere configuración adicional
```

### 2. **Forzar Extracción Manual**

```bash
# Endpoint REST
POST http://localhost:3000/generator-pro/extraction/trigger/:websiteId
Authorization: Bearer YOUR_JWT_TOKEN
```

### 3. **Consultar Estado**

```bash
GET http://localhost:3000/generator-pro/extraction/status/:websiteId
Authorization: Bearer YOUR_JWT_TOKEN

# Response:
{
  "success": true,
  "data": {
    "isScheduled": true,
    "nextExecution": "2025-10-15T16:00:00.000Z",
    "lastExecution": "2025-10-15T15:00:00.000Z",
    "frequency": 60
  }
}
```

### 4. **Consultar Logs**

```bash
GET http://localhost:3000/generator-pro/extraction/logs/:websiteId?limit=10
Authorization: Bearer YOUR_JWT_TOKEN

# Response:
{
  "success": true,
  "data": {
    "logs": [
      {
        "websiteName": "El Universal",
        "status": "success",
        "totalUrlsFound": 50,
        "newUrls": 10,
        "duplicateUrls": 40,
        "processingTime": 2341,
        "executedAt": "2025-10-15T15:00:00.000Z"
      }
    ]
  }
}
```

### 5. **Consultar URLs Trackeadas**

```bash
GET http://localhost:3000/generator-pro/extraction/urls/:websiteId?status=discovered
Authorization: Bearer YOUR_JWT_TOKEN

# Response:
{
  "success": true,
  "data": {
    "urls": [...],
    "stats": {
      "discovered": 150,
      "queued": 20,
      "completed": 500,
      "failed": 5
    }
  }
}
```

---

## ⚠️ Código Deprecado

### `GeneratorProSchedulerService.scheduleExtractionJobs()`

**Estado**: DESHABILITADO (cron comentado)

```typescript
// ❌ ANTES (DEPRECADO):
@Cron('*/5 * * * *')
async scheduleExtractionJobs() {
  // Este método está deshabilitado
}
```

**Migración**:
- El scheduling automático ahora lo maneja `SmartExtractionSchedulerService`
- No requiere acción manual
- Los otros métodos del scheduler (generación y publicación) siguen funcionando

### `GeneratorProOrchestratorService.initializeWebsiteCycles()`

**Estado**: Ciclo de extracción DESHABILITADO

```typescript
// ❌ ANTES (DEPRECADO):
const extractionInterval = setInterval(() => {
  await this.runExtractionCycle(websiteId);
}, frequency);

// ✅ AHORA (código comentado en el servicio)
// Los ciclos de generación y publicación siguen funcionando normalmente
```

**Migración**:
- El ciclo de extracción está comentado internamente
- `SmartExtractionSchedulerService` se encarga del scheduling
- Los ciclos de generación y publicación no se ven afectados

---

## 📊 Comparación: Antes vs Ahora

| Característica | ANTES | AHORA |
|----------------|-------|-------|
| **Scheduling al inicio** | ❌ Espera hasta 5 min (cron) | ✅ Inmediato con cálculo inteligente |
| **Considera última extracción** | ❌ No | ✅ Sí |
| **Actualización timestamps** | ❌ Al encolar (incorrecto) | ✅ Al completar exitosamente |
| **Detección duplicados** | ❌ No | ✅ Sí con `urlHash` |
| **Logs de extracción** | ❌ Solo contenido | ✅ URLs + contenido |
| **Re-extracción** | ❌ No configurable | ✅ Configurable por días |
| **Endpoints REST** | ❌ No | ✅ Sí (7 endpoints) |
| **Métricas detalladas** | ❌ Básicas | ✅ Completas (nuevas/duplicadas/tiempo) |

---

## 🐛 Troubleshooting

### Problema: "PuppeteerManagerService not found"

**Solución**: Verificar que `ReportsModule` esté importado en `GeneratorProModule`:

```typescript
imports: [
  ReportsModule, // ✅ Debe estar importado
],
```

### Problema: "Extracción no se ejecuta automáticamente"

**Verificar**:
1. ¿El sitio tiene `isActive: true`?
2. ¿El sitio tiene `extractionFrequency` configurado?
3. Revisar logs del servidor al iniciar:
   ```
   [SmartExtractionSchedulerService] 🚀 Inicializando Smart Extraction Scheduler...
   [SmartExtractionSchedulerService] ✅ Scheduler iniciado con X sitios activos
   ```

### Problema: "URLs duplicadas siguen siendo procesadas"

**Verificar**:
1. ¿El schema `ExtractedUrlTracking` está registrado?
2. ¿El índice único está creado? (MongoDB):
   ```javascript
   db.extractedurltrackings.getIndexes()
   // Debe existir: { websiteConfigId: 1, urlHash: 1 }
   ```

---

## 📝 Notas Finales

- El sistema antiguo NO fue eliminado, solo deprecado
- Los métodos de generación y publicación siguen funcionando normalmente
- El nuevo sistema es **backward compatible**
- Se recomienda usar el nuevo sistema para todas las nuevas implementaciones

---

## 📞 Soporte

Si tienes problemas con la migración:
1. Revisa los logs del servidor
2. Verifica la configuración de MongoDB
3. Consulta este documento
4. Contacta al equipo de desarrollo

---

**Fin de la Guía de Migración** 📋
