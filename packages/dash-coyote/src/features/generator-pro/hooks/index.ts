import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'
import type {
  WebsiteConfig,
  FacebookConfig,
  GeneratedPost,
  GeneratorProJob,
  SystemStatus,
  DashboardStats,
  CreateWebsiteConfigRequest,
  CreateFacebookConfigRequest,
  TestSelectorsRequest,
  TestSelectorsResponse,
  TestListingSelectorsRequest,
  TestIndividualContentRequest,
  TestListingResponse,
  TestContentResponse,
  GeneratedContentResponse,
} from '../types'
import type {
  FacebookPage,
  ExtractedUrl,
  ExtractedContent,
  GeneratedContent,
} from '../schemas'

// API functions
const generatorProApi = {
  // Websites
  getWebsites: async (): Promise<WebsiteConfig[]> => {
    const response = await apiClient.get<{ websites: WebsiteConfig[] }>('/generator-pro/websites')
    return response.websites
  },

  createWebsite: async (data: CreateWebsiteConfigRequest): Promise<WebsiteConfig> => {
    const response = await apiClient.post<{ website: WebsiteConfig }>('/generator-pro/websites', data)
    return response.website
  },

  updateWebsite: async ({ id, data }: { id: string; data: Partial<CreateWebsiteConfigRequest> }): Promise<WebsiteConfig> => {
    const response = await apiClient.put<{ website: WebsiteConfig }>(`/generator-pro/websites/${id}`, data)
    return response.website
  },

  testSelectors: async (data: TestSelectorsRequest): Promise<TestSelectorsResponse> => {
    // Transform the data structure to match backend DTO
    const transformedData = {
      baseUrl: data.baseUrl,
      listingUrl: data.listingUrl,
      contentSelectors: {
        titleSelector: data.contentSelectors.title,
        contentSelector: data.contentSelectors.content,
        imageSelector: data.contentSelectors.image,
        dateSelector: data.contentSelectors.publishedAt,
        authorSelector: data.contentSelectors.author,
        categorySelector: data.contentSelectors.category,
      }
    }
    return apiClient.post<TestSelectorsResponse>('/generator-pro/websites/test-selectors', transformedData)
  },

  testListingSelectors: async (data: TestListingSelectorsRequest): Promise<TestListingResponse> => {
    return apiClient.post<TestListingResponse>('/generator-pro/websites/test-listing-selectors', data)
  },

  testIndividualContent: async (data: TestIndividualContentRequest): Promise<TestContentResponse> => {
    return apiClient.post<TestContentResponse>('/generator-pro/websites/test-individual-content', data)
  },

  // Facebook Configs
  getFacebookConfigs: async (): Promise<FacebookConfig[]> => {
    const response = await apiClient.get<{ configs: FacebookConfig[] }>('/generator-pro/facebook-configs')
    return response.configs
  },

  createFacebookConfig: async (data: CreateFacebookConfigRequest): Promise<FacebookConfig> => {
    const response = await apiClient.post<{ config: FacebookConfig }>('/generator-pro/facebook-configs', data)
    return response.config
  },

  // Posts
  getPosts: async (): Promise<GeneratedPost[]> => {
    const response = await apiClient.get<{ posts: GeneratedPost[] }>('/generator-pro/posts')
    return response.posts || []
  },

  // Jobs
  getJobs: async (): Promise<GeneratorProJob[]> => {
    const response = await apiClient.get<{ jobs: GeneratorProJob[] }>('/generator-pro/jobs')
    return response.jobs || []
  },

  retryJob: async (jobId: string): Promise<void> => {
    await apiClient.post<void>(`/generator-pro/jobs/${jobId}/retry`)
  },

  // System
  getSystemStatus: async (): Promise<SystemStatus> => {
    return apiClient.get<SystemStatus>('/generator-pro/status')
  },

  getJobStats: async (): Promise<DashboardStats> => {
    return apiClient.get<DashboardStats>('/generator-pro/dashboard-stats')
  },

  startSystem: async (): Promise<void> => {
    await apiClient.post<void>('/generator-pro/system/control', { action: 'start' })
  },

  stopSystem: async (): Promise<void> => {
    await apiClient.post<void>('/generator-pro/system/control', { action: 'stop' })
  },

  clearQueue: async (queueName: string): Promise<void> => {
    await apiClient.post<void>(`/generator-pro/queues/${queueName}/clear`)
  },

  // Facebook Pages
  getFacebookPages: async (): Promise<{ pages: FacebookPage[] }> => {
    return apiClient.get<{ pages: FacebookPage[] }>('/generator-pro/facebook-pages')
  },

  // Manual workflow APIs
  extractUrls: async (websiteId: string): Promise<{ extractedUrls: string[]; totalUrls: number }> => {
    return apiClient.post<{ extractedUrls: string[]; totalUrls: number }>(`/generator-pro/websites/${websiteId}/extract-urls`)
  },

  extractContent: async ({ websiteId, urls }: { websiteId: string; urls: string[] }): Promise<{ extractedContent: ExtractedContent[]; totalProcessed: number }> => {
    return apiClient.post<{ extractedContent: ExtractedContent[]; totalProcessed: number }>(`/generator-pro/websites/${websiteId}/extract-content`, { urls })
  },

  generateContent: async (data: {
    extractedContent: {
      title: string;
      content: string;
      url: string;
      author?: string;
      category?: string;
    };
    templateId: string;
    providerId?: string;
  }): Promise<{ generatedContent: GeneratedContent }> => {
    return apiClient.post<{ generatedContent: GeneratedContent }>('/generator-pro/content/generate-from-extracted', data)
  },

  // 6-Tab Workflow APIs

  // URLs Tab APIs
  extractUrlsAndSave: async (websiteId: string): Promise<{ extractedUrls: ExtractedUrl[]; totalUrls: number }> => {
    return apiClient.post<{ extractedUrls: ExtractedUrl[]; totalUrls: number }>(`/generator-pro/websites/${websiteId}/extract-urls-and-save`)
  },

  getExtractedUrls: async (params: {
    websiteId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ urls: ExtractedUrl[]; total: number; page: number; totalPages: number }> => {
    const searchParams = new URLSearchParams();
    if (params.websiteId) searchParams.append('websiteId', params.websiteId);
    if (params.status) searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return apiClient.get<{ urls: ExtractedUrl[]; total: number; page: number; totalPages: number }>(`/generator-pro/urls?${searchParams}`);
  },

  // Contenido Tab APIs
  extractContentFromUrls: async (data: { urls: string[]; websiteId: string }): Promise<{ extractedContent: ExtractedContent[]; totalProcessed: number }> => {
    return apiClient.post<{ extractedContent: ExtractedContent[]; totalProcessed: number }>('/generator-pro/urls/extract-content', data)
  },

  getExtractedContent: async (params: {
    websiteId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ content: ExtractedContent[]; total: number; page: number; totalPages: number }> => {
    const searchParams = new URLSearchParams();
    if (params.websiteId) searchParams.append('websiteId', params.websiteId);
    if (params.status) searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return apiClient.get<{ content: ExtractedContent[]; total: number; page: number; totalPages: number }>(`/generator-pro/content?${searchParams}`);
  },

  // Content Agents API
  getContentAgents: async (): Promise<{ agents: ContentAgent[]; total: number }> => {
    return apiClient.get<{ agents: ContentAgent[]; total: number }>('/generator-pro/content-agents');
  },

  // Generados Tab APIs
  generateContentWithAgent: async (data: {
    extractedContentId: string;
    agentId: string;
    templateId?: string;
    providerId?: string;
    referenceContent?: string;
  }): Promise<{ generatedContent: GeneratedContentResponse }> => {
    // El userId se obtiene del token JWT en el backend usando @CurrentUser
    return apiClient.post<{ generatedContent: GeneratedContentResponse }>('/generator-pro/content/generate', data)
  },

  getGeneratedContent: async (params: {
    status?: string;
    agentId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ generated: GeneratedContent[]; total: number; page: number; totalPages: number }> => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.append('status', params.status);
    if (params.agentId) searchParams.append('agentId', params.agentId);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return apiClient.get<{ generated: GeneratedContent[]; total: number; page: number; totalPages: number }>(`/generator-pro/generated?${searchParams}`);
  },
}

// Query keys
export const generatorProKeys = {
  all: ['generator-pro'] as const,
  websites: () => [...generatorProKeys.all, 'websites'] as const,
  facebookConfigs: () => [...generatorProKeys.all, 'facebook-configs'] as const,
  facebookPages: () => [...generatorProKeys.all, 'facebook-pages'] as const,
  posts: () => [...generatorProKeys.all, 'posts'] as const,
  jobs: () => [...generatorProKeys.all, 'jobs'] as const,
  systemStatus: () => [...generatorProKeys.all, 'system-status'] as const,
  dashboardStats: () => [...generatorProKeys.all, 'dashboard-stats'] as const,
}

// Website hooks
export function useWebsiteConfigs() {
  return useQuery({
    queryKey: generatorProKeys.websites(),
    queryFn: generatorProApi.getWebsites,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCreateWebsiteConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generatorProApi.createWebsite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: generatorProKeys.websites() })
    },
  })
}

