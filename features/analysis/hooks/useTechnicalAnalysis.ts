import { useQuery } from '@tanstack/react-query';

import { getTechnicalAnalysis } from '../services/technical-analysis.service';

export function useTechnicalAnalysis(symbol: string) {
  const query = useQuery({
    queryKey: ['analysis', 'technical', symbol] as const,
    queryFn: () => getTechnicalAnalysis(symbol),
    enabled: Boolean(symbol),
    staleTime: 120_000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
