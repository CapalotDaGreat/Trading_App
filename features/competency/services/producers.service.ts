import { DRILL_TO_CONCEPT, LESSON_PRIMARY_CONCEPT } from '@/features/learning-engine/content/learning-graph';
import { logger } from '@/shared/services/observability/logger';

import type {
  CompetencyEvidenceInput,
  CompetencyScenarioContext,
  ProcessFlags,
} from '../types/competency.types';
import { recipeFor } from '../content/demonstration-recipes';
import { resolveCompetencyId } from './taxonomy.service';
import { useCompetencyEvidenceStore } from '../stores/competency-evidence.store';

const CALCULATION_DRILLS = new Set(['position-size', 'rr-compare', 'fx-convert']);

const REPLAY_SKILL_TO_CONCEPT: Record<string, string> = {
  invalidation: 'invalidation',
  thesis_quality: 'thesis',
  risk: 'position-sizing',
  patience: 'discipline',
  event_risk: 'event-risk',
  earnings: 'earnings-events',
  structure: 'chart-interpretation',
  crowd: 'fomo',
  plan: 'following-a-plan',
  gap_risk: 'volatility-aware-risk',
  macro: 'event-risk',
  attention: 'discipline',
  regime: 'trend-identification',
  binary_event: 'event-risk',
};

function recordAll(inputs: CompetencyEvidenceInput[]): void {
  if (!inputs.length) return;
  try {
    useCompetencyEvidenceStore.getState().recordMany(inputs);
  } catch (error) {
    logger.warn('competency.ingest_failed', { error });
  }
}

function resolveIds(raw: Array<string | undefined | null>): string[] {
  const ids = new Set<string>();
  for (const value of raw) {
    if (!value) continue;
    const resolved = resolveCompetencyId(value);
    if (resolved) ids.add(resolved);
  }
  return [...ids];
}

export function ingestLessonCompletion(uid: string, lessonId: string, occurredAt = Date.now()): void {
  const conceptIds = resolveIds([LESSON_PRIMARY_CONCEPT[lessonId], lessonId]);
  if (!conceptIds.length) return;
  recordAll(
    conceptIds.map((conceptId) => ({
      uid,
      conceptId,
      sourceType: 'lesson_completion',
      sourceId: lessonId,
      occurredAt,
      result: 'observed',
      difficulty: 'foundations',
      independent: true,
    })),
  );
}

export function ingestKnowledgeCheck(
  uid: string,
  sourceId: string,
  conceptId: string,
  correct: boolean,
  occurredAt = Date.now(),
): void {
  const resolved = resolveIds([conceptId, LESSON_PRIMARY_CONCEPT[sourceId], sourceId]);
  if (!resolved.length) return;
  recordAll(
    resolved.map((id) => ({
      uid,
      conceptId: id,
      sourceType: 'knowledge_check',
      sourceId,
      occurredAt,
      result: correct ? 'pass' : 'fail',
      difficulty: 'foundations',
      independent: true,
    })),
  );
}

export function ingestLessonExercise(
  uid: string,
  lessonId: string,
  conceptId: string | undefined,
  correct: boolean,
  occurredAt = Date.now(),
): void {
  const ids = resolveIds([conceptId, LESSON_PRIMARY_CONCEPT[lessonId]]);
  if (!ids.length) return;
  const calculation = ids.some((id) => recipeFor(id).requirements.some((req) => req.role === 'calculation'));
  recordAll(
    ids.map((id) => ({
      uid,
      conceptId: id,
      sourceType: calculation ? 'calculation_exercise' : 'practice_drill',
      sourceId: `${lessonId}:exercise`,
      occurredAt,
      result: correct ? 'pass' : 'fail',
      difficulty: 'applied',
      independent: true,
    })),
  );
}

export function ingestPracticeAttempt(
  uid: string,
  drillId: string,
  correct: boolean,
  occurredAt = Date.now(),
): void {
  const conceptIds = resolveIds([DRILL_TO_CONCEPT[drillId], drillId]);
  if (!conceptIds.length) return;
  const asCalculation = CALCULATION_DRILLS.has(drillId);
  recordAll(
    conceptIds.map((conceptId) => ({
      uid,
      conceptId,
      sourceType: asCalculation ? 'calculation_exercise' : 'practice_drill',
      sourceId: drillId,
      occurredAt,
      result: correct ? 'pass' : 'fail',
      difficulty: 'applied',
      independent: true,
    })),
  );
}

