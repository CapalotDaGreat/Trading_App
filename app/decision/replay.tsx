import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { CandlestickChart } from '@/features/charts/components/CandlestickChart';
import { TimeframeSelector } from '@/features/charts/components/TimeframeSelector';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { DataFreshnessBadge } from '@/features/decision/components/DataFreshnessBadge';
import { useSetupRadar } from '@/features/decision/hooks/useDecision';
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
import { cn } from '@/shared/utils/cn';

type UserBias = 'bullish' | 'bearish' | 'neutral';

export default function ChartReplayScreen() {
  const router = useRouter();
  const radar = useSetupRadar();
  const [symbol, setSymbol] = useState('SPY');
  const [interval, setInterval] = useState<CandleInterval>('1d');
  const [frameIdx, setFrameIdx] = useState(0);
  const [userBias, setUserBias] = useState<UserBias | null>(null);
  const appendDecision = useAppendDecisionRecord();

  const symbols = useMemo(() => {
    const fromRadar = (radar.data ?? []).slice(0, 5).map((s) => s.symbol);
    return fromRadar.length ? fromRadar : ['SPY', 'NVDA', 'AAPL'];
  }, [radar.data]);

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
  const dataUpdatedAt = candleResult?.fetchedAt ?? queryUpdatedAt;

  const session = useMemo(
    () => buildChartReplay(symbol, candles, interval),
    [candles, interval, symbol],
  );

  const frame = session.frames[Math.min(frameIdx, Math.max(0, session.frames.length - 1))];
  const atEnd = frameIdx >= session.frames.length - 1;

  return (
    <Screen scrollable>
      <Header
        title="Chart Replay"
        subtitle={`${symbol} bar-by-bar`}
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-4 pb-8">
        <View className="flex-row flex-wrap gap-2">
          {symbols.map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                setSymbol(s);
                setFrameIdx(0);
                setUserBias(null);
              }}
              className={cn(
                'rounded-full px-3.5 py-1.5',
                symbol === s ? 'bg-accent-muted' : 'bg-surface',
              )}
            >
              <Text variant="caption" className={symbol === s ? 'text-accent' : 'text-text-secondary'}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row items-center justify-between">
          <Text variant="body-sm">Pick your bias at each frame — compare to engine at the end.</Text>
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
              <Badge label={`Engine ${frame.confidence}%`} variant="accent" size="sm" />
              <Text variant="caption">{formatRelativeTime(frame.asOf)}</Text>
            </View>
            <Text variant="body-sm">{frame.note}</Text>

            <Text variant="caption" className="mt-3 mb-2 text-text-secondary">
              What would you do at this bar?
            </Text>
            <View className="mb-3 flex-row gap-2">
              {(['bullish', 'bearish', 'neutral'] as const).map((b) => (
                <Button
                  key={b}
                  size="sm"
                  variant={userBias === b ? 'primary' : 'outline'}
                  className="flex-1"
                  onPress={() => setUserBias(b)}
                >
                  {b}
                </Button>
              ))}
            </View>

            {userBias && !atEnd ? (
              <Text variant="caption" className="mb-2 text-accent">
                Logged your read. Advance to compare with structure — outcome is learning, not a
                signal.
              </Text>
            ) : null}

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
                disabled={atEnd}
                onPress={() => setFrameIdx((i) => Math.min(session.frames.length - 1, i + 1))}
              >
                Next bar
              </Button>
            </View>

            {atEnd && userBias ? (
              <View className="mt-4 gap-2">
                <Text variant="label" className="text-text-primary">
                  Learning comparison
                </Text>
                <Text variant="body-sm">
                  You: {userBias} · Engine structure: {frame.bias}
                  {userBias === frame.bias
                    ? ' — aligned with structure.'
                    : ' — divergence is a lesson, not a wrong/right trade call.'}
                </Text>
                <Text variant="caption" className="text-text-secondary">
                  Historical outcome on this replay path is educational only. Journal what you would
                  have sized, skipped, or waited for.
                </Text>
                <Text variant="caption" className="text-accent">
                  Learning point: name invalidation before bias. Replay builds process, not
                  predictions.
                </Text>
                <Button
                  onPress={() => {
                    void appendDecision.mutateAsync({
                      symbol,
                      regime: 'replay',
                      action: 'replay_completed',
                      bias: userBias,
                      note: `Chart replay · you ${userBias} · engine ${frame.bias}`,
                    });
                    void appendDecision.mutateAsync({
                      symbol,
                      regime: 'replay',
                      action: 'journaled',
                      bias: userBias,
                      note: `Replay aligned: ${userBias === frame.bias}`,
                    });
                    router.push('/journal' as never);
                  }}
                >
                  Journal this session
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
    </Screen>
  );
}
