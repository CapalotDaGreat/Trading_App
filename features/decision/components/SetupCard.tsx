import { Pressable, View } from 'react-native';

import { ExplainabilityBlock } from '@/features/decision/components/ExplainabilityBlock';
import type {
  DecisionBias,
  ImpactLevel,
  SetupCardData,
  SetupStatus,
} from '@/features/decision/types/decision.types';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { formatPercent, formatPrice, getPriceColorClass } from '@/shared/utils/format';

interface SetupCardProps {
  setup: SetupCardData;
  onPress?: () => void;
}

const BIAS_VARIANT: Record<DecisionBias, 'success' | 'danger' | 'default'> = {
  bullish: 'success',
  bearish: 'danger',
  neutral: 'default',
};

const RISK_VARIANT: Record<ImpactLevel, 'success' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

const STATUS_VARIANT: Record<SetupStatus, 'accent' | 'default' | 'success' | 'danger'> = {
  watching: 'default',
  forming: 'accent',
  confirmed: 'success',
  invalidated: 'danger',
};

export function SetupCard({ setup, onPress }: SetupCardProps) {
  const changeColor =
    setup.changePercent !== undefined
      ? getPriceColorClass(setup.changePercent)
      : 'text-text-secondary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${setup.symbol} setup ${setup.title}`}
      onPress={onPress}
      disabled={!onPress}
    >
      <GlassCard className="mb-3 p-4" glow>
        <View className="mb-2 flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <View className="mb-1 flex-row flex-wrap items-center gap-2">
              <Text variant="h3">{setup.symbol}</Text>
              <Badge label={setup.bias} variant={BIAS_VARIANT[setup.bias]} size="sm" />
              <Badge label={setup.status} variant={STATUS_VARIANT[setup.status]} size="sm" />
            </View>
            <Text variant="body-sm" className="text-text-primary">
              {setup.title}
            </Text>
          </View>

          <View className="items-end">
            <Text variant="caption" className="mb-0.5 text-accent">
              {Math.round(setup.confidence)}%
            </Text>
            {setup.lastPrice !== undefined ? (
              <Text variant="mono" className="text-text-primary">
                {formatPrice(setup.lastPrice)}
              </Text>
            ) : null}
            {setup.changePercent !== undefined ? (
              <Text variant="caption" className={changeColor}>
                {formatPercent(setup.changePercent)}
              </Text>
            ) : null}
          </View>
        </View>

        {setup.why.length > 0 ? (
          <View className="mb-3 gap-1">
            <Text variant="caption" className="font-semibold uppercase tracking-wide">
              Why
            </Text>
            {setup.why.slice(0, 4).map((reason) => (
              <Text key={reason} variant="caption" className="leading-relaxed">
                • {reason}
              </Text>
            ))}
          </View>
        ) : null}

        <View className="mb-3 flex-row flex-wrap items-center gap-2">
          <Badge label={`Risk ${setup.risk}`} variant={RISK_VARIANT[setup.risk]} size="sm" />
          {setup.invalidation ? (
            <Text variant="caption" className="flex-1 text-bearish" numberOfLines={2}>
              Invalidation: {setup.invalidation}
            </Text>
          ) : null}
        </View>

        {setup.entryZone ? (
          <Text variant="caption" className="mb-3 text-text-secondary">
            Entry {formatPrice(setup.entryZone.low)} – {formatPrice(setup.entryZone.high)}
          </Text>
        ) : null}

        <ExplainabilityBlock explainability={setup.explainability} compact />
      </GlassCard>
    </Pressable>
  );
}