export function useUpdateWebsiteConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generatorProApi.updateWebsite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: generatorProKeys.websites() })
    },
  })
}

export function useTestSelectors() {
  return useMutation({
    mutationFn: generatorProApi.testSelectors,
  })
}

export function useTestListingSelectors() {
  return useMutation({
    mutationFn: generatorProApi.testListingSelectors,
  })
}

export function useTestIndividualContent() {
  return useMutation({
    mutationFn: generatorProApi.testIndividualContent,
  })
}

// Facebook hooks
export function useFacebookConfigs() {
  return useQuery({
    queryKey: generatorProKeys.facebookConfigs(),
    queryFn: generatorProApi.getFacebookConfigs,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCreateFacebookConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generatorProApi.createFacebookConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: generatorProKeys.facebookConfigs() })
    },
  })
}

// Posts hooks
export function useGeneratedPosts() {
  return useQuery({
    queryKey: generatorProKeys.posts(),
    queryFn: generatorProApi.getPosts,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Jobs hooks
export function useGeneratorProJobs() {
  return useQuery({
    queryKey: generatorProKeys.jobs(),
    queryFn: generatorProApi.getJobs,
    refetchInterval: 5000, // Refrescar cada 5 segundos
  })
}

export function useRetryJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generatorProApi.retryJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: generatorProKeys.jobs() })
    },
  })
}

