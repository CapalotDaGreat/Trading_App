import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  DecisionDebtCard,
  DecisionFatigueCard,
} from '@/features/decision/components/DecisionOsCards';
import {
  DisciplineStreakCard,
  WeeklyReviewCard,
  WhyNotCard,
} from '@/features/decision/components/CoachRetentionCards';
import { DecisionBriefHeader } from '@/features/decision/components/DecisionBriefHeader';
import { DecisionLogCard } from '@/features/decision-log/components/DecisionLogCard';
import { DecisionTimelineCard } from '@/features/decision-log/components/DecisionTimelineCard';
import { useDecisionLog } from '@/features/decision-log/hooks/useDecisionLog';
import { buildDecisionTimeline } from '@/features/decision-log/services/decision-log.service';
import { DecisionQualityExplainer } from '@/features/decision/components/DecisionQualityExplainer';
import { PremiumOsGate } from '@/features/decision/components/PremiumOsGate';
import { RegimeCard } from '@/features/decision/components/RegimeCard';
import { ResearchQueueCard } from '@/features/decision/components/ResearchQueueCard';
import { SetupCard } from '@/features/decision/components/SetupCard';
import { TradingDayPlanCard } from '@/features/decision/components/TradingDayPlanCard';
import {
  useDecisionBrief,
  useRegime,
} from '@/features/decision/hooks/useDecision';
import {
  buildWeeklyReview,
  loadDisciplineStreak,
  markDisciplineAction,
} from '@/features/decision/services/coaching-loop.service';
import type { DisciplineStreak } from '@/features/decision/types/decision.types';
import { ensureDemoSeedData } from '@/features/onboarding/services/demo-seed.service';
import { ensureDemoDecisionTape } from '@/features/decision-replay/services/demo-tape.service';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { Screen } from '@/shared/components/layout/Screen';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useTheme } from '@/shared/hooks/useTheme';

const COACH_DISMISS_KEY = 'tradevision-today-coach-dismissed';

const EMPTY_BRIEF = {
  greeting: 'Loading',
  generatedAt: Date.now(),
  regime: 'ranging' as const,
  regimeLabel: '…',
  highImpactEvents: [],
  setupCount: 0,
  topSetups: [],
  watchFocus: [],
  headline: '',
  summary: '',
  suggestResearch: [],
  explainability: {
    confidence: 0,
    factors: [],
    agrees: 0,
    disagrees: 0,
    dataAsOf: Date.now(),
    freshness: 'unknown' as const,
    reasoning: '',
  },
  quotesFetchedAt: Date.now(),
};

