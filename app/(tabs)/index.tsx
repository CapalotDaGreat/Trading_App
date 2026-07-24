import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { WhyNotCard } from '@/features/decision/components/CoachRetentionCards';
import { DecisionBriefHeader } from '@/features/decision/components/DecisionBriefHeader';
import { MentorCard } from '@/features/decision/components/MentorCard';
import { RegimeCard } from '@/features/decision/components/RegimeCard';
import { ResearchQueueCard } from '@/features/decision/components/ResearchQueueCard';
import { StartHereCard } from '@/features/decision/components/StartHereCard';
import { useDecisionBrief } from '@/features/decision/hooks/useDecision';
import { useTradingMentor } from '@/features/decision/hooks/useTradingMentor';
import {
  loadDisciplineStreak,
  markDisciplineAction,
  toggleQueueSymbol,
} from '@/features/decision/services/coaching-loop.service';
import {
  reviewAccessLabel,
  selectTodayTimeBudget,
} from '@/features/decision/services/today-sections.service';
import type { DecisionBrief, DisciplineStreak } from '@/features/decision/types/decision.types';
import { DecisionLogCard } from '@/features/decision-log/components/DecisionLogCard';
import {
  useAppendDecisionRecord,
  useDecisionLog,
} from '@/features/decision-log/hooks/useDecisionLog';
import { ensureDemoDecisionTape } from '@/features/decision-replay/services/demo-tape.service';
import { ensureDemoSeedData } from '@/features/onboarding/services/demo-seed.service';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { useTheme } from '@/shared/hooks/useTheme';
import { useSettingsStore } from '@/shared/stores/settings.store';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';
import { cn } from '@/shared/utils/cn';

const EMPTY_BRIEF: DecisionBrief = {
  greeting: 'Loading',
  generatedAt: Date.now(),
  regime: 'ranging',
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
    freshness: 'unknown',
    reasoning: '',
  },
  quotesFetchedAt: Date.now(),
};

function TodayHeader({
  streak,
  onAskAi,
}: {
  streak: DisciplineStreak | null;
  onAskAi: () => void;
}) {
  const { colors } = useTheme();
  const completed = streak ? Object.values(streak.completedToday).filter(Boolean).length : 0;

  return (
    <View testID="today-section-header">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text variant="h1">Today</Text>
          <Text variant="caption" className="mt-1 text-text-secondary">
            {streak
              ? `${streak.days}d discipline streak · ${completed}/3 loop steps`
              : 'Your decision loop'}
          </Text>
        </View>
        <Pressable
          onPress={onAskAi}
          className="h-11 w-11 items-center justify-center rounded-full bg-surface"
          accessibilityRole="button"
          accessibilityLabel="Ask AI"
          testID="today-ask-ai"
        >
          <Ionicons name="sparkles" size={20} color={colors.accent.primary} />
        </Pressable>
      </View>
      <EducationalModeBadge className="mt-3" />
    </View>
  );
}

function CloseLoopCard({
  tier,
  onJournal,
  onReview,
}: {
  tier: 'free' | 'premium';
  onJournal: () => void;
  onReview: () => void;
}) {
  const { colors } = useTheme();
  return (
    <GlassCard className="p-4" testID="today-section-close-loop">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        CLOSE THE LOOP
      </Text>
      <Text variant="h3" className="mb-1">
        Journal or review
      </Text>
      <Text variant="caption" className="mb-3 text-text-secondary">
        Record what you researched or skipped. Weekly patterns belong in Review.
      </Text>
      <View className="flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Journal today's decisions"
          testID="today-close-loop-journal"
          onPress={onJournal}
          className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-accent px-3"
        >
          <Ionicons name="book-outline" size={17} color={colors.text.inverse} />
          <Text variant="label" className="text-text-inverse">
            Journal
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={reviewAccessLabel(tier)}
          testID="today-close-loop-review"
          onPress={onReview}
          className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-accent-muted px-3"
        >
          <Ionicons name="film-outline" size={17} color={colors.accent.primary} />
          <Text variant="label" className="text-accent">
            Review
          </Text>
        </Pressable>
      </View>
    </GlassCard>
  );
}

