import { View } from 'react-native';

import { CandlestickChart } from '@/features/charts/components/CandlestickChart';
import { Text } from '@/shared/components/ui/Text';
import type { Candle } from '@/shared/types/market';

import type { SimulationBar } from '../types/scenario.types';

type VisibleBar = Omit<SimulationBar, 'phase'> | SimulationBar;

interface SimulationTapeChartProps {
  symbol: string;
  name: string;
  bars: VisibleBar[];
  clockDay: number;
}

export function SimulationTapeChart({ symbol, name, bars, clockDay }: SimulationTapeChartProps) {
  const candles: Candle[] = bars.map((bar) => ({
    timestamp: bar.day,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
  }));

  if (!candles.length) {
    return (
      <View className="mb-4 rounded-2xl border border-border bg-background-elevated px-3 py-3">
        <Text variant="caption" className="text-text-tertiary">
          No visible tape yet. Advance the clock — future sessions stay hidden.
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-4" testID="simulate-tape">
      <CandlestickChart
        candles={candles}
        symbol={symbol}
        currency="USD"
        intervalLabel={`Simulated day 0–${clockDay}`}
        dataKind="sample"
        extraNote={`${name}. Only sessions that have already printed. Not live market data.`}
        height={220}
      />
    </View>
  );
}
