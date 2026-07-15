import { RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';

import { TraderMemoryCard } from '@/features/decision/components/TraderMemoryCard';
import { useTraderMemory } from '@/features/decision/hooks/useDecision';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';

export default function MemoryScreen() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch } = useTraderMemory();

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
      <Header title="AI Memory" subtitle="Your trading profile" onBack={() => router.back()} />
      <View className="mt-4 gap-4 pb-8">
        <GlassCard className="p-4">
          <Text variant="body-sm">
            Stored locally so Decision Brief and Setup Radar can prefer your style, favorites, and
            common mistakes.
          </Text>
        </GlassCard>
        {isLoading && !data ? <Skeleton height={200} rounded="lg" /> : null}
        {data ? <TraderMemoryCard memory={data} /> : null}
      </View>
    </Screen>
  );
}
