import { useQuery } from '@tanstack/react-query';
import { extractionHistoryApi } from '@/src/services/outlets/extractionHistoryApi';

/**
 * Query keys for extraction history
 */
export const extractionHistoryKeys = {
  all: ['extraction-history'] as const,
  statistics: (outletId: string) => [...extractionHistoryKeys.all, 'statistics', outletId] as const,
  history: (outletId: string, limit?: number) =>
    [...extractionHistoryKeys.all, 'history', outletId, limit] as const,
};

/**
 * Hook to fetch outlet statistics from database
 * Returns real data from extractednoticias table
 */
export function useOutletStatistics(outletId: string) {
  return useQuery({
    queryKey: extractionHistoryKeys.statistics(outletId),
    queryFn: () => extractionHistoryApi.getOutletStatistics(outletId),
    staleTime: 30 * 1000, // 30 seconds - refresh frequently for live data
    gcTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!outletId,
  });
}

/**
 * Hook to fetch extraction history for an outlet
 * Shows last N extraction runs
 */
export function useExtractionHistory(outletId: string, limit: number = 5) {
  return useQuery({
    queryKey: extractionHistoryKeys.history(outletId, limit),
    queryFn: () => extractionHistoryApi.getExtractionHistory(outletId, limit),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!outletId,
  });
}
