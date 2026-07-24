import { useQuery } from '@tanstack/react-query';

import { enrichRequestContext } from '@/features/ai/services/ai-context.service';
import { buildAiDebate } from '@/features/ai/services/ai-debate.service';
import type { AiDebateResult } from '@/features/ai/types/ai-debate.types';
import { useRegime, useTraderMemory, useMtfConsensus } from '@/features/decision/hooks/useDecision';
import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio';
import type { CandleInterval } from '@/shared/types/market';

export const aiDebateKeys = {
  all: ['ai-debate'] as const,
  symbol: (symbol: string, timeframe: string) =>
    ['ai-debate', symbol.toUpperCase(), timeframe] as const,
};

export function useAiDebate(symbol: string, timeframe: CandleInterval | string, enabled = true) {
  const regimeQuery = useRegime({ enabled });
  const memoryQuery = useTraderMemory();
  const mtfQuery = useMtfConsensus(symbol, { enabled: enabled && Boolean(symbol) });
  const { holdings } = usePortfolio();
  const portfolioSymbols = holdings.map((h) => h.symbol);

  const query = useQuery({
    queryKey: [
      ...aiDebateKeys.symbol(symbol, String(timeframe)),
      regimeQuery.dataUpdatedAt,
      mtfQuery.dataUpdatedAt,
      memoryQuery.dataUpdatedAt,
      portfolioSymbols.join(','),
    ],
    enabled: enabled && Boolean(symbol),
    staleTime: 45_000,
    queryFn: async (): Promise<AiDebateResult> => {
      const enrichedRequest = await enrichRequestContext({
        symbol,
        timeframe: String(timeframe),
        portfolio: holdings.map((h) => ({
          symbol: h.symbol,
          quantity: h.quantity,
          avgCost: h.averageCost,
        })),
      });
      if (!enrichedRequest.enriched) {
        throw new Error('Unable to assemble debate evidence for this symbol.');
      }
      return buildAiDebate({
        enriched: enrichedRequest.enriched,
        timeframe: String(timeframe),
        regime: regimeQuery.data,
        mtf: mtfQuery.data,
        memory: memoryQuery.data,
        portfolioSymbols,
      });
    },
  });

  return {
    ...query,
    debate: query.data,
  };
}
