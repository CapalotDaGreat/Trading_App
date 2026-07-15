import { useMemo } from 'react';

import { useCandles } from '@/features/markets/hooks/useCandles';
import type { CandleInterval, MarketType } from '@/shared/types/market';

import { analyzeChart } from '../services/chart-analysis.service';
import type { IndicatorType } from '../utils/indicators';

interface UseChartDataOptions {
  symbol: string;
  interval: CandleInterval;
  marketType?: MarketType;
  limit?: number;
  indicators?: IndicatorType[];
}

export function useChartData({
  symbol,
  interval,
  marketType,
  limit = 100,
  indicators = ['rsi', 'macd', 'bollinger'],
}: UseChartDataOptions) {
  const candlesQuery = useCandles({ symbol, interval, marketType, limit });

  const analysis = useMemo(() => {
    if (!candlesQuery.data?.length) return null;
    return analyzeChart(candlesQuery.data, indicators);
  }, [candlesQuery.data, indicators]);

  return {
    candles: candlesQuery.data ?? [],
    analysis,
    isLoading: candlesQuery.isLoading,
    isError: candlesQuery.isError,
    error: candlesQuery.error,
    refetch: candlesQuery.refetch,
    dataUpdatedAt: candlesQuery.dataUpdatedAt,
  };
}
