import { isExposureOnlyRecord, isIndependentEvidence } from '@/features/competency';
import type { CompetencyEvidenceRecord } from '@/features/competency';

import type {
  ConceptLongitudinalSlice,
  DevelopmentHistoryView,
  LearnerConceptState,
  LearnerModelSnapshot,
  LearnerPracticeSuggestion,
} from '../types/learner-model.types';

function independentFor(
  records: readonly CompetencyEvidenceRecord[],
  conceptId: string,
): CompetencyEvidenceRecord[] {
  return records
    .filter(
      (item) =>
        item.conceptId === conceptId &&
        !isExposureOnlyRecord(item) &&
        isIndependentEvidence(item) &&
        (item.result === 'pass' || item.result === 'fail'),
    )
    .sort((a, b) => a.occurredAt - b.occurredAt);
}

function earlierLine(slice: ConceptLongitudinalSlice | undefined, independent: CompetencyEvidenceRecord[]): string | null {
  const weakness = slice?.recurringWeaknesses[0];
  if (weakness === 'missing invalidation') return 'You frequently omitted invalidation.';
  if (weakness === 'missing thesis') return 'You frequently omitted a written thesis.';
  if (weakness === 'impulse entry') return 'Several earlier decisions were recorded shortly after a fast move, without a written plan.';
  if (weakness) return `You frequently recorded ${weakness}.`;
  if (independent.length < 4) return null;
  const mid = Math.floor(independent.length / 2);
  const early = independent.slice(0, Math.max(1, mid));
  const earlyPass = early.filter((item) => item.result === 'pass').length / early.length;
  if (earlyPass < 0.5) return 'Earlier independent scenarios often missed this process.';
  return 'Earlier evidence on this concept was still developing.';
}

function recentlyLine(independent: CompetencyEvidenceRecord[], improvement: ConceptLongitudinalSlice['improvement'] | undefined): string | null {
  const window = independent.slice(-8);
  if (window.length >= 4) {
    const passes = window.filter((item) => item.result === 'pass').length;
    return `You have applied this correctly in ${passes} of your last ${window.length} independent scenarios.`;
  }
  if (improvement === 'improving') return 'Recent independent attempts show improvement.';
  return null;
}

function nextLine(
  concept: LearnerConceptState | undefined,
  suggestion: LearnerPracticeSuggestion | undefined,
  slice: ConceptLongitudinalSlice | undefined,
): string {
  if (suggestion?.reason) return suggestion.reason;
  if (concept?.nextReason) return concept.nextReason;
  const title = concept?.title ?? 'this process';
  if (slice?.retention.dueForRedemonstration) {
    return `Revisit ${title} — evidence is due for re-demonstration.`;
  }
  if (slice && !slice.transferProven) {
    return `Demonstrate ${title} under a different context.`;
  }
  return `Continue practicing ${title} in a new scenario.`;
}

function pickConceptId(
  concepts: readonly LearnerConceptState[],
  longitudinal: readonly ConceptLongitudinalSlice[],
  nextPractice: readonly LearnerPracticeSuggestion[],
  records: readonly CompetencyEvidenceRecord[],
): string | null {
  const scored = (id: string) => {
    const slice = longitudinal.find((row) => row.conceptId === id);
    const independent = independentFor(records, id);
    const hasTrend = independent.length >= 4 || (slice?.recurringWeaknesses.length ?? 0) > 0;
    return hasTrend ? independent.length + (slice?.recurringWeaknesses.length ?? 0) * 2 : 0;
  };

  const preferred = nextPractice[0]?.conceptId;
  if (preferred && scored(preferred) > 0) return preferred;

  const ranked = concepts
    .map((row) => ({ id: row.conceptId, score: scored(row.conceptId) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.id ?? null;
}

export function composeDevelopmentHistory(
  model: Pick<LearnerModelSnapshot, 'concepts' | 'longitudinal' | 'nextPractice'>,
  records: readonly CompetencyEvidenceRecord[],
): DevelopmentHistoryView | null {
  const conceptId = pickConceptId(model.concepts, model.longitudinal.concepts, model.nextPractice, records);
  if (!conceptId) return null;

  const concept = model.concepts.find((row) => row.conceptId === conceptId);
  const slice = model.longitudinal.concepts.find((row) => row.conceptId === conceptId);
  const independent = independentFor(records, conceptId);
  const earlier = earlierLine(slice, independent);
  const recently = recentlyLine(independent, slice?.improvement);
  if (!earlier || !recently) return null;

  const suggestion = model.nextPractice.find((item) => item.conceptId === conceptId) ?? model.nextPractice[0];
  return {
    conceptId,
    title: concept?.title ?? conceptId,
    earlier,
    recently,
    next: nextLine(concept, suggestion, slice),
    href: suggestion?.href ?? concept?.nextHref,
  };
}
