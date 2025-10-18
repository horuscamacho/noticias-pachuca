# 🔍 Análisis: Mejoramiento del Sistema de Extracción Automática de Noticias

**Fecha de Análisis**: 15 de Octubre, 2025
**Autor**: Jarvis (Claude Code)
**Objetivo**: Implementar sistema robusto de extracción automática de URLs con scheduling inteligente, detección de duplicados y logs detallados

---

## ⚠️ ACLARACIÓN CRÍTICA: Problema Identificado

### 🔴 **PROBLEMA PRINCIPAL**: Scheduling No Considera Última Extracción al Iniciar

#### **Estado Actual del Sistema**
El sistema de extracción automática tiene dos implementaciones diferentes con problemas similares:

1. **`GeneratorProSchedulerService`** (Cron cada 5 minutos)
   - ✅ Calcula correctamente `nextRun` basado en `lastExtractionRun + extractionFrequency`
   - ❌ **PROBLEMA**: Actualiza `lastExtractionRun` INMEDIATAMENTE al encolar, no al ejecutar
   - ❌ **PROBLEMA**: NO tiene lógica en `OnModuleInit` para calcular próxima ejecución
   - ❌ **PROBLEMA**: Espera a que el cron ejecute (puede tardar hasta 5 minutos después de arrancar)

2. **`GeneratorProOrchestratorService`** (setInterval)
   - ❌ **PROBLEMA CRÍTICO**: Usa `setInterval` directo desde el inicio del módulo
   - ❌ **PROBLEMA**: NO considera `lastExtractionRun` al programar primera ejecución
   - ❌ **PROBLEMA**: Si `lastExtractionRun` fue hace 30 min y `extractionFrequency` es 60 min, debería ejecutar en 30 min, NO en 60 min

#### **Ejemplo del Problema**:
```
Escenario:
- lastExtractionRun: 3:00 PM
- extractionFrequency: 60 minutos (cada hora)
- Servidor se levanta a las: 3:45 PM

❌ COMPORTAMIENTO ACTUAL:
- GeneratorProSchedulerService: Espera hasta 3:50 PM (próximo cron), luego verifica y ejecuta
- GeneratorProOrchestratorService: Programa en 60 minutos desde NOW (4:45 PM)

✅ COMPORTAMIENTO ESPERADO:
- Calcular nextRun = 3:00 PM + 60 min = 4:00 PM
- Como NOW = 3:45 PM, programar en 15 minutos (a las 4:00 PM)
```

#### **Otros Problemas Identificados**:

3. **Detección de URLs Duplicadas**
   - ❌ NO hay sistema para trackear URLs extraídas previamente
   - ❌ NO hay schema para guardar URLs procesadas
   - ❌ Cada extracción vuelve a procesar TODAS las URLs del listado

4. **Logs de Extracción Incompletos**
   - ✅ Existe `NoticiasExtractionLog` para contenido extraído
   - ❌ NO hay logs de URLs extraídas desde listados
   - ❌ NO hay tracking de cuántas URLs nuevas vs duplicadas

5. **Sincronización de Timestamps**
   - ❌ `lastExtractionRun` se actualiza al ENCOLAR job, no al EJECUTAR
   - ❌ Si job falla, `lastExtractionRun` ya fue actualizado incorrectamente

---

## 📋 TABLA DE CONTENIDOS

