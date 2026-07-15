import { Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { DecisionBriefHeader } from '@/features/decision/components/DecisionBriefHeader';
import { ExplainabilityBlock } from '@/features/decision/components/ExplainabilityBlock';
import { RegimeCard } from '@/features/decision/components/RegimeCard';
import { SetupCard } from '@/features/decision/components/SetupCard';
import { TraderMemoryCard } from '@/features/decision/components/TraderMemoryCard';
import {
  useDecisionBrief,
  useRegime,
  useTraderMemory,
} from '@/features/decision/hooks/useDecision';
import { Screen } from '@/shared/components/layout/Screen';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useTheme } from '@/shared/hooks/useTheme';

export default function DecisionBriefScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const briefQuery = useDecisionBrief();
  const regimeQuery = useRegime();
  const memoryQuery = useTraderMemory();

  const refreshing =
    briefQuery.isRefetching || regimeQuery.isRefetching || memoryQuery.isRefetching;

  const onRefresh = () => {
    void Promise.all([briefQuery.refetch(), regimeQuery.refetch(), memoryQuery.refetch()]);
  };

  return (
    <Screen
      scrollable
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.primary}
          />
        ),
      }}
    >
      <View className="pb-8 pt-4">
        <View className="mb-5 flex-row items-center justify-between">
          <View>
            <Text variant="caption" className="text-accent">
              TradeVision AI
            </Text>
            <Text variant="h1" className="text-2xl">
              Decision Brief
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/ai' as never)}
            className="h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface"
            accessibilityLabel="Open AI chat"
          >
            <Ionicons name="sparkles" size={20} color={colors.accent.primary} />
          </Pressable>
        </View>

        <View className="gap-4">
          {briefQuery.isLoading && !briefQuery.data ? (
            <DecisionBriefHeader
              brief={{
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
              }}
              isLoading
            />
          ) : briefQuery.data ? (
            <DecisionBriefHeader
              brief={briefQuery.data}
              onOpenRadar={() => router.push('/decision/radar' as never)}
            />
          ) : (
            <GlassCard className="p-4">
              <Text variant="h3">Unable to load decision brief</Text>
              <Text variant="body-sm" className="mt-2">
                Pull to refresh. Check Finnhub/Alpha Vantage keys for stock quotes.
              </Text>
            </GlassCard>
          )}

          {regimeQuery.data ? <RegimeCard regime={regimeQuery.data} /> : null}

          <View>
            <View className="mb-2 flex-row items-center justify-between">
              <Text variant="h3">Top setups</Text>
              <Pressable onPress={() => router.push('/decision/radar' as never)}>
                <Text variant="label" className="text-accent">
                  Setup Radar
                </Text>
              </Pressable>
            </View>
            {briefQuery.isLoading && !briefQuery.data?.topSetups?.length ? (
              <View className="gap-3">
                <Skeleton height={120} rounded="lg" />
                <Skeleton height={120} rounded="lg" />
              </View>
            ) : (
              <View className="gap-3">
                {(briefQuery.data?.topSetups ?? []).map((setup) => (
                  <SetupCard
                    key={setup.id}
                    setup={setup}
                    onPress={() =>
                      router.push(`/asset/${encodeURIComponent(setup.symbol)}` as never)
                    }
                  />
                ))}
                {!briefQuery.data?.topSetups?.length && !briefQuery.isLoading ? (
                  <GlassCard className="p-4">
                    <Text variant="body-sm">
                      No high-conviction setups yet. Wait for clearer structure instead of forcing
                      trades.
                    </Text>
                  </GlassCard>
                ) : null}
              </View>
            )}
          </View>

          {briefQuery.data ? (
            <ExplainabilityBlock explainability={briefQuery.data.explainability} />
          ) : null}

          {memoryQuery.data ? <TraderMemoryCard memory={memoryQuery.data} /> : null}

          <View className="flex-row flex-wrap gap-2">
            {(
              [
                { href: '/decision/risk', label: 'Risk Center' },
                { href: '/decision/coach', label: 'Journal Coach' },
                { href: '/decision/replay', label: 'Chart Replay' },
                { href: '/decision/memory', label: 'AI Memory' },
              ] as const
            ).map((link) => (
              <Pressable
                key={link.href}
                onPress={() => router.push(link.href as never)}
                className="rounded-xl border border-border bg-surface/60 px-3 py-2"
              >
                <Text variant="label" className="text-accent">
                  {link.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}
