import { useQuery } from '@tanstack/react-query';

import type { MarketType } from '@/shared/types/market';

import { useDebounce } from '@/shared/hooks/useDebounce';

import { searchMarkets } from '../services/market-search.service';

export const marketSearchKeys = {
  all: ['market-search'] as const,
  query: (query: string, marketType?: MarketType) =>
    [...marketSearchKeys.all, query, marketType] as const,
};

interface UseMarketSearchOptions {
  query: string;
  marketType?: MarketType;
  limit?: number;
  enabled?: boolean;
}

export function useMarketSearch({
  query,
  marketType,
  limit = 20,
  enabled = true,
}: UseMarketSearchOptions) {
  const debouncedQuery = useDebounce(query, 350);

  return useQuery({
    queryKey: marketSearchKeys.query(debouncedQuery, marketType),
    queryFn: () => searchMarkets({ query: debouncedQuery, marketType, limit }),
    enabled: enabled && debouncedQuery.length >= 1,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}
