import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { buildAssetFromSymbol } from '@/features/markets/services/market-data.service';
import { formatPercent } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

import { useMarketQuote } from '../hooks/useMarketQuote';

interface HeatmapCell {
  symbol: string;
  label: string;
  changePercent: number;
}

interface MarketHeatmapProps {
  symbols: string[];
  columns?: number;
  onPress?: (symbol: string) => void;
  className?: string;
}

function HeatmapCellItem({
  cell,
  onPress,
}: {
  cell: HeatmapCell;
  onPress?: (symbol: string) => void;
}) {
  const asset = buildAssetFromSymbol(cell.symbol);
  const { data: quote, isLoading } = useMarketQuote({
    symbol: cell.symbol,
    marketType: asset.marketType,
  });

  const changePercent = quote?.changePercent ?? cell.changePercent;
  const intensity = Math.min(Math.abs(changePercent) / 5, 1);

  const bgColor =
    changePercent > 0
      ? `rgba(0, 212, 170, ${0.15 + intensity * 0.45})`
      : changePercent < 0
        ? `rgba(255, 71, 87, ${0.15 + intensity * 0.45})`
        : 'rgba(255, 255, 255, 0.05)';

  return (
    <Pressable
      onPress={() => onPress?.(cell.symbol)}
      style={{ backgroundColor: bgColor }}
      className="min-h-[72px] flex-1 items-center justify-center rounded-lg border border-border p-2"
    >
      {isLoading ? (
        <Skeleton width={40} height={14} />
      ) : (
        <>
          <Text variant="label" className="font-bold text-text-primary">
            {cell.label}
          </Text>
          <Text
            variant="caption"
            className={cn(
              'mt-1 font-semibold',
              changePercent > 0 ? 'text-bullish' : changePercent < 0 ? 'text-bearish' : 'text-text-secondary',
            )}
          >
            {formatPercent(changePercent)}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function MarketHeatmap({ symbols, columns = 3, onPress, className }: MarketHeatmapProps) {
  const cells = useMemo<HeatmapCell[]>(
    () =>
      symbols.map((symbol) => ({
        symbol,
        label: symbol.split('/')[0].replace('^', '').slice(0, 5),
        changePercent: 0,
      })),
    [symbols],
  );

  const rows: HeatmapCell[][] = [];
  for (let i = 0; i < cells.length; i += columns) {
    rows.push(cells.slice(i, i + columns));
  }

  return (
    <GlassCard className={cn('p-3', className)}>
      <Text variant="h3" className="mb-3">
        Market Heatmap
      </Text>
      <View className="gap-2">
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row gap-2">
            {row.map((cell) => (
              <HeatmapCellItem key={cell.symbol} cell={cell} onPress={onPress} />
            ))}
            {row.length < columns
              ? Array.from({ length: columns - row.length }).map((_, i) => (
                  <View key={`pad-${i}`} className="flex-1" />
                ))
              : null}
          </View>
        ))}
      </View>
    </GlassCard>
  );
}
