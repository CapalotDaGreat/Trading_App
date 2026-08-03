import { View } from 'react-native';

import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import {
  allowDevDirectVendors,
  canUseVendorProxy,
} from '@/shared/services/firebase/callable-proxy';

export function MarketDataHealthScreen() {
  const proxy = canUseVendorProxy();
  const devDirect = allowDevDirectVendors();
  const finnhubDev = devDirect && Boolean(process.env.EXPO_PUBLIC_FINNHUB_API_KEY);
  const alphaDev = devDirect && Boolean(process.env.EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY);

  const providers = [
    {
      name: 'Cloud Functions proxy (signed-in)',
      kind: proxy ? ('live' as const) : ('mock' as const),
    },
    {
      name: 'Finnhub via Functions secrets',
      kind: proxy ? ('delayed' as const) : ('mock' as const),
    },
    {
      name: 'Alpha Vantage via Functions secrets',
      kind: proxy ? ('delayed' as const) : ('mock' as const),
    },
    {
      name: 'Dev-direct Finnhub key (never production)',
      kind: finnhubDev ? ('live' as const) : ('mock' as const),
    },
    {
      name: 'Dev-direct Alpha Vantage key (never production)',
      kind: alphaDev ? ('live' as const) : ('mock' as const),
    },
    { name: 'CoinGecko (public crypto)', kind: 'delayed' as const },
    { name: 'ExchangeRate API (public FX quotes)', kind: 'delayed' as const },
  ];

  return (
    <Screen scrollable>
      <Header title="Market data health" subtitle="API status & honesty" />

      <View className="mt-4 gap-3">
        {providers.map((p) => (
          <GlassCard key={p.name} className="flex-row items-center justify-between p-4">
            <Text variant="body-sm" className="mr-3 flex-1">
              {p.name}
            </Text>
            <DataSourceBadge kind={p.kind} />
          </GlassCard>
        ))}

        <GlassCard className="p-4">
          <Text variant="h3" className="mb-2">
            Production path
          </Text>
          <Text variant="body-sm" className="text-text-secondary">
            Signed-in users fetch Finnhub / Alpha Vantage / News through authenticated Cloud
            Functions with quotas and App Check. Guest and demo modes use sample or public no-key
            sources — vendor secrets must not ship in EAS production env.
          </Text>
        </GlassCard>
      </View>
    </Screen>
  );
}
