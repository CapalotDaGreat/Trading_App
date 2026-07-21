import { useRouter } from 'expo-router';
import { RefreshControl, View } from 'react-native';

import { JournalCoachCard } from '@/features/decision/components/JournalCoachCard';
import { useJournalCoach } from '@/features/decision/hooks/useDecision';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';

export default function JournalCoachScreen() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch } = useJournalCoach();

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
        title="Ask"
        subtitle="One process prompt from your history"
        onBack={() => router.back()}
      />
      <View className="mt-4 gap-4 pb-8">
        <GlassCard className="p-4">
          <Text variant="body-sm" className="text-text-secondary">
            Built from closed trades and notes in your journal. More fills = more personal tips.
          </Text>
        </GlassCard>
        {isLoading && !data ? <Skeleton height={280} rounded="lg" /> : null}
        {data ? <JournalCoachCard insight={data} /> : null}
      </View>
    </Screen>
  );
}
