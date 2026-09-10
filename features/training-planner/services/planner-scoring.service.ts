import { activityKey } from '@/features/learning-engine/services/concept-handoff.service';
import type { TrainingEngineCandidate } from '@/features/learning-engine/services/training-candidate-pool.service';
import { PRIORITY_RANK } from '@/features/learning-engine/services/training-candidate-pool.service';
import type { CompetencyEvidenceRecord, CompetencyMastery } from '@/features/competency';
import type { MistakeLibrarySnapshot } from '@/features/mistake-library/types/mistake-library.types';
import { plannerScoreDeltaForMistakeLibrary } from '@/features/mistake-library/services/mistake-library.service';

import { sessionFitDelta } from './planner-session.service';
import type { PlannerPriorityBand, TrainingActivityType } from '../types/training-planner.types';
import type { PracticeStage } from '@/features/learning-engine/types/learning-engine.types';

export const BAND_BASE_SCORE: Record<PlannerPriorityBand, number> = {
  critical_remediation: 900,
  overdue_redemonstration: 800,
  in_progress_application: 700,
  weak_competency: 600,
  transfer_practice: 520,
  event_driven: 480,
  new_curriculum: 400,
  varied_practice: 320,
  optional_exploration: 120,
};

export function bandForPriority(
  priority: TrainingEngineCandidate['priority'],
  flags?: { transfer?: boolean; event?: boolean; optional?: boolean },
): PlannerPriorityBand {
  if (flags?.optional || priority === 'optional_exploration') return 'optional_exploration';
  if (flags?.event || priority === 'event_driven') return 'event_driven';
  if (flags?.transfer || priority === 'transfer_practice') return 'transfer_practice';
  if (priority === 'remediation') return 'critical_remediation';
  if (priority === 'redemonstration') return 'overdue_redemonstration';
  if (priority === 'in_progress') return 'in_progress_application';
  if (priority === 'weak_competency') return 'weak_competency';
  if (priority === 'curriculum') return 'new_curriculum';
  return 'varied_practice';
}

export function activityTypeFor(kind: TrainingEngineCandidate['kind'], href: string): TrainingActivityType {
  if (kind === 'continue_lesson') return 'lesson';
  if (kind === 'historical_replay') return 'replay';
  if (kind === 'simulation_challenge' || kind === 'redemonstration') {
    return href.includes('replay-tv') ? 'replay' : 'simulation';
  }
  if (kind === 'journal_review') return href.includes('/review') ? 'review' : 'journal';
  if (kind === 'event_prep') return 'event';
  if (kind === 'remediation' || kind === 'chart_exercise' || kind === 'review_concept' || kind === 'spaced_review') {
    if (href.startsWith('/academy')) return 'lesson';
    if (href.includes('replay-tv')) return 'replay';
    if (href.startsWith('/simulate')) return 'simulation';
    if (href.startsWith('/journal')) return 'journal';
    if (href.startsWith('/practice')) return 'practice';
    return 'practice';
  }
  if (href === '/practice') return 'exploration';
  return 'practice';
}

export interface ScoreContext {
  now: number;
  recentActivityKeys: string[];
  evidence: CompetencyEvidenceRecord[];
  competency: CompetencyMastery[];
  sessionBudgetMinutes: number;
  grinding: boolean;
  mistakeLibrary?: MistakeLibrarySnapshot;
  stage?: PracticeStage;
}

const VOLUME_WINDOW_DAYS = 14;

/** Graded attempts on a concept in the last two weeks. Completions and hours are ignored. */
export function recentConceptActivityCount(
  evidence: CompetencyEvidenceRecord[],
  conceptId: string | undefined,
  now: number,
): number {
  if (!conceptId) return 0;
  const windowStart = now - VOLUME_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return evidence.filter(
    (row) =>
      row.conceptId === conceptId &&
      row.occurredAt >= windowStart &&
      row.result !== 'observed' &&
      row.sourceType !== 'lesson_completion',
  ).length;
}

function daysSince(at: number | null | undefined, now: number): number | null {
  if (!at) return null;
  return Math.floor((now - at) / (24 * 60 * 60 * 1000));
}

export function recentFailCount(evidence: CompetencyEvidenceRecord[], conceptId: string | undefined, now: number): number {
  if (!conceptId) return 0;
  const windowStart = now - 14 * 24 * 60 * 60 * 1000;
  return evidence.filter(
    (row) => row.conceptId === conceptId && row.result === 'fail' && row.occurredAt >= windowStart,
  ).length;
}

