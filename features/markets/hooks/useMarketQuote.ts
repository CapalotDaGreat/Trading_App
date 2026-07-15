import { useQuery } from '@tanstack/react-query';

import type { MarketType } from '@/shared/types/market';

import { MARKET_DATA_POLICY, withFetchedAt } from '../constants/freshness';
import { buildAssetFromSymbol, fetchQuote } from '../services/market-data.service';

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
  refetchInterval = MARKET_DATA_POLICY.quoteRefetchMs,
}: UseMarketQuoteOptions) {
  return useQuery({
    queryKey: marketQuoteKeys.quote(symbol, marketType),
    queryFn: async () => {
      const quote = await fetchQuote(symbol, marketType);
      return withFetchedAt(quote, marketType ?? buildAssetFromSymbol(symbol).marketType);
    },
    enabled: enabled && symbol.length > 0,
    refetchInterval,
    staleTime: MARKET_DATA_POLICY.quoteStaleMs,
    refetchOnReconnect: true,
  });
}
