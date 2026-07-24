import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { EducationalPanel } from '@/features/educational/components/EducationalPanel';
import { useDecisionSimulator } from '@/features/decision-simulator/hooks/useDecisionSimulator';
import { DEFAULT_BRIEF_SYMBOLS } from '@/features/markets/constants/freshness';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';

export function SimulatorHomeScreen() {
  const router = useRouter();
  const { startSession, isStarting, startError, history, passport } = useDecisionSimulator();
  const [symbol, setSymbol] = useState<string>(DEFAULT_BRIEF_SYMBOLS[0] ?? 'AAPL');

  const begin = async (value: string) => {
    const next = value.trim().toUpperCase();
    if (!next) return;
    await startSession({ symbol: next, interval: '1d' });
    router.push('/decision/simulator/session' as never);
  };

  return (
    <Screen scrollable contentClassName="pb-12">
      <Header
        title="Decision Simulator"
        subtitle="Train decisions under uncertainty — never graded on profits"
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-4">
        <EducationalModeBadge />
        <EducationalPanel
          variant="practice"
          body="Future candles stay hidden until you choose Research, Wait, Ignore, or Create Thesis. Scoring measures Decision Quality, Checklist, Risk, Discipline, and Reasoning — not P&L."
        />

        <GlassCard className="p-4" bordered>
          <Text variant="h3">Start a session</Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            You will receive the visible chart, indicators, news, regime, portfolio context, and a
            research-time budget.
          </Text>
          <View className="mt-4">
            <Input
              label="Symbol"
              value={symbol}
              onChangeText={setSymbol}
              autoCapitalize="characters"
              accessibilityLabel="Simulator symbol"
            />
          </View>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {DEFAULT_BRIEF_SYMBOLS.slice(0, 6).map((item) => (
              <Pressable
                key={item}
                onPress={() => setSymbol(item)}
                className="rounded-pill bg-surface px-3 py-2"
              >
                <Text variant="caption" className="text-text-secondary">
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
          <Button
            className="mt-4"
            loading={isStarting}
            disabled={isStarting}
            onPress={() => void begin(symbol)}
          >
            Begin simulation
          </Button>
          {startError ? (
            <Text variant="caption" className="mt-2 text-bearish">
              {startError instanceof Error ? startError.message : 'Could not start simulator'}
            </Text>
          ) : null}
        </GlassCard>

        <GlassCard className="p-4">
          <Text variant="caption" className="mb-1 font-semibold uppercase tracking-wide text-text-tertiary">
            Decision Passport snapshot
          </Text>
          <Text variant="h3">{passport.processSessions} process sessions</Text>
          <Text variant="body-sm" className="mt-1 text-text-secondary">
            Avg process score {passport.averageProcessScore} · credentials{' '}
            {passport.credentials.length}
          </Text>
          <Button
            className="mt-3"
            variant="secondary"
            onPress={() => router.push('/decision/passport' as never)}
          >
            Open Decision Passport
          </Button>
        </GlassCard>

        {history.length > 0 ? (
          <GlassCard className="p-4">
            <Text variant="caption" className="mb-2 font-semibold uppercase tracking-wide text-text-tertiary">
              Recent practice
            </Text>
            {history.slice(0, 5).map((item) => (
              <View key={item.id} className="mb-2 border-b border-border/40 pb-2">
                <Text variant="label" className="text-text-primary">
                  {item.symbol} · {item.action.replace('_', ' ')}
                </Text>
                <Text variant="caption" className="text-text-secondary">
                  Process {item.processScore} · {item.learningSummary}
                </Text>
              </View>
            ))}
          </GlassCard>
        ) : null}
      </View>
    </Screen>
  );
}
