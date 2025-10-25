import { useMutation, useQueryClient } from '@tanstack/react-query';
import { imageBankApi } from '../services/api/imageBankApi';
import type { UploadImageResponse } from '../services/api/imageBankApi';

/**
 * 📤 Hook para upload manual de imágenes
 * Sube 1 o más imágenes con metadata manual desde galería
 * Invalida cache del banco de imágenes tras completar
 */
export function useUploadImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => imageBankApi.uploadImages(formData),
    onSuccess: (data: UploadImageResponse) => {
      console.log(`✅ ${data.totalUploaded} imagen(es) subida(s) correctamente`);

      // Invalidar cache del banco de imágenes
      queryClient.invalidateQueries({ queryKey: ['image-bank'] });
      queryClient.invalidateQueries({ queryKey: ['image-bank-stats'] });

      // Invalidar keywords/categories aggregations
      queryClient.invalidateQueries({ queryKey: ['image-bank-keywords'] });
      queryClient.invalidateQueries({ queryKey: ['image-bank-categories'] });
      queryClient.invalidateQueries({ queryKey: ['image-bank-outlets'] });
    },
    onError: (error) => {
      console.error('❌ Error uploading images:', error);
    },
  });
}
