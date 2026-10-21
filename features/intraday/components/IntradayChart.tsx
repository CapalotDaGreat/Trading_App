import { useMemo } from 'react';
import { View } from 'react-native';

import { CandlestickChart } from '@/features/charts/components/CandlestickChart';
import { Text } from '@/shared/components/ui/Text';
import { formatPrice } from '@/shared/utils/format';

import { sessionVwap, sessionVwapSeries } from '../services/candle.service';
import type { IntradayCandle } from '../types/intraday.types';

interface IntradayChartProps {
  candles: IntradayCandle[];
  intervalLabel: string;
  height?: number;
  testID?: string;
}

/**
 * Intraday replay chart built on the existing CandlestickChart.
 * Only revealed candles are ever passed in — future candles are hidden by
 * construction. VWAP is computed incrementally over the revealed prefix.
 */
export function IntradayChart({
  candles,
  intervalLabel,
  height = 260,
  testID,
}: IntradayChartProps) {
  const vwap = useMemo(() => sessionVwap(candles), [candles]);
  const vwapSeries = useMemo(() => sessionVwapSeries(candles), [candles]);
  const current = candles[candles.length - 1];
  const vwapNow = vwapSeries[vwapSeries.length - 1] ?? null;

  return (
    <View testID={testID}>
      <CandlestickChart
        candles={candles}
        height={height}
        symbol={current?.symbol}
        intervalLabel={intervalLabel}
        dataKind="Synthetic educational session — fictional prices, not real market data"
        guideLevels={vwap != null ? [vwap] : []}
        extraNote="Dashed guide is session VWAP over revealed candles only. Future candles are hidden."
      />
      <View className="mt-1 flex-row flex-wrap gap-x-4 gap-y-1">
        <Text variant="caption" className="text-text-tertiary">
          {current
            ? `${new Date(current.timestamp).toUTCString().slice(17, 22)} UTC · Close ${formatPrice(current.close, 'USD')}`
            : 'No candles revealed yet'}
        </Text>
        <Text variant="caption" className="text-text-tertiary">
          {vwapNow != null
            ? `VWAP ${formatPrice(vwapNow, 'USD')}${current ? (current.close >= vwapNow ? ' · price above VWAP (context only)' : ' · price below VWAP (context only)') : ''}`
            : 'VWAP not yet available (no volume)'}
        </Text>
        <Text variant="caption" className="text-text-tertiary">
          {candles.length} candle{candles.length === 1 ? '' : 's'} revealed
        </Text>
      </View>
    </View>
  );
}
