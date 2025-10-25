/**
 * 📝 Hooks para User Generated Content
 *
 * Gestión de contenido manual creado por usuarios (URGENT y NORMAL)
 * - Crear contenido URGENT (breaking news)
 * - Crear contenido NORMAL (publicación estándar)
 * - Actualizar contenido URGENT (reinicia timer de 2 horas)
 * - Cerrar contenido URGENT manualmente
 * - Listar contenido URGENT activo con polling
 * - Upload de archivos multimedia
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userContentApi } from '@/src/services/api/userContentApi';
import { imageBankApi } from '@/src/services/api/imageBankApi';
import type {
  CreateUrgentContentDto,
  CreateNormalContentDto,
  UpdateUrgentContentDto,
} from '@/src/types/user-generated-content.types';

// ============================================================
// QUERY KEYS
// ============================================================

export const userContentKeys = {
  all: ['user-content'] as const,
  lists: () => [...userContentKeys.all, 'list'] as const,
  activeUrgent: () => [...userContentKeys.lists(), 'active-urgent'] as const,
  details: () => [...userContentKeys.all, 'detail'] as const,
  detail: (id: string) => [...userContentKeys.details(), id] as const,
};

// ============================================================
// QUERY HOOKS (GET Operations)
// ============================================================

/**
 * 📋 Hook para obtener contenido URGENT activo con polling
 *
 * - Lista todos los contenidos URGENT activos
 * - Polling cada 30 segundos para actualizar timers
 * - Útil para cintillo "ÚLTIMO MOMENTO"
 *
 * @param options - Opciones de configuración
 * @param options.enabled - Habilitar/deshabilitar query (default: true)
 * @param options.refetchInterval - Intervalo de polling en ms (default: 30000)
 */
export function useActiveUrgentList(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useQuery({
    queryKey: userContentKeys.activeUrgent(),
    queryFn: () => userContentApi.getActiveUrgent(),
    staleTime: 20 * 1000, // 20 segundos (datos frescos)
    gcTime: 2 * 60 * 1000, // 2 minutos
    enabled: options?.enabled ?? true,
    // Polling cada 30 segundos para actualizar timers
    refetchInterval: options?.refetchInterval ?? 30 * 1000,
    refetchIntervalInBackground: false, // Solo polling cuando app está en foreground
  });
}

/**
 * 🔍 Hook para obtener detalle de contenido por ID
 *
 * - Incluye contenido generado por IA
 * - Incluye contenido publicado
 * - Incluye métricas y metadata
 *
 * @param id - ID del contenido
 * @param options - Opciones de configuración
 */
export function useUserContentDetail(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userContentKeys.detail(id),
    queryFn: () => userContentApi.getById(id),
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    enabled: (options?.enabled ?? true) && !!id,
  });
}

// ============================================================
// MUTATION HOOKS (POST, PUT, DELETE Operations)
// ============================================================

/**
 * 🚨 Hook para crear contenido URGENT (Breaking News)
 *
 * - Auto-publica inmediatamente
 * - Redacción corta (300-500 palabras)
 * - Copys agresivos para redes sociales
 * - Auto-cierre después de 2 horas sin actualización
 *
 * @example
 * const createUrgent = useCreateUrgentContent();
 *
 * createUrgent.mutate({
 *   originalTitle: "Accidente múltiple en carretera",
 *   originalContent: "Se reporta accidente...",
 *   uploadedImageUrls: ["https://..."]
 * }, {
 *   onSuccess: (data) => {
 *     console.log("Contenido urgent creado:", data.content.id);
 *   }
 * });
 */
export function useCreateUrgentContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateUrgentContentDto) => userContentApi.createUrgent(dto),
    // ⚠️ CRÍTICO: Deshabilitar retries para evitar duplicados
    // El backend tarda 13-15 segundos, si falla no reintentar
    retry: false,
    onSuccess: () => {
      // Invalidar lista de contenido urgent activo
      queryClient.invalidateQueries({ queryKey: userContentKeys.activeUrgent() });
      // Invalidar todas las listas
      queryClient.invalidateQueries({ queryKey: userContentKeys.lists() });
    },
  });
}

/**
 * 📝 Hook para crear contenido NORMAL (Publicación estándar)
 *
 * - Usuario decide tipo de publicación (breaking/noticia/blog)
 * - Redacción normal (500-700 palabras)
 * - Copys normales para redes sociales
 * - NO se auto-cierra
 *
 * @example
 * const createNormal = useCreateNormalContent();
 *
 * createNormal.mutate({
 *   originalTitle: "Nueva inversión en educación",
 *   originalContent: "El gobierno anunció...",
 *   publicationType: PublicationType.NOTICIA,
 *   uploadedImageUrls: ["https://..."]
 * });
 */
