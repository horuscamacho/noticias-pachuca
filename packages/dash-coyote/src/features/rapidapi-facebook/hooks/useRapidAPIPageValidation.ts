// 🔍 RapidAPI Facebook Page Validation Hook - TanStack Query Integration
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../../shared/services/apiClient'
import type {
  PageValidationRequest,
  PageValidationResponse,
  PageDetailsRequest,
  PageDetailsResponse,
  PagePostsRequest,
  PagePostsResponse,
  UseRapidAPIPageValidationReturn,
  MappedPageDetails
} from '../types/rapidapi-facebook.types'

// 🔗 API Functions
const validatePageUrl = async (request: PageValidationRequest): Promise<PageValidationResponse> => {
  return await apiClient.post<PageValidationResponse>('/rapidapi-facebook/validate-page-url', request)
}

const extractPageDetails = async (request: PageDetailsRequest): Promise<PageDetailsResponse> => {
  return await apiClient.post<PageDetailsResponse>('/rapidapi-facebook/extract-page-details', request)
}

const extractPagePosts = async (request: PagePostsRequest): Promise<PagePostsResponse> => {
  return await apiClient.post<PagePostsResponse>('/rapidapi-facebook/extract-page-posts', request)
}

// 🎣 Main Hook
export function useRapidAPIPageValidation(): UseRapidAPIPageValidationReturn {
  // 🔍 Page URL Validation Mutation
  const validatePageMutation = useMutation({
    mutationFn: validatePageUrl,
    onError: (error) => {
      console.error('Error validating page URL:', error)
    }
  })

  // 📄 Page Details Extraction Mutation
  const pageDetailsMutation = useMutation({
    mutationFn: extractPageDetails,
    onError: (error) => {
      console.error('Error extracting page details:', error)
    }
  })

  // 📝 Page Posts Extraction Mutation
  const pagePostsMutation = useMutation({
    mutationFn: extractPagePosts,
    onError: (error) => {
      console.error('Error extracting page posts:', error)
    }
  })

  // 🎯 Wrapper functions
  const validatePage = async (request: PageValidationRequest): Promise<PageValidationResponse> => {
    return await validatePageMutation.mutateAsync(request)
  }

  const getPageDetails = async (request: PageDetailsRequest): Promise<PageDetailsResponse> => {
    return await pageDetailsMutation.mutateAsync(request)
  }

  const extractPosts = async (request: PagePostsRequest): Promise<PagePostsResponse> => {
    return await pagePostsMutation.mutateAsync(request)
  }

  // 🎯 Return hook interface
  return {
    validatePage,
    getPageDetails,
    extractPagePosts: extractPosts,
    isLoading: validatePageMutation.isPending || pageDetailsMutation.isPending || pagePostsMutation.isPending,
    error: validatePageMutation.error || pageDetailsMutation.error || pagePostsMutation.error,
  }
}

// 🔄 Hook for complete page setup with database storage
export function useRapidAPIPageSetup() {
  const pageValidation = useRapidAPIPageValidation()

  // 🎯 Complete page setup process - validates URL and gets details (which creates page automatically)
  const setupPage = async (pageUrl: string, configId?: string) => {
    try {
      // Step 1: Validate URL and get page ID
      const validationResult = await pageValidation.validatePage({
        pageUrl,
        configId
      })

      // Step 2: Get page details AND CREATE PAGE automatically (backend now handles this)
      const detailsResult = await pageValidation.getPageDetails({
        pageUrl,
        configId
      })

      // Map page details for UI display
      const mappedPageDetails: MappedPageDetails = {
        name: detailsResult.pageDetails.rawData.results.name,
        image: detailsResult.pageDetails.rawData.results.image,
        intro: detailsResult.pageDetails.rawData.results.intro,
        followers: detailsResult.pageDetails.rawData.results.followers,
        likes: detailsResult.pageDetails.rawData.results.likes,
        categories: detailsResult.pageDetails.rawData.results.categories,
        phone: detailsResult.pageDetails.rawData.results.phone,
        email: detailsResult.pageDetails.rawData.results.email,
        website: detailsResult.pageDetails.rawData.results.website,
        verified: detailsResult.pageDetails.rawData.results.verified,
        cover_image: detailsResult.pageDetails.rawData.results.cover_image,
        rating: detailsResult.pageDetails.rawData.results.rating
      }

      return {
        success: true,
        pageId: validationResult.pageId,
        pageUrl,
        pageDetails: mappedPageDetails,
        page: detailsResult.page, // Now comes from extract-page-details response
        message: 'Page created successfully'
      }
    } catch (error) {
      throw error
    }
  }

  return {
    setupPage,
    isLoading: pageValidation.isLoading,
    error: pageValidation.error
  }
}