import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { EducationalPanel } from '@/features/educational/components/EducationalPanel';
import { PremiumOsGate } from '@/features/decision/components/PremiumOsGate';
import { ChartReplaySegment } from '@/features/decision-replay/components/ChartReplaySegment';
import { DecisionReplayTimeline } from '@/features/decision-replay/components/DecisionReplayTimeline';
import {
  LearningInsightsCard,
  WeeklyGameTapeCard,
} from '@/features/decision-replay/components/GameTapeCards';
import { ReplayCoachCard } from '@/features/decision-replay/components/ReplayCoachCard';
import { ScoreEvolutionCard } from '@/features/decision-replay/components/ScoreEvolutionCard';
import {
  useDecisionReplaySession,
  useWeeklyGameTape,
} from '@/features/decision-replay/hooks/useDecisionReplay';
import type { ReplayRange } from '@/features/decision-replay/services/decision-replay.service';
import { ensureDemoDecisionTape } from '@/features/decision-replay/services/demo-tape.service';
import {
  normalizeReplayInterval,
  normalizeReviewSegment,
  REVIEW_SEGMENTS,
} from '@/features/navigation/config/review-navigation.config';
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

export default function ReviewHubScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ segment?: string; symbol?: string; interval?: string }>();
  const { colors } = useTheme();
  const segment = normalizeReviewSegment(params.segment);
  const [range, setRange] = useState<ReplayRange>('today');
  const [frameIdx, setFrameIdx] = useState(0);

  const sessionQuery = useDecisionReplaySession(range);
  const tapeQuery = useWeeklyGameTape();
  const refetchSession = sessionQuery.refetch;
  const refetchTape = tapeQuery.refetch;

  const session = sessionQuery.data;
  const frames = session?.frames ?? [];
  const safeIdx = frames.length ? Math.min(frameIdx, frames.length - 1) : 0;
  const frame = frames[safeIdx];

  useEffect(() => {
    setFrameIdx(0);
  }, [range, session?.id]);

  useEffect(() => {
    void ensureDemoDecisionTape().then(() => {
      void refetchSession();
      void refetchTape();
    });
  }, [refetchSession, refetchTape]);

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
        title="Review"
        subtitle="Reflect on process and practice chart reading"
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-4 pb-10">
        <EducationalModeBadge />
        <EducationalPanel
          variant="why"
          title="What did you learn?"
          body="End every review by naming a process lesson — patience, invalidation, sizing, or checklist discipline — not whether you made money."
        />

        <View className="rounded-2xl bg-background-elevated p-4">
          <Text variant="body-sm" className="leading-relaxed text-text-secondary">
            Review improves decision process; it does not predict price direction. Process Tape uses
            your recorded decisions. Chart Replay uses historical bars for practice.
          </Text>
        </View>

        <View className="flex-row rounded-2xl bg-surface p-1" testID="review-segments">
          {REVIEW_SEGMENTS.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: segment === item.id }}
              accessibilityLabel={item.accessibilityLabel}
              testID={item.testID}
              onPress={() =>
                router.replace({
                  pathname: '/decision/decision-replay',
                  params: { segment: item.id },
                } as never)
              }
              className={cn(
                'min-h-11 flex-1 items-center justify-center rounded-xl px-3',
                segment === item.id && 'bg-accent-muted',
              )}
            >
              <Text
                variant="label"
                className={segment === item.id ? 'text-accent' : 'text-text-secondary'}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {segment === 'chart' ? (
          <ChartReplaySegment
            initialSymbol={params.symbol}
            initialInterval={normalizeReplayInterval(params.interval)}
            onReflect={() => router.push('/journal' as never)}
          />
        ) : (
          <View className="gap-4" testID="review-process-tape">
            <View className="rounded-2xl bg-background-elevated p-4">
              <Text variant="h3">Process Tape</Text>
              <Text variant="body-sm" className="mt-1 text-text-secondary">
                History of what you researched, skipped, and reflected on. Never create activity
                just to fill the tape.
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {RANGES.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => setRange(r.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${r.label.toLowerCase()} Process Tape`}
                  testID={`process-tape-range-${r.id}`}
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
                    <ScoreEvolutionCard points={session.scoreEvolution} highlightIndex={safeIdx} />
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
              accessibilityRole="button"
              accessibilityLabel="Reflect on a decision from Process Tape"
              testID="process-tape-reflect"
              className="flex-row items-center gap-2 rounded-2xl bg-surface px-4 py-3"
            >
              <Ionicons name="book-outline" size={18} color={colors.accent.primary} />
              <Text variant="body-sm" className="flex-1 text-text-primary">
                Reflect on a decision from this tape
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </Pressable>
          </View>
        )}

        <View className="flex-row gap-2">
          <Button
            className="flex-1"
            variant="outline"
            accessibilityLabel="Ask about your decision process"
            testID="review-ask"
            onPress={() => router.push('/ai' as never)}
          >
            Ask
          </Button>
          <Button
            className="flex-1"
            variant="outline"
            accessibilityLabel="Learn decision skills"
            testID="review-learn"
            onPress={() => router.push('/academy' as never)}
          >
            Learn
          </Button>
        </View>
      </View>
    </Screen>
  );
}