// System hooks
export function useSystemStatus() {
  return useQuery({
    queryKey: generatorProKeys.systemStatus(),
    queryFn: generatorProApi.getSystemStatus,
    refetchInterval: 10000, // Refrescar cada 10 segundos
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: generatorProKeys.dashboardStats(),
    queryFn: generatorProApi.getJobStats,
    refetchInterval: 30000, // Refrescar cada 30 segundos
  })
}

export function useStartSystem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generatorProApi.startSystem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: generatorProKeys.systemStatus() })
    },
  })
}

export function useStopSystem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generatorProApi.stopSystem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: generatorProKeys.systemStatus() })
    },
  })
}

export function useClearQueue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generatorProApi.clearQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: generatorProKeys.jobs() })
    },
  })
}

// Facebook Pages hooks
export function useFacebookPages() {
  return useQuery({
    queryKey: generatorProKeys.facebookPages(),
    queryFn: generatorProApi.getFacebookPages,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  })
}

// Manual workflow hooks
export function useExtractUrls() {
  return useMutation({
    mutationFn: generatorProApi.extractUrls,
  })
}

export function useExtractContent() {
  return useMutation({
    mutationFn: generatorProApi.extractContent,
  })
}

export function useGenerateContent() {
  return useMutation({
    mutationFn: generatorProApi.generateContent,
  })
}

// 6-Tab Workflow Hooks

// URLs Tab hooks
export function useExtractUrlsAndSave() {
  return useMutation({
    mutationFn: generatorProApi.extractUrlsAndSave,
  })
}

export function useExtractedUrls(params: {
  websiteId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...generatorProKeys.all, 'extracted-urls', params],
    queryFn: () => generatorProApi.getExtractedUrls(params),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Contenido Tab hooks
export function useExtractContentFromUrls() {
  return useMutation({
    mutationFn: generatorProApi.extractContentFromUrls,
  })
}

export function useExtractedContent(params: {
  websiteId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...generatorProKeys.all, 'extracted-content', params],
    queryFn: () => generatorProApi.getExtractedContent(params),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Generados Tab hooks
export function useGenerateContentWithAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generatorProApi.generateContentWithAgent,
    onSuccess: () => {
      // Invalidar contenido generado
      queryClient.invalidateQueries({ queryKey: [...generatorProKeys.all, 'generated-content'] })
      // Invalidar contenido extraído para actualizar contador en PostsTab
      queryClient.invalidateQueries({ queryKey: [...generatorProKeys.all, 'extracted-content'] })
      // Invalidar dashboard stats
      queryClient.invalidateQueries({ queryKey: [...generatorProKeys.all, 'dashboard'] })
    },
  })
}

export function useGeneratedContent(params: {
  status?: string;
  agentId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...generatorProKeys.all, 'generated-content', params],
    queryFn: () => generatorProApi.getGeneratedContent(params),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Content Agents hooks
export {
  useContentAgents,
  useCreateContentAgent,
  useUpdateContentAgent,
  useDeleteContentAgent,
} from './useContentAgents';
export type { CreateContentAgentRequest } from './useContentAgents';
export type { ContentAgent, WritingStyle } from '../schemas';

// Content Generation Socket hooks
export { useContentGenerationSocket } from './useContentGenerationSocket';