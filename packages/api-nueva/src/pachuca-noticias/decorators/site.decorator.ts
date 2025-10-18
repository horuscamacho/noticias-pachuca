import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SiteInfo } from '../services/site-detection.service';

/**
 * 🌐 Decorator @Site() para extraer información del sitio del request
 *
 * Uso:
 * ```typescript
 * @Get()
 * async getItems(@Site() site: SiteInfo) {
 *   // site contiene: { id, domain, slug, name, isMainSite, isActive }
 * }
 * ```
 *
 * El SiteInterceptor debe estar aplicado para que funcione.
 * El interceptor agrega `request.siteInfo` que este decorator extrae.
 */
export const Site = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SiteInfo => {
    const request = ctx.switchToHttp().getRequest();
    const siteInfo = request.siteInfo as SiteInfo;

    if (!siteInfo) {
      throw new Error(
        'SiteInfo not found in request. Make sure SiteInterceptor is applied.'
      );
    }

    return siteInfo;
  },
);
