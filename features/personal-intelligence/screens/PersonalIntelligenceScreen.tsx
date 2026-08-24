import { useRouter } from 'expo-router';
import { RefreshControl, View } from 'react-native';

import { PremiumOsGate } from '@/features/decision/components/PremiumOsGate';
import { useEntitlement } from '@/features/subscription/hooks/useEntitlement';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { StatusState } from '@/shared/components/feedback/StatusState';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

import { AdaptiveGoalsCard } from '../components/AdaptiveGoalsCard';
import { AiMemoryTimeline } from '../components/AiMemoryTimeline';
import { CoachingReferencesCard } from '../components/CoachingReferencesCard';
import { DecisionGraphCard } from '../components/DecisionGraphCard';
import { DnaEvolutionTimeline } from '../components/DnaEvolutionTimeline';
import { DnaProcessGoalsCard } from '../components/DnaProcessGoalsCard';
import { DnaReviewsPanel } from '../components/DnaReviewsPanel';
import { DynamicTodayHero } from '../components/DynamicTodayHero';
import { TradingDnaCard } from '../components/TradingDnaCard';
import { usePersonalIntelligence } from '../hooks/usePersonalIntelligence';

export function PersonalIntelligenceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading, isRefetching, refetch, graphPeriod, setGraphPeriod } =
    usePersonalIntelligence('weekly');
  const tradingDnaEntitlement = useEntitlement('tradingDna');
  const personalIntelEntitlement = useEntitlement('personalIntelligence');
  const isPremium = Boolean(tradingDnaEntitlement.allowed && personalIntelEntitlement.allowed);

  return (
    <ScreenScaffold
      title="Trading DNA"
      subtitle="How do I make decisions — and how am I changing over time?"
      contentClassName="pb-12"
      showBack
      onBack={() => router.back()}
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
      <View className="gap-5">
        {isLoading && !data ? (
          <StatusState
            status="loading"
            title="Composing your process profile"
            description="Trading DNA describes observed decision tendencies from Decision Log, Journal, Replay, and practice — never P&L, never a personality diagnosis."
          />
        ) : data ? (
          <>
            <TradingDnaCard dna={data.dna} limited={!isPremium} />
            <CollapsibleSection
              title="Today's cue"
              description="The same cue already lives on Today. Open only if you want the longer snapshot."
              defaultExpanded={false}
            >
              <DynamicTodayHero
                focus={data.today}
                becomingQuestion={data.becomingQuestion}
                showCue={false}
              />
            </CollapsibleSection>
            <CollapsibleSection
              title="Process goals"
              description="Adaptive goals and DNA process targets."
              defaultExpanded={false}
            >
              <DnaProcessGoalsCard isPremium={isPremium} />
              <AdaptiveGoalsCard goals={data.goals} />
            </CollapsibleSection>
            <CollapsibleSection
              title="What's changing"
              description="Reviews, patterns, and coaching actions."
            >
              <DnaReviewsPanel
                whatsChanging={data.whatsChanging}
                weeklyReview={data.weeklyReview}
                monthlyReview={data.monthlyReview}
                patterns={data.patterns}
                coachingActions={data.coachingActions}
                isPremium={isPremium}
              />
            </CollapsibleSection>
            {isPremium ? (
              <CollapsibleSection
                title="Deeper profile"
                description="Evolution, graph, memory timeline, and coaching references."
              >
                <DnaEvolutionTimeline points={data.evolution} />
                <DecisionGraphCard
                  graph={data.graph}
                  period={graphPeriod}
                  onPeriodChange={setGraphPeriod}
                />
                <AiMemoryTimeline events={data.memoryTimeline} />
                <CoachingReferencesCard references={data.coachingReferences} />
              </CollapsibleSection>
            ) : (
              <PremiumOsGate feature="tradingDnaInsights">
                <Text variant="body-sm" className="text-text-secondary">
                  Premium includes DNA evolution, advanced patterns, monthly self-comparison, and
                  deeper Mentor integration.
                </Text>
              </PremiumOsGate>
            )}
          </>
        ) : (
          <StatusState
            status="empty"
            title="Not enough evidence yet"
            description="Open Today once and log a few research, skip, or journal actions so Trading DNA can compose."
            actionLabel="Go to Today"
            onAction={() => router.push('/' as never)}
          />
        )}
      </View>
    </ScreenScaffold>
  );
}
