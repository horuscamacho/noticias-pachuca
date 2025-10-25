// Hooks de autenticación
export { useAuth } from './useAuth'
export { useBiometric, useBiometricAvailability, useBiometricSetup } from './useBiometric'
export { useAutoTokenRefresh } from './useAutoTokenRefresh'

// Re-export hooks de stores para conveniencia
export {
  useAuthUser,
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
  useAuthMethod
} from '@/src/stores/authStore'

export {
  useTheme,
  useLanguage,
  useBiometricSettings,
  useNotificationSettings,
  useOnboardingStatus,
  useConnectivityStatus,
  useDeveloperSettings,
  useSessionSettings
} from '@/src/stores/appStore'

// Hooks de Sites Multi-Tenant
export {
  useSites,
  useSiteById,
  useCreateSite,
  useUpdateSite,
  useDeleteSite,
  useSiteStats,
  sitesKeys
} from './useSites'

// Hooks de Estadísticas Generales
export {
  useStatsAgents,
  useStatsSites,
  useStatsNoticias,
  useStatsOutlets,
  statsKeys
} from './useStats'

// Hooks de Community Manager
export {
  useScheduledPosts,
  useScheduledPostById,
  useScheduleContent,
  useScheduleRecycled,
  useCancelScheduledPost,
  useReschedulePost,
  useCommunityManagerStats,
  useEligibleContent,
  useCheckEligibility,
  useRecyclingStats,
  useCreateRecycleSchedule,
  communityManagerKeys
} from './useCommunityManager'

// Hooks de Publicación de Contenido Generado
export { usePublishContent } from './usePublishContent'
export { useImproveCopy } from './useImproveCopy'

// Hooks de Image Bank
export { useUploadImages } from './useUploadImages'

// Hooks de User Generated Content (Manual Content Creation)
export {
  useActiveUrgentList,
  useUserContentDetail,
  useCreateUrgentContent,
  useCreateNormalContent,
  useUpdateUrgentContent,
  useCloseUrgentContent,
  useFileUpload,
  useUrgentTimeRemaining,
  userContentKeys,
} from './useUserContent'

// Hooks de UI y Animaciones
export { useCollapsibleHeader } from './useCollapsibleHeader'