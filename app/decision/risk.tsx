import { RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';

import { RiskCenterCard } from '@/features/decision/components/RiskCenterCard';
import { useRiskCenter } from '@/features/decision/hooks/useDecision';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';

export default function RiskCenterScreen() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch } = useRiskCenter();

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
      <Header title="Risk Center" subtitle="Concentration & exposure" onBack={() => router.back()} />
      <View className="mt-4 gap-4 pb-8">
        <GlassCard className="p-4">
          <Text variant="body-sm">
            Health-style risk score based on your tracked holdings. Analysis only — no brokerage
            execution.
          </Text>
        </GlassCard>
        {isLoading && !data ? <Skeleton height={240} rounded="lg" /> : null}
        {data ? <RiskCenterCard data={data} /> : null}
      </View>
    </Screen>
  );
}
