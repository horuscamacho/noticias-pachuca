import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { SiteDetectionService, SiteInfo } from '../services/site-detection.service';

/**
 * 🌐 Interceptor que detecta el sitio y lo agrega al request
 *
 * Lee el header 'x-site-domain', detecta el sitio y agrega `request.siteInfo`
 *
 * Uso en controllers:
 * ```typescript
 * @UseInterceptors(SiteInterceptor)
 * @Controller('items')
 * export class ItemsController {
 *   @Get()
 *   async getItems(@Site() site: SiteInfo) {
 *     // site disponible aquí
 *   }
 * }
 * ```
 *
 * O aplicar globalmente en el módulo.
 */
@Injectable()
export class SiteInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SiteInterceptor.name);

  constructor(private readonly siteDetectionService: SiteDetectionService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    try {
      // Detectar sitio desde header
      const siteInfo = await this.siteDetectionService.detectSite(request);

      // Agregar al request para que esté disponible en controllers
      request.siteInfo = siteInfo;

      this.logger.debug(
        `Site detected: ${siteInfo.name} (${siteInfo.domain}) [${siteInfo.id}]`
      );
    } catch (error) {
      this.logger.error('Error detecting site:', error);
      // Re-lanzar error para que el controller lo maneje
      throw error;
    }

    return next.handle();
  }
}

// Extender el tipo Request de Express para incluir siteInfo
declare module 'express' {
  interface Request {
    siteInfo?: SiteInfo;
  }
}
