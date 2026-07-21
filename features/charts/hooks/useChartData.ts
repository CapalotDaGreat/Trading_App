import { useMemo } from 'react';

import { useCandles } from '@/features/markets/hooks/useCandles';
import { performanceDiagnostics } from '@/shared/services/performance';
import type { CandleInterval, MarketType } from '@/shared/types/market';

import { analyzeChart } from '../services/chart-analysis.service';
import type { IndicatorType } from '../utils/indicators';

interface UseChartDataOptions {
  symbol: string;
  interval: CandleInterval;
  marketType?: MarketType;
  limit?: number;
  indicators?: IndicatorType[];
  enabled?: boolean;
}

export function useChartData({
  symbol,
  interval,
  marketType,
  limit = 100,
  indicators = ['rsi', 'macd', 'bollinger'],
  enabled = true,
}: UseChartDataOptions) {
  const candlesQuery = useCandles({ symbol, interval, marketType, limit, enabled });

  const analysis = useMemo(() => {
    if (!enabled || !candlesQuery.data?.candles.length) return null;
    return performanceDiagnostics.measure('chart.work', () =>
      analyzeChart(candlesQuery.data!.candles, indicators),
    );
  }, [candlesQuery.data, enabled, indicators]);

  return {
    candles: candlesQuery.data?.candles ?? [],
    source: candlesQuery.data
      ? {
          provider: candlesQuery.data.provider,
          kind: candlesQuery.data.kind,
          fetchedAt: candlesQuery.data.fetchedAt,
        }
      : undefined,
    analysis,
    isLoading: candlesQuery.isLoading,
    isError: candlesQuery.isError,
    error: candlesQuery.error,
    refetch: candlesQuery.refetch,
    dataUpdatedAt: candlesQuery.data?.fetchedAt ?? candlesQuery.dataUpdatedAt,
  };
}
