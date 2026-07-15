import { View } from 'react-native';

import { DataFreshnessBadge } from '@/features/decision/components/DataFreshnessBadge';
import type { Explainability } from '@/features/decision/types/decision.types';
import { Badge } from '@/shared/components/ui/Badge';
import { Text } from '@/shared/components/ui/Text';
import { formatRelativeTime } from '@/shared/utils/date';
import { cn } from '@/shared/utils/cn';

interface ExplainabilityBlockProps {
  explainability: Explainability;
  compact?: boolean;
  className?: string;
}

export function ExplainabilityBlock({
  explainability,
  compact = false,
  className,
}: ExplainabilityBlockProps) {
  const factors = compact ? explainability.factors.slice(0, 3) : explainability.factors;

  return (
    <View
      className={cn(
        'rounded-xl border border-border/60 bg-surface/20',
        compact ? 'p-2.5' : 'p-3',
        className,
      )}
    >
      <View className="mb-2 flex-row flex-wrap items-center gap-2">
        <Text variant="caption" className="font-semibold text-text-primary">
          {Math.round(explainability.confidence)}% confidence
        </Text>
        <Badge
          label={`${explainability.agrees} agree`}
          variant="success"
          size="sm"
        />
        <Badge
          label={`${explainability.disagrees} disagree`}
          variant="danger"
          size="sm"
        />
        <DataFreshnessBadge fetchedAt={explainability.dataAsOf} />
      </View>

      {factors.length > 0 ? (
        <View className={cn(compact ? 'gap-1' : 'mb-2 gap-1.5')}>
          {factors.map((factor) => (
            <View key={`${factor.label}-${factor.detail}`} className="flex-row gap-2">
              <Text
                variant="caption"
                className={cn(
                  'mt-0.5 font-bold',
                  factor.agrees ? 'text-bullish' : 'text-bearish',
                )}
              >
                {factor.agrees ? '+' : '−'}
              </Text>
              <View className="flex-1">
                <Text variant="caption" className="font-medium text-text-primary">
                  {factor.label}
                </Text>
                {!compact ? (
                  <Text variant="caption" className="leading-relaxed text-text-secondary">
                    {factor.detail}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {!compact && explainability.reasoning ? (
        <Text variant="body-sm" className="mb-2 leading-relaxed text-text-secondary">
          {explainability.reasoning}
        </Text>
      ) : null}

      {compact && explainability.reasoning ? (
        <Text variant="caption" className="mb-1 leading-relaxed" numberOfLines={2}>
          {explainability.reasoning}
        </Text>
      ) : null}

      <Text variant="caption" className="text-text-tertiary">
        As of {formatRelativeTime(explainability.dataAsOf)}
      </Text>
    </View>
  );
}
