import { RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { EducationalPanel } from '@/features/educational/components/EducationalPanel';
import { RiskCenterCard } from '@/features/decision/components/RiskCenterCard';
import { PremiumOsGate } from '@/features/decision/components/PremiumOsGate';
import { useRiskCenter } from '@/features/decision/hooks/useDecision';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

export default function RiskCenterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading, isRefetching, refetch } = useRiskCenter();

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
        title="Portfolio health"
        subtitle="Concentration, stress & exposure — no buy/sell advice"
        onBack={() => router.back()}
      />
      <View className="mt-4 gap-4 pb-8">
        <EducationalModeBadge />
        <EducationalPanel
          variant="risk"
          body="Health reads help you notice concentration and stress. They are research context — not orders or advice."
        />
        <GlassCard className="p-4">
          <Text variant="body-sm" className="text-text-secondary">
            A health-style read on tracked holdings. Analysis only — no brokerage orders.
          </Text>
        </GlassCard>
        {isLoading && !data ? <Skeleton height={240} rounded="lg" /> : null}
        {data ? (
          <PremiumOsGate feature="portfolioIntelligence">
            <RiskCenterCard data={data} />
          </PremiumOsGate>
        ) : null}
      </View>
    </Screen>
  );
}
