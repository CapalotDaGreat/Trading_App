import { View } from 'react-native';

import { ExplainabilityBlock } from '@/features/decision/components/ExplainabilityBlock';
import type {
  DecisionBias,
  ImpactLevel,
  RegimeSnapshot,
} from '@/features/decision/types/decision.types';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { formatRelativeTime } from '@/shared/utils/date';

interface RegimeCardProps {
  regime: RegimeSnapshot;
}

const IMPACT_VARIANT: Record<ImpactLevel, 'success' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

const TREND_VARIANT: Record<DecisionBias, 'success' | 'danger' | 'default'> = {
  bullish: 'success',
  bearish: 'danger',
  neutral: 'default',
};

export function RegimeCard({ regime }: RegimeCardProps) {
  return (
    <GlassCard className="p-4" glow>
      <View className="mb-3 flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text variant="label" className="mb-1">
            Market Regime
          </Text>
          <Text variant="h3">{regime.label}</Text>
        </View>
        <View className="items-end gap-1.5">
          <Badge
            label={`Vol ${regime.volatility}`}
            variant={IMPACT_VARIANT[regime.volatility]}
            size="sm"
          />
          <Badge label={regime.trend} variant={TREND_VARIANT[regime.trend]} size="sm" />
        </View>
      </View>

      <View className="mb-3 flex-row flex-wrap gap-2">
        <Badge
          label={`Liquidity ${regime.liquidity}`}
          variant={IMPACT_VARIANT[regime.liquidity]}
          size="sm"
        />
        {regime.fearGreed !== undefined ? (
          <Badge label={`F&G ${regime.fearGreed}`} variant="outline" size="sm" />
        ) : null}
      </View>

      {regime.bestStrategies.length > 0 ? (
        <View className="mb-3">
          <Text variant="caption" className="mb-1.5 font-semibold uppercase tracking-wide">
            Best strategies
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {regime.bestStrategies.map((strategy) => (
              <Badge key={strategy} label={strategy} variant="success" size="sm" />
            ))}
          </View>
        </View>
      ) : null}

      {regime.avoidStrategies.length > 0 ? (
        <View className="mb-3">
          <Text variant="caption" className="mb-1.5 font-semibold uppercase tracking-wide">
            Avoid
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {regime.avoidStrategies.map((strategy) => (
              <Badge key={strategy} label={strategy} variant="danger" size="sm" />
            ))}
          </View>
        </View>
      ) : null}

      <ExplainabilityBlock explainability={regime.explainability} />

      <Text variant="caption" className="mt-2 text-text-tertiary">
        Regime as of {formatRelativeTime(regime.asOf)}
      </Text>
    </GlassCard>
  );
}