export default function DecisionBriefScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const layout = useResponsiveLayout();
  const [streak, setStreak] = useState<DisciplineStreak | null>(null);
  const timeBudgetMinutes = useSettingsStore(selectTodayTimeBudget);
  const tier = useSubscriptionStore((state) => state.tier);
  const briefQuery = useDecisionBrief(timeBudgetMinutes);
  const mentorQuery = useTradingMentor();
  const { summary: logSummary } = useDecisionLog();
  const { mutateAsync: appendDecision } = useAppendDecisionRecord();

  useEffect(() => {
    void ensureDemoSeedData();
    void ensureDemoDecisionTape();
    void loadDisciplineStreak().then(setStreak);
  }, []);

  useEffect(() => {
    if (!briefQuery.data) return;
    const brief = briefQuery.data;
    void markDisciplineAction('morningBrief').then(setStreak);
    useAcademyProgressStore.getState().markDisciplineAction('brief');
    const day = new Date().toISOString().slice(0, 10);
    void AsyncStorage.getItem('tradevision-brief-logged-day').then((value) => {
      if (value === day) return;
      void appendDecision({
        symbol: '',
        regime: brief.regime,
        action: 'brief_opened',
        note: 'Opened Today’s Brief',
      });
      void AsyncStorage.setItem('tradevision-brief-logged-day', day);
    });
  }, [appendDecision, briefQuery.data]);

  const brief = briefQuery.data;
  const startHereSymbol = brief?.startHereSymbol;
  const startHereSetup = brief?.topSetups.find(
    (setup) => setup.symbol.toUpperCase() === startHereSymbol?.toUpperCase(),
  );
  const startHereQueueItem = brief?.researchQueue?.find(
    (item) => item.symbol.toUpperCase() === startHereSymbol?.toUpperCase(),
  );
  const refreshing = briefQuery.isRefetching;

  return (
    <Screen
      scrollable
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void briefQuery.refetch()}
            tintColor={colors.accent.primary}
          />
        ),
      }}
    >
      <View className="gap-4 pb-8 pt-4">
        <TodayHeader streak={streak} onAskAi={() => router.push('/ai' as never)} />

        <View className={cn(layout.columns === 2 && 'flex-row gap-4')}>
          <View className={cn('gap-4', layout.columns === 2 && 'flex-1')}>
            <View testID="today-section-morning-brief">
              {briefQuery.isLoading && !brief ? (
                <DecisionBriefHeader brief={EMPTY_BRIEF} isLoading />
              ) : brief ? (
                <DecisionBriefHeader brief={brief} />
              ) : (
                <GlassCard className="p-4">
                  <Text variant="h3">Couldn’t load today’s brief</Text>
                  <Text variant="body-sm" className="mt-2 text-text-secondary">
                    No score or setup has been invented. Check your market-data connection and try
                    again.
                  </Text>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 self-start"
                    onPress={() => void briefQuery.refetch()}
                  >
                    Retry brief
                  </Button>
                </GlassCard>
              )}
            </View>

            <View testID="today-section-mentor">
              <MentorCard brief={mentorQuery.data} isLoading={mentorQuery.isLoading} />
            </View>

            {brief && startHereSymbol ? (
              <StartHereCard
                symbol={startHereSymbol}
                setup={startHereSetup}
                queueItem={startHereQueueItem}
                regime={brief.regimeLabel}
                onOutcome={(action) => {
                  void markDisciplineAction('researchPlan').then(setStreak);
                  if (action === 'skipped') void toggleQueueSymbol(startHereSymbol);
                }}
              />
            ) : null}

            <View testID="today-section-research-queue">
              {brief?.researchQueue?.length ? (
                <>
                  <ResearchQueueCard
                    queue={brief.researchQueue}
                    regime={brief.regimeLabel}
                    freeItemLimit={3}
                    onOutcome={() => void markDisciplineAction('researchPlan').then(setStreak)}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="See all setups in Radar"
                    testID="today-see-all-setups"
                    onPress={() => router.push('/decision/radar' as never)}
                    className="mt-2 min-h-11 items-center justify-center rounded-xl bg-surface px-4"
                  >
                    <Text variant="label" className="text-accent">
                      See all setups in Radar
                    </Text>
                  </Pressable>
                </>
              ) : briefQuery.isLoading ? (
                <Skeleton height={110} rounded="lg" />
              ) : null}
            </View>
          </View>

          <View className={cn('gap-4', layout.columns === 2 && 'flex-1')}>
            {brief?.skipSuggestions?.length ? (
              <View testID="today-section-why-not">
                <WhyNotCard items={brief.skipSuggestions} regime={brief.regimeLabel} />
              </View>
            ) : null}

            {logSummary ? (
              <View testID="today-section-decision-log">
                <DecisionLogCard summary={logSummary} />
              </View>
            ) : null}

            {brief?.regimeSnapshot ? (
              <View testID="today-section-regime">
                <RegimeCard regime={brief.regimeSnapshot} />
              </View>
            ) : null}

            <CloseLoopCard
              tier={tier}
              onJournal={() => {
                void markDisciplineAction('journal').then(setStreak);
                useAcademyProgressStore.getState().markDisciplineAction('journal');
                router.push('/journal' as never);
              }}
              onReview={() => router.push('/decision/decision-replay' as never)}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}
