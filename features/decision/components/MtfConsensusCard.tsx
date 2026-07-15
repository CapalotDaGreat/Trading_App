import { View } from 'react-native';

import type { DecisionBias, MtfConsensus } from '@/features/decision/types/decision.types';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { formatRelativeTime } from '@/shared/utils/date';
import { cn } from '@/shared/utils/cn';

interface MtfConsensusCardProps {
  data: MtfConsensus;
}

const BIAS_VARIANT: Record<DecisionBias, 'success' | 'danger' | 'default'> = {
  bullish: 'success',
  bearish: 'danger',
  neutral: 'default',
};

const BIAS_BAR: Record<DecisionBias, string> = {
  bullish: 'bg-bullish',
  bearish: 'bg-bearish',
  neutral: 'bg-text-tertiary',
};

export function MtfConsensusCard({ data }: MtfConsensusCardProps) {
  const scoreWidth = Math.max(0, Math.min(100, Math.round(data.consensusScore)));

  return (
    <GlassCard className="p-4">
      <View className="mb-3 flex-row items-center justify-between gap-2">
        <View className="flex-1">
          <Text variant="label" className="mb-0.5">
            Multi-timeframe
          </Text>
          <Text variant="h3">{data.symbol}</Text>
        </View>
        <Badge
          label={data.consensus}
          variant={BIAS_VARIANT[data.consensus]}
          size="md"
        />
      </View>

      <View className="mb-4 gap-2">
        {data.frames.map((frame) => (
          <View
            key={frame.interval}
            className="flex-row items-center justify-between gap-2 rounded-lg border border-border/50 bg-surface/20 px-2.5 py-2"
          >
            <Text variant="caption" className="w-12 font-semibold text-text-primary">
              {frame.interval}
            </Text>
            <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-active">
              <View
                className={cn('h-full rounded-full', BIAS_BAR[frame.bias])}
                style={{ width: `${Math.max(8, Math.round(frame.confidence))}%` }}
              />
            </View>
            <Badge label={frame.bias} variant={BIAS_VARIANT[frame.bias]} size="sm" />
            <Text variant="caption" className="w-10 text-right">
              {Math.round(frame.confidence)}%
            </Text>
          </View>
        ))}
      </View>

      <View className="mb-3">
        <View className="mb-1.5 flex-row items-center justify-between">
          <Text variant="caption" className="font-semibold uppercase tracking-wide">
            Consensus score
          </Text>
          <Text variant="caption" className="font-semibold text-accent">
            {scoreWidth}/100
          </Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-surface-active">
          <View
            className={cn('h-full rounded-full', BIAS_BAR[data.consensus])}
            style={{ width: `${scoreWidth}%` }}
          />
        </View>
      </View>

      <Text variant="body-sm" className="mb-2 leading-relaxed text-text-secondary">
        {data.explanation}
      </Text>
      <Text variant="caption" className="text-text-tertiary">
        As of {formatRelativeTime(data.asOf)}
      </Text>
    </GlassCard>
  );
}
