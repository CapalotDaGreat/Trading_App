import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { DecisionQualityExplainer } from '@/features/decision/components/DecisionQualityExplainer';
import { SetupCard } from '@/features/decision/components/SetupCard';
import { useSetupRadar } from '@/features/decision/hooks/useDecision';
import type { SetupCardData } from '@/features/decision/types/decision.types';
import { StatusState } from '@/shared/components/feedback/StatusState';
import { Header } from '@/shared/components/layout/Header';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { useTheme } from '@/shared/hooks/useTheme';

export default function SetupRadarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const { colors } = useTheme();
  const { data, isLoading, isError, isRefetching, refetch } = useSetupRadar();

  const renderItem = useCallback(
    ({ item }: { item: SetupCardData }) => (
      <SetupCard
        setup={item}
        onPress={() => router.push(`/asset/${encodeURIComponent(item.symbol)}` as never)}
      />
    ),
    [router],
  );

  const keyExtractor = useCallback((item: SetupCardData) => item.id, []);

  return (
    <View className="flex-1 bg-background-secondary" style={{ paddingTop: insets.top }}>
      <FlatList
        data={data ?? []}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={{
          paddingHorizontal: layout.gutter,
          paddingBottom: insets.bottom + 32,
          maxWidth: layout.isTablet ? layout.contentMaxWidth : undefined,
          alignSelf: layout.isTablet ? 'center' : undefined,
          width: '100%',
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.accent.primary}
          />
        }
        ListHeaderComponent={
          <View className="mt-2 gap-3 pb-3">
            <Header
              title="Setups"
              subtitle="Research candidates ranked by attention value — not buy or sell signals"
              onBack={() => router.back()}
            />
            <EducationalModeBadge />
            <GlassCard className="p-4">
              <Text variant="body-sm" className="text-text-secondary">
                These are research candidates ranked by evidence and attention value. Open a chart to
                inspect the case — never treat RVS or DQS as a price prediction.
              </Text>
            </GlassCard>
            {isLoading && !data?.length ? (
              <View className="gap-3">
                <Skeleton height={140} rounded="lg" />
                <Skeleton height={140} rounded="lg" />
              </View>
            ) : null}
            {isError && !data?.length ? (
              <StatusState
                status="error"
                title="Radar unavailable"
                description="Evidence needed to rank research candidates could not be loaded."
                actionLabel="Retry"
                onAction={() => void refetch()}
              />
            ) : null}
            {data?.length ? <DecisionQualityExplainer /> : null}
          </View>
        }
        ListEmptyComponent={
          !isLoading && !isError ? (
            <StatusState
              status="empty"
              title="No research candidates yet"
              description="There is not enough current evidence to rank a setup honestly. Pull to refresh when markets are online."
              actionLabel="Refresh"
              onAction={() => void refetch()}
            />
          ) : null
        }
      />
    </View>
  );
}
