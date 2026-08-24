import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { MetricRow } from '@/shared/components/patterns/MetricRow';
import { TRUST_LANGUAGE } from '@/shared/constants/trust-language';

import type { DecisionLogSummary } from '../services/decision-log.service';

interface DecisionLogCardProps {
  summary: DecisionLogSummary;
  className?: string;
}

export function DecisionLogCard({ summary, className }: DecisionLogCardProps) {
  return (
    <GlassCard className={className ?? 'p-4'}>
      <Text variant="caption" className="mb-1 font-medium text-text-tertiary">
        Process quality
      </Text>
      <MetricRow
        label={TRUST_LANGUAGE.dqs.short}
        value={String(summary.processScore)}
        detail={TRUST_LANGUAGE.dqs.meaning}
      />
      <Text variant="caption" className="mt-1 text-text-secondary">
        Last 7 days · {summary.researched} researched · {summary.skipped} skipped ·{' '}
        {summary.ignored} dismissed · {summary.journaled} journaled
      </Text>
      {summary.insight ? (
        <Text variant="body-sm" className="mt-2">
          {summary.insight}
        </Text>
      ) : null}
    </GlassCard>
  );
}
