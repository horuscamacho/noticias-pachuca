import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PlatformDetectionService } from '../services/platform-detection.service';

export const Platform = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // Agregar platform info al request si no existe
    if (!request.platformInfo) {
      const platformService = new PlatformDetectionService();
      request.platformInfo = platformService.detectPlatform(request);
    }

    return data ? request.platformInfo[data] : request.platformInfo;
  },
);
