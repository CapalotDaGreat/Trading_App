import { View } from 'react-native';

import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { formatPercent, formatPrice } from '@/shared/utils/format';

import type { AiEnrichedContext } from '../types/ai.types';

interface AiContextPreviewProps {
  context?: AiEnrichedContext | null;
  isLoading?: boolean;
}

export function AiContextPreview({ context, isLoading }: AiContextPreviewProps) {
  if (isLoading) {
    return (
      <GlassCard className="mb-4 p-4">
        <Skeleton height={16} width="40%" className="mb-3" />
        <Skeleton height={48} />
      </GlassCard>
    );
  }

  if (!context) return null;

  return (
    <GlassCard className="mb-4 p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text variant="label">Live Market Context</Text>
        {context.overallBias ? (
          <Badge
            label={context.overallBias}
            variant={
              context.overallBias === 'bullish'
                ? 'success'
                : context.overallBias === 'bearish'
                  ? 'danger'
                  : 'default'
            }
            size="sm"
          />
        ) : null}
      </View>

      {context.symbol && context.quote ? (
        <Text variant="price" className="mb-1">
          {context.symbol} {formatPrice(context.quote.price)}{' '}
          <Text
            variant="body-sm"
            className={context.quote.changePercent >= 0 ? 'text-bullish' : 'text-bearish'}
          >
            {formatPercent(context.quote.changePercent)}
          </Text>
        </Text>
      ) : null}

      <View className="mt-2 flex-row flex-wrap gap-2">
        {context.trend ? <Chip label={`Trend: ${context.trend}`} /> : null}
        {context.rsi ? <Chip label={`RSI ${context.rsi.value}`} /> : null}
        {context.macd ? <Chip label={`MACD ${context.macd.signal}`} /> : null}
        {context.adx !== undefined ? <Chip label={`ADX ${context.adx}`} /> : null}
        {context.fearGreedIndex !== undefined ? (
          <Chip label={`F&G ${context.fearGreedIndex}`} />
        ) : null}
      </View>

      {context.detectedPatterns && context.detectedPatterns.length > 0 ? (
        <Text variant="caption" className="mt-2">
          Patterns: {context.detectedPatterns.map((p) => p.name).join(', ')}
        </Text>
      ) : null}
    </GlassCard>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View className="rounded-full border border-border bg-surface/40 px-2 py-0.5">
      <Text variant="caption">{label}</Text>
    </View>
  );
}
