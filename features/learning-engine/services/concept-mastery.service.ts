import { SPACED_INTERVAL_DAYS } from '../content/learning-graph';
import type { ConceptMastery, ConceptMasteryState } from '../types/learning-engine.types';
import type { ConceptEvidenceSlice } from './learning-evidence.service';
import { getConcept } from './learning-graph.service';

const DAY = 24 * 60 * 60 * 1000;

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function nextSpacedDueAt(lastSuccessAt: number, successCount: number): number {
  const index = Math.min(Math.max(successCount - 1, 0), SPACED_INTERVAL_DAYS.length - 1);
  return lastSuccessAt + SPACED_INTERVAL_DAYS[index]! * DAY;
}

export function isSpacedReviewDue(mastery: ConceptMastery, now: number): boolean {
  if (!mastery.nextDueAt || mastery.lastSuccessAt == null) return false;
  if (mastery.state === 'not_started') return false;
  return now >= mastery.nextDueAt;
}

/**
 * Mastery is demonstrated performance. Reading a lesson only yields `exposed`.
 */
export function scoreConceptMastery(slice: ConceptEvidenceSlice, now = Date.now()): ConceptMastery {
  const node = getConcept(slice.conceptId);
  const title = node?.title ?? slice.conceptId;
  const quizN = slice.quizAttempts;
  const drillN = slice.drillAttempts;
  const demonstratedN = quizN + drillN + slice.replayCompletions;
  const quizHits = Math.max(0, quizN - slice.quizMisses);
  const drillHits = Math.max(0, drillN - slice.drillMisses);
  const replayHit = slice.replayBest != null && slice.replayBest >= 60 ? 1 : 0;
  const hits = quizHits + drillHits + replayHit;
  const score = demonstratedN === 0 ? null : clamp((hits / Math.max(1, quizN + drillN + (slice.replayBest != null ? 1 : 0))) * 100);

  const missRate =
    quizN + drillN >= 2 ? (slice.quizMisses + slice.drillMisses) / Math.max(1, quizN + drillN) : 0;

  let state: ConceptMasteryState = 'not_started';
  const evidence: string[] = [];

  if (demonstratedN === 0 && slice.lessonRead) {
    state = 'exposed';
    evidence.push('The lesson was read. That is exposure, not demonstrated skill.');
  } else if (demonstratedN === 0) {
    state = 'not_started';
    evidence.push('No quiz, exercise, replay, or simulation evidence yet.');
  } else if (missRate >= 0.5 && quizN + drillN >= 2) {
    state = 'developing';
    evidence.push(
      `${slice.quizMisses + slice.drillMisses} misses in ${quizN + drillN} checks. A completed lesson does not override this.`,
    );
  } else if (score != null && score >= 70 && demonstratedN >= 3) {
    state = 'demonstrated';
    evidence.push(`${demonstratedN} demonstrated attempts with about ${score}% process accuracy.`);
  } else {
    state = 'practicing';
    evidence.push(`${demonstratedN} practice signal${demonstratedN === 1 ? '' : 's'} so far.`);
  }

  if (slice.replayCompletions > 0) {
    evidence.push(
      slice.replayBest != null
        ? `Replay process best ${slice.replayBest}. Process — not P/L — counts.`
        : 'A related historical room was completed.',
    );
  }

  const lastSuccessAt = slice.lastSuccessAt;
  return {
    conceptId: slice.conceptId,
    title,
    state,
    score,
    evidence,
    lastPracticedAt: slice.lastPracticedAt,
    lastSuccessAt,
    successCount: slice.successCount,
    nextDueAt: lastSuccessAt != null ? nextSpacedDueAt(lastSuccessAt, Math.max(1, slice.successCount)) : null,
  };
}

export function scoreAllConceptMastery(
  byConcept: Record<string, ConceptEvidenceSlice>,
  now = Date.now(),
): ConceptMastery[] {
  return Object.values(byConcept).map((slice) => scoreConceptMastery(slice, now));
}
