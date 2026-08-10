import { useQuery } from '@tanstack/react-query';

import { useDebounce } from '@/shared/hooks/useDebounce';

import {
  resolveInstrument,
  searchInstruments,
} from '../services/instrument-resolver.service';

export const instrumentSearchKeys = {
  all: ['instrument-search'] as const,
  query: (query: string) => [...instrumentSearchKeys.all, 'list', query] as const,
  resolve: (query: string) => [...instrumentSearchKeys.all, 'resolve', query] as const,
};

interface UseInstrumentSearchOptions {
  query: string;
  enabled?: boolean;
  limit?: number;
}

/** Debounced instrument search for portfolio / pickers (React Query cached). */
export function useInstrumentSearch({
  query,
  enabled = true,
  limit = 20,
}: UseInstrumentSearchOptions) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: instrumentSearchKeys.query(`${debouncedQuery}:${limit}`),
    queryFn: () => searchInstruments(debouncedQuery, { limit }),
    enabled: enabled && debouncedQuery.trim().length >= 1,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

/** Full resolve pipeline (capability-gated) for confirmation flows. */
export function useInstrumentResolve(query: string, enabled = true) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: instrumentSearchKeys.resolve(debouncedQuery),
    queryFn: () => resolveInstrument(debouncedQuery),
    enabled: enabled && debouncedQuery.trim().length >= 1,
    staleTime: 60_000,
  });
}
