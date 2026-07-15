import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { CandlestickChart } from '@/features/charts/components/CandlestickChart';
import { TimeframeSelector } from '@/features/charts/components/TimeframeSelector';
import { DataFreshnessBadge } from '@/features/decision/components/DataFreshnessBadge';
import { buildChartReplay } from '@/features/decision/services/replay.service';
import { useCandles } from '@/features/markets/hooks/useCandles';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import type { CandleInterval } from '@/shared/types/market';
import { formatRelativeTime } from '@/shared/utils/date';

const DEFAULT_SYMBOL = 'SPY';

export default function ChartReplayScreen() {
  const router = useRouter();
  const [interval, setInterval] = useState<CandleInterval>('1d');
  const [frameIdx, setFrameIdx] = useState(0);
  const { data: candles = [], isLoading, dataUpdatedAt } = useCandles({
    symbol: DEFAULT_SYMBOL,
    interval,
    limit: 120,
  });

  const session = useMemo(
    () => buildChartReplay(DEFAULT_SYMBOL, candles, interval),
    [candles, interval],
  );

  const frame = session.frames[Math.min(frameIdx, Math.max(0, session.frames.length - 1))];

  return (
    <Screen scrollable>
      <Header
        title="Chart Replay"
        subtitle={`${DEFAULT_SYMBOL} bar-by-bar`}
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-4 pb-8">
        <View className="flex-row items-center justify-between">
          <Text variant="body-sm">Practice reading setups without foresight bias.</Text>
          <DataFreshnessBadge fetchedAt={dataUpdatedAt || undefined} />
        </View>

        <TimeframeSelector value={interval} onChange={(v) => {
          setInterval(v);
          setFrameIdx(0);
        }} />

        <GlassCard className="overflow-hidden p-2">
          <CandlestickChart
            candles={frame?.visibleCandles ?? candles}
            isLoading={isLoading}
            height={280}
          />
        </GlassCard>

        {frame ? (
          <GlassCard className="p-4">
            <View className="mb-2 flex-row items-center gap-2">
              <Badge
                label={frame.bias}
                variant={
                  frame.bias === 'bullish' ? 'success' : frame.bias === 'bearish' ? 'danger' : 'default'
                }
              />
              <Badge label={`${frame.confidence}%`} variant="accent" size="sm" />
              <Text variant="caption">{formatRelativeTime(frame.asOf)}</Text>
            </View>
            <Text variant="body-sm">{frame.note}</Text>
            <Text variant="caption" className="mt-2">
              Frame {frameIdx + 1} / {session.frames.length || 1} · {session.totalBars} bars loaded
            </Text>
            <View className="mt-4 flex-row gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={frameIdx <= 0}
                onPress={() => setFrameIdx((i) => Math.max(0, i - 1))}
              >
                Prev
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={frameIdx >= session.frames.length - 1}
                onPress={() => setFrameIdx((i) => Math.min(session.frames.length - 1, i + 1))}
              >
                Next bar
              </Button>
            </View>
          </GlassCard>
        ) : (
          <GlassCard className="p-4">
            <Text variant="body-sm">
              {isLoading ? 'Loading candles…' : 'Not enough candle history for replay.'}
            </Text>
          </GlassCard>
        )}
      </View>
    </Screen>
  );
}