1. [Estado Actual del Sistema](#-1-estado-actual-del-sistema)
2. [Arquitectura Propuesta](#-2-arquitectura-propuesta)
3. [Esquemas y Servicios](#-3-esquemas-y-servicios)
4. [Patrones de Implementación](#-4-patrones-de-implementacion)
5. [Fases de Implementación](#-5-fases-de-implementacion)
6. [Síntesis Ejecutiva de Fases](#-6-sintesis-ejecutiva-de-fases)

---

## 🔍 1. ESTADO ACTUAL DEL SISTEMA

### 1.1. Schema: `NewsWebsiteConfig`

**Archivo**: `packages/api-nueva/src/generator-pro/schemas/news-website-config.schema.ts`

```typescript
@Schema({ timestamps: true })
export class NewsWebsiteConfig {
  @Prop({ required: true, unique: true, trim: true })
  name: string; // "El Universal", "Milenio"

  @Prop({ required: true, trim: true })
  listingUrl: string; // URL donde están todas las noticias

  // 📋 SELECTORES PARA LISTADO
  @Prop({ type: Object, required: true })
  listingSelectors: {
    articleLinks: string; // CSS selector para URLs
    titleSelector?: string;
    imageSelector?: string;
  };

  // ⏰ CONFIGURACIÓN DE FRECUENCIAS
  @Prop({ default: 60 })
  extractionFrequency: number; // Frecuencia en minutos (60 = cada hora)

  // 📊 CONTROL DE EJECUCIÓN
  @Prop()
  lastExtractionRun?: Date; // 🔴 PROBLEMA: Se actualiza al encolar, no al ejecutar

  @Prop({ type: Object, default: {} })
  statistics: {
    totalUrlsExtracted?: number;
    successfulExtractions?: number;
    failedExtractions?: number;
    lastExtractionAt?: Date;
  };
}

// 🧮 VIRTUAL para siguiente ejecución
NewsWebsiteConfigSchema.virtual('nextExtractionDue').get(function () {
  if (!this.lastExtractionRun) return new Date();
  return new Date(this.lastExtractionRun.getTime() + (this.extractionFrequency * 60 * 1000));
});
```

**✅ Lo que funciona bien**:
- Tiene campo `extractionFrequency` para configurar cada cuánto extraer
- Tiene virtual `nextExtractionDue` que calcula próxima ejecución
- Tiene estadísticas de extracción

**🔴 Problemas**:
- `lastExtractionRun` se actualiza al encolar job, no al completar
- NO hay campo para guardar URLs extraídas (para detección de duplicados)
- NO hay logs específicos de extracción de URLs

---

### 1.2. Service: `GeneratorProSchedulerService`

**Archivo**: `packages/api-nueva/src/generator-pro/services/generator-pro-scheduler.service.ts`

```typescript
@Injectable()
export class GeneratorProSchedulerService implements OnModuleInit {
  onModuleInit() {
    this.logger.log('GeneratorProScheduler initialized');
    // 🔴 PROBLEMA: NO hay lógica aquí para calcular próximas ejecuciones
  }

  /**
   * ⏰ Cron que ejecuta cada 5 minutos
   */
  @Cron('*/5 * * * *')
  async scheduleExtractionJobs() {
    const websites = await this.websiteModel.find({ isActive: true });

    for (const website of websites) {
      const nextRun = this.calculateNextRun(
        website.lastExtractionRun,
        website.extractionFrequency,
      );

      // ✅ BIEN: Verifica si ya es tiempo de ejecutar
      if (Date.now() >= nextRun.getTime()) {
        await this.queueService.addExtractionJob({
          type: 'extract_urls',
          websiteConfigId: String(website._id),
          data: { automated: true },
        });

        // 🔴 PROBLEMA: Actualiza INMEDIATAMENTE, no al completar job
        await this.websiteModel.findByIdAndUpdate(website._id, {
          lastExtractionRun: new Date(),
        });
      }
    }
  }

  /**
   * ✅ BIEN: Calcula próxima ejecución
   */
  private calculateNextRun(lastRun: Date | undefined, frequencyMinutes: number): Date {
    if (!lastRun) {
      return new Date(0); // Ejecutar ahora
    }
    return new Date(lastRun.getTime() + (frequencyMinutes * 60 * 1000));
  }
}
```

**✅ Lo que funciona bien**:
- Cálculo correcto de `nextRun`
- Cron cada 5 minutos verifica sitios

**🔴 Problemas**:
1. **NO hay lógica en `OnModuleInit`**: Al levantar servidor, espera hasta 5 minutos para que el cron ejecute
2. **Actualización prematura**: `lastExtractionRun` se actualiza al encolar, no al ejecutar el job
3. **Sin considerar estado actual**: Si debió ejecutar hace 10 minutos, no ejecuta inmediatamente

---

### 1.3. Service: `GeneratorProOrchestratorService`

**Archivo**: `packages/api-nueva/src/generator-pro/services/generator-pro-orchestrator.service.ts`

```typescript
@Injectable()
export class GeneratorProOrchestratorService {
  private cycleIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * 🔄 Inicializa ciclos para un sitio
   */
  private async initializeWebsiteCycles(website: NewsWebsiteConfigDocument): Promise<void> {
    // 🔴 PROBLEMA CRÍTICO: setInterval desde NOW, no considera lastExtractionRun
    const extractionInterval = setInterval(async () => {
      if (this.isSystemRunning) {
        await this.runExtractionCycle(String(website._id));
      }
    }, website.extractionFrequency * 60 * 1000); // Empieza a contar desde NOW

    this.cycleIntervals.set(`${website._id}-extraction`, extractionInterval);
  }

  /**
   * Ejecuta ciclo de extracción
   */
  async runExtractionCycle(websiteId: string): Promise<CycleResult> {
    const website = await this.websiteConfigModel.findById(websiteId);

    // Extraer URLs
    const extractedUrls = await this.websiteService.extractNewsUrls(websiteId);

    // 🔴 PROBLEMA: NO hay detección de URLs duplicadas
    for (const url of extractedUrls) {
      await this.queueService.addExtractionJob({
        type: 'extract_content',
        websiteConfigId: websiteId,
        data: { targetUrl: url },
      });
    }

    // 🔴 PROBLEMA: Actualiza timestamp aquí, pero ¿qué pasa si hubo error?
    await this.websiteConfigModel.findByIdAndUpdate(websiteId, {
      lastExtractionRun: new Date(),
    });

    return { success: true, jobsCreated: extractedUrls.length };
  }
}
```

**🔴 Problemas críticos**:
1. **`setInterval` desde NOW**: NO calcula cuándo debería ser la próxima ejecución basado en `lastExtractionRun`
2. **Sin detección de duplicados**: Procesa todas las URLs cada vez, incluso las ya procesadas
3. **Actualización incondicional**: Actualiza `lastExtractionRun` aunque no se hayan extraído URLs nuevas

---

### 1.4. Schema: `NoticiasExtractionLog`

**Archivo**: `packages/api-nueva/src/noticias/schemas/noticias-extraction-log.schema.ts`

```typescript
@Schema({ timestamps: true })
export class NoticiasExtractionLog {
  @Prop({ required: true, trim: true })
  sourceUrl: string; // URL de la noticia individual

  @Prop({ required: true, trim: true })
  domain: string;

  @Prop({ enum: ['success', 'error', 'partial', 'skipped'], required: true })
  status: string;

  @Prop({ required: true })
  method: 'cheerio' | 'puppeteer' | 'manual';

  @Prop({ required: true })
  processingTime: number; // ms

  @Prop({ type: Object })
  extractedData?: {
    title?: string;
    contentLength?: number;
    imagesCount?: number;
  };

  @Prop({ type: Object })
  error?: {
    message: string;
    type: 'network' | 'parsing' | 'selector' | 'timeout' | 'rate_limit' | 'unknown';
  };

  // ... más campos
}
```

**✅ Lo que funciona bien**:
- Logs detallados de extracción de contenido
- Métricas de performance
- Tracking de errores

**🔴 Problema**:
- Solo logs de extracción de CONTENIDO
- NO hay logs de extracción de URLs desde listados

---

## 🏗️ 2. ARQUITECTURA PROPUESTA

### 2.1. Schema Nuevo: `ExtractedUrlTracking`

**Archivo**: `packages/api-nueva/src/generator-pro/schemas/extracted-url-tracking.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExtractedUrlTrackingDocument = ExtractedUrlTracking & Document;

/**
 * 🔗 Schema para trackear URLs extraídas y evitar duplicados
 *
 * Propósito:
 * - Guardar todas las URLs extraídas de listados
 * - Detectar URLs duplicadas
 * - Trackear estado de procesamiento de cada URL
 * - Permitir re-extracción después de X días (contenido actualizado)
 */
@Schema({ timestamps: true })
export class ExtractedUrlTracking {
  // ========================================
  // 🔑 IDENTIFICACIÓN
  // ========================================

  @Prop({ required: true, type: Types.ObjectId, ref: 'NewsWebsiteConfig', index: true })
  websiteConfigId: Types.ObjectId; // Sitio del que se extrajo

  @Prop({ required: true, trim: true, index: true })
  url: string; // URL completa de la noticia

  @Prop({ required: true, trim: true, index: true })
  urlHash: string; // Hash SHA-256 de la URL (para búsquedas rápidas)

  @Prop({ required: true, trim: true })
  domain: string; // Dominio extraído de la URL

  // ========================================
  // 📊 ESTADO DE PROCESAMIENTO
  // ========================================

  @Prop({
    required: true,
    enum: ['discovered', 'queued', 'processing', 'completed', 'failed', 'skipped'],
    default: 'discovered',
    index: true
  })
  status: 'discovered' | 'queued' | 'processing' | 'completed' | 'failed' | 'skipped';

  @Prop()
  queuedAt?: Date; // Cuándo se agregó a la cola

  @Prop()
  processedAt?: Date; // Cuándo se procesó completamente

  @Prop({ type: String })
  failureReason?: string; // Razón de fallo si status = 'failed'

  // ========================================
  // 🔍 METADATA DE EXTRACCIÓN
  // ========================================

  @Prop({ required: true })
  firstDiscoveredAt: Date; // Primera vez que se descubrió

  @Prop({ required: true })
  lastSeenAt: Date; // Última vez que apareció en el listado

  @Prop({ default: 1 })
  timesDiscovered: number; // Cuántas veces ha aparecido en listados

  @Prop({ type: String })
  title?: string; // Título si se pudo extraer del listado

  @Prop({ type: String })
  imageUrl?: string; // Imagen si se pudo extraer del listado

  // ========================================
  // 🔄 CONTROL DE RE-EXTRACCIÓN
  // ========================================

  @Prop({ default: false })
  allowReExtraction: boolean; // ¿Permitir re-extraer después de X días?

  @Prop({ default: 30 })
  reExtractionDays: number; // Días después de los cuales se puede re-extraer (default: 30)

  @Prop()
  nextReExtractionAllowedAt?: Date; // Cuándo se permite re-extraer

  // ========================================
  // 📝 REFERENCIAS
  // ========================================

  @Prop({ type: Types.ObjectId, ref: 'ExtractedNoticia' })
  extractedNoticiaId?: Types.ObjectId; // Referencia a contenido extraído (si existe)

  @Prop({ type: Types.ObjectId, ref: 'AIContentGeneration' })
  generatedContentId?: Types.ObjectId; // Referencia a contenido generado (si existe)

  @Prop({ type: Types.ObjectId, ref: 'PublishedNoticia' })
  publishedNoticiaId?: Types.ObjectId; // Referencia a noticia publicada (si existe)

  // ========================================
  // 📊 MÉTRICAS
  // ========================================

  @Prop({ default: 0 })
  extractionAttempts: number; // Intentos de extracción

  @Prop()
  lastExtractionAttempt?: Date;

  @Prop({ type: Number })
  processingTime?: number; // Tiempo de procesamiento (ms)

  // ========================================
  // 🔧 METADATA
  // ========================================

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ExtractedUrlTrackingSchema = SchemaFactory.createForClass(ExtractedUrlTracking);

// ========================================
// 📇 ÍNDICES
// ========================================

// Índice único: Un sitio no puede tener la misma URL dos veces
ExtractedUrlTrackingSchema.index(
  { websiteConfigId: 1, urlHash: 1 },
  { unique: true }
);

// Índices de búsqueda
ExtractedUrlTrackingSchema.index({ url: 1 });
ExtractedUrlTrackingSchema.index({ domain: 1, status: 1 });
ExtractedUrlTrackingSchema.index({ status: 1, createdAt: -1 });
ExtractedUrlTrackingSchema.index({ websiteConfigId: 1, status: 1, lastSeenAt: -1 });

// Índice para re-extracción
ExtractedUrlTrackingSchema.index({
  status: 1,
  allowReExtraction: 1,
  nextReExtractionAllowedAt: 1
});

// ========================================
// 🔧 MÉTODOS
// ========================================

ExtractedUrlTrackingSchema.methods.markAsQueued = function (): Promise<ExtractedUrlTrackingDocument> {
  this.status = 'queued';
  this.queuedAt = new Date();
  return this.save();
};

ExtractedUrlTrackingSchema.methods.markAsProcessing = function (): Promise<ExtractedUrlTrackingDocument> {
  this.status = 'processing';
  this.extractionAttempts += 1;
  this.lastExtractionAttempt = new Date();
  return this.save();
};

ExtractedUrlTrackingSchema.methods.markAsCompleted = function (
  extractedNoticiaId?: Types.ObjectId,
  processingTime?: number
): Promise<ExtractedUrlTrackingDocument> {
  this.status = 'completed';
  this.processedAt = new Date();
  if (extractedNoticiaId) {
    this.extractedNoticiaId = extractedNoticiaId;
  }
  if (processingTime) {
    this.processingTime = processingTime;
  }
  // Calcular próxima re-extracción si está habilitada
  if (this.allowReExtraction) {
    this.nextReExtractionAllowedAt = new Date(
      Date.now() + this.reExtractionDays * 24 * 60 * 60 * 1000
    );
  }
  return this.save();
};

ExtractedUrlTrackingSchema.methods.markAsFailed = function (reason: string): Promise<ExtractedUrlTrackingDocument> {
  this.status = 'failed';
  this.failureReason = reason;
  this.processedAt = new Date();
  return this.save();
};

ExtractedUrlTrackingSchema.methods.updateLastSeen = function (): Promise<ExtractedUrlTrackingDocument> {
  this.lastSeenAt = new Date();
  this.timesDiscovered += 1;
  return this.save();
};
```

---

### 2.2. Schema Nuevo: `UrlExtractionLog`

**Archivo**: `packages/api-nueva/src/generator-pro/schemas/url-extraction-log.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UrlExtractionLogDocument = UrlExtractionLog & Document;

/**
 * 📊 Schema para logs de extracción de URLs desde listados
 *
 * Propósito:
 * - Loggear cada ejecución de extracción de URLs
 * - Trackear cuántas URLs se encontraron
 * - Trackear cuántas URLs son nuevas vs duplicadas
 * - Métricas de performance
 * - Debugging de selectores
 */
@Schema({ timestamps: true })
export class UrlExtractionLog {
  // ========================================
  // 🔑 IDENTIFICACIÓN
  // ========================================

  @Prop({ required: true, type: Types.ObjectId, ref: 'NewsWebsiteConfig', index: true })
  websiteConfigId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  websiteName: string; // Nombre del sitio para búsquedas fáciles

  @Prop({ required: true, trim: true })
  listingUrl: string; // URL del listado escaneado

  // ========================================
  // 📊 RESULTADOS
  // ========================================

  @Prop({ required: true, enum: ['success', 'partial', 'failed'], index: true })
  status: 'success' | 'partial' | 'failed';

  @Prop({ required: true, default: 0 })
  totalUrlsFound: number; // Total de URLs encontradas en el listado

  @Prop({ required: true, default: 0 })
  newUrls: number; // URLs nuevas (no vistas antes)

  @Prop({ required: true, default: 0 })
  duplicateUrls: number; // URLs que ya existían

  @Prop({ required: true, default: 0 })
  skippedUrls: number; // URLs que se saltaron (filtros, etc)

  @Prop({ required: true, default: 0 })
  queuedUrls: number; // URLs agregadas a la cola de procesamiento

  // ========================================
  // ⏱️ MÉTRICAS DE PERFORMANCE
  // ========================================

  @Prop({ required: true })
  processingTime: number; // Tiempo total (ms)

  @Prop()
  fetchTime?: number; // Tiempo de fetch del listado (ms)

  @Prop()
  parsingTime?: number; // Tiempo de parsing con Cheerio/Puppeteer (ms)

  @Prop()
  dbOperationsTime?: number; // Tiempo de operaciones de BD (ms)

  // ========================================
  // 🔍 METADATA TÉCNICA
  // ========================================

  @Prop({ required: true, enum: ['cheerio', 'puppeteer'] })
  method: 'cheerio' | 'puppeteer';

  @Prop({ required: true })
  httpStatusCode: number;

  @Prop({ type: String })
  selector: string; // Selector usado (articleLinks)

  @Prop()
  htmlSize?: number; // Tamaño del HTML descargado (bytes)

  // ========================================
  // ❌ ERRORES Y WARNINGS
  // ========================================

  @Prop({ type: String })
  errorMessage?: string;

  @Prop({ type: String })
  errorType?: 'network' | 'parsing' | 'selector' | 'timeout' | 'rate_limit' | 'unknown';

  @Prop({ type: [String], default: [] })
  warnings: string[]; // Warnings no críticos

  // ========================================
  // 📝 SAMPLES PARA DEBUGGING
  // ========================================

  @Prop({ type: [String], default: [] })
  sampleUrls: string[]; // Primeras 5 URLs encontradas (para debugging)

  // ========================================
  // 🔧 METADATA
  // ========================================

  @Prop({ default: false })
  wasScheduled: boolean; // ¿Fue ejecución automática o manual?

  @Prop({ required: true })
  executedAt: Date; // Cuándo se ejecutó

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UrlExtractionLogSchema = SchemaFactory.createForClass(UrlExtractionLog);

// ========================================
// 📇 ÍNDICES
// ========================================

UrlExtractionLogSchema.index({ websiteConfigId: 1, executedAt: -1 });
UrlExtractionLogSchema.index({ status: 1, executedAt: -1 });
UrlExtractionLogSchema.index({ websiteName: 1, executedAt: -1 });
UrlExtractionLogSchema.index({ executedAt: -1 }); // Para queries de rango temporal
```

---

## 🛠️ 3. ESQUEMAS Y SERVICIOS

### 3.1. Service Nuevo: `SmartExtractionSchedulerService`

**Archivo**: `packages/api-nueva/src/generator-pro/services/smart-extraction-scheduler.service.ts`

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { CronJob } from 'cron';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NewsWebsiteConfig, NewsWebsiteConfigDocument } from '../schemas/news-website-config.schema';
import { UrlExtractionService } from './url-extraction.service';

/**
 * 📅 Smart Extraction Scheduler Service
 *
 * PROPÓSITO:
 * - Scheduling inteligente de extracción de URLs
 * - Considera última extracción al levantar servidor
 * - Programa próxima ejecución basándose en frecuencia configurada
 * - Actualiza timestamps solo después de ejecución exitosa
 *
 * FUNCIONAMIENTO:
 * 1. OnModuleInit: Calcula próximas ejecuciones para todos los sitios activos
 * 2. Programa CronJobs dinámicos para cada sitio
 * 3. Después de cada extracción, re-programa la siguiente
 */
@Injectable()
export class SmartExtractionSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SmartExtractionSchedulerService.name);
  private readonly scheduledJobs: Map<string, CronJob> = new Map();

  constructor(
    @InjectModel(NewsWebsiteConfig.name)
    private websiteModel: Model<NewsWebsiteConfigDocument>,
    private schedulerRegistry: SchedulerRegistry,
    private urlExtractionService: UrlExtractionService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * 🚀 Inicializa scheduling al levantar el servidor
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('🚀 Inicializando Smart Extraction Scheduler...');

    try {
      const activeWebsites = await this.websiteModel.find({ isActive: true });

      if (activeWebsites.length === 0) {
        this.logger.warn('⚠️ No hay sitios activos configurados');
        return;
      }

      for (const website of activeWebsites) {
        await this.scheduleWebsiteExtraction(website);
      }

      this.logger.log(
        `✅ Scheduler iniciado con ${activeWebsites.length} sitios activos`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error inicializando scheduler: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 📅 Programa extracción para un sitio específico
   *
   * LÓGICA:
   * 1. Calcula cuándo DEBERÍA ejecutar próxima extracción
   * 2. Si ya pasó la hora, ejecuta INMEDIATAMENTE
   * 3. Si no, programa para la hora calculada
   * 4. Usa SchedulerRegistry para CronJobs dinámicos
   */
  async scheduleWebsiteExtraction(
    website: NewsWebsiteConfigDocument,
  ): Promise<void> {
    const websiteId = String(website._id);
    const now = Date.now();

    // Calcular próxima ejecución
    const nextExecutionTime = this.calculateNextExecution(
      website.lastExtractionRun,
      website.extractionFrequency,
    );

    const delayMs = nextExecutionTime.getTime() - now;

    this.logger.log(
      `📅 Programando extracción para "${website.name}":`,
    );
    this.logger.log(
      `   - Última extracción: ${website.lastExtractionRun ? website.lastExtractionRun.toISOString() : 'NUNCA'}`,
    );
    this.logger.log(
      `   - Frecuencia: ${website.extractionFrequency} minutos`,
    );
    this.logger.log(
      `   - Próxima ejecución calculada: ${nextExecutionTime.toISOString()}`,
    );
    this.logger.log(
      `   - Delay: ${Math.floor(delayMs / 1000)} segundos`,
    );

    // Si ya debió ejecutarse, ejecutar INMEDIATAMENTE
    if (delayMs <= 0) {
      this.logger.log(
        `⚡ Extracción de "${website.name}" ya debió ejecutarse, ejecutando AHORA`,
      );
      await this.executeExtraction(websiteId);
      return;
    }

    // Programar para la hora calculada
    this.scheduleOneTimeExecution(websiteId, delayMs);
  }

  /**
   * ⏰ Programa una ejecución única después de X ms
   *
   * Después de ejecutar, re-programa la siguiente
   */
  private scheduleOneTimeExecution(
    websiteId: string,
    delayMs: number,
  ): void {
    // Limpiar job anterior si existe
    this.cancelScheduledJob(websiteId);

    // Programar timeout
    const timeout = setTimeout(async () => {
      await this.executeExtraction(websiteId);
    }, delayMs);

    // Guardar referencia (como pseudo-CronJob para poder cancelar)
    const pseudoJob = {
      stop: () => clearTimeout(timeout),
      start: () => {},
    } as any;

    this.scheduledJobs.set(websiteId, pseudoJob);

    this.logger.log(
      `✅ Programada extracción para ${websiteId} en ${Math.floor(delayMs / 1000)} segundos`,
    );
  }

  /**
   * 🔍 Ejecuta extracción y re-programa siguiente
   */
  private async executeExtraction(websiteId: string): Promise<void> {
    this.logger.log(`🔍 Ejecutando extracción para sitio: ${websiteId}`);

    try {
      // Ejecutar extracción
      const result = await this.urlExtractionService.extractUrls(
        new Types.ObjectId(websiteId),
      );

      if (result.success) {
        // ✅ CRÍTICO: Solo actualizar timestamp DESPUÉS de ejecución exitosa
        await this.websiteModel.findByIdAndUpdate(websiteId, {
          lastExtractionRun: new Date(),
          $inc: {
            'statistics.successfulExtractions': 1,
            'statistics.totalUrlsExtracted': result.totalUrlsFound,
          },
        });

        this.logger.log(
          `✅ Extracción exitosa para ${websiteId}: ${result.newUrls} URLs nuevas`,
        );
      } else {
        // Error: NO actualizar timestamp, intentar de nuevo en próxima ejecución
        this.logger.error(
          `❌ Extracción falló para ${websiteId}: ${result.error}`,
        );

        await this.websiteModel.findByIdAndUpdate(websiteId, {
          $inc: { 'statistics.failedExtractions': 1 },
        });
      }

      // Re-programar siguiente extracción
      const website = await this.websiteModel.findById(websiteId);
      if (website && website.isActive) {
        await this.scheduleWebsiteExtraction(website);
      }

      // Emitir evento
      this.eventEmitter.emit('url-extraction.completed', {
        websiteId,
        success: result.success,
        newUrls: result.newUrls,
        totalUrls: result.totalUrlsFound,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `❌ Error ejecutando extracción para ${websiteId}: ${error.message}`,
        error.stack,
      );

      // Re-programar de todos modos
      const website = await this.websiteModel.findById(websiteId);
      if (website && website.isActive) {
        await this.scheduleWebsiteExtraction(website);
      }
    }
  }

  /**
   * 🧮 Calcula próxima ejecución basándose en última y frecuencia
   *
   * LÓGICA:
   * - Si nunca se ha ejecutado: AHORA
   * - Si ya se ejecutó: lastRun + frequencyMinutes
   */
  private calculateNextExecution(
    lastRun: Date | undefined,
    frequencyMinutes: number,
  ): Date {
    if (!lastRun) {
      // Nunca se ha ejecutado, ejecutar ahora
      return new Date();
    }

    // Calcular próxima ejecución
    const nextRun = new Date(
      lastRun.getTime() + frequencyMinutes * 60 * 1000,
    );

    return nextRun;
  }

  /**
   * ❌ Cancela job programado para un sitio
   */
  private cancelScheduledJob(websiteId: string): void {
    const existingJob = this.scheduledJobs.get(websiteId);
    if (existingJob) {
      existingJob.stop();
      this.scheduledJobs.delete(websiteId);
      this.logger.debug(`Cancelado job anterior para ${websiteId}`);
    }
  }

  /**
   * 🔄 Re-programa extracción para un sitio (útil para cambios de config)
   */
  async rescheduleWebsite(websiteId: string): Promise<void> {
    this.cancelScheduledJob(websiteId);

    const website = await this.websiteModel.findById(websiteId);
    if (!website) {
      throw new Error(`Website ${websiteId} not found`);
    }

    if (!website.isActive) {
      this.logger.log(`Sitio ${websiteId} está inactivo, no se programa`);
      return;
    }

    await this.scheduleWebsiteExtraction(website);
  }

  /**
   * ⏸️ Pausa extracción para un sitio
   */
  async pauseWebsite(websiteId: string): Promise<void> {
    this.cancelScheduledJob(websiteId);
    await this.websiteModel.findByIdAndUpdate(websiteId, {
      isActive: false,
    });
    this.logger.log(`⏸️ Extracción pausada para ${websiteId}`);
  }

  /**
   * ▶️ Reanuda extracción para un sitio
   */
  async resumeWebsite(websiteId: string): Promise<void> {
    const website = await this.websiteModel.findByIdAndUpdate(
      websiteId,
      { isActive: true },
      { new: true },
    );

    if (!website) {
      throw new Error(`Website ${websiteId} not found`);
    }

    await this.scheduleWebsiteExtraction(website);
    this.logger.log(`▶️ Extracción reanudada para ${websiteId}`);
  }

  /**
   * 🔍 Obtiene estado de scheduling para un sitio
   */
  async getSchedulingStatus(websiteId: string): Promise<{
    isScheduled: boolean;
    nextExecution: Date | null;
    lastExecution: Date | null;
    frequency: number;
  }> {
    const website = await this.websiteModel.findById(websiteId);
    if (!website) {
      throw new Error(`Website ${websiteId} not found`);
    }

    const isScheduled = this.scheduledJobs.has(websiteId) && website.isActive;
    const nextExecution = isScheduled
      ? this.calculateNextExecution(
          website.lastExtractionRun,
          website.extractionFrequency,
        )
      : null;

    return {
      isScheduled,
      nextExecution,
      lastExecution: website.lastExtractionRun || null,
      frequency: website.extractionFrequency,
    };
  }
}
```

---

### 3.2. Service Nuevo: `UrlExtractionService`

**Archivo**: `packages/api-nueva/src/generator-pro/services/url-extraction.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';

import { NewsWebsiteConfig, NewsWebsiteConfigDocument } from '../schemas/news-website-config.schema';
import { ExtractedUrlTracking, ExtractedUrlTrackingDocument } from '../schemas/extracted-url-tracking.schema';
import { UrlExtractionLog, UrlExtractionLogDocument } from '../schemas/url-extraction-log.schema';
import { PuppeteerManagerService } from '../../modules/reports/services/puppeteer-manager.service';

/**
 * 🔍 URL Extraction Service
 *
 * Responsabilidades:
 * - Extraer URLs desde listados de sitios web
 * - Detectar URLs duplicadas
 * - Guardar tracking de URLs extraídas
 * - Generar logs detallados
 * - Encolar URLs nuevas para extracción de contenido
 */

interface UrlExtractionResult {
  success: boolean;
  totalUrlsFound: number;
  newUrls: number;
  duplicateUrls: number;
  skippedUrls: number;
  queuedUrls: number;
  processingTime: number;
  error?: string;
}

@Injectable()
export class UrlExtractionService {
  private readonly logger = new Logger(UrlExtractionService.name);

  constructor(
    @InjectModel(NewsWebsiteConfig.name)
    private websiteModel: Model<NewsWebsiteConfigDocument>,
    @InjectModel(ExtractedUrlTracking.name)
    private urlTrackingModel: Model<ExtractedUrlTrackingDocument>,
    @InjectModel(UrlExtractionLog.name)
    private urlLogModel: Model<UrlExtractionLogDocument>,
    private puppeteerService: PuppeteerManagerService,
  ) {}

  /**
   * 🔍 Extrae URLs de un sitio web
   */
  async extractUrls(websiteId: Types.ObjectId): Promise<UrlExtractionResult> {
    const startTime = Date.now();

    this.logger.log(`🔍 Iniciando extracción de URLs para sitio: ${websiteId}`);

    try {
      // Obtener configuración del sitio
      const website = await this.websiteModel.findById(websiteId);
      if (!website) {
        throw new Error(`Website ${websiteId} not found`);
      }

      if (!website.isActive) {
        throw new Error(`Website ${website.name} is not active`);
      }

      // Extraer URLs según método (Cheerio o Puppeteer)
      const extractedUrls = website.extractionSettings.useJavaScript
        ? await this.extractWithPuppeteer(website)
        : await this.extractWithCheerio(website);

      // Procesar URLs extraídas
      const processingResult = await this.processExtractedUrls(
        website,
        extractedUrls,
      );

      const processingTime = Date.now() - startTime;

      // Crear log
      await this.createExtractionLog(website, {
        status: 'success',
        totalUrlsFound: extractedUrls.length,
        newUrls: processingResult.newUrls,
        duplicateUrls: processingResult.duplicateUrls,
        skippedUrls: processingResult.skippedUrls,
        queuedUrls: processingResult.queuedUrls,
        processingTime,
        method: website.extractionSettings.useJavaScript ? 'puppeteer' : 'cheerio',
        sampleUrls: extractedUrls.slice(0, 5),
      });

      this.logger.log(
        `✅ Extracción completada para ${website.name}: ${processingResult.newUrls} nuevas, ${processingResult.duplicateUrls} duplicadas`,
      );

      return {
        success: true,
        totalUrlsFound: extractedUrls.length,
        newUrls: processingResult.newUrls,
        duplicateUrls: processingResult.duplicateUrls,
        skippedUrls: processingResult.skippedUrls,
        queuedUrls: processingResult.queuedUrls,
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `❌ Error extrayendo URLs para ${websiteId}: ${error.message}`,
        error.stack,
      );

      // Crear log de error
      const website = await this.websiteModel.findById(websiteId);
      if (website) {
        await this.createExtractionLog(website, {
          status: 'failed',
          totalUrlsFound: 0,
          newUrls: 0,
          duplicateUrls: 0,
          skippedUrls: 0,
          queuedUrls: 0,
          processingTime,
          errorMessage: error.message,
          errorType: this.categorizeError(error.message),
        });
      }

      return {
        success: false,
        totalUrlsFound: 0,
        newUrls: 0,
        duplicateUrls: 0,
        skippedUrls: 0,
        queuedUrls: 0,
        processingTime,
        error: error.message,
      };
    }
  }

  /**
   * 🌐 Extrae URLs con Cheerio (estático)
   */
  private async extractWithCheerio(
    website: NewsWebsiteConfigDocument,
  ): Promise<string[]> {
    this.logger.log(`🕷️ Extrayendo URLs con Cheerio desde: ${website.listingUrl}`);

    try {
      // Fetch HTML
      const response = await axios.get(website.listingUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...website.customHeaders,
        },
        timeout: website.extractionSettings.timeout || 30000,
      });

      // Parse con Cheerio
      const $ = cheerio.load(response.data);

      // Extraer URLs usando selector
      const selector = website.listingSelectors.articleLinks;
      const urls: string[] = [];

      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          // Convertir a URL absoluta si es relativa
          const absoluteUrl = this.makeAbsoluteUrl(href, website.baseUrl);
          urls.push(absoluteUrl);
        }
      });

      this.logger.log(`🔗 Encontradas ${urls.length} URLs con selector "${selector}"`);

      return urls;
    } catch (error) {
      this.logger.error(`❌ Error con Cheerio: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🎭 Extrae URLs con Puppeteer (dinámico)
   */
  private async extractWithPuppeteer(
    website: NewsWebsiteConfigDocument,
  ): Promise<string[]> {
    this.logger.log(`🎭 Extrayendo URLs con Puppeteer desde: ${website.listingUrl}`);

    try {
      // Renderizar con Puppeteer
      const html = await this.puppeteerService.getRenderedHTML(
        website.listingUrl,
        {
          waitTime: website.extractionSettings.waitTime,
          timeout: website.extractionSettings.timeout || 30000,
          useJavaScript: true,
        },
      );

      // Parse con Cheerio
      const $ = cheerio.load(html);

      // Extraer URLs
      const selector = website.listingSelectors.articleLinks;
      const urls: string[] = [];

      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const absoluteUrl = this.makeAbsoluteUrl(href, website.baseUrl);
          urls.push(absoluteUrl);
        }
      });

      this.logger.log(`🔗 Encontradas ${urls.length} URLs con Puppeteer`);

      return urls;
    } catch (error) {
      this.logger.error(`❌ Error con Puppeteer: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔄 Procesa URLs extraídas
   *
   * LÓGICA:
   * 1. Para cada URL, calcular hash
   * 2. Verificar si ya existe en ExtractedUrlTracking
   * 3. Si existe: actualizar lastSeenAt
   * 4. Si no existe: crear nuevo tracking y encolar para extracción
   */
  private async processExtractedUrls(
    website: NewsWebsiteConfigDocument,
    urls: string[],
  ): Promise<{
    newUrls: number;
    duplicateUrls: number;
    skippedUrls: number;
    queuedUrls: number;
  }> {
    let newUrls = 0;
    let duplicateUrls = 0;
    let skippedUrls = 0;
    let queuedUrls = 0;

    for (const url of urls) {
      try {
        // Calcular hash de la URL
        const urlHash = this.calculateUrlHash(url);

        // Buscar si ya existe
        const existingTracking = await this.urlTrackingModel.findOne({
          websiteConfigId: website._id,
          urlHash,
        });

        if (existingTracking) {
          // URL duplicada: actualizar lastSeenAt
          await existingTracking.updateLastSeen();
          duplicateUrls++;

          this.logger.debug(`🔁 URL duplicada: ${url}`);

          // Verificar si necesita re-extracción
          if (this.needsReExtraction(existingTracking)) {
            this.logger.log(`🔄 URL necesita re-extracción: ${url}`);
            // TODO: Encolar para re-extracción
            queuedUrls++;
          }
        } else {
          // URL nueva: crear tracking
          const tracking = new this.urlTrackingModel({
            websiteConfigId: website._id,
            url,
            urlHash,
            domain: new URL(url).hostname,
            status: 'discovered',
            firstDiscoveredAt: new Date(),
            lastSeenAt: new Date(),
            timesDiscovered: 1,
            allowReExtraction: false, // Por defecto no permitir re-extracción
          });

          await tracking.save();
          newUrls++;

          this.logger.debug(`🆕 URL nueva: ${url}`);

          // Encolar para extracción de contenido
          // TODO FASE 2: Integrar con GeneratorProQueueService
          queuedUrls++;
        }
      } catch (error) {
        this.logger.error(`❌ Error procesando URL ${url}: ${error.message}`);
        skippedUrls++;
      }
    }

    return {
      newUrls,
      duplicateUrls,
      skippedUrls,
      queuedUrls,
    };
  }

  /**
   * 🔑 Calcula hash SHA-256 de una URL
   */
  private calculateUrlHash(url: string): string {
    return createHash('sha256').update(url).digest('hex');
  }

  /**
   * 🔗 Convierte URL relativa a absoluta
   */
  private makeAbsoluteUrl(href: string, baseUrl: string): string {
    try {
      if (href.startsWith('http://') || href.startsWith('https://')) {
        return href;
      }
      const base = new URL(baseUrl);
      return new URL(href, base.origin).href;
    } catch {
      return href;
    }
  }

  /**
   * 🔄 Verifica si una URL necesita re-extracción
   */
  private needsReExtraction(tracking: ExtractedUrlTrackingDocument): boolean {
    if (!tracking.allowReExtraction) {
      return false;
    }

    if (!tracking.nextReExtractionAllowedAt) {
      return false;
    }

    return new Date() >= tracking.nextReExtractionAllowedAt;
  }

  /**
   * 📝 Crea log de extracción
   */
  private async createExtractionLog(
    website: NewsWebsiteConfigDocument,
    data: Partial<UrlExtractionLog>,
  ): Promise<void> {
    try {
      const log = new this.urlLogModel({
        websiteConfigId: website._id,
        websiteName: website.name,
        listingUrl: website.listingUrl,
        selector: website.listingSelectors.articleLinks,
        executedAt: new Date(),
        wasScheduled: true,
        ...data,
      });

      await log.save();
    } catch (error) {
      this.logger.error(`Error creando log: ${error.message}`);
    }
  }

  /**
   * 🔍 Categoriza tipo de error
   */
  private categorizeError(errorMessage: string): string {
    const message = errorMessage.toLowerCase();

    if (message.includes('timeout')) return 'timeout';
    if (message.includes('network') || message.includes('connection')) return 'network';
    if (message.includes('selector') || message.includes('not found')) return 'selector';
    if (message.includes('rate limit')) return 'rate_limit';
    if (message.includes('parse')) return 'parsing';

    return 'unknown';
  }
}
```

---

## 🛠️ 4. PATRONES DE IMPLEMENTACIÓN

### 4.1. Patrones del Backend (NestJS)

#### ✅ **Patrón 1: OnModuleInit para Scheduling Inteligente**

```typescript
// ✅ BIEN: Calcular próxima ejecución al iniciar
@Injectable()
export class SmartScheduler implements OnModuleInit {
  async onModuleInit() {
    const websites = await this.websiteModel.find({ isActive: true });

    for (const website of websites) {
      // Calcular cuándo debería ejecutar
      const nextRun = this.calculateNextRun(
        website.lastExtractionRun,
        website.extractionFrequency
      );

      // Programar con delay calculado
      const delay = nextRun.getTime() - Date.now();

      if (delay <= 0) {
        // Ya debió ejecutarse, ejecutar AHORA
        await this.executeExtraction(website._id);
      } else {
        // Programar para la hora calculada
        this.scheduleExtraction(website._id, delay);
      }
    }
  }
}

// ❌ MAL: No considerar última ejecución
@Injectable()
export class BadScheduler implements OnModuleInit {
  async onModuleInit() {
    // Solo loggear, no programar nada
    this.logger.log('Initialized');
  }
}
```

#### ✅ **Patrón 2: SchedulerRegistry para Cron Jobs Dinámicos**

```typescript
// ✅ BIEN: Usar SchedulerRegistry para jobs dinámicos
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class SmartScheduler {
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  scheduleExtraction(websiteId: string, delayMs: number) {
    // Programar timeout dinámico
    const timeout = setTimeout(async () => {
      await this.executeExtraction(websiteId);
    }, delayMs);

    // Registrar para poder cancelar después
    this.schedulerRegistry.addTimeout(`extraction-${websiteId}`, timeout);
  }

  cancelExtraction(websiteId: string) {
    this.schedulerRegistry.deleteTimeout(`extraction-${websiteId}`);
  }
}

// ❌ MAL: setInterval directo sin considerar estado
@Injectable()
export class BadScheduler {
  initializeWebsite(website: Website) {
    // Empieza a contar desde NOW, ignora lastRun
    setInterval(() => {
      this.extract(website._id);
    }, website.frequency * 60 * 1000);
  }
}
```

#### ✅ **Patrón 3: Actualizar Timestamps DESPUÉS de Ejecución**

```typescript
// ✅ BIEN: Actualizar después de éxito
async executeExtraction(websiteId: string) {
  try {
    const result = await this.extractUrls(websiteId);

    if (result.success) {
      // Solo actualizar si fue exitoso
      await this.websiteModel.findByIdAndUpdate(websiteId, {
        lastExtractionRun: new Date(),
      });
    }

    // Re-programar siguiente
    await this.scheduleNextExtraction(websiteId);

  } catch (error) {
    // NO actualizar timestamp si hubo error
    this.logger.error(`Error: ${error.message}`);
  }
}

// ❌ MAL: Actualizar ANTES de ejecutar
async scheduleExtraction(websiteId: string) {
  // Actualiza timestamp ANTES de ejecutar
  await this.websiteModel.findByIdAndUpdate(websiteId, {
    lastExtractionRun: new Date(),
  });

  // Si esto falla, timestamp ya fue actualizado incorrectamente
  await this.extractUrls(websiteId);
}
```

#### ✅ **Patrón 4: Tipado Estricto (No `any`)**

```typescript
// ✅ BIEN: Tipos explícitos
interface UrlExtractionResult {
  success: boolean;
  totalUrlsFound: number;
  newUrls: number;
  duplicateUrls: number;
  error?: string;
}

async extractUrls(websiteId: Types.ObjectId): Promise<UrlExtractionResult> {
  // Implementación
}

// ❌ MAL: Uso de any
async extractUrls(websiteId: any): Promise<any> {
  // Pierde validación de tipos
}
```

#### ✅ **Patrón 5: EventEmitter para Desacoplar Módulos**

```typescript
// ✅ BIEN: Emitir eventos para comunicación
@Injectable()
export class UrlExtractionService {
  constructor(private eventEmitter: EventEmitter2) {}

  async extractUrls(websiteId: string) {
    const result = await this.doExtraction(websiteId);

    // Emitir evento
    this.eventEmitter.emit('url-extraction.completed', {
      websiteId,
      newUrls: result.newUrls,
      success: result.success,
    });

    return result;
  }
}

// Otro servicio escucha
@Injectable()
export class GeneratorProQueueService {
  constructor(private eventEmitter: EventEmitter2) {
    this.eventEmitter.on('url-extraction.completed', this.handleUrlExtraction.bind(this));
  }

  async handleUrlExtraction(payload) {
    // Encolar URLs para extracción de contenido
  }
}

// ❌ MAL: Inyección circular con forwardRef
@Injectable()
export class UrlExtractionService {
  constructor(
    @Inject(forwardRef(() => GeneratorProQueueService))
    private queueService: GeneratorProQueueService
  ) {}
}
```

---

## 🚀 5. FASES DE IMPLEMENTACIÓN

### FASE 0: Preparación y Schemas ✅

**Objetivo**: Crear schemas necesarios para tracking de URLs y logs

**Archivos a crear**:
1. `packages/api-nueva/src/generator-pro/schemas/extracted-url-tracking.schema.ts`
2. `packages/api-nueva/src/generator-pro/schemas/url-extraction-log.schema.ts`

**Tareas**:
- [x] Crear `ExtractedUrlTracking` schema con campos:
  - `websiteConfigId`, `url`, `urlHash`
  - `status`: discovered | queued | processing | completed | failed | skipped
  - `firstDiscoveredAt`, `lastSeenAt`, `timesDiscovered`
  - `allowReExtraction`, `reExtractionDays`, `nextReExtractionAllowedAt`
  - Referencias: `extractedNoticiaId`, `generatedContentId`, `publishedNoticiaId`
- [x] Crear `UrlExtractionLog` schema con campos:
  - `websiteConfigId`, `websiteName`, `listingUrl`
  - `status`, `totalUrlsFound`, `newUrls`, `duplicateUrls`, `queuedUrls`
  - Métricas: `processingTime`, `fetchTime`, `parsingTime`
  - `errorMessage`, `errorType`, `warnings`, `sampleUrls`
- [x] Definir índices correctos para ambos schemas
- [x] Definir métodos helper en schemas

**Validación**:
- Schemas compilan sin errores TypeScript
- Índices definidos correctamente
- No uso de `any`

---

### FASE 1: Service de Extracción de URLs

**Objetivo**: Crear servicio que extrae URLs desde listados con detección de duplicados

**Archivos a crear**:
1. `packages/api-nueva/src/generator-pro/services/url-extraction.service.ts`

**Tareas**:
- [ ] Crear `UrlExtractionService` con método `extractUrls(websiteId)`
- [ ] Implementar `extractWithCheerio(website)` para extracción estática
- [ ] Implementar `extractWithPuppeteer(website)` para extracción dinámica
- [ ] Implementar `processExtractedUrls(website, urls)`:
  - Calcular hash de cada URL
  - Buscar en `ExtractedUrlTracking` por hash
  - Si existe: actualizar `lastSeenAt`, incrementar `timesDiscovered`
  - Si no existe: crear nuevo tracking con status `discovered`
  - Retornar contadores: newUrls, duplicateUrls, skippedUrls
- [ ] Implementar `createExtractionLog()` para guardar log detallado
- [ ] Manejo de errores con categorización
- [ ] Helpers: `calculateUrlHash()`, `makeAbsoluteUrl()`, `needsReExtraction()`

**Validación**:
- Extrae URLs correctamente con Cheerio
- Extrae URLs correctamente con Puppeteer
- Detecta URLs duplicadas
- Crea tracking para URLs nuevas
- Actualiza `lastSeenAt` para URLs existentes
- Genera logs detallados
- No uso de `any`

---

### FASE 2: Smart Extraction Scheduler

**Objetivo**: Implementar scheduler inteligente que considera última extracción al iniciar

**Archivos a crear**:
1. `packages/api-nueva/src/generator-pro/services/smart-extraction-scheduler.service.ts`

**Tareas**:
- [ ] Crear `SmartExtractionSchedulerService` que implementa `OnModuleInit`
- [ ] Implementar `onModuleInit()`:
  - Cargar todos los sitios activos
  - Para cada sitio, calcular próxima ejecución con `calculateNextExecution()`
  - Si `nextExecution <= NOW`: ejecutar inmediatamente
  - Si `nextExecution > NOW`: programar con delay calculado
- [ ] Implementar `calculateNextExecution(lastRun, frequency)`:
  - Si `lastRun` es `undefined`: retornar `NOW`
  - Si `lastRun` existe: retornar `lastRun + frequency`
- [ ] Implementar `scheduleOneTimeExecution(websiteId, delayMs)`:
  - Usar `setTimeout` con delay calculado
  - Guardar referencia en `Map<string, NodeJS.Timeout>`
  - Al ejecutar, llamar `executeExtraction()` y re-programar siguiente
- [ ] Implementar `executeExtraction(websiteId)`:
  - Llamar `urlExtractionService.extractUrls()`
  - Si exitoso: actualizar `lastExtractionRun` en BD
  - Si falla: NO actualizar timestamp
  - Re-programar siguiente ejecución
  - Emitir evento `url-extraction.completed`
- [ ] Métodos auxiliares:
  - `rescheduleWebsite(websiteId)`: para cambios de config
  - `pauseWebsite(websiteId)`: cancelar scheduling
  - `resumeWebsite(websiteId)`: reactivar scheduling
  - `getSchedulingStatus(websiteId)`: obtener estado

**Validación**:
- Al levantar servidor, calcula correctamente próximas ejecuciones
- Si `lastRun` fue hace 30 min y frequency es 60 min, programa en 30 min
- Si `lastRun` fue hace 70 min y frequency es 60 min, ejecuta inmediatamente
- Actualiza `lastExtractionRun` solo después de ejecución exitosa
- Re-programa correctamente después de cada ejecución
- No uso de `any`, sin `forwardRef`

---

### FASE 3: Integración con Módulo GeneratorPro

**Objetivo**: Integrar nuevos servicios con módulo existente

**Archivos a modificar**:
1. `packages/api-nueva/src/generator-pro/generator-pro.module.ts`

**Tareas**:
- [ ] Agregar schemas al `MongooseModule.forFeature()`:
  - `ExtractedUrlTracking`
  - `UrlExtractionLog`
- [ ] Agregar servicios a `providers`:
  - `UrlExtractionService`
  - `SmartExtractionSchedulerService`
- [ ] Agregar a `exports` si otros módulos lo necesitan
- [ ] Deprecar o remover `GeneratorProSchedulerService` (cron cada 5 min)
- [ ] Deprecar `GeneratorProOrchestratorService.initializeWebsiteCycles()` (setInterval)

**Validación**:
- Módulo compila sin errores
- Servicios se inyectan correctamente
- No hay dependencias circulares
- `npm run build` ejecuta sin errores

---

### FASE 4: Controller y Endpoints REST

**Objetivo**: Exponer endpoints para gestión manual de extracción

**Archivos a crear/modificar**:
1. `packages/api-nueva/src/generator-pro/controllers/extraction-management.controller.ts`

**Tareas**:
- [ ] Crear `ExtractionManagementController`
- [ ] Endpoints:
  ```typescript
  POST /generator-pro/extraction/trigger/:websiteId
  // Forzar extracción inmediata

  GET /generator-pro/extraction/status/:websiteId
  // Obtener estado de scheduling

  POST /generator-pro/extraction/pause/:websiteId
  // Pausar extracción automática

  POST /generator-pro/extraction/resume/:websiteId
  // Reanudar extracción automática

  POST /generator-pro/extraction/reschedule/:websiteId
  // Re-calcular y re-programar

  GET /generator-pro/extraction/logs/:websiteId
  // Obtener logs de extracción

  GET /generator-pro/extraction/urls/:websiteId
  // Obtener URLs trackeadas
  ```
- [ ] Validación con DTOs
- [ ] Guards: `JwtAuthGuard`
- [ ] Documentación Swagger

**Validación**:
- Endpoints responden correctamente
- Validación de parámetros funciona
- Autenticación requerida
- Documentación Swagger generada

---

### FASE 5: Deprecación de Código Antiguo

**Objetivo**: Remover o deprecar implementaciones antiguas

**Archivos a modificar**:
1. `packages/api-nueva/src/generator-pro/services/generator-pro-scheduler.service.ts`
2. `packages/api-nueva/src/generator-pro/services/generator-pro-orchestrator.service.ts`

**Tareas**:
- [ ] Deprecar `GeneratorProSchedulerService.scheduleExtractionJobs()`
  - Agregar decorator `@Deprecated()`
  - Loggear warning si se usa
  - Documentar migración a `SmartExtractionSchedulerService`
- [ ] Deprecar `GeneratorProOrchestratorService.initializeWebsiteCycles()`
  - Agregar decorator `@Deprecated()`
  - Documentar nueva implementación
- [ ] Crear guía de migración en `docs/migration-extraction-scheduler.md`
- [ ] Actualizar README con nueva arquitectura

**Validación**:
- Código antiguo marcado como deprecated
- Documentación de migración completa
- No breaking changes para usuarios existentes

---

## 📊 6. SÍNTESIS EJECUTIVA DE FASES

### Resumen de Implementación

| Fase | Descripción | Archivos Nuevos | Archivos Modificados | Estimación |
|------|-------------|-----------------|----------------------|------------|
| **FASE 0** | Schemas de tracking y logs | 2 schemas | 0 | 2 horas |
| **FASE 1** | Service de extracción de URLs | 1 service | 0 | 4 horas |
| **FASE 2** | Smart Extraction Scheduler | 1 service | 0 | 6 horas |
| **FASE 3** | Integración con módulo | 0 | 1 module | 1 hora |
| **FASE 4** | Controller y endpoints | 1 controller | 0 | 3 horas |
| **FASE 5** | Deprecación código antiguo | 1 doc | 2 services | 2 horas |
| **TOTAL** | — | **5 archivos** | **3 archivos** | **18 horas** |

---

### Problemas Resueltos

✅ **Problema 1: Scheduling no considera última extracción al iniciar**
- **Solución**: `SmartExtractionSchedulerService` con `onModuleInit()` que calcula próxima ejecución basándose en `lastExtractionRun + frequency`
- **Resultado**: Si servidor se levanta a las 3:45 PM y última extracción fue a las 3:00 PM con frequency 60 min, programa en 15 minutos (4:00 PM), NO en 60 minutos

✅ **Problema 2: Actualización prematura de timestamps**
- **Solución**: Actualizar `lastExtractionRun` solo DESPUÉS de ejecución exitosa, no al encolar
- **Resultado**: Si extracción falla, timestamp no se actualiza incorrectamente

✅ **Problema 3: Sin detección de URLs duplicadas**
- **Solución**: `ExtractedUrlTracking` schema con `urlHash` único por sitio
- **Resultado**: Sistema detecta URLs ya procesadas y no las vuelve a encolar

✅ **Problema 4: Logs incompletos**
- **Solución**: `UrlExtractionLog` schema con métricas detalladas
- **Resultado**: Logs muestran: total URLs, nuevas, duplicadas, skipped, tiempo de procesamiento, errores

✅ **Problema 5: setInterval desde NOW**
- **Solución**: Usar `setTimeout` dinámico con delay calculado basado en `lastRun`
- **Resultado**: Scheduling preciso que respeta frecuencias configuradas

---

### Beneficios de la Nueva Arquitectura

1. **⏱️ Scheduling Preciso**
   - Considera última extracción al calcular próxima
   - No pierde sincronización al reiniciar servidor
   - Ejecuta inmediatamente si ya pasó la hora

2. **🔍 Detección de Duplicados**
   - Trackea todas las URLs extraídas
   - Evita procesar URLs ya vistas
   - Permite re-extracción configurableafter X días

3. **📊 Logs Detallados**
   - Historial completo de extracciones
   - Métricas de performance
   - Debugging de selectores
   - Estadísticas de URLs nuevas vs duplicadas

4. **🔧 Control Manual**
   - Endpoints REST para gestión
   - Pausar/reanudar extracción
   - Forzar extracción inmediata
   - Consultar estado y logs

5. **🏗️ Código Limpio**
   - Sin `any` types
   - Sin `forwardRef()`
   - EventEmitter para comunicación
   - Tipado estricto TypeScript

---

### Diagrama de Flujo Propuesto

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. SERVIDOR SE LEVANTA (OnModuleInit)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. SmartExtractionSchedulerService.onModuleInit()              │
│    - Cargar sitios activos                                      │
│    - Para cada sitio: calcular nextExecution                    │
│      nextExecution = lastExtractionRun + extractionFrequency    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
                    ¿nextExecution <= NOW?
                         │
        ┌────────────────┴────────────────┐
        │ SÍ                              │ NO
        │                                 │
        ▼                                 ▼
┌───────────────────┐          ┌──────────────────────┐
│ Ejecutar AHORA    │          │ Programar setTimeout │
│                   │          │ con delay calculado  │
└─────┬─────────────┘          └──────────┬───────────┘
      │                                    │
      └────────────────┬───────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. UrlExtractionService.extractUrls()                          │
│    - Fetch listingUrl (Cheerio o Puppeteer)                    │
│    - Extraer URLs con selector                                  │
│    - Para cada URL: calcular hash                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Procesar URLs Extraídas                                     │
│    ┌──────────────────────────────────────────────┐            │
│    │ Para cada URL:                               │            │
│    │   - Buscar en ExtractedUrlTracking por hash  │            │
│    │   - Si existe:                                │            │
│    │     * Actualizar lastSeenAt                   │            │
│    │     * Incrementar timesDiscovered             │            │
│    │     * Verificar si necesita re-extracción     │            │
│    │   - Si NO existe:                             │            │
│    │     * Crear nuevo tracking                    │            │
│    │     * Status = discovered                     │            │
│    │     * Encolar para extracción de contenido    │            │
│    └──────────────────────────────────────────────┘            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Guardar Log y Actualizar Timestamp                          │
│    - Crear UrlExtractionLog con:                                │
│      * totalUrlsFound, newUrls, duplicateUrls                   │
│      * processingTime, sampleUrls                               │
│    - Si exitoso:                                                 │
│      * Actualizar NewsWebsiteConfig.lastExtractionRun = NOW     │
│    - Si falló:                                                   │
│      * NO actualizar timestamp                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Re-Programar Siguiente Extracción                           │
│    - Calcular nuevo nextExecution:                              │
│      nextExecution = NOW + extractionFrequency                   │
│    - Programar setTimeout con delay calculado                    │
│    - Emitir evento: url-extraction.completed                     │
└─────────────────────────────────────────────────────────────────┘
```

---

### Ejemplo Concreto

**Escenario**:
- Sitio: "El Universal"
- `extractionFrequency`: 60 minutos
- `lastExtractionRun`: 14:00
- Servidor se levanta: 14:45

**Flujo con NUEVA arquitectura**:

```
14:45:00 - Servidor arranca
14:45:01 - SmartExtractionSchedulerService.onModuleInit()
14:45:01 - Calcula nextExecution = 14:00 + 60 min = 15:00
14:45:01 - Delay = 15:00 - 14:45 = 15 minutos
14:45:01 - Programa setTimeout(15 min)
14:45:01 - Log: "Programada extracción para 'El Universal' en 15 minutos (15:00)"

15:00:00 - setTimeout ejecuta
15:00:01 - UrlExtractionService.extractUrls()
15:00:02 - Extrae 50 URLs del listado
15:00:03 - Procesa URLs: 10 nuevas, 40 duplicadas
15:00:04 - Encola 10 URLs nuevas para extracción de contenido
15:00:05 - Crea UrlExtractionLog con métricas
15:00:06 - Actualiza lastExtractionRun = 15:00
15:00:07 - Calcula nextExecution = 15:00 + 60 min = 16:00
15:00:08 - Programa setTimeout(60 min)
15:00:09 - Emite evento: url-extraction.completed

16:00:00 - Repite ciclo...
```

**Comparación con arquitectura ANTIGUA**:

```
❌ ANTIGUA (GeneratorProSchedulerService con cron cada 5 min):
14:45:00 - Servidor arranca
14:45:01 - onModuleInit() solo loggea, no programa nada
14:50:00 - Cron ejecuta (5 min después)
14:50:01 - Verifica: nextRun = 14:00 + 60 = 15:00, NOW = 14:50
14:50:01 - No ejecuta porque 14:50 < 15:00
14:55:00 - Cron ejecuta
14:55:01 - No ejecuta porque 14:55 < 15:00
15:00:00 - Cron ejecuta
15:00:01 - Ejecuta porque NOW >= 15:00
15:00:02 - Actualiza lastExtractionRun = 15:00 INMEDIATAMENTE (antes de ejecutar)
15:00:03 - Si extracción falla, timestamp ya fue actualizado incorrectamente
```

---

### Conclusión

La nueva arquitectura resuelve todos los problemas identificados mediante:

1. **Scheduling inteligente** con `onModuleInit()` que calcula próximas ejecuciones
2. **Timestamps precisos** actualizados solo después de ejecución exitosa
3. **Detección de duplicados** con `ExtractedUrlTracking`
4. **Logs detallados** con `UrlExtractionLog`
5. **Código limpio** sin `any`, sin `forwardRef`, con EventEmitter

**Estimación total**: 18 horas de desarrollo

**Próximos pasos**: Aprobar fases y comenzar implementación en orden secuencial.

---

**Fin del Análisis** 📋