export default function DecisionBriefScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [coachVisible, setCoachVisible] = useState(true);
  const [streak, setStreak] = useState<DisciplineStreak | null>(null);
  const briefQuery = useDecisionBrief(20);
  const regimeQuery = useRegime();
  const { summary: logSummary, records: logRecords } = useDecisionLog();
  const appendDecision = useAppendDecisionRecord();
  const timeline = logRecords?.length ? buildDecisionTimeline(logRecords).slice(-8) : [];

  useEffect(() => {
    void ensureDemoSeedData();
    void ensureDemoDecisionTape();
    void AsyncStorage.getItem(COACH_DISMISS_KEY).then((v) => {
      if (v === '1') setCoachVisible(false);
    });
    void loadDisciplineStreak().then(setStreak);
  }, []);

  useEffect(() => {
    if (!briefQuery.data) return;
    const brief = briefQuery.data;
    void markDisciplineAction('morningBrief').then(setStreak);
    const day = new Date().toISOString().slice(0, 10);
    void AsyncStorage.getItem('tradevision-brief-logged-day').then((v) => {
      if (v === day) return;
      void appendDecision.mutateAsync({
        symbol: '',
        regime: brief.regime,
        action: 'brief_opened',
        note: 'Opened Today’s Brief',
      });
      void AsyncStorage.setItem('tradevision-brief-logged-day', day);
    });
  }, [briefQuery.data?.generatedAt]);

  const refreshing = briefQuery.isRefetching || regimeQuery.isRefetching;
  const startHere = briefQuery.data?.startHereSymbol;
  const weeklyReview = logSummary ? buildWeeklyReview(logSummary) : null;

  return (
    <Screen
      scrollable
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void Promise.all([briefQuery.refetch(), regimeQuery.refetch()]);
            }}
            tintColor={colors.accent.primary}
          />
        ),
      }}
    >
      <View className="pb-8 pt-4">
        <View className="mb-5 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text variant="h1" className="text-2xl">
              Today
            </Text>
            <Text variant="caption" className="mt-1 text-text-secondary">
              Your personal trading decision coach
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/ai' as never)}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface"
            accessibilityLabel="Ask AI"
          >
            <Ionicons name="sparkles" size={20} color={colors.accent.primary} />
          </Pressable>
        </View>

        <View className="gap-4">
          {coachVisible ? (
            <GlassCard className="p-4">
              <Text variant="label" className="text-text-primary">
                How to use Today
              </Text>
              <Text variant="body-sm" className="mt-1 text-text-secondary">
                1) Read your brief · 2) Follow the research queue · 3) Journal what you did or skipped
              </Text>
              <Pressable
                onPress={() => {
                  setCoachVisible(false);
                  void AsyncStorage.setItem(COACH_DISMISS_KEY, '1');
                }}
                className="mt-2"
              >
                <Text variant="caption" className="text-accent">
                  Got it
                </Text>
              </Pressable>
            </GlassCard>
          ) : null}

          {streak ? <DisciplineStreakCard streak={streak} /> : null}

          {briefQuery.isLoading && !briefQuery.data ? (
            <DecisionBriefHeader brief={EMPTY_BRIEF} isLoading />
          ) : briefQuery.data ? (
            <DecisionBriefHeader
              brief={briefQuery.data}
              onOpenRadar={() => {
                void markDisciplineAction('researchPlan').then(setStreak);
                router.push('/decision/radar' as never);
              }}
            />
          ) : (
            <GlassCard className="p-4">
              <Text variant="h3">Couldn’t load today’s brief</Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                Pull to refresh. Stock quotes need Finnhub or Alpha Vantage keys in Settings / .env.
              </Text>
            </GlassCard>
          )}

          {briefQuery.data?.psychologyReminder ? (
            <View className="rounded-2xl bg-accent-muted/40 p-4">
              <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
                PSYCHOLOGY
              </Text>
              <Text variant="body-sm" className="text-text-primary">
                {briefQuery.data.psychologyReminder}
              </Text>
              {briefQuery.data.recommendedFocus ? (
                <Text variant="caption" className="mt-2 text-accent">
                  Focus: {briefQuery.data.recommendedFocus}
                </Text>
              ) : null}
              {briefQuery.data.timeBudgetMinutes ? (
                <Text variant="caption" className="mt-1 text-text-tertiary">
                  Research budget: {briefQuery.data.timeBudgetMinutes} min · Process score{' '}
                  {briefQuery.data.decisionQualityTrend ?? '—'}
                </Text>
              ) : null}
            </View>
          ) : null}

          {briefQuery.data?.fatigue ? (
            <DecisionFatigueCard fatigue={briefQuery.data.fatigue} />
          ) : null}

          {briefQuery.data?.decisionDebt ? (
            <DecisionDebtCard debt={briefQuery.data.decisionDebt} />
          ) : null}

          {briefQuery.data?.tradingDayPlan ? (
            <TradingDayPlanCard plan={briefQuery.data.tradingDayPlan} />
          ) : null}

          {briefQuery.data?.researchQueue?.length ? (
            <ResearchQueueCard queue={briefQuery.data.researchQueue} />
          ) : null}

          {briefQuery.data?.skipSuggestions?.length ? (
            <WhyNotCard items={briefQuery.data.skipSuggestions} />
          ) : null}

          {logSummary ? <DecisionLogCard summary={logSummary} /> : null}

          {timeline.length ? (
            <PremiumOsGate feature="decisionTimeline">
              <DecisionTimelineCard events={timeline} title="Decision timeline" />
            </PremiumOsGate>
          ) : null}

          {weeklyReview ? (
            <PremiumOsGate feature="weeklyReviews">
              <WeeklyReviewCard review={weeklyReview} />
            </PremiumOsGate>
          ) : null}

          {regimeQuery.data ? <RegimeCard regime={regimeQuery.data} /> : null}

          <View>
            <Text variant="h3" className="mb-1">
              Top setups
            </Text>
            <Text variant="caption" className="mb-3 text-text-secondary">
              Research Value (RVS) ranks attention · Decision Quality (DQS) grades process — never
              price odds
            </Text>

            {briefQuery.isLoading && !briefQuery.data?.topSetups?.length ? (
              <View className="gap-3">
                <Skeleton height={100} rounded="lg" />
                <Skeleton height={100} rounded="lg" />
              </View>
            ) : (
              <View>
                {briefQuery.data?.topSetups?.length ? <DecisionQualityExplainer /> : null}
                {(briefQuery.data?.topSetups ?? []).map((setup) => (
                  <SetupCard
                    key={setup.id}
                    setup={setup}
                    highlight={setup.symbol === startHere}
                    onPress={() => {
                      void markDisciplineAction('researchPlan').then(setStreak);
                      router.push(`/asset/${encodeURIComponent(setup.symbol)}` as never);
                    }}
                  />
                ))}
                {!briefQuery.data?.topSetups?.length && !briefQuery.isLoading ? (
                  <GlassCard className="p-4">
                    <Text variant="body-sm" className="text-text-secondary">
                      Nothing clear enough yet. Waiting is a valid decision — don’t force a trade.
                    </Text>
                  </GlassCard>
                ) : null}
              </View>
            )}
          </View>

          <Pressable
            onPress={() => router.push('/decision/lab' as never)}
            className="flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3.5"
          >
            <View className="flex-1 pr-3">
              <Text variant="label" className="text-text-primary">
                Decision Lab
              </Text>
              <Text variant="caption" className="mt-0.5 text-text-secondary">
                Thesis-first paper practice — process, not P&L
              </Text>
            </View>
            <Ionicons name="flask-outline" size={18} color={colors.accent.primary} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/decision/decision-replay' as never)}
            className="flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3.5"
          >
            <View className="flex-1 pr-3">
              <Text variant="label" className="text-text-primary">
                Decision Replay AI
              </Text>
              <Text variant="caption" className="mt-0.5 text-text-secondary">
                Replay today’s process like game film
              </Text>
            </View>
            <Ionicons name="film-outline" size={18} color={colors.accent.primary} />
          </Pressable>

          <Pressable
            onPress={() => {
              void markDisciplineAction('journal').then(setStreak);
              router.push('/journal' as never);
            }}
            className="flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3.5"
          >
            <View className="flex-1 pr-3">
              <Text variant="label" className="text-text-primary">
                Journal today’s decisions
              </Text>
              <Text variant="caption" className="mt-0.5 text-text-secondary">
                Close the loop — acted or skipped both count
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/more' as never)}
            className="flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3.5"
          >
            <View className="flex-1 pr-3">
              <Text variant="label" className="text-text-primary">
                More tools
              </Text>
              <Text variant="caption" className="mt-0.5 text-text-secondary">
                Risk, coach, replay, calendar…
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
