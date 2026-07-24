import { RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { EducationalPanel } from '@/features/educational/components/EducationalPanel';
import { RegimeCard } from '@/features/decision/components/RegimeCard';
import { useRegime } from '@/features/decision/hooks/useDecision';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

export default function RegimeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading, isRefetching, refetch } = useRegime();

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
        title="Market condition"
        subtitle="What the tape favors right now — research context"
        onBack={() => router.back()}
      />
      <View className="mt-4 gap-4 pb-8">
        <EducationalModeBadge />
        <EducationalPanel
          variant="why"
          body="Regime context helps you choose patience vs aggression in research — it is not a signal to trade."
        />
        {isLoading && !data ? <Skeleton height={220} rounded="lg" /> : null}
        {data ? <RegimeCard regime={data} /> : null}
        {!isLoading && !data ? (
          <Text variant="body-sm">Regime unavailable. Check network and pull to refresh.</Text>
        ) : null}
      </View>
    </Screen>
  );
}
