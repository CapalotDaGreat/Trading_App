import { RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';

import { RegimeCard } from '@/features/decision/components/RegimeCard';
import { useRegime } from '@/features/decision/hooks/useDecision';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';

export default function RegimeScreen() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch } = useRegime();

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
      <Header title="Market condition" subtitle="What the tape favors right now" onBack={() => router.back()} />
      <View className="mt-4 gap-4 pb-8">
        {isLoading && !data ? <Skeleton height={220} rounded="lg" /> : null}
        {data ? <RegimeCard regime={data} /> : null}
        {!isLoading && !data ? (
          <Text variant="body-sm">Regime unavailable. Check network and pull to refresh.</Text>
        ) : null}
      </View>
    </Screen>
  );
}
