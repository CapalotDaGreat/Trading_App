import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { WhyNotCard } from '@/features/decision/components/CoachRetentionCards';
import { DecisionBriefHeader } from '@/features/decision/components/DecisionBriefHeader';
import { MarketConditionCard } from '@/features/decision/components/MarketConditionCard';
import { MentorCard } from '@/features/decision/components/MentorCard';
import { ProcessSnapshotCard } from '@/features/decision/components/ProcessSnapshotCard';
import { RegimeCard } from '@/features/decision/components/RegimeCard';
import { ResearchPriorityCard } from '@/features/decision/components/ResearchPriorityCard';
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
import type { DecisionBrief, DisciplineStreak, ResearchQueueItem } from '@/features/decision/types/decision.types';
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
import { StatusState } from '@/shared/components/feedback/StatusState';
import { RecoverableErrorState } from '@/shared/components/feedback/RecoverableErrorState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { SectionHeader } from '@/shared/components/patterns/SectionHeader';
import { Surface } from '@/shared/components/ui/Surface';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { CALM_ATTENTION } from '@/shared/constants/trust-language';
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

function DeskLink({
  label,
  hint,
  testID,
  onPress,
}: {
  label: string;
  hint?: string;
  testID?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      className="min-h-11 flex-row items-center justify-between py-2"
    >
      <View className="min-w-0 flex-1 pr-3">
        <Text variant="label">{label}</Text>
        {hint ? (
          <Text variant="caption" className="mt-0.5 text-text-tertiary">
            {hint}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
    </Pressable>
  );
}

function toFocusItems(brief: DecisionBrief | undefined): ResearchQueueItem[] {
  if (!brief) return [];
  const fromQueue = brief.researchQueue ?? [];
  const fromSetups: ResearchQueueItem[] =
    fromQueue.length > 0
      ? fromQueue
      : (brief.topSetups ?? []).map((setup) => ({
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

  const start = brief.startHereSymbol?.toUpperCase();
  const ordered: ResearchQueueItem[] = [];
  const startItem = start
    ? fromSetups.find((item) => item.symbol.toUpperCase() === start)
    : undefined;
  if (startItem) ordered.push(startItem);
  for (const item of fromSetups) {
    if (ordered.length >= 3) break;
    if (start && item.symbol.toUpperCase() === start) continue;
    ordered.push(item);
  }
  return ordered.slice(0, 3);
}

export default function DecisionBriefScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [streak, setStreak] = useState<DisciplineStreak | null>(null);
  const [debtHidden, setDebtHidden] = useState(false);
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
  const focusItems = useMemo(() => toFocusItems(brief), [brief]);
  const primaryFocus = focusItems[0];
  const secondaryFocus = focusItems.slice(1);

  const processInsight =
    mentorQuery.data?.daily.improveNext ??
    intel?.dna.becomingLabel ??
    null;

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
  const support = brief
    ? `${brief.regimeLabel}. ${CALM_ATTENTION.researchOptional}`
    : streak
      ? `${streak.days}d discipline · ${completed}/3 loop steps`
      : CALM_ATTENTION.researchOptional;

  return (
    <ScreenScaffold
      eyebrow="Today"
      title="What deserves your attention?"
      subtitle={support}
      contentClassName="pb-12 pt-2"
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
      <View className="gap-5">
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
          <MarketConditionCard brief={brief} />
        ) : null}

        {briefQuery.isLoading && !brief ? (
          <Skeleton height={140} rounded="lg" />
        ) : focusItems.length > 0 && primaryFocus ? (
          <View testID="today-worth-attention">
            <SectionHeader
              title="Your focus"
              description="At most three research opportunities. Everything else can wait."
            />
            <View className="gap-3" testID="today-merged-nba">
              {startHereSymbol ? (
                <StartHereCard
                  symbol={startHereSymbol}
                  setup={startHereSetup}
                  queueItem={startHereQueueItem ?? primaryFocus}
                  regime={brief?.regimeLabel ?? ''}
                  onOutcome={(action) => {
                    void markDisciplineAction('researchPlan').then(setStreak);
                    if (action === 'skipped') void toggleQueueSymbol(startHereSymbol);
                  }}
                />
              ) : (
                <StartHereCard
                  symbol={primaryFocus.symbol}
                  queueItem={primaryFocus}
                  regime={brief?.regimeLabel ?? ''}
                  onOutcome={(action) => {
                    void markDisciplineAction('researchPlan').then(setStreak);
                    if (action === 'skipped') void toggleQueueSymbol(primaryFocus.symbol);
                  }}
                />
              )}
              {secondaryFocus.map((item, index) => (
                <ResearchPriorityCard key={item.symbol} item={item} rank={index + 2} />
              ))}
            </View>
          </View>
        ) : brief ? (
          <StatusState
            status="empty"
            title={CALM_ATTENTION.nothingRequiresAttention}
            description={CALM_ATTENTION.nothingRequiresAttentionDetail}
            testID="today-nothing-requires-attention"
          />
        ) : null}

        <ProcessSnapshotCard
          processScore={brief?.processScoreWeek ?? logSummary?.processScore}
          researched={logSummary?.researched}
          journaled={logSummary?.journaled}
          skipped={logSummary?.skipped}
          total={logSummary?.total}
          debt={brief?.decisionDebt}
          insight={processInsight}
          debtHidden={debtHidden}
          onReview={() => router.push('/(tabs)/review' as never)}
          onDefer={() => setDebtHidden(true)}
          onDismiss={() => setDebtHidden(true)}
        />

        {briefQuery.isLoading && !brief ? (
          <DecisionBriefHeader brief={EMPTY_BRIEF} isLoading />
        ) : null}

        <CollapsibleSection
          title="Optional desk"
          description="Calendar, watchlists, portfolio, mentor, and deeper evidence — when you want them."
          defaultExpanded={false}
          testID="today-more-disclosure"
        >
          <DeskLink
            label="Calendar"
            hint="Upcoming events, without urgency"
            onPress={() => router.push('/calendar' as never)}
          />
          <DeskLink
            label="Watchlists"
            hint="Names you already follow"
            onPress={() => router.push('/(tabs)/markets' as never)}
          />
          <DeskLink
            label="Portfolio"
            hint="Holdings context for research, not a trade ticket"
            onPress={() => router.push('/(tabs)/portfolio' as never)}
          />
          <DeskLink
            label="Ask"
            hint="Evidence coach — not signals"
            testID="today-ask-ai"
            onPress={() => router.push('/ai?source=today' as never)}
          />
          <DeskLink
            label="Trading DNA"
            hint="Who you are becoming as a decision-maker"
            testID="today-open-intelligence"
            onPress={() => router.push('/decision/intelligence' as never)}
          />

          {intel?.today ? (
            <View testID="today-section-dynamic-today-optional">
              <DynamicTodayHero focus={intel.today} becomingQuestion={intel.becomingQuestion} />
            </View>
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

          {brief?.researchQueue?.length ? (
            <View testID="today-section-research-queue">
              <ResearchQueueCard
                queue={brief.researchQueue}
                regime={brief.regimeLabel}
                freeItemLimit={3}
                variant="compact"
                eyebrow="FULL QUEUE"
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
          ) : null}

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
      </View>
    </ScreenScaffold>
  );
}
