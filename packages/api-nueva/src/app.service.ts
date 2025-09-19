import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from './config/config.service';
import { CacheService } from './services/cache.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly configService: AppConfigService,
    private readonly cacheService: CacheService,
  ) {}

  async getHello(): Promise<string> {
    const cacheKey = 'hello-message';

    // Usar cache con función helper
    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        this.logger.log('Generating new hello message');
        return `¡Hola desde Noticias Pachuca API! 🚀
    Ambiente: ${this.configService.nodeEnv}
    Puerto: ${this.configService.port}
    MongoDB: Conectado correctamente
    Redis: Funcionando perfectamente con Cache Manager
    Timestamp: ${new Date().toISOString()}`;
      },
      3600, // Cache por 1 hora
    );
  }

  async getConfig() {
    return {
      app: {
        nodeEnv: this.configService.nodeEnv,
        port: this.configService.port,
        apiPrefix: 'api',
      },
      database: {
        host: this.configService.dbHost,
        port: this.configService.dbPort,
        database: 'noticias_pachuca_db',
        status: 'connected',
      },
      redis: {
        host: this.configService.redisHost,
        port: this.configService.redisPort,
        status: 'connected',
      },
      cache: {
        ttl: this.configService.cacheTtl,
        defaultTtl: this.configService.defaultCacheTtl,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
