import { useQuery } from '@tanstack/react-query';

import type { CandleInterval, MarketType } from '@/shared/types/market';
import { useFeatureFlag, useRemoteConfig } from '@/features/ops-config/hooks/useOpsConfig';

import { MARKET_DATA_POLICY } from '../constants/freshness';
import { detectMarketType, fetchCandlesWithMetadata } from '../services/market-data.service';

export const candlesKeys = {
  all: ['candles'] as const,
  symbol: (symbol: string, interval: CandleInterval, marketType?: MarketType) =>
    [...candlesKeys.all, symbol, interval, marketType] as const,
};

interface UseCandlesOptions {
  symbol: string;
  interval: CandleInterval;
  marketType?: MarketType;
  limit?: number;
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useCandles({
  symbol,
  interval,
  marketType,
  limit = 100,
  enabled = true,
  refetchInterval,
}: UseCandlesOptions) {
  const remote = useRemoteConfig();
  const aggressivePollingEnabled = useFeatureFlag('aggressiveMarketPollingEnabled');
  const configuredPollMs = Math.max(30_000, Math.min(10 * 60_000, remote.marketCandlePollMs));
  const resolvedRefetchInterval =
    refetchInterval ??
    (aggressivePollingEnabled
      ? configuredPollMs
      : Math.max(MARKET_DATA_POLICY.candleRefetchMs, configuredPollMs));
  return useQuery({
    queryKey: candlesKeys.symbol(symbol, interval, marketType),
    queryFn: () =>
      fetchCandlesWithMetadata({
        symbol,
        interval,
        marketType: marketType ?? detectMarketType(symbol),
        limit,
      }),
    enabled: enabled && symbol.length > 0,
    staleTime: MARKET_DATA_POLICY.candleStaleMs,
    refetchInterval: resolvedRefetchInterval,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
