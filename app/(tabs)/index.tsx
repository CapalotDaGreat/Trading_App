import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { WhyNotCard } from '@/features/decision/components/CoachRetentionCards';
import { DecisionBriefHeader } from '@/features/decision/components/DecisionBriefHeader';
import { MentorCard } from '@/features/decision/components/MentorCard';
import { RegimeCard } from '@/features/decision/components/RegimeCard';
import { ResearchQueueCard } from '@/features/decision/components/ResearchQueueCard';
import { StartHereCard } from '@/features/decision/components/StartHereCard';
import { TradingDayPlanCard } from '@/features/decision/components/TradingDayPlanCard';
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
  visibleTodaySections,
  type TodaySection,
} from '@/features/decision/services/today-sections.service';
import type { DecisionBrief, DisciplineStreak } from '@/features/decision/types/decision.types';
import { DecisionLogCard } from '@/features/decision-log/components/DecisionLogCard';
import {
  useAppendDecisionRecord,
  useDecisionLog,
} from '@/features/decision-log/hooks/useDecisionLog';
import { ensureDemoDecisionTape } from '@/features/decision-replay/services/demo-tape.service';
import { MentorSetupInviteCard } from '@/features/onboarding/components/MentorSetupInviteCard';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import { ensureDemoSeedData } from '@/features/onboarding/services/demo-seed.service';
import { AdaptiveGoalsCard } from '@/features/personal-intelligence/components/AdaptiveGoalsCard';
import { DynamicTodayHero } from '@/features/personal-intelligence/components/DynamicTodayHero';
import { TradingDnaCard } from '@/features/personal-intelligence/components/TradingDnaCard';
import { usePersonalIntelligence } from '@/features/personal-intelligence/hooks/usePersonalIntelligence';
import { DataFreshnessBadge } from '@/features/decision/components/DataFreshnessBadge';
import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import { RecoverableErrorState } from '@/shared/components/feedback/RecoverableErrorState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Surface } from '@/shared/components/ui/Surface';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { useSettingsStore } from '@/shared/stores/settings.store';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

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
    <Surface testID="today-section-close-loop">
      <Text variant="caption" className="mb-1.5 font-medium text-text-tertiary">
        Close the loop
      </Text>
      <Text variant="h3" headingLevel={3} className="mb-1.5 tracking-tight">
        Journal or review
      </Text>
      <Text variant="caption" className="mb-5 leading-5 text-text-secondary">
        Record what you researched or skipped. Patterns belong in Review.
      </Text>
      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Journal today's decisions"
          testID="today-close-loop-journal"
          onPress={onJournal}
          className="min-h-13 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-accent px-3"
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
          className="min-h-13 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-accent-muted px-3"
        >
          <Ionicons name="film-outline" size={17} color={colors.accent.primary} />
          <Text variant="label" className="text-accent">
            Review
          </Text>
        </Pressable>
      </View>
    </Surface>
  );
}

