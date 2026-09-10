import {
  isExposureOnlyRecord,
  isIndependentEvidence,
  scoreTransferEvidence,
} from '@/features/competency';
import type { CompetencyEvidenceRecord, CompetencyMastery } from '@/features/competency';

import type {
  ConceptLongitudinalSlice,
  ImprovementDirection,
  LearnerLongitudinalProfile,
  LongitudinalStrongestEvidence,
} from '../types/learner-model.types';

const WEAKNESS_FLAGS: Array<{
  flag: keyof NonNullable<NonNullable<CompetencyEvidenceRecord['processMetrics']>['flags']>;
  label: string;
}> = [
  { flag: 'missingThesis', label: 'missing thesis' },
  { flag: 'missingInvalidation', label: 'missing invalidation' },
  { flag: 'missingEvidence', label: 'missing evidence' },
  { flag: 'movedInvalidation', label: 'moved invalidation' },
  { flag: 'exceededRiskLimit', label: 'exceeded risk limit' },
  { flag: 'fomoEntry', label: 'impulse entry' },
];

function forConcept(records: readonly CompetencyEvidenceRecord[], conceptId: string): CompetencyEvidenceRecord[] {
  return records.filter((item) => item.conceptId === conceptId).sort((a, b) => a.occurredAt - b.occurredAt);
}

function strongestOf(records: readonly CompetencyEvidenceRecord[]): LongitudinalStrongestEvidence | null {
  const ranked = records
    .filter((item) => item.result === 'pass' && !isExposureOnlyRecord(item))
    .slice()
    .sort((a, b) => {
      const aInd = isIndependentEvidence(a) ? 1 : 0;
      const bInd = isIndependentEvidence(b) ? 1 : 0;
      if (bInd !== aInd) return bInd - aInd;
      return b.reliability - a.reliability || b.occurredAt - a.occurredAt;
    });
  const top = ranked[0];
  if (!top) return null;
  return {
    sourceType: top.sourceType,
    occurredAt: top.occurredAt,
    reliability: top.reliability,
    evidenceLayer: top.evidenceLayer,
  };
}

function improvementOf(records: readonly CompetencyEvidenceRecord[]): ImprovementDirection {
  const graded = records.filter(
    (item) =>
      !isExposureOnlyRecord(item) &&
      (item.result === 'pass' || item.result === 'fail') &&
      isIndependentEvidence(item),
  );
  if (graded.length < 4) return 'insufficient';
  const mid = Math.floor(graded.length / 2);
  const early = graded.slice(0, mid);
  const late = graded.slice(mid);
  const rate = (rows: CompetencyEvidenceRecord[]) =>
    rows.filter((item) => item.result === 'pass').length / Math.max(1, rows.length);
  const delta = rate(late) - rate(early);
  if (delta >= 0.15) return 'improving';
  if (delta <= -0.15) return 'slipping';
  return 'stable';
}

function recurringWeaknesses(records: readonly CompetencyEvidenceRecord[]): string[] {
  const recent = records.slice(-8);
  const labels: string[] = [];
  for (const row of WEAKNESS_FLAGS) {
    const hits = recent.filter((item) => item.processMetrics?.flags?.[row.flag]).length;
    if (hits >= 2) labels.push(row.label);
  }
  return labels;
}

function diversityOf(records: readonly CompetencyEvidenceRecord[]): ConceptLongitudinalSlice['evidenceDiversity'] {
  const applied = records.filter((item) => !isExposureOnlyRecord(item) && item.result !== 'observed');
  return {
    contextCount: new Set(applied.map((item) => item.scenarioContext ?? 'standard')).size,
    formatCount: new Set(applied.map((item) => item.sourceType)).size,
    assetClassCount: new Set(applied.map((item) => item.assetClass).filter(Boolean)).size,
    sourceIdCount: new Set(applied.map((item) => item.sourceId)).size,
  };
}

export function emptyLongitudinalProfile(): LearnerLongitudinalProfile {
  return { firstEvidenceAt: null, mostRecentEvidenceAt: null, concepts: [] };
}

export function composeLongitudinalProfile(
  records: readonly CompetencyEvidenceRecord[],
  mastery: readonly CompetencyMastery[],
  now: number,
): LearnerLongitudinalProfile {
  const sorted = [...records].sort((a, b) => a.occurredAt - b.occurredAt);
  const concepts = mastery
    .filter((row) => row.state !== 'not_started')
    .map((row) => {
      const mine = forConcept(records, row.conceptId);
      const transfer = scoreTransferEvidence(mine);
      const slice: ConceptLongitudinalSlice = {
        conceptId: row.conceptId,
        firstEvidenceAt: mine[0]?.occurredAt ?? row.lastEvidenceAt,
        strongestEvidence: strongestOf(mine),
        mostRecentEvidenceAt: mine.at(-1)?.occurredAt ?? row.lastEvidenceAt,
        evidenceDiversity: diversityOf(mine),
        recurringWeaknesses: recurringWeaknesses(mine),
        improvement: improvementOf(mine),
        transferProven: transfer.proven,
        retention: {
          previouslyDemonstrated: row.previouslyDemonstrated || row.state === 'demonstrated' || row.state === 'due_for_redemonstration',
          dueForRedemonstration:
            row.state === 'due_for_redemonstration' ||
            Boolean(row.nextRedemonstrationAt && now >= row.nextRedemonstrationAt),
          recency: row.quality.recency,
        },
      };
      return slice;
    })
    .sort((a, b) => (b.mostRecentEvidenceAt ?? 0) - (a.mostRecentEvidenceAt ?? 0));

  return {
    firstEvidenceAt: sorted[0]?.occurredAt ?? null,
    mostRecentEvidenceAt: sorted.at(-1)?.occurredAt ?? null,
    concepts,
  };
}
