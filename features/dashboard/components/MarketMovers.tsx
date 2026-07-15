import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { formatPercent, formatPrice, formatVolume, getPriceColorClass } from '@/shared/utils/format';

import type { MarketMover } from '../services/dashboard.service';

interface MarketMoversProps {
  movers?: MarketMover[];
  isLoading?: boolean;
}

export function MarketMovers({ movers, isLoading }: MarketMoversProps) {
  const router = useRouter();

  if (isLoading || !movers) {
    return (
      <GlassCard className="p-4">
        <Skeleton height={20} width="50%" className="mb-3" />
        <View className="gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={40} />
          ))}
        </View>
      </GlassCard>
    );
  }

  const gainers = movers.filter((m) => m.direction === 'gainer').slice(0, 3);
  const losers = movers.filter((m) => m.direction === 'loser').slice(0, 3);

  return (
    <GlassCard className="p-4">
      <Text variant="h3" className="mb-3">
        Market Movers
      </Text>

      <View className="flex-row gap-3">
        <MoverColumn title="Top Gainers" items={gainers} router={router} />
        <MoverColumn title="Top Losers" items={losers} router={router} />
      </View>
    </GlassCard>
  );
}

function MoverColumn({
  title,
  items,
  router,
}: {
  title: string;
  items: MarketMover[];
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <View className="flex-1">
      <Text variant="caption" className="mb-2 font-semibold uppercase tracking-wide">
        {title}
      </Text>
      {items.map((item) => (
        <Pressable
          key={item.symbol}
          onPress={() => router.push(`/analysis/${item.symbol}` as never)}
          className="mb-1.5 rounded-lg px-1 py-1.5 active:bg-surface-hover"
        >
          <View className="flex-row items-center justify-between">
            <Text variant="label">{item.symbol}</Text>
            <Text variant="caption" className={getPriceColorClass(item.changePercent)}>
              {formatPercent(item.changePercent)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text variant="caption">{formatPrice(item.price)}</Text>
            <Text variant="caption">{formatVolume(item.volume)} vol</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
