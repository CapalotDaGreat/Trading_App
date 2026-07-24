import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { DecisionQualityExplainer } from '@/features/decision/components/DecisionQualityExplainer';
import { SetupCard } from '@/features/decision/components/SetupCard';
import { useSetupRadar } from '@/features/decision/hooks/useDecision';
import type { SetupCardData } from '@/features/decision/types/decision.types';
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
  const { data, isLoading, isRefetching, refetch } = useSetupRadar();

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
              subtitle="Research opportunities ranked by attention value"
              onBack={() => router.back()}
            />
            <EducationalModeBadge />
            <GlassCard className="p-4">
              <Text variant="body-sm" className="text-text-secondary">
                These are research opportunities — not buy/sell orders. Open a card’s chart before
                you decide anything.
              </Text>
            </GlassCard>
            {isLoading && !data?.length ? (
              <View className="gap-3">
                <Skeleton height={140} rounded="lg" />
                <Skeleton height={140} rounded="lg" />
              </View>
            ) : null}
            {data?.length ? <DecisionQualityExplainer /> : null}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <GlassCard className="p-4">
              <Text variant="body-sm">
                No setups scored yet. Pull to refresh with market online.
              </Text>
            </GlassCard>
          ) : null
        }
      />
    </View>
  );
}