export function useCreateNormalContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateNormalContentDto) => userContentApi.createNormal(dto),
    // ⚠️ CRÍTICO: Deshabilitar retries para evitar duplicados
    // El backend tarda 13-15 segundos, si falla no reintentar
    retry: false,
    onSuccess: () => {
      // Invalidar todas las listas
      queryClient.invalidateQueries({ queryKey: userContentKeys.lists() });
    },
  });
}

/**
 * ✏️ Hook para actualizar contenido URGENT
 *
 * - Reemplaza el contenido existente
 * - Re-procesa con IA
 * - Re-publica
 * - REINICIA el timer de 2 horas
 *
 * @example
 * const updateUrgent = useUpdateUrgentContent();
 *
 * updateUrgent.mutate({
 *   id: "content-id",
 *   dto: {
 *     newContent: "ACTUALIZACIÓN: Se confirman 3 heridos...",
 *     newImageUrls: ["https://..."]
 *   }
 * }, {
 *   onSuccess: (data) => {
 *     console.log("Timer reiniciado:", data.content.urgentAutoCloseAt);
 *   }
 * });
 */
export function useUpdateUrgentContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUrgentContentDto }) =>
      userContentApi.updateUrgent(id, dto),
    onSuccess: (data, variables) => {
      // Invalidar detalle del contenido actualizado
      queryClient.invalidateQueries({ queryKey: userContentKeys.detail(variables.id) });
      // Invalidar lista de contenido urgent activo
      queryClient.invalidateQueries({ queryKey: userContentKeys.activeUrgent() });
      // Invalidar todas las listas
      queryClient.invalidateQueries({ queryKey: userContentKeys.lists() });
    },
  });
}

/**
 * 🔒 Hook para cerrar contenido URGENT manualmente
 *
 * - Cierre manual por usuario (antes de 2 horas)
 * - Se remueve del cintillo "ÚLTIMO MOMENTO"
 * - NO agrega párrafo de cierre (solo sistema lo hace)
 *
 * @example
 * const closeUrgent = useCloseUrgentContent();
 *
 * closeUrgent.mutate("content-id", {
 *   onSuccess: (data) => {
 *     console.log("Contenido cerrado:", data.content.urgentClosedAt);
 *   }
 * });
 */
export function useCloseUrgentContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userContentApi.closeUrgent(id),
    onSuccess: (data, id) => {
      // Invalidar detalle del contenido cerrado
      queryClient.invalidateQueries({ queryKey: userContentKeys.detail(id) });
      // Invalidar lista de contenido urgent activo (ya no aparecerá)
      queryClient.invalidateQueries({ queryKey: userContentKeys.activeUrgent() });
      // Invalidar todas las listas
      queryClient.invalidateQueries({ queryKey: userContentKeys.lists() });
    },
  });
}

/**
 * 📤 Hook para upload de archivos multimedia
 *
 * - Sube archivos a S3
 * - Retorna URLs públicas
 * - Máximo 10 imágenes + 5 videos
 * - Incluye progress tracking
 *
 * @example
 * const uploadFiles = useFileUpload();
 *
 * const formData = new FormData();
 * formData.append('files', file1);
 * formData.append('files', file2);
 *
 * uploadFiles.mutate(formData, {
 *   onSuccess: (data) => {
 *     console.log("URLs subidas:", data.urls);
 *     // Usar data.urls en originalImageUrls/originalVideoUrls
 *   }
 * });
 */
export function useFileUpload() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      // Usar el API del banco de imágenes que SÍ está implementado
      const response = await imageBankApi.uploadImages(formData);

      // Extraer URLs de las imágenes subidas
      const urls = response.uploadedImages.map(img => img.processedUrls.large);

      return { urls, uploadedImages: response.uploadedImages };
    },
    // No invalidamos queries aquí porque el upload es previo a crear contenido
  });
}

// ============================================================
// HELPER HOOKS (Utilidades)
// ============================================================

/**
 * ⏱️ Hook para calcular tiempo restante de contenido URGENT
 *
 * Calcula cuánto tiempo queda antes del auto-cierre (2 horas)
 * Útil para mostrar countdown en UI
 *
 * @param urgentAutoCloseAt - Fecha de auto-cierre ISO string
 * @returns Objeto con horas, minutos, segundos, isExpired y percentage
 */
export function useUrgentTimeRemaining(urgentAutoCloseAt?: string) {
  if (!urgentAutoCloseAt) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      percentage: 0,
    };
  }

  const closeAt = new Date(urgentAutoCloseAt);
  const now = new Date();
  const diff = closeAt.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      percentage: 0,
    };
  }

  const totalMs = 2 * 60 * 60 * 1000; // 2 horas en ms
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const percentage = Math.round(((totalMs - diff) / totalMs) * 100);

  return {
    hours,
    minutes,
    seconds,
    isExpired: false,
    percentage: Math.min(percentage, 100),
  };
}
