import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { usePracticeProgressStore } from '@/features/practice/stores/practice-progress.store';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import type { IntradayDrillKind } from '../services/intraday-drills.service';
import {
  recommendIntradayNext,
  type IntradayPerformanceSignals,
} from '../services/recommendations.service';
import { useIntradaySessionStore } from '../stores/intraday-session.store';

const ENTRIES = [
  {
    href: '/intraday/replay',
    title: 'Intraday Replay',
    body: 'Step a fictional session candle by candle on 1m–15m views. Commit decisions before the future prints.',
  },
  {
    href: '/intraday/day',
    title: 'Trading Day Simulator',
    body: 'A complete simulated day: written plan, orders with honest fills, a daily loss circuit breaker, and a process review. Flat counts.',
  },
  {
    href: '/intraday/scalp',
    title: 'Scalping Practice',
    body: 'Short spread-aware sessions where an 8¢ idea can pay 7¢ of friction. First session free; unlimited with Aithera Pro.',
  },
  {
    href: '/intraday/drills',
    title: 'Advanced drills',
    body: 'Generated advanced/expert scenarios — sizing, costs, VWAP context, timeframe conflicts, and the discipline to not trade.',
  },
] as const;

export function IntradayHubScreen() {
  const router = useRouter();
  const records = useIntradaySessionStore((s) => s.records);
  const attempts = usePracticeProgressStore((s) => s.attempts);

  const recommendations = useMemo(() => {
    const missedKinds = attempts
      .filter((a) => !a.correct && a.drillId.startsWith('intraday-gen-'))
      .map((a) => a.drillId.split('-')[2] as IntradayDrillKind)
      .filter(Boolean);
    const signals: IntradayPerformanceSignals = {
      missedDrillKinds: missedKinds,
      breakerSessions: records.filter((r) => r.breakerHit).length,
      flatSessions: records.filter((r) => r.flat).length,
      costHeavySessions: 0,
      completedSessions: records.length,
    };
    return recommendIntradayNext(signals);
  }, [attempts, records]);

  return (
    <Screen scrollable contentClassName="pb-10">
      <Header
        title="Day Trading & Scalping"
        subtitle="Intraday chart reading, execution mechanics, risk control, and timed decision practice — simulated, process-graded, never a signal."
        onBack={() => router.back()}
      />

      <Surface className="mt-3">
        <Text variant="h3">Start with the Academy path</Text>
        <Text variant="body-sm" className="mt-1 text-text-secondary">
          Eleven lessons from intraday foundations to strategy evaluation, each linked into the
          simulators below. Simulated results never certify live trading.
        </Text>
        <Button
          className="mt-3"
          onPress={() => router.push('/academy/path/path-day-trading' as never)}
        >
          Open Day Trading & Scalping path
        </Button>
        <View className="mt-2 flex-row flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onPress={() => router.push('/academy/checklist/pre-session-intraday' as never)}
          >
            Pre-session checklist
          </Button>
          <Button
            size="sm"
            variant="outline"
            onPress={() => router.push('/academy/checklist/post-session-intraday' as never)}
          >
            Post-session checklist
          </Button>
        </View>
      </Surface>

      {ENTRIES.map((entry) => (
        <Surface key={entry.href} className="mt-3">
          <Text variant="h3">{entry.title}</Text>
          <Text variant="body-sm" className="mt-1 text-text-secondary">
            {entry.body}
          </Text>
          <Button size="sm" className="mt-3" onPress={() => router.push(entry.href as never)}>
            Open {entry.title}
          </Button>
        </Surface>
      ))}

      {recommendations.length ? (
        <Surface className="mt-4">
          <Text variant="label" className="text-text-tertiary">
            RECOMMENDED NEXT
          </Text>
          {recommendations.map((rec) => (
            <View key={rec.id} className="mt-2">
              <Text variant="body-sm">{rec.reason}</Text>
              <Button size="sm" variant="ghost" onPress={() => router.push(rec.href as never)}>
                {rec.label}
              </Button>
            </View>
          ))}
        </Surface>
      ) : null}

      <Surface className="mt-4" testID="intraday-history">
        <Text variant="label" className="text-text-tertiary">
          YOUR SIMULATED SESSIONS (ON THIS DEVICE)
        </Text>
        {records.length === 0 ? (
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            No completed sessions yet. A deliberate flat session is a complete first entry.
          </Text>
        ) : (
          records.slice(0, 8).map((record) => (
            <Text
              key={record.id + record.at}
              variant="caption"
              className="mt-2 text-text-secondary"
            >
              {new Date(record.at).toLocaleDateString()} · {record.mode} · process{' '}
              {record.processScore}/100 ·{' '}
              {record.flat ? 'flat by plan' : `${record.tradesPlaced} trades`} · net{' '}
              {record.netPnl.toFixed(2)} (context only)
              {record.breakerHit ? ' · daily limit reached and respected' : ''}
            </Text>
          ))
        )}
      </Surface>
    </Screen>
  );
}
