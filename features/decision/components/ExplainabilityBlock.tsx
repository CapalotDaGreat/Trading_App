import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DataFreshnessBadge } from '@/features/decision/components/DataFreshnessBadge';
import type { Explainability } from '@/features/decision/types/decision.types';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { formatRelativeTime } from '@/shared/utils/date';
import { cn } from '@/shared/utils/cn';

interface ExplainabilityBlockProps {
  explainability: Explainability;
  compact?: boolean;
  /** When true (default), details stay hidden until tapped. */
  defaultCollapsed?: boolean;
  className?: string;
}

export function ExplainabilityBlock({
  explainability,
  compact = false,
  defaultCollapsed = true,
  className,
}: ExplainabilityBlockProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(!defaultCollapsed);
  const factors = compact ? explainability.factors.slice(0, 4) : explainability.factors;
  const score = Math.round(explainability.confidence);
  const present = factors.filter((f) => f.agrees);
  const missing = factors.filter((f) => !f.agrees);

  return (
    <View
      className={cn(
        'rounded-2xl bg-surface',
        compact ? 'p-2.5' : 'p-3',
        className,
      )}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between gap-2"
      >
        <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
          <Text variant="caption" className="font-semibold text-text-primary">
            Decision quality · {score}%
          </Text>
          <DataFreshnessBadge fetchedAt={explainability.dataAsOf} />
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.text.tertiary}
        />
      </Pressable>

      {!open ? (
        <Text variant="caption" className="mt-1 text-text-tertiary" numberOfLines={1}>
          Process fit — not a price prediction · tap for factors
        </Text>
      ) : (
        <View className="mt-2">
          {present.length > 0 ? (
            <View className={cn(compact ? 'mb-1.5 gap-1' : 'mb-2 gap-1.5')}>
              <Text variant="caption" className="font-semibold text-bullish">
                Based on
              </Text>
              {present.map((factor) => (
                <View key={`${factor.label}-${factor.detail}`} className="flex-row gap-2">
                  <Text variant="caption" className="mt-0.5 font-bold text-bullish">
                    ✓
                  </Text>
                  <View className="flex-1">
                    <Text variant="caption" className="font-medium text-text-primary">
                      {factor.label}
                    </Text>
                    <Text variant="caption" className="leading-relaxed text-text-secondary">
                      {factor.detail}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {missing.length > 0 ? (
            <View className={cn(compact ? 'mb-1.5 gap-1' : 'mb-2 gap-1.5')}>
              <Text variant="caption" className="font-semibold text-warning">
                Missing
              </Text>
              {missing.map((factor) => (
                <View key={`${factor.label}-${factor.detail}`} className="flex-row gap-2">
                  <Text variant="caption" className="mt-0.5 font-bold text-warning">
                    ⚠
                  </Text>
                  <View className="flex-1">
                    <Text variant="caption" className="font-medium text-text-primary">
                      {factor.label}
                    </Text>
                    <Text variant="caption" className="leading-relaxed text-text-secondary">
                      {factor.detail}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {explainability.reasoning ? (
            <Text
              variant={compact ? 'caption' : 'body-sm'}
              className="mb-2 leading-relaxed text-text-secondary"
            >
              {explainability.reasoning}
            </Text>
          ) : null}

          {explainability.counterfactuals?.length ? (
            <View className="mb-2 gap-1.5">
              <Text variant="caption" className="font-semibold text-text-primary">
                What would flip this?
              </Text>
              {explainability.counterfactuals.map((cf) => (
                <View key={cf.label}>
                  <Text variant="caption" className="font-medium text-text-primary">
                    {cf.label}
                  </Text>
                  <Text variant="caption" className="text-text-secondary">
                    {cf.detail}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text variant="caption" className="text-text-tertiary">
            As of {formatRelativeTime(explainability.dataAsOf)}
          </Text>
        </View>
      )}
    </View>
  );
}
