// 🔍 Facebook Page URL Validation Hook - TanStack Query Integration
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'
import { toast } from 'sonner'

// 🎯 Types for page validation
export interface FacebookPageValidationRequest {
  pageUrl: string
}

export interface FacebookPageValidationResponse {
  pageId: string
  pageName: string
  category: string
  verified: boolean
  isAccessible: boolean
  followerCount?: number
  about?: string
}

export interface UseFacebookPageValidationReturn {
  validatePage: (pageUrl: string) => Promise<FacebookPageValidationResponse>
  validatedPageData: FacebookPageValidationResponse | null
  isValidating: boolean
  validationError: Error | null
  clearValidation: () => void
}

// 🔗 API Function
const validateFacebookPageUrl = async (pageUrl: string): Promise<FacebookPageValidationResponse> => {
  const { data } = await apiClient.post<FacebookPageValidationResponse>('/facebook/page-info-from-url', {
    pageUrl
  })
  return data
}

// 🎣 Main Hook
export function useFacebookPageValidation(): UseFacebookPageValidationReturn {
  // 🔍 Validation Mutation
  const {
    mutateAsync: validatePage,
    data: validatedPageData,
    isPending: isValidating,
    error: validationError,
    reset: clearValidation
  } = useMutation({
    mutationFn: validateFacebookPageUrl,
    onSuccess: (data) => {
      toast.success(`Page found: ${data.pageName}`)
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to validate Facebook page URL'

      // Handle specific error cases
      if (errorMessage.includes('not found')) {
        toast.error('Facebook page not found or is private')
      } else if (errorMessage.includes('Invalid URL')) {
        toast.error('Please enter a valid Facebook page URL')
      } else if (errorMessage.includes('not accessible')) {
        toast.error('Facebook page is not accessible')
      } else {
        toast.error(`Validation failed: ${errorMessage}`)
      }
    },
    retry: (failureCount, error) => {
      // Only retry on network errors, not validation errors
      const errorMessage = error.message || ''
      const isValidationError = errorMessage.includes('not found') ||
                               errorMessage.includes('Invalid URL') ||
                               errorMessage.includes('not accessible')

      return !isValidationError && failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  })

  return {
    validatePage,
    validatedPageData: validatedPageData || null,
    isValidating,
    validationError,
    clearValidation,
  }
}