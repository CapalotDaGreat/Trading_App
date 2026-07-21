import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import type { Quote } from '@/shared/types/market';
import { formatPercent } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

interface HeatmapCell {
  symbol: string;
  label: string;
  changePercent: number;
}

interface MarketHeatmapProps {
  symbols: string[];
  /** Prefetched quotes — when provided, cells do not mount per-symbol polls. */
  quotes?: Quote[];
  columns?: number;
  onPress?: (symbol: string) => void;
  className?: string;
  isLoading?: boolean;
}

function HeatmapCellItem({
  cell,
  isLoading,
  onPress,
}: {
  cell: HeatmapCell;
  isLoading?: boolean;
  onPress?: (symbol: string) => void;
}) {
  const changePercent = cell.changePercent;
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
      accessibilityRole="button"
      accessibilityLabel={`${cell.label} ${formatPercent(changePercent)}`}
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
              changePercent > 0
                ? 'text-bullish'
                : changePercent < 0
                  ? 'text-bearish'
                  : 'text-text-secondary',
            )}
          >
            {formatPercent(changePercent)}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function MarketHeatmap({
  symbols,
  quotes,
  columns = 3,
  onPress,
  className,
  isLoading = false,
}: MarketHeatmapProps) {
  const quoteMap = useMemo(() => {
    const map = new Map<string, Quote>();
    for (const quote of quotes ?? []) {
      map.set(quote.symbol.toUpperCase(), quote);
    }
    return map;
  }, [quotes]);

  const cells = useMemo<HeatmapCell[]>(
    () =>
      symbols.map((symbol) => {
        const quote = quoteMap.get(symbol.toUpperCase());
        return {
          symbol,
          label: symbol.split('/')[0].replace('^', '').slice(0, 5),
          changePercent: quote?.changePercent ?? 0,
        };
      }),
    [quoteMap, symbols],
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
              <HeatmapCellItem
                key={cell.symbol}
                cell={cell}
                isLoading={isLoading && !quoteMap.has(cell.symbol.toUpperCase())}
                onPress={onPress}
              />
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
