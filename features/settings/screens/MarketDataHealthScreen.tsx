import { View } from 'react-native';

import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';

function keyStatus(name: string, configured: boolean) {
  return { name, configured };
}

export function MarketDataHealthScreen() {
  const finnhub = Boolean(process.env.EXPO_PUBLIC_FINNHUB_API_KEY);
  const alpha = Boolean(process.env.EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY);
  const coingecko = true;

  const providers = [
    keyStatus('Finnhub (stocks + FX OHLC)', finnhub),
    keyStatus('Alpha Vantage (fallback quotes)', alpha),
    keyStatus('CoinGecko (crypto)', coingecko),
    keyStatus('ExchangeRate API (FX quotes)', true),
  ];

  return (
    <Screen scrollable>
      <Header title="Market data health" subtitle="API status & honesty" />

      <View className="mt-4 gap-3">
        {providers.map((p) => (
          <GlassCard key={p.name} className="flex-row items-center justify-between p-4">
            <Text variant="body-sm">{p.name}</Text>
            <DataSourceBadge kind={p.configured ? 'live' : 'mock'} />
          </GlassCard>
        ))}

        <GlassCard className="p-4">
          <Text variant="h3" className="mb-2">
            Refresh policy
          </Text>
          <Text variant="body-sm" className="text-text-secondary">
            Quotes poll on an interval — Premium tiers get faster refresh, not exchange-tick
            realtime. Panels labeled Sample or Demo use placeholder data when APIs are unavailable.
          </Text>
        </GlassCard>
      </View>
    </Screen>
  );
}
