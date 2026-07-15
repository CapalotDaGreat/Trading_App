import { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import type { Candle } from '@/shared/types/market';
import { formatPrice } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

interface CandlestickChartProps {
  candles: Candle[];
  height?: number;
  isLoading?: boolean;
  currency?: string;
  className?: string;
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

const PADDING = { top: 16, right: 56, bottom: 24, left: 8 };
const CANDLE_GAP = 2;

function scaleCandles(
  candles: Candle[],
  width: number,
  height: number,
): { scaled: ScaledCandle[]; minPrice: number; maxPrice: number } {
  if (!candles.length || width <= 0 || height <= 0) {
    return { scaled: [], minPrice: 0, maxPrice: 0 };
  }

  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const minPrice = Math.min(...lows);
  const maxPrice = Math.max(...highs);
  const priceRange = maxPrice - minPrice || 1;

  const candleWidth = Math.max(2, (chartWidth - CANDLE_GAP * candles.length) / candles.length);

  const priceToY = (price: number) =>
    PADDING.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

  const scaled: ScaledCandle[] = candles.map((candle, i) => {
    const x = PADDING.left + i * (candleWidth + CANDLE_GAP);
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

  return { scaled, minPrice, maxPrice };
}

export function CandlestickChart({
  candles,
  height = 280,
  isLoading = false,
  currency = 'USD',
  className,
}: CandlestickChartProps) {
  const { colors } = useTheme();
  const [dimensions, setDimensions] = useState<ChartDimensions>({ width: 0, height });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    setDimensions({ width, height });
  }, [height]);

  const { scaled, minPrice, maxPrice } = useMemo(
    () => scaleCandles(candles, dimensions.width, dimensions.height),
    [candles, dimensions.width, dimensions.height],
  );

  const candleWidth = scaled.length > 0
    ? Math.max(2, (dimensions.width - PADDING.left - PADDING.right - CANDLE_GAP * scaled.length) / scaled.length)
    : 6;

  const priceLabels = useMemo(() => {
    if (!scaled.length) return [];
    const steps = 4;
    const range = maxPrice - minPrice;
    return Array.from({ length: steps + 1 }, (_, i) => minPrice + (range * i) / steps);
  }, [scaled.length, minPrice, maxPrice]);

  if (isLoading) {
    return (
      <View className={cn('w-full', className)} style={{ height }}>
        <Skeleton width="100%" height={height} rounded="lg" />
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

  const chartHeight = dimensions.height - PADDING.top - PADDING.bottom;

  return (
    <View className={cn('w-full', className)} onLayout={onLayout} style={{ height }}>
      {dimensions.width > 0 ? (
        <Svg width={dimensions.width} height={dimensions.height}>
          {priceLabels.map((price, i) => {
            const y =
              PADDING.top + chartHeight - ((price - minPrice) / (maxPrice - minPrice || 1)) * chartHeight;
            return (
              <G key={i}>
                <Line
                  x1={PADDING.left}
                  y1={y}
                  x2={dimensions.width - PADDING.right}
                  y2={y}
                  stroke={colors.border.default}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
                <SvgText
                  x={dimensions.width - PADDING.right + 4}
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
