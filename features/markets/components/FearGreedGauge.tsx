import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { MARKET_DATA_POLICY } from '@/features/markets/constants/freshness';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { colors } from '@/shared/constants/theme';
import { cn } from '@/shared/utils/cn';

import { fetchFearGreedIndex } from '../services/market-data.service';

interface FearGreedGaugeProps {
  className?: string;
}

const GAUGE_SIZE = 200;
const STROKE_WIDTH = 14;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CENTER = GAUGE_SIZE / 2;

function polarToCartesian(angleDeg: number, radius: number): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(angleRad),
    y: CENTER + radius * Math.sin(angleRad),
  };
}

function describeArc(startAngle: number, endAngle: number): string {
  const start = polarToCartesian(endAngle, RADIUS);
  const end = polarToCartesian(startAngle, RADIUS);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function getGaugeColor(value: number): string {
  if (value <= 25) return colors.bearish.primary;
  if (value <= 45) return '#FF8C42';
  if (value <= 55) return colors.warning.primary;
  if (value <= 75) return '#A8E063';
  return colors.bullish.primary;
}

export function FearGreedGauge({ className }: FearGreedGaugeProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['fear-greed-index'],
    queryFn: fetchFearGreedIndex,
    staleTime: MARKET_DATA_POLICY.fearGreedStaleMs,
    refetchInterval: MARKET_DATA_POLICY.fearGreedRefetchMs,
  });

  const value = data?.value ?? 50;
  const needleAngle = -90 + (value / 100) * 180;
  const needleEnd = polarToCartesian(needleAngle + 90, RADIUS - 20);

  return (
    <GlassCard className={cn('items-center p-4', className)}>
      <Text variant="h3" className="mb-1 self-start">
        Fear & Greed
      </Text>
      <Text variant="caption" className="mb-4 self-start">
        Crypto market sentiment
      </Text>

      {isLoading ? (
        <Skeleton width={GAUGE_SIZE} height={GAUGE_SIZE / 2 + 20} rounded="lg" />
      ) : error ? (
        <Text variant="body-sm" className="text-bearish">
          Unable to load index
        </Text>
      ) : (
        <>
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE / 2 + 30}>
            <Path
              d={describeArc(-90, 90)}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d={describeArc(-90, needleAngle)}
              stroke={getGaugeColor(value)}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
            />
            <Line
              x1={CENTER}
              y1={CENTER}
              x2={needleEnd.x}
              y2={needleEnd.y}
              stroke={colors.text.primary}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Circle cx={CENTER} cy={CENTER} r={6} fill={getGaugeColor(value)} />
            <SvgText
              x={CENTER}
              y={CENTER + 28}
              fill={colors.text.primary}
              fontSize={28}
              fontWeight="bold"
              textAnchor="middle"
            >
              {value}
            </SvgText>
          </Svg>
          <View className="mt-2 items-center">
            <Text variant="body" className="font-semibold" style={{ color: getGaugeColor(value) }}>
              {data?.classification ?? 'Neutral'}
            </Text>
          </View>
        </>
      )}
    </GlassCard>
  );
}
