import { View } from 'react-native';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

import type { DecisionLogSummary } from '../services/decision-log.service';

interface DecisionLogCardProps {
  summary: DecisionLogSummary;
  className?: string;
}

export function DecisionLogCard({ summary, className }: DecisionLogCardProps) {
  return (
    <GlassCard className={className ?? 'p-4'}>
      <View className="mb-2 flex-row items-center justify-between">
        <Text variant="h3">Process score</Text>
        <Text variant="price" className="text-accent">
          {summary.processScore}
        </Text>
      </View>
      <Text variant="caption" className="text-text-secondary">
        Last 7 days · {summary.researched} researched · {summary.skipped} skipped ·{' '}
        {summary.journaled} journaled
      </Text>
      {summary.insight ? (
        <Text variant="body-sm" className="mt-2">
          {summary.insight}
        </Text>
      ) : null}
    </GlassCard>
  );
}
