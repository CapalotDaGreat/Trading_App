import type { ReplayTvScores } from '@/features/decision-replay-tv/types/replay-tv.types';
import { MetricRow } from '@/shared/components/patterns/MetricRow';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { TRUST_LANGUAGE } from '@/shared/constants/trust-language';

export function ReplayTvReportCard({ scores }: { scores: ReplayTvScores }) {
  return (
    <Surface padding="md" testID="replay-tv-report">
      <Text variant="caption" className="mb-1 font-medium text-text-tertiary">
        Decision Replay Report
      </Text>
      <Text variant="h3" headingLevel={2}>
        {TRUST_LANGUAGE.dqs.short} {scores.overall}
      </Text>
      <Text variant="body-sm" className="mt-1 leading-6 text-text-secondary">
        {TRUST_LANGUAGE.dqs.meaning} Never a profitability score.
      </Text>
      <MetricRow label="Process quality" value={String(scores.processQuality)} />
      <MetricRow label="Evidence quality" value={String(scores.evidenceQuality)} />
      <MetricRow label="Invalidation quality" value={String(scores.invalidationClarity)} />
      <MetricRow label="Adaptability" value={String(scores.adaptability)} />
      <MetricRow label="Patience" value={String(scores.patience)} />
      <MetricRow label="Consistency" value={String(scores.consistency)} />
      <MetricRow label="Research efficiency" value={String(scores.researchEfficiency)} />
    </Surface>
  );
}
