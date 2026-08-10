import { useQuery } from '@tanstack/react-query';

import type { MarketType } from '@/shared/types/market';
import { useFeatureFlag, useRemoteConfig } from '@/features/ops-config/hooks/useOpsConfig';

import { MARKET_DATA_POLICY } from '../constants/freshness';
import { buildAssetFromSymbol, fetchQuoteWithMetadata } from '../services/market-data.service';

export const marketQuoteKeys = {
  all: ['market-quote'] as const,
  quote: (symbol: string, marketType?: MarketType) =>
    [...marketQuoteKeys.all, symbol, marketType] as const,
};

interface UseMarketQuoteOptions {
  symbol: string;
  marketType?: MarketType;
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useMarketQuote({
  symbol,
  marketType,
  enabled = true,
  refetchInterval,
}: UseMarketQuoteOptions) {
  const remote = useRemoteConfig();
  const aggressivePollingEnabled = useFeatureFlag('aggressiveMarketPollingEnabled');
  const configuredPollMs = Math.max(10_000, Math.min(5 * 60_000, remote.marketQuotePollMs));
  const resolvedRefetchInterval =
    refetchInterval ??
    (aggressivePollingEnabled
      ? configuredPollMs
      : Math.max(MARKET_DATA_POLICY.quoteRefetchMs, configuredPollMs));
  return useQuery({
    queryKey: marketQuoteKeys.quote(symbol, marketType),
    queryFn: async () => {
      const result = await fetchQuoteWithMetadata(symbol, marketType);
      return {
        ...result.quote,
        fetchedAt: result.fetchedAt,
        provider: result.provider,
        dataSourceKind: result.kind,
        marketType: marketType ?? buildAssetFromSymbol(symbol).marketType,
      };
    },
    enabled: enabled && symbol.length > 0,
    refetchInterval: resolvedRefetchInterval,
    staleTime: MARKET_DATA_POLICY.quoteStaleMs,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
