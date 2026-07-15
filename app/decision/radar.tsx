import { RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';

import { SetupCard } from '@/features/decision/components/SetupCard';
import { useSetupRadar } from '@/features/decision/hooks/useDecision';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';

export default function SetupRadarScreen() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch } = useSetupRadar();

  return (
    <Screen
      scrollable
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor="#00D4AA"
          />
        ),
      }}
    >
      <Header
        title="Setup Radar"
        subtitle="What deserves research time"
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-3 pb-8">
        <GlassCard className="p-4">
          <Text variant="body-sm">
            Ranked live setups from your watchlist benchmarks. This prioritizes research time — it
            does not execute trades.
          </Text>
        </GlassCard>

        {isLoading && !data?.length ? (
          <View className="gap-3">
            <Skeleton height={140} rounded="lg" />
            <Skeleton height={140} rounded="lg" />
          </View>
        ) : (
          (data ?? []).map((setup) => (
            <SetupCard
              key={setup.id}
              setup={setup}
              onPress={() => router.push(`/asset/${encodeURIComponent(setup.symbol)}` as never)}
            />
          ))
        )}

        {!isLoading && !data?.length ? (
          <GlassCard className="p-4">
            <Text variant="body-sm">No setups scored yet. Pull to refresh with market online.</Text>
          </GlassCard>
        ) : null}
      </View>
    </Screen>
  );
}
