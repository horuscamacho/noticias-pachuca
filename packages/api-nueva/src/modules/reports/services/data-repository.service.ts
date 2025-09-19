/**
 * 🗃️ DATA REPOSITORY SERVICE
 * Repository Pattern universal para acceso a datos MongoDB con cache inteligente
 * Soporte para consultas dinámicas, agregaciones y análisis de schemas
 */

import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  FilterConfig,
  SortConfig,
  PaginationConfig,
  FilterCondition,
  SortDirection,
} from '../types/report.types';

export interface QueryResult {
  data: Record<string, unknown>[];
  total: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
  queryTime?: number;
  cacheHit?: boolean;
}

export interface QueryOptions {
  filters?: FilterConfig;
  sorting?: SortConfig;
  pagination?: PaginationConfig;
  fields?: string[];
  useCache?: boolean;
  aggregations?: AggregationConfig[];
}

export interface AggregationConfig {
  field: string;
  operation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'group';
  groupBy?: string;
  alias?: string;
}

export interface CollectionInfo {
  name: string;
  count: number;
  size: number;
  avgObjSize: number;
  indexes: number;
  schema?: Record<string, unknown>;
  lastAccessed?: Date;
}

@Injectable()
export class DataRepositoryService {
  private readonly logger = new Logger(DataRepositoryService.name);
  private readonly cachePrefix = 'data-repo:';
  private readonly cacheTtl: number;
  private readonly queryCache = new Map<string, { result: QueryResult; timestamp: number }>();
  private readonly maxCacheSize = 1000;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtl = this.configService.get('cache.ttl', 600); // 10 minutos por defecto
  }

  /**
   * 🎯 Consulta universal para cualquier colección MongoDB con cache inteligente
   */
  async query(
    collection: string,
    options: QueryOptions = {},
  ): Promise<QueryResult> {
    const startTime = Date.now();
    this.logger.log(`Querying collection: ${collection}`);

    try {
      // Verificar cache si está habilitado
      const cacheKey = this.generateCacheKey(collection, options);
      if (options.useCache !== false) {
        const cached = await this.getCachedResult(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for query: ${collection}`);
          return {
            ...cached,
            queryTime: Date.now() - startTime,
            cacheHit: true,
          };
        }
      }

      // Validar que la colección existe
      await this.validateCollection(collection);

      // Obtener modelo dinámico
      const model = this.getDynamicModel(collection);

      // Construir pipeline de agregación
      const pipeline = this.buildAggregationPipeline(options);

      // Ejecutar consulta principal con timeout
      const queryTimeout = this.calculateQueryTimeout(options);
      const data = await this.executeWithTimeout(
        model.aggregate(pipeline).exec(),
        queryTimeout,
        `Query timeout for collection ${collection}`,
      );

      // Contar total de registros (sin pagination) - en paralelo si hay paginación
      let total = data.length;
      if (options.pagination) {
        const countPipeline = this.buildCountPipeline(options);
        const totalResult = await this.executeWithTimeout(
          model.aggregate(countPipeline).exec(),
          queryTimeout,
          `Count timeout for collection ${collection}`,
        );
        total = totalResult[0]?.total || 0;
      }

      const queryTime = Date.now() - startTime;
      this.logger.log(
        `Query completed in ${queryTime}ms. Found ${data.length}/${total} records`,
      );

      // Construir resultado
      const result: QueryResult = {
        data: data as Record<string, unknown>[],
        total,
        queryTime,
        cacheHit: false,
      };

      if (options.pagination) {
        result.page = options.pagination.page;
        result.limit = options.pagination.limit;
        result.hasMore =
          options.pagination.page * options.pagination.limit < total;
      }

      // Guardar en cache si está habilitado
      if (options.useCache !== false) {
        await this.setCachedResult(cacheKey, result);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Query failed for collection ${collection}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Query failed: ${error.message}`);
    }
  }

  /**
   * 📊 Obtener estadísticas completas de una colección
   */
  async getCollectionStats(collection: string): Promise<{
    count: number;
    size: number;
    avgObjSize: number;
    indexes: number;
  }> {
    const cacheKey = `${this.cachePrefix}stats:${collection}`;

    try {
      // Verificar cache primero
      const cached = await this.cacheManager.get<{
        count: number;
        size: number;
        avgObjSize: number;
        indexes: number;
      }>(cacheKey);
      if (cached) {
        this.logger.debug(`Stats cache hit for collection: ${collection}`);
        return cached;
      }

      await this.validateCollection(collection);

      if (!this.connection.db) {
        throw new Error('Database connection not available');
      }

      // Use MongoDB driver's collection stats command
      const db = this.connection.db;
      const stats = await db.admin().command({ collStats: collection });

      const result = {
        count: stats.count || 0,
        size: stats.size || 0,
        avgObjSize: stats.avgObjSize || 0,
        indexes: stats.nindexes || 0,
      };

      // Guardar en cache por 1 hora
      await this.cacheManager.set(cacheKey, result, 3600 * 1000);

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get stats for collection ${collection}: ${error.message}`,
      );
      // Return default stats if collection stats fail
      return {
        count: 0,
        size: 0,
        avgObjSize: 0,
        indexes: 0,
      };
    }
  }

  /**
   * 🏗️ Obtener esquema dinámico de una colección (sample)
   */
  async getCollectionSchema(
    collection: string,
    sampleSize: number = 100,
  ): Promise<Record<string, unknown>> {
    const cacheKey = `${this.cachePrefix}schema:${collection}:${sampleSize}`;

    try {
      // Verificar cache primero
      const cached = await this.cacheManager.get<Record<string, unknown>>(cacheKey);
      if (cached) {
        this.logger.debug(`Schema cache hit for collection: ${collection}`);
        return cached;
      }

      await this.validateCollection(collection);

      const model = this.getDynamicModel(collection);

      // Usar múltiples samples para mejor análisis
      const samples = await model
        .aggregate([
          { $sample: { size: Math.min(sampleSize, 10) } },
          { $limit: 10 }
        ])
        .exec();

      if (samples.length === 0) {
        return {};
      }

      // Analizar múltiples documentos para esquema más completo
      const schema = this.analyzeMutlipleDocuments(samples);

      // Guardar en cache por 30 minutos
      await this.cacheManager.set(cacheKey, schema, 1800 * 1000);

      return schema;
    } catch (error) {
      this.logger.error(
        `Failed to get schema for collection ${collection}: ${error.message}`,
      );
      throw new BadRequestException(`Schema analysis failed: ${error.message}`);
    }
  }

  /**
   * 📋 Listar todas las colecciones disponibles con información completa
   */
  async listCollections(): Promise<string[]> {
    const cacheKey = `${this.cachePrefix}collections`;

    try {
      // Verificar cache primero
      const cached = await this.cacheManager.get<string[]>(cacheKey);
      if (cached) {
        this.logger.debug('Collections cache hit');
        return cached;
      }

      if (!this.connection.db) {
        throw new Error('Database connection not available');
      }

      const collections = await this.connection.db.listCollections().toArray();
      const result = collections
        .filter((col) => !col.name.startsWith('system.'))
        .map((col) => col.name)
        .sort();

      // Guardar en cache por 5 minutos
      await this.cacheManager.set(cacheKey, result, 300 * 1000);

      return result;
    } catch (error) {
      this.logger.error(`Failed to list collections: ${error.message}`);
      throw new BadRequestException(`Failed to list collections: ${error.message}`);
    }
  }

  /**
   * 📋 Obtener información completa de colecciones
   */
  async getCollectionsInfo(): Promise<CollectionInfo[]> {
    try {
      const collections = await this.listCollections();

      const collectionsInfo = await Promise.all(
        collections.map(async (name) => {
          try {
            const stats = await this.getCollectionStats(name);
            return {
              name,
              ...stats,
              lastAccessed: new Date(),
            };
          } catch {
            return {
              name,
              count: 0,
              size: 0,
              avgObjSize: 0,
              indexes: 0,
              lastAccessed: new Date(),
            };
          }
        })
      );

      return collectionsInfo.sort((a, b) => b.count - a.count);
    } catch (error) {
      this.logger.error(`Failed to get collections info: ${error.message}`);
      throw new BadRequestException(`Failed to get collections info: ${error.message}`);
    }
  }

  /**
   * 🔍 Buscar documentos con texto libre
   */
  async searchText(
    collection: string,
    searchTerm: string,
    fields: string[] = [],
    options: QueryOptions = {},
  ): Promise<QueryResult> {
    try {
      await this.validateCollection(collection);

      // Construir filtro de búsqueda de texto
      const textFilter: FilterConfig = {};

      if (fields.length > 0) {
        // Búsqueda en campos específicos
        textFilter.$or = fields.map((field) => ({
          [field]: { $regex: searchTerm, $options: 'i' },
        }));
      } else {
        // Búsqueda de texto completo (requiere índice de texto)
        textFilter.$text = { $search: searchTerm };
      }

      // Combinar con filtros existentes
      const combinedOptions: QueryOptions = {
        ...options,
        filters: {
          ...options.filters,
          ...textFilter,
        },
      };

      return await this.query(collection, combinedOptions);
    } catch (error) {
      this.logger.error(
        `Text search failed for collection ${collection}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * 🔧 MÉTODOS PRIVADOS
   */

  /**
   * ✅ Validar que la colección existe
   */
  private async validateCollection(collection: string): Promise<void> {
    const collections = await this.listCollections();
    if (!collections.includes(collection)) {
      throw new BadRequestException(
        `Collection '${collection}' does not exist`,
      );
    }
  }

  /**
   * 🏭 Obtener modelo dinámico para cualquier colección
   */
  private getDynamicModel(collection: string) {
    // Usar modelo dinámico sin esquema específico
    return this.connection.model(
      collection,
      new this.connection.base.Schema({}, { strict: false }),
      collection,
    );
  }

  /**
   * 🔨 Construir pipeline de agregación
   */
  private buildAggregationPipeline(options: QueryOptions): any[] {
    const pipeline: any[] = [];

    // 1. Aplicar filtros (o match vacío por defecto)
    if (options.filters && Object.keys(options.filters).length > 0) {
      const matchStage = this.buildMatchStage(options.filters);
      pipeline.push({ $match: matchStage });
    } else {
      // Agregar match vacío para evitar pipeline vacío
      pipeline.push({ $match: {} });
    }

    // 2. Aplicar ordenamiento
    if (options.sorting && Object.keys(options.sorting).length > 0) {
      const sortStage = this.buildSortStage(options.sorting);
      pipeline.push({ $sort: sortStage });
    }

    // 3. Aplicar paginación
    if (options.pagination) {
      const skip = (options.pagination.page - 1) * options.pagination.limit;
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: options.pagination.limit });
    }

    // 4. Proyección de campos (opcional)
    if (options.fields && options.fields.length > 0) {
      const projection = options.fields.reduce((acc, field) => {
        acc[field] = 1;
        return acc;
      }, {} as any);
      pipeline.push({ $project: projection });
    }

    return pipeline;
  }

  /**
   * 📊 Construir pipeline para contar registros
   */
  private buildCountPipeline(options: QueryOptions): any[] {
    const pipeline: any[] = [];

    // Solo aplicar filtros para el conteo (o match vacío por defecto)
    if (options.filters && Object.keys(options.filters).length > 0) {
      const matchStage = this.buildMatchStage(options.filters);
      pipeline.push({ $match: matchStage });
    } else {
      // Agregar match vacío para evitar pipeline vacío
      pipeline.push({ $match: {} });
    }

    pipeline.push({ $count: 'total' });

    return pipeline;
  }

  /**
   * 🎯 Construir stage de match para filtros
   */
  private buildMatchStage(filters: FilterConfig): any {
    const matchStage: any = {};

    Object.entries(filters).forEach(([field, condition]) => {
      if (this.isFilterCondition(condition)) {
        // Condición compleja con operador
        matchStage[field] = { [condition.operator]: condition.value };
      } else {
        // Condición simple (igualdad)
        matchStage[field] = condition;
      }
    });

    return matchStage;
  }

  /**
   * 📈 Construir stage de sort
   */
  private buildSortStage(sorting: SortConfig): any {
    const sortStage: any = {};

    Object.entries(sorting).forEach(([field, direction]) => {
      sortStage[field] = this.normalizeSortDirection(direction);
    });

    return sortStage;
  }

  /**
   * 🔄 Normalizar dirección de ordenamiento
   */
  private normalizeSortDirection(direction: SortDirection): 1 | -1 {
    if (direction === 'asc' || direction === 1) return 1;
    if (direction === 'desc' || direction === -1) return -1;
    return 1; // Default ascendente
  }

  /**
   * ❓ Verificar si es una condición de filtro compleja
   */
  private isFilterCondition(value: any): value is FilterCondition {
    return (
      value &&
      typeof value === 'object' &&
      'operator' in value &&
      'value' in value
    );
  }

  /**
   * 🔍 Analizar estructura de documento para inferir schema
   */
  private analyzeDocumentStructure(doc: Record<string, unknown>, maxDepth: number = 3): Record<string, unknown> {
    const schema: Record<string, unknown> = {};

    const analyzeValue = (value: unknown, depth: number): string | Record<string, unknown> => {
      if (depth > maxDepth) return 'object';

      if (value === null || value === undefined) return 'null';
      if (typeof value === 'string') return 'string';
      if (typeof value === 'number') return 'number';
      if (typeof value === 'boolean') return 'boolean';
      if (value instanceof Date) return 'date';
      if (Array.isArray(value)) {
        if (value.length > 0) {
          return `array<${analyzeValue(value[0], depth + 1)}>`;
        }
        return 'array';
      }
      if (typeof value === 'object') {
        const nested: Record<string, unknown> = {};
        Object.keys(value)
          .slice(0, 10)
          .forEach((key) => {
            // Límite de 10 keys por objeto
            nested[key] = analyzeValue((value as Record<string, unknown>)[key], depth + 1);
          });
        return nested;
      }
      return 'unknown';
    };

    Object.keys(doc).forEach((key) => {
      schema[key] = analyzeValue(doc[key], 0);
    });

    return schema;
  }

  /**
   * 🔍 Analizar múltiples documentos para esquema más completo
   */
  private analyzeMutlipleDocuments(docs: Record<string, unknown>[]): Record<string, unknown> {
    const combinedSchema: Record<string, unknown> = {};
    const fieldTypes: Record<string, Set<string>> = {};

    // Analizar cada documento
    docs.forEach(doc => {
      const schema = this.analyzeDocumentStructure(doc);

      Object.keys(schema).forEach(field => {
        if (!fieldTypes[field]) {
          fieldTypes[field] = new Set();
        }

        const type = schema[field];
        if (typeof type === 'string') {
          fieldTypes[field].add(type);
        } else {
          fieldTypes[field].add('object');
        }
      });
    });

    // Construir esquema combinado
    Object.keys(fieldTypes).forEach(field => {
      const types = Array.from(fieldTypes[field]);
      if (types.length === 1) {
        combinedSchema[field] = types[0];
      } else {
        combinedSchema[field] = `union<${types.join('|')}>`;
      }
    });

    return combinedSchema;
  }

  /**
   * 🔐 Generar clave de cache para consultas
   */
  private generateCacheKey(collection: string, options: QueryOptions): string {
    const key = JSON.stringify({
      collection,
      filters: options.filters,
      sorting: options.sorting,
      pagination: options.pagination,
      fields: options.fields,
    });

    return `${this.cachePrefix}query:${Buffer.from(key).toString('base64').substring(0, 32)}`;
  }

  /**
   * 📥 Obtener resultado de cache
   */
  private async getCachedResult(cacheKey: string): Promise<QueryResult | null> {
    try {
      // Verificar cache in-memory primero
      const memCache = this.queryCache.get(cacheKey);
      if (memCache && Date.now() - memCache.timestamp < this.cacheTtl * 1000) {
        return memCache.result;
      }

      // Verificar cache Redis
      const result = await this.cacheManager.get<QueryResult>(cacheKey);
      return result || null;
    } catch (error) {
      this.logger.warn(`Cache read failed: ${error.message}`);
      return null;
    }
  }

  /**
   * 📤 Guardar resultado en cache
   */
  private async setCachedResult(cacheKey: string, result: QueryResult): Promise<void> {
    try {
      // Guardar en cache in-memory
      this.queryCache.set(cacheKey, { result, timestamp: Date.now() });

      // Limpiar cache in-memory si está muy grande
      if (this.queryCache.size > this.maxCacheSize) {
        const oldest = Array.from(this.queryCache.entries())
          .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0];
        this.queryCache.delete(oldest[0]);
      }

      // Guardar en cache Redis
      await this.cacheManager.set(cacheKey, result, this.cacheTtl * 1000);
    } catch (error) {
      this.logger.warn(`Cache write failed: ${error.message}`);
    }
  }

  /**
   * ⏰ Calcular timeout para consulta
   */
  private calculateQueryTimeout(options: QueryOptions): number {
    const baseTimeout = 30000; // 30 segundos base

    if (options.pagination && options.pagination.limit > 1000) {
      return 60000; // 1 minuto para consultas grandes
    }

    if (options.aggregations && options.aggregations.length > 0) {
      return 90000; // 1.5 minutos para agregaciones
    }

    return baseTimeout;
  }

  /**
   * ⏱️ Ejecutar consulta con timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeout: number,
    errorMessage: string,
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeout)
      ),
    ]);
  }

  /**
   * 🧹 Limpiar cache
   */
  async clearCache(pattern?: string): Promise<number> {
    // Limpiar cache in-memory
    if (pattern) {
      let cleared = 0;
      this.queryCache.forEach((_, key) => {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
          cleared++;
        }
      });
    } else {
      this.queryCache.clear();
    }

    // Limpiar cache Redis (CACHE_MANAGER no soporta pattern delete, usar clear)
    await this.cacheManager.clear();
    return this.queryCache.size;
  }

  /**
   * 📊 Obtener métricas de performance
   */
  getPerformanceMetrics(): {
    cacheSize: number;
    maxCacheSize: number;
    cacheHitRate: number;
  } {
    return {
      cacheSize: this.queryCache.size,
      maxCacheSize: this.maxCacheSize,
      cacheHitRate: 0, // TODO: Implementar tracking de hit rate
    };
  }
}