export default function DecisionBriefScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [streak, setStreak] = useState<DisciplineStreak | null>(null);
  const timeBudgetMinutes = useSettingsStore(selectTodayTimeBudget);
  const tier = useSubscriptionStore((state) => state.tier);
  const { showMentorSetupInvite, dismissMentorInvite } = useCoachProfile();
  const briefQuery = useDecisionBrief(timeBudgetMinutes);
  const mentorQuery = useTradingMentor();
  const intelligenceQuery = usePersonalIntelligence('weekly');
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
  const intel = intelligenceQuery.data;
  const startHereSymbol = brief?.startHereSymbol;
  const startHereSetup = brief?.topSetups.find(
    (setup) => setup.symbol.toUpperCase() === startHereSymbol?.toUpperCase(),
  );
  const startHereQueueItem = brief?.researchQueue?.find(
    (item) => item.symbol.toUpperCase() === startHereSymbol?.toUpperCase(),
  );
  const refreshing = briefQuery.isRefetching || intelligenceQuery.isRefetching;

  const priorities = useMemo(() => {
    const fromQueue = (brief?.researchQueue ?? []).slice(0, 3);
    if (fromQueue.length > 0) return fromQueue;
    return (brief?.topSetups ?? []).slice(0, 3).map((setup) => ({
      symbol: setup.symbol,
      setupTitle: setup.setupTypeLabel,
      estimatedMinutes: 10,
      researchValueScore: setup.researchValueScore,
      decisionQualityScore: setup.decisionQualityScore ?? setup.confidence,
      rankReason: setup.why[0],
      priority: 'high' as const,
      bias: setup.bias,
      invalidation: setup.invalidation,
      completed: false,
    }));
  }, [brief]);

  const upcomingEvent = brief?.highImpactEvents[0];
  const processInsight =
    mentorQuery.data?.daily.improveNext ??
    intel?.dna.becomingLabel ??
    'Open Mentor or log a few decisions to surface one process insight.';

  const sections = useMemo(() => {
    return visibleTodaySections({
      hasBrief: Boolean(brief),
      hasMentor: Boolean(mentorQuery.data),
      hasStartHere: Boolean(startHereSymbol),
      hasResearchQueue: Boolean(brief?.researchQueue?.length),
      hasWhyNot: Boolean(brief?.skipSuggestions?.length),
      hasDecisionLog: Boolean(logSummary),
      hasRegime: Boolean(brief?.regimeSnapshot),
      hasGoals: Boolean(intel?.goals.length),
      hasDayPlan: Boolean(brief?.tradingDayPlan?.items.length),
      hasDnaPulse: Boolean(intel?.dna),
      hasDynamicToday: Boolean(intel?.today),
      tier,
      preferredOrder: intel?.today.sectionOrder,
      archetype: intel?.today.archetype,
    });
  }, [brief, mentorQuery.data, startHereSymbol, logSummary, intel, tier]);

  const renderedPrimary = new Set<TodaySection>([
    'header',
    'morningBrief',
    'startHere',
    'dynamicToday',
    'researchQueue',
    'dayPlan',
    'dnaPulse',
    'mentor',
  ]);

  const moreSections = sections.filter((section) => !renderedPrimary.has(section));

  const renderMoreSection = (section: TodaySection): ReactNode => {
    switch (section) {
      case 'goals':
        return intel?.goals?.length ? (
          <AdaptiveGoalsCard key={section} goals={intel.goals} />
        ) : null;
      case 'whyNot':
        return brief?.skipSuggestions?.length ? (
          <View key={section} testID="today-section-why-not">
            <WhyNotCard items={brief.skipSuggestions} regime={brief.regimeLabel} />
          </View>
        ) : null;
      case 'decisionLog':
        return logSummary ? (
          <View key={section} testID="today-section-decision-log">
            <DecisionLogCard summary={logSummary} />
          </View>
        ) : null;
      case 'regime':
        return brief?.regimeSnapshot ? (
          <View key={section} testID="today-section-regime">
            <RegimeCard regime={brief.regimeSnapshot} />
          </View>
        ) : null;
      case 'closeLoop':
        return (
          <CloseLoopCard
            key={section}
            tier={tier}
            onJournal={() => {
              void markDisciplineAction('journal').then(setStreak);
              useAcademyProgressStore.getState().markDisciplineAction('journal');
              router.push('/journal' as never);
            }}
            onReview={() => router.push('/(tabs)/review' as never)}
          />
        );
      case 'mentor':
        return mentorQuery.data ? (
          <View key={section} testID="today-section-mentor">
            <MentorCard brief={mentorQuery.data} isLoading={mentorQuery.isLoading} />
          </View>
        ) : null;
      case 'dnaPulse':
        return intel?.dna ? <TradingDnaCard key={section} dna={intel.dna} compact /> : null;
      case 'morningBrief':
        return brief ? (
          <View key={section} testID="today-section-morning-brief-detail">
            <DecisionBriefHeader brief={brief} />
          </View>
        ) : null;
      default:
        return null;
    }
  };

  const completed = streak ? Object.values(streak.completedToday).filter(Boolean).length : 0;
  const support = intel?.dna.becomingLabel
    ? `Becoming: ${intel.dna.becomingLabel}`
    : streak
      ? `${streak.days}d discipline · ${completed}/3 loop steps`
      : 'One calm session. Protect attention.';

  return (
    <ScreenScaffold
      eyebrow="Today"
      title="What deserves your attention?"
      subtitle={support}
      contentClassName="pb-12 pt-2"
      headerAction={
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => router.push('/decision/intelligence' as never)}
            className="h-12 w-12 items-center justify-center rounded-full bg-surface"
            accessibilityRole="button"
            accessibilityLabel="Trading DNA"
            testID="today-open-intelligence"
          >
            <Ionicons name="finger-print-outline" size={20} color={colors.accent.primary} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/ai?source=today' as never)}
            className="h-12 w-12 items-center justify-center rounded-full bg-surface"
            accessibilityRole="button"
            accessibilityLabel="Ask AI"
            testID="today-ask-ai"
          >
            <Ionicons name="sparkles-outline" size={20} color={colors.accent.primary} />
          </Pressable>
        </View>
      }
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void briefQuery.refetch();
              void intelligenceQuery.refetch();
              void mentorQuery.refetch();
            }}
            tintColor={colors.accent.primary}
          />
        ),
      }}
      testID="today-screen"
    >
      <View className="gap-4">
        <EducationalModeBadge />

        {showMentorSetupInvite ? (
          <MentorSetupInviteCard onLater={() => void dismissMentorInvite()} />
        ) : null}

        {briefQuery.isLoading && !brief ? (
          <Skeleton height={72} rounded="lg" />
        ) : briefQuery.isError && !brief ? (
          <RecoverableErrorState
            error={briefQuery.error ?? new Error('Could not load today’s brief')}
            onRetry={() => void briefQuery.refetch()}
          />
        ) : brief ? (
          <Surface padding="sm" tone="subtle" testID="today-regime-freshness">
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text variant="label">Market condition</Text>
                <Text variant="body-sm" className="mt-1 text-text-secondary">
                  {brief.greeting} · {brief.regimeLabel}
                </Text>
              </View>
              <View className="items-end gap-1">
                {brief.provenance ? <DataSourceBadge kind={brief.provenance.kind} /> : null}
                <DataFreshnessBadge fetchedAt={brief.quotesFetchedAt} />
              </View>
            </View>
          </Surface>
        ) : null}

        {priorities.length > 0 ? (
          <Surface testID="today-worth-attention">
            <Text variant="label" className="text-accent">
              WORTH YOUR ATTENTION
            </Text>
            <Text variant="body-sm" className="mt-1 text-text-secondary">
              At most three priorities for this session.
            </Text>
            <View className="mt-3 gap-2">
              {priorities.map((item, index) => (
                <Pressable
                  key={`${item.symbol}-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.symbol}`}
                  onPress={() => router.push(`/asset/${encodeURIComponent(item.symbol)}` as never)}
                  className="min-h-11 flex-row items-center justify-between rounded-xl bg-surface px-3 py-2"
                >
                  <View className="min-w-0 flex-1 pr-3">
                    <Text variant="label">{item.symbol}</Text>
                    <Text variant="caption" className="text-text-secondary" numberOfLines={1}>
                      {item.setupTitle ?? item.rankReason ?? 'Review evidence'}
                    </Text>
                  </View>
                  <Text variant="caption" className="text-text-tertiary">
                    {[
                      item.estimatedMinutes ? `~${item.estimatedMinutes}m` : null,
                      item.researchValueScore != null ? `RVS ${item.researchValueScore}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Surface>
        ) : null}

        {brief && startHereSymbol ? (
          <View testID="today-merged-nba">
            {intel?.today ? (
              <Text variant="caption" className="mb-2 text-text-tertiary">
                {intel.today.eyebrow}: {intel.today.headline}
              </Text>
            ) : null}
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
          </View>
        ) : intel?.today ? (
          <View testID="today-merged-nba">
            <DynamicTodayHero focus={intel.today} becomingQuestion={intel.becomingQuestion} />
          </View>
        ) : null}

        {upcomingEvent ? (
          <Surface tone="warning" padding="sm" testID="today-upcoming-event">
            <Text variant="label">Upcoming event</Text>
            <Text variant="body-sm" className="mt-1 text-text-secondary">
              {upcomingEvent.title} · {upcomingEvent.impact} impact ·{' '}
              {new Date(upcomingEvent.at).toLocaleString()}
            </Text>
          </Surface>
        ) : null}

        <Surface padding="sm" testID="today-process-insight">
          <Text variant="label" className="text-text-tertiary">
            PROCESS INSIGHT
          </Text>
          <Text variant="body-sm" className="mt-1 text-text-secondary">
            {processInsight}
          </Text>
        </Surface>

        {brief?.researchQueue?.length ? (
          <View testID="today-section-research-queue">
            <ResearchQueueCard
              queue={brief.researchQueue}
              regime={brief.regimeLabel}
              freeItemLimit={3}
              variant="compact"
              eyebrow="RESEARCH QUEUE"
              title={`${brief.researchQueue.length} ranked · next up`}
              description={`~${brief.researchQueue
                .slice(0, 3)
                .reduce((sum, item) => sum + (item.estimatedMinutes ?? 0), 0)} min for the next free items · full queue lives in Research`}
              onOutcome={() => void markDisciplineAction('researchPlan').then(setStreak)}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open the full Research queue"
              testID="today-see-all-setups"
              onPress={() => router.push('/research' as never)}
              className="mt-2 min-h-11 items-center justify-center rounded-xl bg-surface px-4"
            >
              <Text variant="label" className="text-accent">
                Open full Research queue
              </Text>
            </Pressable>
          </View>
        ) : briefQuery.isLoading ? (
          <Skeleton height={110} rounded="lg" />
        ) : null}

        {brief?.tradingDayPlan?.items.length ? (
          <CollapsibleSection
            title="Day plan"
            description="Current phase and remaining session steps."
            testID="today-day-plan-disclosure"
          >
            <TradingDayPlanCard plan={brief.tradingDayPlan} />
          </CollapsibleSection>
        ) : null}

        {briefQuery.isLoading && !brief ? (
          <DecisionBriefHeader brief={EMPTY_BRIEF} isLoading />
        ) : null}

        {moreSections.length > 0 || brief || mentorQuery.data || intel?.dna ? (
          <CollapsibleSection
            title="More for this session"
            description="Brief detail, mentor, DNA, regime, goals, and log — when you want them."
            defaultExpanded={false}
            testID="today-more-disclosure"
          >
            {brief ? (
              <View testID="today-section-morning-brief">
                <DecisionBriefHeader brief={brief} />
              </View>
            ) : null}
            {mentorQuery.data ? (
              <View testID="today-section-mentor">
                <MentorCard brief={mentorQuery.data} isLoading={mentorQuery.isLoading} />
              </View>
            ) : null}
            {intel?.dna ? <TradingDnaCard dna={intel.dna} compact /> : null}
            {moreSections.map((section) => renderMoreSection(section))}
          </CollapsibleSection>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}
