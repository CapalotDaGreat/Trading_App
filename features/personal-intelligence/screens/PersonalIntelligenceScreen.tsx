import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, View } from 'react-native';

import { Screen } from '@/shared/components/layout/Screen';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

import { AdaptiveGoalsCard } from '../components/AdaptiveGoalsCard';
import { AiMemoryTimeline } from '../components/AiMemoryTimeline';
import { CoachingReferencesCard } from '../components/CoachingReferencesCard';
import { DecisionGraphCard } from '../components/DecisionGraphCard';
import { DnaEvolutionTimeline } from '../components/DnaEvolutionTimeline';
import { DynamicTodayHero } from '../components/DynamicTodayHero';
import { TradingDnaCard } from '../components/TradingDnaCard';
import { usePersonalIntelligence } from '../hooks/usePersonalIntelligence';

export function PersonalIntelligenceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading, isRefetching, refetch, graphPeriod, setGraphPeriod } =
    usePersonalIntelligence('weekly');

  return (
    <Screen
      scrollable
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
      <View className="gap-5 pb-10 pt-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text variant="h1">Personal Intelligence</Text>
            <Text variant="caption" className="mt-1 text-text-secondary">
              Who am I becoming as a trader?
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            className="min-h-11 items-center justify-center rounded-xl bg-surface px-3"
          >
            <Text variant="label" className="text-accent">
              Back
            </Text>
          </Pressable>
        </View>

        {isLoading && !data ? (
          <View className="gap-3">
            <Skeleton height={140} rounded="lg" />
            <Skeleton height={220} rounded="lg" />
            <Skeleton height={180} rounded="lg" />
          </View>
        ) : data ? (
          <>
            <DynamicTodayHero focus={data.today} becomingQuestion={data.becomingQuestion} />
            <TradingDnaCard dna={data.dna} />
            <DnaEvolutionTimeline points={data.evolution} />
            <DecisionGraphCard
              graph={data.graph}
              period={graphPeriod}
              onPeriodChange={setGraphPeriod}
            />
            <AdaptiveGoalsCard goals={data.goals} />
            <AiMemoryTimeline events={data.memoryTimeline} />
            <CoachingReferencesCard references={data.coachingReferences} />
          </>
        ) : (
          <Text variant="body-sm" className="text-text-secondary">
            Personal Intelligence needs trader memory to compose. Open Today once, then return.
          </Text>
        )}
      </View>
    </Screen>
  );
}