export function ingestReplayDecision(input: {
  uid: string;
  episodeId: string;
  checkpointId: string;
  skills: string[];
  conceptIds?: string[];
  processQuality: number;
  occurredAt?: number;
  scenarioContext?: CompetencyScenarioContext;
}): void {
  const conceptIds = resolveIds([
    ...(input.conceptIds ?? []),
    ...input.skills.map((skill) => REPLAY_SKILL_TO_CONCEPT[skill]),
    ...input.skills,
  ]);
  if (!conceptIds.length) return;
  recordAll(
    conceptIds.map((conceptId) => ({
      uid: input.uid,
      conceptId,
      sourceType: 'replay_decision',
      sourceId: `${input.episodeId}:${input.checkpointId}`,
      occurredAt: input.occurredAt,
      difficulty: 'applied',
      independent: true,
      scenarioContext: input.scenarioContext,
      processMetrics: { processQuality: input.processQuality },
    })),
  );
}

export function ingestReplayCompletion(input: {
  uid: string;
  episodeId: string;
  skills: string[];
  processQuality: number;
  occurredAt?: number;
  scenarioContext?: CompetencyScenarioContext;
  conceptIds?: string[];
}): void {
  const conceptIds = resolveIds([
    ...(input.conceptIds ?? []),
    ...input.skills.map((skill) => REPLAY_SKILL_TO_CONCEPT[skill]),
    ...input.skills,
  ]);
  if (!conceptIds.length) return;
  recordAll(
    conceptIds.map((conceptId) => ({
      uid: input.uid,
      conceptId,
      sourceType: 'replay_decision',
      sourceId: input.episodeId,
      occurredAt: input.occurredAt,
      difficulty: 'applied',
      independent: true,
      scenarioContext: input.scenarioContext,
      processMetrics: { processQuality: input.processQuality },
    })),
  );
}

export function ingestSimulationDecision(input: {
  uid: string;
  sourceId: string;
  occurredAt?: number;
  processQuality: number;
  thesis?: number;
  evidence?: number;
  invalidation?: number;
  risk?: number;
  discipline?: number;
  positionSizing?: number;
  simulatedPnl?: number;
  simulatedProfitable?: boolean;
  flags?: ProcessFlags;
  scenarioContext?: CompetencyScenarioContext;
  conceptIds?: string[];
}): void {
  const ids = resolveIds(
    input.conceptIds ??
      [
        'thesis',
        input.flags?.missingInvalidation || (input.invalidation ?? 100) < 50 ? 'invalidation' : 'invalidation',
        'position-sizing',
        input.flags?.fomoEntry ? 'fomo' : undefined,
        (input.evidence ?? 100) < 50 ? 'evidence-quality' : 'evidence-quality',
      ],
  );

  recordAll(
    ids.map((conceptId) => {
      const qualityForConcept =
        conceptId === 'position-sizing'
          ? (input.positionSizing ?? input.risk ?? input.processQuality)
          : conceptId === 'invalidation'
            ? (input.invalidation ?? input.processQuality)
            : conceptId === 'thesis'
              ? (input.thesis ?? input.processQuality)
              : conceptId === 'evidence-quality'
                ? (input.evidence ?? input.processQuality)
                : conceptId === 'fomo'
                  ? (input.flags?.fomoEntry ? Math.min(40, input.processQuality) : input.discipline ?? input.processQuality)
                  : input.processQuality;
      return {
        uid: input.uid,
        conceptId,
        sourceType: 'simulation_decision' as const,
        sourceId: input.sourceId,
        occurredAt: input.occurredAt,
        difficulty: 'complex' as const,
        independent: true,
        scenarioContext: input.scenarioContext,
        processMetrics: {
          processQuality: qualityForConcept,
          thesis: input.thesis,
          evidence: input.evidence,
          invalidation: input.invalidation,
          risk: input.risk,
          discipline: input.discipline,
          simulatedPnl: input.simulatedPnl,
          simulatedProfitable: input.simulatedProfitable,
          flags: input.flags,
        },
      };
    }),
  );
}

export function ingestJournalReflection(input: {
  uid: string;
  sourceId: string;
  occurredAt?: number;
  mistakeCategory?: string | null;
  planAdhered?: boolean | null;
}): void {
  const mapped: Record<string, string> = {
    invalidation: 'invalidation',
    fomo: 'fomo',
    size: 'position-sizing',
    revenge: 'revenge-trading',
    no_plan: 'following-a-plan',
  };
  const conceptIds = resolveIds([
    input.mistakeCategory ? mapped[input.mistakeCategory] : undefined,
    input.planAdhered === false || input.planAdhered === true ? 'following-a-plan' : undefined,
    'journaling',
  ]);
  const result =
    input.mistakeCategory || input.planAdhered === false
      ? 'fail'
      : input.planAdhered === true
        ? 'pass'
        : 'observed';
  recordAll(
    conceptIds.map((conceptId) => ({
      uid: input.uid,
      conceptId,
      sourceType: 'journal_reflection',
      sourceId: input.sourceId,
      occurredAt: input.occurredAt,
      result,
      difficulty: 'applied',
      independent: true,
    })),
  );
}
