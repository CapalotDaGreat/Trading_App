import { useId, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ExplainabilityBlock } from '@/features/decision/components/ExplainabilityBlock';
import type { RegimeSnapshot } from '@/features/decision/types/decision.types';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { formatRelativeTime } from '@/shared/utils/date';

interface RegimeCardProps {
  regime: RegimeSnapshot;
}

function plainGuidance(regime: RegimeSnapshot): string {
  const best = regime.bestStrategies[0];
  const avoid = regime.avoidStrategies[0];
  if (best && avoid) {
    return `Conditions fit ${best.toLowerCase()} research. Defer ${avoid.toLowerCase()} for now.`;
  }
  if (best) return `Conditions currently fit ${best.toLowerCase()} research.`;
  return 'Stay selective until the tape clarifies.';
}

export function RegimeCard({ regime }: RegimeCardProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const detailsId = useId();

  return (
    <GlassCard className="p-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Market condition ${regime.label}`}
        accessibilityHint={open ? 'Collapses regime detail' : 'Expands regime detail'}
        accessibilityState={{ expanded: open }}
        aria-controls={detailsId}
        onPress={() => setOpen((v) => !v)}
        className="min-h-11"
      >
        <View className="mb-2 flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text variant="caption" className="mb-1 text-text-tertiary">
              Market condition
            </Text>
            <Text variant="h3" headingLevel={3}>
              {regime.label}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Badge label={regime.trend} variant="outline" size="sm" />
            <Ionicons
              name={open ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.text.tertiary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </View>
        </View>
        <Text variant="body-sm" className="leading-relaxed text-text-secondary">
          {plainGuidance(regime)}
        </Text>
      </Pressable>

      {open ? (
        <View nativeID={detailsId} className="mt-4 gap-3 pt-3">
          <View className="flex-row flex-wrap gap-2">
            <Badge label={`Volatility · ${regime.volatility}`} variant="default" size="sm" />
            <Badge label={`Liquidity · ${regime.liquidity}`} variant="default" size="sm" />
            {regime.fearGreed !== undefined ? (
              <Badge label={`Fear & Greed ${regime.fearGreed}`} variant="outline" size="sm" />
            ) : null}
          </View>

          {regime.bestStrategies.length > 0 ? (
            <View>
              <Text variant="caption" className="mb-1.5 font-semibold text-text-secondary">
                Better research fit now
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {regime.bestStrategies.map((strategy) => (
                  <Badge key={strategy} label={strategy} variant="success" size="sm" />
                ))}
              </View>
            </View>
          ) : null}

          {regime.avoidStrategies.length > 0 ? (
            <View>
              <Text variant="caption" className="mb-1.5 font-semibold text-text-secondary">
                Usually skip
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {regime.avoidStrategies.map((strategy) => (
                  <Badge key={strategy} label={strategy} variant="danger" size="sm" />
                ))}
              </View>
            </View>
          ) : null}

          <ExplainabilityBlock explainability={regime.explainability} />
          <Text variant="caption" className="text-text-tertiary">
            Updated {formatRelativeTime(regime.asOf)}
          </Text>
        </View>
      ) : null}
    </GlassCard>
  );
}
