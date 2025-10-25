import { useMutation } from '@tanstack/react-query';
import { publishApi } from '../services/publish/publishApi';
import type { ImproveCopyRequest } from '../types/publish.types';

/**
 * ✨ Hook para mejorar copy de redes sociales con IA
 * Optimiza hooks, agrega URL canónica y mejora engagement
 * Se usa antes de publicar en redes sociales
 */
export function useImproveCopy() {
  return useMutation({
    mutationFn: (request: ImproveCopyRequest) => publishApi.improveCopy(request),
  });
}