export function passContextCount(evidence: CompetencyEvidenceRecord[], conceptId: string | undefined): number {
  if (!conceptId) return 0;
  const contexts = new Set(
    evidence
      .filter(
        (row) =>
          row.conceptId === conceptId &&
          row.result === 'pass' &&
          (row.sourceType === 'simulation_decision' ||
            row.sourceType === 'replay_decision' ||
            row.sourceType === 're_demonstration'),
      )
      .map((row) => row.scenarioContext ?? 'standard'),
  );
  return contexts.size;
}

export function scorePlannerCandidate(
  candidate: TrainingEngineCandidate,
  estimatedMinutes: number,
  ctx: ScoreContext,
): { score: number; band: PlannerPriorityBand } {
  const transfer = candidate.priority === 'transfer_practice' || candidate.id.startsWith('transfer-');
  const event = candidate.priority === 'event_driven' || candidate.kind === 'event_prep';
  const optional = candidate.priority === 'optional_exploration' || candidate.id === 'explore-library';
  const band = bandForPriority(candidate.priority, { transfer, event, optional });
  let score = BAND_BASE_SCORE[band];

  const mastery = candidate.conceptId
    ? ctx.competency.find((row) => row.conceptId === candidate.conceptId)
    : undefined;
  const key = activityKey(candidate.href);
  const recentlyOpened = ctx.recentActivityKeys.includes(key);
  const recentConcept = Boolean(
    candidate.conceptId &&
      ctx.recentActivityKeys.some((item) => item.includes(candidate.conceptId!)),
  );
  const fails = recentFailCount(ctx.evidence, candidate.conceptId, ctx.now);
  const contexts = passContextCount(ctx.evidence, candidate.conceptId);
  const staleDays = daysSince(mastery?.lastIndependentSuccessAt ?? mastery?.lastEvidenceAt, ctx.now);
  const critical = band === 'critical_remediation' || band === 'overdue_redemonstration';

  if (recentlyOpened) {
    score += critical && fails >= 2 ? -40 : -240;
  } else if (recentConcept && !critical) {
    score -= 55;
  }

  if (fails >= 2) score += 70;
  const lastFail = ctx.evidence
    .filter((row) => row.conceptId === candidate.conceptId && row.result === 'fail')
    .at(-1);
  if (lastFail && fails >= 2 && candidate.href.includes(lastFail.sourceId)) {
    score -= 180;
  }
  const recentVolume = recentConceptActivityCount(ctx.evidence, candidate.conceptId, ctx.now);
  if (!critical && recentVolume >= 8) score -= 180;
  else if (!critical && recentVolume >= 4) score -= 90;
  if (staleDays != null && staleDays >= 14 && (band === 'overdue_redemonstration' || band === 'transfer_practice')) {
    score += Math.min(50, staleDays);
  }
  if (transfer && contexts >= 2) score -= 160;
  if (mastery?.missingRoles.includes('application') && band === 'in_progress_application') score += 35;
  if (ctx.grinding && (band === 'new_curriculum' || candidate.kind === 'continue_lesson') && !critical) {
    score -= 70;
  }
  if (ctx.grinding && (band === 'varied_practice' || band === 'transfer_practice')) score += 55;

  score += sessionFitDelta(estimatedMinutes, ctx.sessionBudgetMinutes, critical);
  score += Math.min(20, candidate.deferCount * 8);
  score -= PRIORITY_RANK[candidate.priority] * 0.01;
  score += plannerScoreDeltaForMistakeLibrary(
    { href: candidate.href, conceptId: candidate.conceptId },
    ctx.mistakeLibrary,
  );

  return { score, band };
}

export function comparePlannerScores(
  a: { score: number; band: PlannerPriorityBand; id: string },
  b: { score: number; band: PlannerPriorityBand; id: string },
): number {
  if (b.score !== a.score) return b.score - a.score;
  if (BAND_BASE_SCORE[b.band] !== BAND_BASE_SCORE[a.band]) {
    return BAND_BASE_SCORE[b.band] - BAND_BASE_SCORE[a.band];
  }
  return a.id.localeCompare(b.id);
}

export const SIGNAL_COPY =
  /\b(buy|sell)\s+(this|now|[A-Z]{2,5})\b|\bgo (long|short)\b|\benter a (long|short)\b/i;

export function looksLikeTradeSignal(text: string): boolean {
  return SIGNAL_COPY.test(text);
}
