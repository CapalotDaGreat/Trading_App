import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { CandlestickChart } from '@/features/charts/components/CandlestickChart';
import { TimeframeSelector } from '@/features/charts/components/TimeframeSelector';
import { DataFreshnessBadge } from '@/features/decision/components/DataFreshnessBadge';
import { useSetupRadar } from '@/features/decision/hooks/useDecision';
import { buildChartReplay } from '@/features/decision/services/replay.service';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { useCandles } from '@/features/markets/hooks/useCandles';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import type { CandleInterval } from '@/shared/types/market';
import { cn } from '@/shared/utils/cn';
import { formatRelativeTime } from '@/shared/utils/date';

type UserBias = 'bullish' | 'bearish' | 'neutral';

export function ChartReplaySegment({
  initialSymbol = 'SPY',
  initialInterval = '1d',
  onReflect,
}: {
  initialSymbol?: string;
  initialInterval?: CandleInterval;
  onReflect: () => void;
}) {
  const radar = useSetupRadar();
  const [symbol, setSymbol] = useState(initialSymbol.toUpperCase());
  const [interval, setInterval] = useState<CandleInterval>(initialInterval);
  const [frameIdx, setFrameIdx] = useState(0);
  const [userBias, setUserBias] = useState<UserBias | null>(null);
  const appendDecision = useAppendDecisionRecord();

  const symbols = useMemo(() => {
    const fromRadar = (radar.data ?? []).slice(0, 5).map((setup) => setup.symbol);
    const available = fromRadar.length ? fromRadar : ['SPY', 'NVDA', 'AAPL'];
    return available.includes(symbol) ? available : [symbol, ...available];
  }, [radar.data, symbol]);

  const {
    data: candleResult,
    isLoading,
    dataUpdatedAt: queryUpdatedAt,
  } = useCandles({
    symbol,
    interval,
    limit: 120,
  });
  const candles = useMemo(() => candleResult?.candles ?? [], [candleResult]);
  const session = useMemo(
    () => buildChartReplay(symbol, candles, interval),
    [candles, interval, symbol],
  );
  const safeFrameIndex = Math.min(frameIdx, Math.max(0, session.frames.length - 1));
  const frame = session.frames[safeFrameIndex];
  const atEnd = safeFrameIndex >= session.frames.length - 1;

  const resetReplay = (nextSymbol?: string, nextInterval?: CandleInterval) => {
    if (nextSymbol) setSymbol(nextSymbol);
    if (nextInterval) setInterval(nextInterval);
    setFrameIdx(0);
    setUserBias(null);
  };

  return (
    <View className="gap-4" testID="review-chart-replay">
      <View className="rounded-2xl bg-background-elevated p-4">
        <Text variant="h3">Chart Replay</Text>
        <Text variant="body-sm" className="mt-1 text-text-secondary">
          Step through historical bars without foresight. This is practice, not a prediction or
          trade signal.
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {symbols.map((candidate) => (
          <Pressable
            key={candidate}
            accessibilityRole="button"
            accessibilityLabel={`Replay ${candidate}`}
            testID={`chart-replay-symbol-${candidate}`}
            onPress={() => resetReplay(candidate)}
            className={cn(
              'rounded-full px-3.5 py-1.5',
              symbol === candidate ? 'bg-accent-muted' : 'bg-surface',
            )}
          >
            <Text
              variant="caption"
              className={symbol === candidate ? 'text-accent' : 'text-text-secondary'}
            >
              {candidate}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row items-center justify-between gap-3">
        <Text variant="body-sm" className="flex-1">
          Choose your read at each frame, then compare it with chart structure.
        </Text>
        <DataFreshnessBadge fetchedAt={(candleResult?.fetchedAt ?? queryUpdatedAt) || undefined} />
      </View>

      <TimeframeSelector value={interval} onChange={(value) => resetReplay(undefined, value)} />

      <GlassCard className="overflow-hidden p-2">
        <CandlestickChart
          candles={frame?.visibleCandles ?? candles}
          isLoading={isLoading}
          height={280}
        />
      </GlassCard>

      {frame ? (
        <GlassCard className="p-4">
          <View className="mb-2 flex-row flex-wrap items-center gap-2">
            <Badge
              label={frame.bias}
              variant={
                frame.bias === 'bullish'
                  ? 'success'
                  : frame.bias === 'bearish'
                    ? 'danger'
                    : 'default'
              }
            />
            <Badge label={`Structure quality ${frame.confidence}%`} variant="accent" size="sm" />
            <Text variant="caption">{formatRelativeTime(frame.asOf)}</Text>
          </View>
          <Text variant="body-sm">{frame.note}</Text>
          <Text variant="caption" className="mb-2 mt-3 text-text-secondary">
            What would you do at this bar?
          </Text>
          <View className="mb-3 flex-row gap-2">
            {(['bullish', 'bearish', 'neutral'] as const).map((bias) => (
              <Button
                key={bias}
                size="sm"
                variant={userBias === bias ? 'primary' : 'outline'}
                className="flex-1"
                accessibilityLabel={`Choose ${bias} chart read`}
                testID={`chart-replay-bias-${bias}`}
                onPress={() => setUserBias(bias)}
              >
                {bias}
              </Button>
            ))}
          </View>

          <Text variant="caption">
            Frame {safeFrameIndex + 1} / {session.frames.length || 1} · {session.totalBars} bars
          </Text>
          <View className="mt-4 flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={safeFrameIndex <= 0}
              accessibilityLabel="Show previous replay bar"
              onPress={() => setFrameIdx((index) => Math.max(0, index - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              className="flex-1"
              disabled={atEnd}
              accessibilityLabel="Show next replay bar"
              onPress={() => setFrameIdx((index) => Math.min(session.frames.length - 1, index + 1))}
            >
              Next bar
            </Button>
          </View>

          {atEnd && userBias ? (
            <View className="mt-4 gap-2" testID="chart-replay-comparison">
              <Text variant="label">Learning comparison</Text>
              <Text variant="body-sm">
                You: {userBias} · Chart structure: {frame.bias}
                {userBias === frame.bias
                  ? ' — aligned with structure.'
                  : ' — divergence is a lesson, not a wrong or right trade call.'}
              </Text>
              <Text variant="caption" className="text-text-secondary">
                Historical outcomes are educational only. Reflect on invalidation, sizing, or why
                you would wait.
              </Text>
              <Button
                accessibilityLabel="Reflect on this chart replay"
                testID="chart-replay-reflect"
                onPress={() => {
                  void appendDecision.mutateAsync({
                    symbol,
                    regime: 'replay',
                    action: 'replay_completed',
                    bias: userBias,
                    note: `Chart replay · you ${userBias} · structure ${frame.bias}`,
                  });
                  onReflect();
                }}
              >
                Reflect on this session
              </Button>
            </View>
          ) : null}
        </GlassCard>
      ) : (
        <GlassCard className="p-4">
          <Text variant="body-sm">
            {isLoading ? 'Loading candles…' : 'Not enough candle history for replay.'}
          </Text>
        </GlassCard>
      )}
    </View>
  );
}
