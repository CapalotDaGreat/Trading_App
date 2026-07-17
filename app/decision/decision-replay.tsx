import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { PremiumOsGate } from '@/features/decision/components/PremiumOsGate';
import {
  LearningInsightsCard,
  WeeklyGameTapeCard,
} from '@/features/decision-replay/components/GameTapeCards';
import { DecisionReplayTimeline } from '@/features/decision-replay/components/DecisionReplayTimeline';
import { ReplayCoachCard } from '@/features/decision-replay/components/ReplayCoachCard';
import { ScoreEvolutionCard } from '@/features/decision-replay/components/ScoreEvolutionCard';
import {
  useDecisionReplaySession,
  useWeeklyGameTape,
} from '@/features/decision-replay/hooks/useDecisionReplay';
import { ensureDemoDecisionTape } from '@/features/decision-replay/services/demo-tape.service';
import type { ReplayRange } from '@/features/decision-replay/services/decision-replay.service';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

const RANGES: { id: ReplayRange; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

export default function DecisionReplayAiScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [range, setRange] = useState<ReplayRange>('today');
  const [frameIdx, setFrameIdx] = useState(0);

  const sessionQuery = useDecisionReplaySession(range);
  const tapeQuery = useWeeklyGameTape();

  const session = sessionQuery.data;
  const frames = session?.frames ?? [];
  const safeIdx = frames.length ? Math.min(frameIdx, frames.length - 1) : 0;
  const frame = frames[safeIdx];

  useEffect(() => {
    setFrameIdx(0);
  }, [range, session?.id]);

  useEffect(() => {
    void ensureDemoDecisionTape().then(() => {
      void sessionQuery.refetch();
      void tapeQuery.refetch();
    });
  }, []);

  const refreshing = sessionQuery.isRefetching || tapeQuery.isRefetching;

  return (
    <Screen
      scrollable
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void Promise.all([sessionQuery.refetch(), tapeQuery.refetch()]);
            }}
            tintColor={colors.accent.primary}
          />
        ),
      }}
    >
      <Header
        title="Decision Replay AI"
        subtitle="Review your process like game film"
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-4 pb-10">
        <View className="rounded-2xl bg-background-elevated p-4">
          <Text variant="body-sm" className="leading-relaxed text-text-secondary">
            This is not a P&L review. Replay your decisions — what you researched, skipped, and
            journaled — to improve process quality. Never overtrade to create footage.
          </Text>
          <Pressable
            className="mt-3 self-start"
            onPress={() => router.push('/decision/replay' as never)}
          >
            <Text variant="caption" className="font-semibold text-accent">
              Open chart bar replay →
            </Text>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {RANGES.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => setRange(r.id)}
              className={cn(
                'rounded-full px-3.5 py-1.5',
                range === r.id ? 'bg-accent-muted' : 'bg-surface',
              )}
            >
              <Text
                variant="caption"
                className={range === r.id ? 'font-semibold text-accent' : 'text-text-secondary'}
              >
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {sessionQuery.isLoading && !session ? (
          <Skeleton height={220} rounded="lg" />
        ) : session ? (
          <>
            <View>
              <Text variant="h3">{session.title}</Text>
              <Text variant="caption" className="mt-1 text-text-secondary">
                {session.subtitle}
              </Text>
              <Text variant="caption" className="mt-1 text-text-tertiary">
                {session.processSummary}
              </Text>
            </View>

            <DecisionReplayTimeline
              frames={frames}
              activeIndex={safeIdx}
              onSelect={setFrameIdx}
            />

            {frames.length > 0 ? (
              <View className="flex-row gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={safeIdx <= 0}
                  onPress={() => setFrameIdx((i) => Math.max(0, i - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={safeIdx >= frames.length - 1}
                  onPress={() => setFrameIdx((i) => Math.min(frames.length - 1, i + 1))}
                >
                  Next decision
                </Button>
              </View>
            ) : null}

            {frame ? <ReplayCoachCard frame={frame} /> : null}

            {session.scoreEvolution.length ? (
              <PremiumOsGate feature="convictionDrift">
                <ScoreEvolutionCard
                  points={session.scoreEvolution}
                  highlightIndex={safeIdx}
                />
              </PremiumOsGate>
            ) : null}

            {session.learningInsights.length ? (
              <PremiumOsGate feature="advancedReplay">
                <LearningInsightsCard insights={session.learningInsights} />
              </PremiumOsGate>
            ) : null}
          </>
        ) : null}

        {tapeQuery.data ? (
          <PremiumOsGate feature="weeklyReviews">
            <WeeklyGameTapeCard tape={tapeQuery.data} />
          </PremiumOsGate>
        ) : null}

        <Pressable
          onPress={() => router.push('/journal' as never)}
          className="flex-row items-center gap-2 rounded-2xl bg-surface px-4 py-3"
        >
          <Ionicons name="book-outline" size={18} color={colors.accent.primary} />
          <Text variant="body-sm" className="flex-1 text-text-primary">
            Journal a decision from this tape
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
        </Pressable>
      </View>
    </Screen>
  );
}
