import { useQuery } from '@tanstack/react-query';

import { MARKET_DATA_POLICY, withFetchedAt, type LiveQuote } from '../constants/freshness';
import { buildAssetFromSymbol, fetchQuotes } from '../services/market-data.service';

export const liveQuotesKeys = {
  all: ['live-quotes'] as const,
  batch: (symbols: string[]) => [...liveQuotesKeys.all, ...[...symbols].sort()] as const,
};

export function useLiveQuotes(symbols: string[], enabled = true) {
  const unique = [...new Set(symbols.filter(Boolean))];

  return useQuery({
    queryKey: liveQuotesKeys.batch(unique),
    queryFn: async (): Promise<LiveQuote[]> => {
      const quotes = await fetchQuotes(unique);
      return quotes.map((q) => withFetchedAt(q, buildAssetFromSymbol(q.symbol).marketType));
    },
    enabled: enabled && unique.length > 0,
    staleTime: MARKET_DATA_POLICY.quoteStaleMs,
    refetchInterval: MARKET_DATA_POLICY.quoteBatchRefetchMs,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function quotesToPriceMap(quotes: LiveQuote[] | undefined): Record<string, number> {
  if (!quotes?.length) return {};
  return Object.fromEntries(quotes.map((q) => [q.symbol.toUpperCase(), q.price]));
}
