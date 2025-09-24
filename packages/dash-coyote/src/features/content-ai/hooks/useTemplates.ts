import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'

// Types
interface PromptTemplate {
  id: string
  name: string
  type: 'noticia' | 'columna' | 'trascendido' | 'seo-metadata'
  agentPersona: string
  promptTemplate: string
  systemPrompt: string
  staticInputStructure: {
    title: string
    content: string
    referenceContent?: string
  }
  staticOutputFormat: {
    title: string
    content: string
    keywords: string[]
    tags: string[]
    category: string
    summary: string
  }
  variables: string[]
  isActive: boolean
  agentConfiguration: {
    editorialLine: 'neutral' | 'izquierda' | 'derecha' | 'crítica'
    politicalIntensity: number
    agentPersonality: string
    canHandlePolitics: boolean
    requiresReference: boolean
  }
  category?: string
  compatibleProviders: string[]
  qualityMetrics?: {
    averageQualityScore: number
    usageCount: number
    successRate: number
    averageProcessingTime: number
    lastUsed: Date
    userRatings: number[]
  }
  examples?: Array<{
    sampleInput: Record<string, string>
    expectedOutput: Record<string, string>
    description?: string
  }>
  createdAt: Date
  updatedAt: Date
}

interface CreateTemplateRequest {
  name: string
  type: 'noticia' | 'columna' | 'trascendido' | 'seo-metadata'
  agentPersona: string
  promptTemplate: string
  systemPrompt: string
  staticInputStructure: {
    title: string
    content: string
    referenceContent?: string
  }
  staticOutputFormat: {
    title: string
    content: string
    keywords: string[]
    tags: string[]
    category: string
    summary: string
  }
  variables: string[]
  agentConfiguration: {
    editorialLine: 'neutral' | 'izquierda' | 'derecha' | 'crítica'
    politicalIntensity: number
    agentPersonality: string
    canHandlePolitics: boolean
    requiresReference: boolean
  }
  category?: string
  compatibleProviders: string[]
  examples?: Array<{
    sampleInput: Record<string, string>
    expectedOutput: Record<string, string>
    description?: string
  }>
}

interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {
  isActive?: boolean
}

interface TemplateTestRequest {
  templateId: string
  testData: {
    title: string
    content: string
    referenceContent?: string
  }
}

interface TemplateTestResponse {
  success: boolean
  generatedContent: {
    title: string
    content: string
    keywords: string[]
    tags: string[]
    category: string
    summary: string
  }
  processingTime: number
  tokensUsed: number
  cost: number
  provider: string
  error?: string
}

interface TemplateSearchParams {
  text?: string
  type?: 'noticia' | 'columna' | 'trascendido' | 'seo-metadata'
  category?: string
  minQualityScore?: number
}

// API functions
const templatesApi = {
  getAll: async (): Promise<PromptTemplate[]> => {
    return apiClient.get<PromptTemplate[]>('/content-ai/templates')
  },

  getActive: async (): Promise<PromptTemplate[]> => {
    return apiClient.get<PromptTemplate[]>('/content-ai/templates', { params: { active: 'true' } })
  },

  getByType: async (type: string): Promise<PromptTemplate[]> => {
    return apiClient.get<PromptTemplate[]>(`/content-ai/templates/type/${type}`)
  },

  getByAgent: async (agentType: string): Promise<PromptTemplate[]> => {
    return apiClient.get<PromptTemplate[]>(`/content-ai/templates/agent/${agentType}`)
  },

  getById: async (id: string): Promise<PromptTemplate> => {
    return apiClient.get<PromptTemplate>(`/content-ai/templates/${id}`)
  },

  search: async (params: TemplateSearchParams): Promise<PromptTemplate[]> => {
    const queryParams: Record<string, string> = {}
    if (params.text) queryParams.text = params.text
    if (params.type) queryParams.type = params.type
    if (params.category) queryParams.category = params.category
    if (params.minQualityScore) queryParams.minQualityScore = params.minQualityScore.toString()

    return apiClient.get<PromptTemplate[]>('/content-ai/templates/search/query', { params: queryParams })
  },

  create: async (data: CreateTemplateRequest): Promise<PromptTemplate> => {
    return apiClient.post<PromptTemplate>('/content-ai/templates', data)
  },

  update: async (id: string, data: UpdateTemplateRequest): Promise<PromptTemplate> => {
    return apiClient.put<PromptTemplate>(`/content-ai/templates/${id}`, data)
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/content-ai/templates/${id}`)
  },

  test: async (data: TemplateTestRequest): Promise<TemplateTestResponse> => {
    return apiClient.post<TemplateTestResponse>(`/content-ai/templates/${data.templateId}/test`, data.testData)
  }
}

// Query keys
export const templatesKeys = {
  all: ['templates'] as const,
  active: ['templates', 'active'] as const,
  byType: (type: string) => ['templates', 'type', type] as const,
  byAgent: (agentType: string) => ['templates', 'agent', agentType] as const,
  detail: (id: string) => ['templates', id] as const,
  search: (params: TemplateSearchParams) => ['templates', 'search', params] as const,
}

// Hooks
export function useTemplates() {
  return useQuery({
    queryKey: templatesKeys.all,
    queryFn: templatesApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useActiveTemplates() {
  return useQuery({
    queryKey: templatesKeys.active,
    queryFn: templatesApi.getActive,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useTemplatesByType(type: string) {
  return useQuery({
    queryKey: templatesKeys.byType(type),
    queryFn: () => templatesApi.getByType(type),
    enabled: !!type,
  })
}

export function useTemplatesByAgent(agentType: string) {
  return useQuery({
    queryKey: templatesKeys.byAgent(agentType),
    queryFn: () => templatesApi.getByAgent(agentType),
    enabled: !!agentType,
  })
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: templatesKeys.detail(id),
    queryFn: () => templatesApi.getById(id),
    enabled: !!id,
  })
}

export function useSearchTemplates(params: TemplateSearchParams) {
  return useQuery({
    queryKey: templatesKeys.search(params),
    queryFn: () => templatesApi.search(params),
    enabled: !!(params.text || params.type || params.category || params.minQualityScore),
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: templatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templatesKeys.all })
      queryClient.invalidateQueries({ queryKey: templatesKeys.active })
    },
  })
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateRequest }) =>
      templatesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: templatesKeys.all })
      queryClient.invalidateQueries({ queryKey: templatesKeys.active })
      queryClient.invalidateQueries({ queryKey: templatesKeys.detail(id) })
    },
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: templatesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templatesKeys.all })
      queryClient.invalidateQueries({ queryKey: templatesKeys.active })
    },
  })
}

export function useTestTemplate() {
  return useMutation({
    mutationFn: templatesApi.test,
  })
}