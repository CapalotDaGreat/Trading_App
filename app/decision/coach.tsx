import { useRouter } from 'expo-router';
import { RefreshControl, View } from 'react-native';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { EducationalPanel } from '@/features/educational/components/EducationalPanel';
import { JournalCoachCard } from '@/features/decision/components/JournalCoachCard';
import { useJournalCoach } from '@/features/decision/hooks/useDecision';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

export default function JournalCoachScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading, isRefetching, refetch } = useJournalCoach();

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
      <Header
        title="Coach"
        subtitle="One process prompt from your history"
        onBack={() => router.back()}
      />
      <View className="mt-4 gap-4 pb-8">
        <EducationalModeBadge />
        <EducationalPanel
          variant="tip"
          body="Coach prompts reinforce journaling discipline and plan adherence — never overtrading."
        />
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
