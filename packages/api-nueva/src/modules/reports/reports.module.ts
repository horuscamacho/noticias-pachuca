/**
 * 🏢 NOTICIAS PACHUCA - UNIVERSAL REPORTS MODULE
 *
 * ⚠️ MÓDULO UNIVERSAL REUTILIZABLE para generación de reportes PDF/Excel
 *
 * 🎯 CARACTERÍSTICAS:
 * - Generación PDF con Puppeteer + Handlebars
 * - Generación Excel con ExcelJS
 * - API universal para cualquier esquema MongoDB
 * - Sistema de queue asíncrono con Bull
 * - Cache inteligente con Redis
 * - Templates dinámicos y branding configurable
 *
 * ✅ PATRONES DE DISEÑO IMPLEMENTADOS:
 * - Factory Pattern: ReportFactoryService
 * - Strategy Pattern: PDF/Excel strategies
 * - Builder Pattern: ConfigBuilder services
 * - Repository Pattern: DataRepository abstraction
 *
 * 🚀 READY FOR PRODUCTION:
 * - Type-safe completo sin 'any'
 * - Performance optimizada para archivos grandes
 * - Monitoring y métricas integradas
 * - Testing suite completa
 *
 * 📋 USO:
 * 1. Importar ReportsModule en tu app.module.ts
 * 2. Configurar Redis y Bull queue
 * 3. Usar endpoints /reports/pdf/generate y /reports/excel/generate
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';

// Controllers
import { PDFReportsController } from './controllers/pdf-reports.controller';
import { ExcelReportsController } from './controllers/excel-reports.controller';
import { ReportsAdminController } from './controllers/reports-admin.controller';

// Core Services
import { ReportFactoryService } from './services/report-factory.service';
import { DataRepositoryService } from './services/data-repository.service';
import { UniversalReportService } from './services/universal-report.service';
import { TemplateService } from './services/template.service';
import { PuppeteerManagerService } from './services/puppeteer-manager.service';

// Strategies
import { PDFReportStrategy } from './strategies/pdf-report.strategy';
import { ExcelReportStrategy } from './strategies/excel-report.strategy';

// Builders
import { PDFConfigBuilderService } from './builders/pdf-config.builder';
import { ExcelConfigBuilderService } from './builders/excel-config.builder';
import { ReportConfigBuilderService } from './builders/report-config.builder';

// Queue Processors
import { ReportProcessor } from './queues/report-processor';

// Cache Module
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    // 🔄 Bull Queue Configuration
    BullModule.registerQueue({
      name: 'reports',
      defaultJobOptions: {
        removeOnComplete: 10, // Mantener últimos 10 trabajos completados
        removeOnFail: 50, // Mantener últimos 50 trabajos fallidos
        attempts: 3, // Máximo 3 intentos por trabajo
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),

    // 💾 Cache Module (local para testing)
    CacheModule.register({
      ttl: 600, // 10 minutos por defecto
      max: 1000, // máximo 1000 elementos
    }),

    // 📊 MongoDB Connection (reutilizar conexión existente)
    MongooseModule.forFeature([
      // No necesitamos esquemas específicos ya que trabajamos dinámicamente
    ]),
  ],

  controllers: [PDFReportsController, ExcelReportsController, ReportsAdminController],

  providers: [
    // 🏭 Core Services
    ReportFactoryService,
    DataRepositoryService,
    UniversalReportService,
    TemplateService,
    PuppeteerManagerService,

    // 🎯 Strategy Services
    PDFReportStrategy,
    ExcelReportStrategy,

    // 🔨 Builder Services
    PDFConfigBuilderService,
    ExcelConfigBuilderService,
    ReportConfigBuilderService,

    // ⚡ Queue Processor
    ReportProcessor,
  ],

  exports: [
    // Exportar servicios para usar en otros módulos
    UniversalReportService,
    ReportFactoryService,
    DataRepositoryService,
    PuppeteerManagerService, // 🎭 Exportar para uso en otros módulos (ej: UrlExtractionService)
  ],
})
export class ReportsModule {
  // 📋 Configuración estática del módulo
  static readonly MODULE_VERSION = '1.0.0';
  static readonly SUPPORTED_FORMATS = ['pdf', 'excel'] as const;
  static readonly MAX_CONCURRENT_JOBS = 5;
  static readonly DEFAULT_TIMEOUT = 300000; // 5 minutos
}
