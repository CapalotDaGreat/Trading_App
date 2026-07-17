import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ImpactLevel, RiskCenterSnapshot } from '@/features/decision/types/decision.types';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { formatRelativeTime } from '@/shared/utils/date';
import { formatPercent } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

interface RiskCenterCardProps {
  data: RiskCenterSnapshot;
  /** Compact home-friendly mode: score + recommendation only until expanded. */
  compact?: boolean;
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
      label: 'OK',
      barClass: 'bg-bullish',
      textClass: 'text-bullish',
      badge: 'success',
    };
  }
  if (score <= 66) {
    return {
      label: 'Watch',
      barClass: 'bg-warning',
      textClass: 'text-warning',
      badge: 'warning',
    };
  }
  return {
    label: 'High',
    barClass: 'bg-bearish',
    textClass: 'text-bearish',
    badge: 'danger',
  };
}

export function RiskCenterCard({ data, compact = false }: RiskCenterCardProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(!compact);
  const score = Math.max(0, Math.min(100, Math.round(data.riskScore)));
  const tone = riskTone(score);

  return (
    <GlassCard className="p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <View>
          <Text variant="caption" className="mb-1 text-text-tertiary">
            Portfolio health
          </Text>
          <Text variant="h3">
            {data.health?.healthScore != null
              ? `${data.health.healthScore} health · risk ${score}`
              : `${score} · ${tone.label}`}
          </Text>
        </View>
        <Badge label={tone.label} variant={tone.badge} size="sm" />
      </View>

      <View className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-active">
        <View className={cn('h-full rounded-full', tone.barClass)} style={{ width: `${score}%` }} />
      </View>

      <Text variant="body-sm" className="mb-2 leading-relaxed text-text-secondary">
        {data.recommendation}
      </Text>

      {data.health?.stressTest ? (
        <Text variant="caption" className="mb-2 leading-relaxed text-text-tertiary">
          Stress: {data.health.stressTest}
        </Text>
      ) : null}

      {data.concentrationWarning ? (
        <Text variant="caption" className="mb-2 leading-relaxed text-warning">
          {data.concentrationWarning}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between pt-3"
      >
        <Text variant="caption" className="font-semibold text-text-secondary">
          {open ? 'Hide exposure details' : 'Show exposure details'}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.text.tertiary}
        />
      </Pressable>

      {open ? (
        <View className="mt-3 gap-3">
          {data.sectorExposure.length > 0 ? (
            <View className="gap-2.5">
              <Text variant="caption" className="font-semibold text-text-secondary">
                Where the money sits
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
                        {formatPercent(width, { showSign: false, decimals: 0 })}
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

          <View className="flex-row flex-wrap gap-3">
            <MetricChip
              label="Cash"
              value={formatPercent(data.cashPercent, { showSign: false, decimals: 0 })}
            />
            <MetricChip label="Beta" value={data.betaEstimate.toFixed(2)} />
            <View className="flex-row items-center gap-1.5">
              <Text variant="caption">Moves together</Text>
              <Badge
                label={data.correlation}
                variant={CORRELATION_VARIANT[data.correlation]}
                size="sm"
              />
            </View>
          </View>

          <Text variant="caption" className="text-text-tertiary">
            {data.holdingsCount} holdings · updated {formatRelativeTime(data.asOf)}
          </Text>
        </View>
      ) : null}
    </GlassCard>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-full bg-surface px-2.5 py-1.5">
      <Text variant="caption" className="mb-0.5">
        {label}
      </Text>
      <Text variant="caption" className="font-semibold text-text-primary">
        {value}
      </Text>
    </View>
  );
}
