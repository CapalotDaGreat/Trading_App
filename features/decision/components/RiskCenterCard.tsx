import { View } from 'react-native';

import type { ImpactLevel, RiskCenterSnapshot } from '@/features/decision/types/decision.types';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { formatRelativeTime } from '@/shared/utils/date';
import { formatPercent } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

interface RiskCenterCardProps {
  data: RiskCenterSnapshot;
}

const CORRELATION_VARIANT: Record<ImpactLevel, 'success' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

function riskTone(score: number): {
  label: string;
  barClass: string;
  textClass: string;
  badge: 'success' | 'warning' | 'danger';
} {
  if (score <= 33) {
    return {
      label: 'Healthy',
      barClass: 'bg-bullish',
      textClass: 'text-bullish',
      badge: 'success',
    };
  }
  if (score <= 66) {
    return {
      label: 'Elevated',
      barClass: 'bg-warning',
      textClass: 'text-warning',
      badge: 'warning',
    };
  }
  return {
    label: 'Stressed',
    barClass: 'bg-bearish',
    textClass: 'text-bearish',
    badge: 'danger',
  };
}

export function RiskCenterCard({ data }: RiskCenterCardProps) {
  const score = Math.max(0, Math.min(100, Math.round(data.riskScore)));
  const tone = riskTone(score);

  return (
    <GlassCard className="p-4" glow>
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text variant="label" className="mb-1">
            Risk Center
          </Text>
          <Text variant="caption">{data.holdingsCount} holdings</Text>
        </View>
        <Badge label={tone.label} variant={tone.badge} size="sm" />
      </View>

      <View className="mb-4 items-center">
        <Text variant="price-lg" className={tone.textClass}>
          {score}
        </Text>
        <Text variant="caption" className="mb-3 uppercase tracking-wide">
          Risk score
        </Text>
        <View className="h-3 w-full overflow-hidden rounded-full bg-surface-active">
          <View
            className={cn('h-full rounded-full', tone.barClass)}
            style={{ width: `${score}%` }}
          />
        </View>
      </View>

      {data.sectorExposure.length > 0 ? (
        <View className="mb-4 gap-2.5">
          <Text variant="caption" className="font-semibold uppercase tracking-wide">
            Sector exposure
          </Text>
          {data.sectorExposure.map((sector) => {
            const width = Math.max(0, Math.min(100, sector.percent));
            return (
              <View key={sector.label}>
                <View className="mb-1 flex-row items-center justify-between">
                  <Text variant="caption" className="text-text-primary">
                    {sector.label}
                  </Text>
                  <Text variant="caption">
                    {formatPercent(width, { showSign: false, decimals: 1 })}
                  </Text>
                </View>
                <View className="h-2 overflow-hidden rounded-full bg-surface-active">
                  <View
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${width}%` }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      <View className="mb-3 flex-row flex-wrap gap-3">
        <MetricChip
          label="Cash"
          value={formatPercent(data.cashPercent, { showSign: false, decimals: 1 })}
        />
        <MetricChip label="Beta" value={data.betaEstimate.toFixed(2)} />
        <View className="flex-row items-center gap-1.5">
          <Text variant="caption">Correlation</Text>
          <Badge
            label={data.correlation}
            variant={CORRELATION_VARIANT[data.correlation]}
            size="sm"
          />
        </View>
      </View>

      {data.concentrationWarning ? (
        <Text variant="caption" className="mb-2 leading-relaxed text-warning">
          {data.concentrationWarning}
        </Text>
      ) : null}

      <Text variant="body-sm" className="mb-2 leading-relaxed text-text-secondary">
        {data.recommendation}
      </Text>
      <Text variant="caption" className="text-text-tertiary">
        Updated {formatRelativeTime(data.asOf)}
      </Text>
    </GlassCard>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-lg border border-border/60 bg-surface/30 px-2.5 py-1.5">
      <Text variant="caption" className="mb-0.5">
        {label}
      </Text>
      <Text variant="caption" className="font-semibold text-text-primary">
        {value}
      </Text>
    </View>
  );
}
