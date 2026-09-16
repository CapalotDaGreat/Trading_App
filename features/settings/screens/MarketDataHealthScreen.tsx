import { View } from 'react-native';

import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

import {
  getMarketDataHealthSnapshot,
  type MarketDataPathStatus,
} from '../services/market-data-health.service';

const BADGE_VARIANT: Record<
  MarketDataPathStatus,
  'success' | 'warning' | 'default' | 'outline'
> = {
  active: 'success',
  available: 'warning',
  optional_idle: 'outline',
  not_configured: 'default',
  not_applicable: 'outline',
};

export function MarketDataHealthScreen() {
  const health = getMarketDataHealthSnapshot();
  const modeLabel =
    health.runtimeMode === 'synthetic' ? 'Synthetic / sample (default)' : 'Vendor (opt-in)';

  return (
    <Screen scrollable>
      <Header title="Market data health" subtitle="Sources & refresh policy" />

      <View className="mt-4 gap-3">
        <GlassCard className="p-4">
          <Text variant="h3" className="mb-2">
            This build
          </Text>
          <View className="mb-2 flex-row items-center justify-between gap-3">
            <Text variant="body-sm" className="flex-1 text-text-secondary">
              Runtime mode
            </Text>
            <Badge label={modeLabel} variant="outline" size="sm" />
          </View>
          <Text variant="body-sm" className="text-text-secondary">
            TradeAcademy does not need Finnhub, Alpha Vantage, CoinGecko, or News API keys on the
            device. Learning, Practice, and Simulation run on labelled sample/synthetic data.
            Optional live Markets quotes for verified signed-in users go through Cloud Functions
            secrets — never Expo public client keys.
          </Text>
        </GlassCard>

        {health.rows.map((row) => (
          <GlassCard key={row.id} className="p-4">
            <View className="mb-2 flex-row items-start justify-between gap-3">
              <Text variant="body-sm" className="flex-1 font-semibold">
                {row.title}
              </Text>
              <Badge
                label={row.statusLabel}
                variant={BADGE_VARIANT[row.status]}
                size="sm"
              />
            </View>
            <Text variant="caption" className="text-text-tertiary">
              {row.detail}
            </Text>
          </GlassCard>
        ))}

        <GlassCard className="p-4">
          <Text variant="h3" className="mb-2">
            Refresh policy
          </Text>
          <Text variant="body-sm" className="text-text-secondary">
            Quote refetch ~{Math.round(health.refreshPolicy.quoteRefetchMs / 1000)}s · Candle
            refetch ~{Math.round(health.refreshPolicy.candleRefetchMs / 1000)}s when a live or
            public path is used. Synthetic training data is local and does not poll vendors.
          </Text>
        </GlassCard>
      </View>
    </Screen>
  );
}
