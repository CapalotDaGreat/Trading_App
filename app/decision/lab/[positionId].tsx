import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { LabScoresCard } from '@/features/decision-lab/components/LabCards';
import { useDecisionLabStore } from '@/features/decision-lab/stores/lab.store';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

export default function LabPositionScreen() {
  const router = useRouter();
  const { positionId } = useLocalSearchParams<{ positionId: string }>();
  const positions = useDecisionLabStore((s) => s.positions);
  const closePosition = useDecisionLabStore((s) => s.closePosition);
  const updateMark = useDecisionLabStore((s) => s.updateMark);
  const appendDecision = useAppendDecisionRecord();

  const position = useMemo(
    () => positions.find((p) => p.id === positionId),
    [positions, positionId],
  );

  const [exitPrice, setExitPrice] = useState(
    position ? String(position.markPrice) : '',
  );
  const [stopHonored, setStopHonored] = useState(true);
  const [willJournal, setWillJournal] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closedId, setClosedId] = useState<string | null>(null);

  const closed = closedId
    ? positions.find((p) => p.id === closedId)
    : position?.status === 'closed'
      ? position
      : null;

  if (!position && !closed) {
    return (
      <Screen>
        <Header title="Lab position" onBack={() => router.back()} />
        <Text variant="body-sm" className="mt-6 text-text-secondary">
          Position not found.
        </Text>
      </Screen>
    );
  }

  const active = closed ?? position!;

  const simulatedPnl = (() => {
    const px = active.status === 'closed' ? active.exitPrice ?? active.markPrice : active.markPrice;
    const diff =
      active.thesis.bias === 'long'
        ? (px - active.entryPrice) * active.quantity
        : (active.entryPrice - px) * active.quantity;
    return diff;
  })();

  const onClose = async () => {
    const exit = Number(exitPrice);
    if (!Number.isFinite(exit) || exit <= 0) {
      setError('Enter a valid exit / mark price.');
      return;
    }
    const result = closePosition(active.id, {
      exitPrice: exit,
      stopHonored,
      journaled: willJournal,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setClosedId(result.position.id);
    setError(null);
    await appendDecision.mutateAsync({
      symbol: result.position.thesis.symbol,
      regime: 'lab',
      action: 'lab_closed',
      setupScore: result.position.scores?.processScore,
      decisionQualityScore: result.position.scores?.processScore,
      researchValueScore: result.position.scores?.disciplineScore,
      bias: result.position.thesis.bias === 'long' ? 'bullish' : 'bearish',
      invalidation: result.position.thesis.invalidation,
      note: result.position.scores?.learningSummary,
      risk: stopHonored ? 'low' : 'high',
    });
  };

  return (
    <Screen scrollable>
      <Header
        title={`${active.thesis.symbol} Lab`}
        subtitle={active.status === 'open' ? 'Track & close with process' : 'Closed — review scores'}
        onBack={() => router.replace('/decision/lab' as never)}
      />

      <View className="mt-4 gap-4 pb-12">
        <GlassCard className="p-4">
          <Text variant="label" className="mb-1">
            {active.thesis.bias.toUpperCase()} · {active.thesis.scenarioId.replace(/_/g, ' ')}
          </Text>
          <Text variant="caption" className="text-text-secondary">
            Entry {active.entryPrice.toFixed(2)} · Stop {active.thesis.stopLoss} · Target{' '}
            {active.thesis.target} · R:R {active.thesis.riskReward}:1
          </Text>
          <Text variant="caption" className="mt-2 text-text-tertiary">
            Invalidation: {active.thesis.invalidation}
          </Text>
          <Text variant="caption" className="mt-1 text-text-tertiary">
            Catalyst: {active.thesis.catalyst}
          </Text>
          <Text
            variant="body-sm"
            className={cn('mt-3', simulatedPnl >= 0 ? 'text-bullish' : 'text-bearish')}
          >
            Simulated P&L {simulatedPnl >= 0 ? '+' : ''}
            {simulatedPnl.toFixed(2)} {active.accountCurrency} (secondary metric)
          </Text>
        </GlassCard>

        {active.status === 'open' ? (
          <GlassCard className="gap-3 p-4">
            <Text variant="h3">Close Lab trade</Text>
            <Input
              label="Exit / mark price"
              keyboardType="decimal-pad"
              value={exitPrice}
              onChangeText={(v) => {
                setExitPrice(v);
                const n = Number(v);
                if (Number.isFinite(n) && n > 0) updateMark(active.id, n);
              }}
            />
            <Pressable
              onPress={() => setStopHonored((v) => !v)}
              className={cn(
                'rounded-xl px-3 py-2.5',
                stopHonored ? 'bg-accent-muted' : 'bg-surface',
              )}
            >
              <Text variant="label">
                {stopHonored ? '✓' : '○'} Stop / plan honored
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setWillJournal((v) => !v)}
              className={cn(
                'rounded-xl px-3 py-2.5',
                willJournal ? 'bg-accent-muted' : 'bg-surface',
              )}
            >
              <Text variant="label">
                {willJournal ? '✓' : '○'} I will journal this close
              </Text>
            </Pressable>
            {error ? (
              <Text variant="caption" className="text-bearish">
                {error}
              </Text>
            ) : null}
            <Button onPress={() => void onClose()}>Close & score process</Button>
          </GlassCard>
        ) : null}

        {active.scores ? <LabScoresCard scores={active.scores} /> : null}

        {active.status === 'closed' ? (
          <View className="gap-2">
            <Button
              onPress={() => {
                router.push('/journal' as never);
              }}
            >
              Journal this Lab trade
            </Button>
            <Button
              variant="outline"
              onPress={() => router.push('/decision/decision-replay' as never)}
            >
              Review in Decision Replay AI
            </Button>
            <Button variant="ghost" onPress={() => router.replace('/decision/lab' as never)}>
              Back to Lab
            </Button>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
