import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/services/apiClient';
import type { NoticiasConfig, CreateConfigForm } from '../types/noticias.types';

// Type for update data (CreateConfigForm without domain)
type UpdateConfigForm = Omit<CreateConfigForm, 'domain'>;

export const useUpdateNoticiasConfig = () => {
  const queryClient = useQueryClient();

  return useMutation<NoticiasConfig, Error, { id: string; data: UpdateConfigForm }>({
    mutationFn: async ({ id, data }) => {
      console.log('🚀 Making PUT request to:', `/noticias/configs/${id}`);
      console.log('📦 Request data:', JSON.stringify(data, null, 2));

      try {
        const response = await apiClient.put<NoticiasConfig>(`/noticias/configs/${id}`, data);
        console.log('📩 PUT response:', response);
        return response;
      } catch (error) {
        console.error('💥 PUT error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: error.config?.data
        });
        throw error;
      }
    },
    onSuccess: (updatedConfig) => {
      console.log('✅ Update successful, invalidating queries...');
      // Invalidate and refetch configs list
      queryClient.invalidateQueries({ queryKey: ['noticias-configs'] });

      // Update specific config in cache if it exists
      queryClient.setQueryData(['noticias-config', updatedConfig._id], updatedConfig);
    },
    onError: (error) => {
      console.error('❌ Error updating config:', error);
    },
  });
};