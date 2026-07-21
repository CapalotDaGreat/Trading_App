import { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';
import { formatPercent, formatPrice } from '@/shared/utils/format';

import type { PortfolioPerformance } from '../types/portfolio.types';

interface PerformanceChartProps {
  performance: PortfolioPerformance;
  currency?: string;
  onPeriodChange?: (period: PortfolioPerformance['period']) => void;
}

const PERIODS: PortfolioPerformance['period'][] = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];

const CHART_HEIGHT = 120;
const PADDING = 8;

export function PerformanceChart({
  performance,
  currency = 'USD',
  onPeriodChange,
}: PerformanceChartProps) {
  const { points, period } = performance;
  const [chartWidth, setChartWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  }, []);

  const geometry = useMemo(() => {
    if (points.length < 2 || chartWidth <= 0) return null;
    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const coords = points.map((point, index) => {
      const x = PADDING + (index / (points.length - 1)) * (chartWidth - PADDING * 2);
      const y = PADDING + (1 - (point.value - min) / range) * (CHART_HEIGHT - PADDING * 2);
      return { x, y, point };
    });

    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const areaPath = `${linePath} L ${coords[coords.length - 1]?.x ?? 0} ${CHART_HEIGHT} L ${coords[0]?.x ?? 0} ${CHART_HEIGHT} Z`;
    return { coords, linePath, areaPath };
  }, [chartWidth, points]);

  if (points.length < 2) {
    return (
      <GlassCard className="p-4">
        <Text variant="body-sm" className="text-center text-text-tertiary">
          Not enough data for chart
        </Text>
      </GlassCard>
    );
  }

  const latest = points[points.length - 1];
  const first = points[0];
  const isPositive = latest && first ? latest.pnl >= 0 : true;
  const strokeColor = isPositive ? '#00D4AA' : '#FF4757';
  const gradientId = 'performanceGradient';

  return (
    <GlassCard className="p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <View>
          <Text variant="label">Performance</Text>
          {latest ? (
            <Text variant="price" className={isPositive ? 'text-bullish' : 'text-bearish'}>
              {formatPrice(latest.value, currency)} ({formatPercent(latest.pnlPercent)})
            </Text>
          ) : null}
        </View>
      </View>

      <View className="w-full" onLayout={onLayout}>
        {geometry ? (
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={strokeColor} stopOpacity="0.3" />
                <Stop offset="1" stopColor={strokeColor} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Path d={geometry.areaPath} fill={`url(#${gradientId})`} />
            <Path d={geometry.linePath} stroke={strokeColor} strokeWidth={2} fill="none" />
          </Svg>
        ) : (
          <View style={{ height: CHART_HEIGHT }} />
        )}
      </View>

      <View className="mt-3 flex-row justify-between">
        {PERIODS.map((p) => (
          <Pressable
            key={p}
            accessibilityRole="button"
            accessibilityState={{ selected: p === period }}
            onPress={() => onPeriodChange?.(p)}
            className={cn(
              'min-h-11 min-w-11 items-center justify-center rounded-lg px-2',
              p === period ? 'bg-accent-muted' : 'bg-transparent',
            )}
          >
            <Text
              variant="caption"
              className={cn('font-medium', p === period ? 'text-accent' : 'text-text-tertiary')}
            >
              {p}
            </Text>
          </Pressable>
        ))}
      </View>
    </GlassCard>
  );
}
