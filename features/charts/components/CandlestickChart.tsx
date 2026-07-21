import { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { performanceDiagnostics } from '@/shared/services/performance';
import type { Candle } from '@/shared/types/market';
import { getChartAccessibilityLabel } from '@/shared/utils/accessibility';
import { cn } from '@/shared/utils/cn';
import { formatPrice } from '@/shared/utils/format';

interface CandlestickChartProps {
  candles: Candle[];
  height?: number;
  isLoading?: boolean;
  currency?: string;
  className?: string;
  symbol?: string;
}

interface ChartDimensions {
  width: number;
  height: number;
}

interface ScaledCandle extends Candle {
  x: number;
  bodyTop: number;
  bodyBottom: number;
  wickTop: number;
  wickBottom: number;
  isBullish: boolean;
}

export const CHART_PADDING = { top: 16, right: 56, bottom: 24, left: 8 };
export const CANDLE_GAP = 2;
export const MIN_CANDLE_BAR_WIDTH = 4;

/** Keep only as many trailing candles as fit the viewport at the minimum bar width. */
export function windowVisibleCandles(
  candles: Candle[],
  width: number,
  minBarWidth = MIN_CANDLE_BAR_WIDTH,
): Candle[] {
  if (!candles.length || width <= 0) return candles;
  const chartWidth = width - CHART_PADDING.left - CHART_PADDING.right;
  if (chartWidth <= 0) return candles;
  const maxCandles = Math.max(1, Math.floor(chartWidth / (minBarWidth + CANDLE_GAP)));
  if (candles.length <= maxCandles) return candles;
  return candles.slice(-maxCandles);
}

function scaleCandles(
  candles: Candle[],
  width: number,
  height: number,
): { scaled: ScaledCandle[]; minPrice: number; maxPrice: number; candleWidth: number } {
  if (!candles.length || width <= 0 || height <= 0) {
    return { scaled: [], minPrice: 0, maxPrice: 0, candleWidth: 6 };
  }

  const chartWidth = width - CHART_PADDING.left - CHART_PADDING.right;
  const chartHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const minPrice = Math.min(...lows);
  const maxPrice = Math.max(...highs);
  const priceRange = maxPrice - minPrice || 1;

  const candleWidth = Math.max(
    MIN_CANDLE_BAR_WIDTH,
    (chartWidth - CANDLE_GAP * candles.length) / candles.length,
  );

  const priceToY = (price: number) =>
    CHART_PADDING.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

  const scaled: ScaledCandle[] = candles.map((candle, i) => {
    const x = CHART_PADDING.left + i * (candleWidth + CANDLE_GAP);
    const isBullish = candle.close >= candle.open;
    return {
      ...candle,
      x,
      bodyTop: priceToY(Math.max(candle.open, candle.close)),
      bodyBottom: priceToY(Math.min(candle.open, candle.close)),
      wickTop: priceToY(candle.high),
      wickBottom: priceToY(candle.low),
      isBullish,
    };
  });

  return { scaled, minPrice, maxPrice, candleWidth };
}

export function CandlestickChart({
  candles,
  height = 280,
  isLoading = false,
  currency = 'USD',
  className,
  symbol,
}: CandlestickChartProps) {
  const { colors } = useTheme();
  const [dimensions, setDimensions] = useState<ChartDimensions>({ width: 0, height });

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width } = e.nativeEvent.layout;
      setDimensions({ width, height });
    },
    [height],
  );

  const visibleCandles = useMemo(
    () => windowVisibleCandles(candles, dimensions.width),
    [candles, dimensions.width],
  );

  const { scaled, minPrice, maxPrice, candleWidth } = useMemo(
    () =>
      performanceDiagnostics.measure('chart.render', () =>
        scaleCandles(visibleCandles, dimensions.width, dimensions.height),
      ),
    [visibleCandles, dimensions.width, dimensions.height],
  );

  const priceLabels = useMemo(() => {
    if (!scaled.length) return [];
    const steps = 4;
    const range = maxPrice - minPrice;
    return Array.from({ length: steps + 1 }, (_, i) => minPrice + (range * i) / steps);
  }, [scaled.length, minPrice, maxPrice]);

  const accessibilityLabel = useMemo(
    () => getChartAccessibilityLabel(symbol ?? 'Chart', visibleCandles),
    [symbol, visibleCandles],
  );

  if (isLoading) {
    return (
      <View className={cn('w-full', className)} style={{ height }}>
        <Skeleton width="100%" height={height} rounded="lg" accessibilityLabel="Loading chart" />
      </View>
    );
  }

  if (!candles.length) {
    return (
      <View className={cn('w-full items-center justify-center', className)} style={{ height }}>
        <Text variant="body-sm" className="text-text-tertiary">
          No chart data available
        </Text>
      </View>
    );
  }

  const chartHeight = dimensions.height - CHART_PADDING.top - CHART_PADDING.bottom;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      className={cn('w-full', className)}
      onLayout={onLayout}
      style={{ height }}
    >
      {dimensions.width > 0 ? (
        <Svg
          width={dimensions.width}
          height={dimensions.height}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        >
          {priceLabels.map((price, i) => {
            const y =
              CHART_PADDING.top +
              chartHeight -
              ((price - minPrice) / (maxPrice - minPrice || 1)) * chartHeight;
            return (
              <G key={i}>
                <Line
                  x1={CHART_PADDING.left}
                  y1={y}
                  x2={dimensions.width - CHART_PADDING.right}
                  y2={y}
                  stroke={colors.border.default}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
                <SvgText
                  x={dimensions.width - CHART_PADDING.right + 4}
                  y={y + 4}
                  fill={colors.text.tertiary}
                  fontSize={10}
                >
                  {formatPrice(price, currency, { decimals: 2 })}
                </SvgText>
              </G>
            );
          })}

          {scaled.map((candle, i) => {
            const color = candle.isBullish ? colors.bullish.primary : colors.bearish.primary;
            const bodyHeight = Math.max(1, candle.bodyBottom - candle.bodyTop);
            const centerX = candle.x + candleWidth / 2;

            return (
              <G key={`${candle.timestamp}-${i}`}>
                <Line
                  x1={centerX}
                  y1={candle.wickTop}
                  x2={centerX}
                  y2={candle.wickBottom}
                  stroke={color}
                  strokeWidth={1}
                />
                <Rect
                  x={candle.x}
                  y={candle.bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={color}
                  rx={1}
                />
              </G>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}
