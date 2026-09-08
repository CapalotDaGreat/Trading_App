import type { ReplayTvProcessComparison, ReplayTvScores } from '@/features/decision-replay-tv/types/replay-tv.types';
import { MetricRow } from '@/shared/components/patterns/MetricRow';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { TRUST_LANGUAGE } from '@/shared/constants/trust-language';

export function ReplayTvReportCard({
  scores,
  comparison,
}: {
  scores: ReplayTvScores;
  comparison?: ReplayTvProcessComparison;
}) {
  const process = comparison ?? scores.processComparison;
  return (
    <Surface
      padding="md"
      testID="replay-tv-report"
      accessibilityLabel={`Decision Replay Report. ${TRUST_LANGUAGE.dqs.short} ${scores.overall}. Process quality ${scores.processQuality}. Evidence quality ${scores.evidenceQuality}. Invalidation quality ${scores.invalidationClarity}. Adaptability ${scores.adaptability}. Patience ${scores.patience}. Consistency ${scores.consistency}. Research efficiency ${scores.researchEfficiency}. ${TRUST_LANGUAGE.dqs.meaning} Never a profitability score.`}
    >
      <Text variant="caption" className="mb-1 font-medium text-text-tertiary">
        Decision Replay Report
      </Text>
      <Text variant="h3" headingLevel={2}>
        {TRUST_LANGUAGE.dqs.short} {scores.overall}
      </Text>
      <Text variant="body-sm" className="mt-1 leading-6 text-text-secondary">
        {TRUST_LANGUAGE.dqs.meaning} Never a profitability score. A later path does not prove the
        process.
      </Text>
      <MetricRow label="Process quality" value={String(scores.processQuality)} />
      <MetricRow label="Evidence quality" value={String(scores.evidenceQuality)} />
      <MetricRow label="Invalidation quality" value={String(scores.invalidationClarity)} />
      <MetricRow label="Adaptability" value={String(scores.adaptability)} />
      <MetricRow label="Patience" value={String(scores.patience)} />
      <MetricRow label="Consistency" value={String(scores.consistency)} />
      <MetricRow label="Research efficiency" value={String(scores.researchEfficiency)} />
      {process ? (
        <Text variant="caption" className="mt-3 leading-5 text-text-tertiary">
          Process comparison uses what you knew at each freeze. The historical reconstruction is
          context, not a grade.
        </Text>
      ) : null}
    </Surface>
  );
}
