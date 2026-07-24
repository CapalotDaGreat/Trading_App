import { useRouter } from 'expo-router';
import { RefreshControl, View } from 'react-native';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { EducationalPanel } from '@/features/educational/components/EducationalPanel';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

import { HeatmapDayDetail } from '../components/HeatmapDayDetail';
import { HeatmapGrid, HeatmapLegend } from '../components/HeatmapGrid';
import { HeatmapScoreCards } from '../components/HeatmapScoreCards';
import { useDecisionHeatmap } from '../hooks/useDecisionHeatmap';
import type { HeatmapPeriod } from '../types/heatmap.types';

const PERIOD_OPTIONS: { value: HeatmapPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function DecisionHeatmapScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    period,
    setPeriod,
    snapshot,
    isLoading,
    isRefetching,
    refetch,
    selectedCell,
    setSelectedKey,
    passport,
    weeklyReview,
    memoryNote,
  } = useDecisionHeatmap('weekly');

  return (
    <Screen
      scrollable
      contentClassName="pb-12"
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.accent.primary}
          />
        ),
      }}
    >
      <Header
        title="Decision Heatmap"
        subtitle="Process consistency — never profits"
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-4">
        <EducationalModeBadge />
        <EducationalPanel
          variant="why"
          body="Colors show No activity, Learning, Good process, and Excellent process. Built from your Decision Log, Academy, Replay, Journal, and Simulator — not P&L."
        />

        <SegmentedControl
          options={PERIOD_OPTIONS}
          value={period}
          onChange={(next) => {
            setPeriod(next);
            setSelectedKey(null);
          }}
        />

        {isLoading && !snapshot ? (
          <View className="gap-3">
            <Skeleton height={120} rounded="lg" />
            <Skeleton height={90} rounded="lg" />
          </View>
        ) : null}

        {snapshot ? (
          <>
            <GlassCard className="p-4" bordered>
              <Text
                variant="caption"
                className="mb-3 font-semibold uppercase tracking-wide text-text-tertiary"
              >
                Process map · {period}
              </Text>
              <HeatmapGrid
                cells={snapshot.cells}
                selectedKey={selectedCell?.key ?? null}
                onSelect={setSelectedKey}
              />
              <HeatmapLegend />
              <Text variant="caption" className="mt-3 text-text-secondary">
                {snapshot.insight}
              </Text>
            </GlassCard>

            <HeatmapScoreCards scores={snapshot.scores} />

            {selectedCell ? <HeatmapDayDetail cell={selectedCell} /> : null}

            <GlassCard className="p-4">
              <Text
                variant="caption"
                className="font-semibold uppercase tracking-wide text-text-tertiary"
              >
                Tracked loops
              </Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                Journal {snapshot.totals.journalCompletions} · Replay{' '}
                {snapshot.totals.replayCompletions} · Checklist {snapshot.totals.checklistUses} ·
                Research {snapshot.totals.researchSessions} · Learning{' '}
                {snapshot.totals.learningSessions} · Academy {snapshot.totals.academyEvents}
              </Text>
            </GlassCard>

            {weeklyReview ? (
              <GlassCard className="p-4" bordered>
                <Text
                  variant="caption"
                  className="font-semibold uppercase tracking-wide text-text-tertiary"
                >
                  Weekly Review snapshot
                </Text>
                <Text variant="body" className="mt-2 text-text-primary">
                  {weeklyReview.bestDecision}
                </Text>
                <Text variant="body-sm" className="mt-2 text-text-secondary">
                  Focus: {weeklyReview.recommendedFocus ?? weeklyReview.aiLesson}
                </Text>
                <Text variant="caption" className="mt-2 text-text-tertiary">
                  Decision quality trend {weeklyReview.decisionQualityTrend} ·{' '}
                  {weeklyReview.journalConsistency}
                </Text>
              </GlassCard>
            ) : null}

            <GlassCard className="p-4">
              <Text
                variant="caption"
                className="font-semibold uppercase tracking-wide text-text-tertiary"
              >
                Decision Passport
              </Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                {passport.processSessions} process sessions · avg score{' '}
                {passport.averageProcessScore}
              </Text>
            </GlassCard>

            {memoryNote ? (
              <EducationalPanel
                variant="tip"
                title="Trader Memory cue"
                body={String(memoryNote)}
              />
            ) : null}

            <View className="gap-2">
              <Button onPress={() => router.push('/decision/mentor' as never)}>
                Ask Trading Mentor
              </Button>
              <Button
                variant="secondary"
                onPress={() => router.push('/decision/decision-replay' as never)}
              >
                Open Decision Replay
              </Button>
              <Button
                variant="secondary"
                onPress={() => router.push('/decision/passport' as never)}
              >
                View Decision Passport
              </Button>
              <Button variant="secondary" onPress={() => router.push('/decision/coach' as never)}>
                Weekly Review / Coach
              </Button>
              <Button variant="ghost" onPress={() => router.push('/decision/memory' as never)}>
                Trader Memory
              </Button>
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}
