import { Global, Module } from '@nestjs/common';
import { AppConfigService } from './config.service';

/**
 * 🔧 Módulo de configuración global
 * Hace disponible AppConfigService en toda la aplicación
 */
@Global()
@Module({
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
