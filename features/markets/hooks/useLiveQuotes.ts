import { useQuery } from '@tanstack/react-query';

import { useFeatureFlag, useRemoteConfig } from '@/features/ops-config/hooks/useOpsConfig';

import { MARKET_DATA_POLICY, withFetchedAt, type LiveQuote } from '../constants/freshness';
import { buildAssetFromSymbol, fetchQuotesWithMetadata } from '../services/market-data.service';

export const liveQuotesKeys = {
  all: ['live-quotes'] as const,
  batch: (symbols: string[]) => [...liveQuotesKeys.all, ...[...symbols].sort()] as const,
};

export function useLiveQuotes(symbols: string[], enabled = true) {
  const unique = [...new Set(symbols.filter(Boolean))];
  const remote = useRemoteConfig();
  const aggressivePollingEnabled = useFeatureFlag('aggressiveMarketPollingEnabled');
  const configuredPollMs = Math.max(10_000, Math.min(5 * 60_000, remote.marketQuotePollMs));
  const refetchInterval = aggressivePollingEnabled
    ? configuredPollMs
    : Math.max(MARKET_DATA_POLICY.quoteBatchRefetchMs, configuredPollMs);

  return useQuery({
    queryKey: liveQuotesKeys.batch(unique),
    queryFn: async (): Promise<LiveQuote[]> => {
      const results = await fetchQuotesWithMetadata(unique);
      return results.map((result) =>
        withFetchedAt(result.quote, buildAssetFromSymbol(result.quote.symbol).marketType, result),
      );
    },
    enabled: enabled && unique.length > 0,
    staleTime: MARKET_DATA_POLICY.quoteStaleMs,
    refetchInterval,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function quotesToPriceMap(quotes: LiveQuote[] | undefined): Record<string, number> {
  if (!quotes?.length) return {};
  return Object.fromEntries(quotes.map((q) => [q.symbol.toUpperCase(), q.price]));
}
