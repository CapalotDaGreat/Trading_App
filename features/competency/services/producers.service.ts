import type { LessonExerciseKind } from '@/features/academy/types/academy.types';
import { logger } from '@/shared/services/observability/logger';

import {
  conceptsForDrill,
  conceptsForLesson,
  isEventDrill,
  isSurpriseReplay,
  isTransferDrill,
  REVIEW_ACTION_CONCEPTS,
} from '../content/activity-concept-map';
import { recipeFor } from '../content/demonstration-recipes';
import type {
  CompetencyEvidenceInput,
  CompetencyEvidenceType,
  CompetencyScenarioContext,
  HelpLevel,
  JournalEvidenceSignals,
  ProcessFlags,
} from '../types/competency.types';
import { isIndependentEvidence, journalSignalCount, normalizeEvidenceRecord } from './evidence.service';
import {
  journalSignalsFromFields,
  sourceTypeForLessonExercise,
} from './ingest.service';
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

const CHECKPOINT_KIND_TO_CONCEPTS: Record<string, string[]> = {
  breakout: ['breakouts', 'false-breakouts'],
  drawdown: ['drawdown-management', 'position-sizing'],
  event_eve: ['event-risk', 'uncertainty'],
  thesis_check: ['thesis', 'evidence-quality'],
  vol_spike: ['volatility-aware-risk'],
  extended_move: ['fomo', 'discipline'],
};

const MISTAKE_TO_CONCEPT: Record<string, string> = {
  invalidation: 'invalidation',
  fomo: 'fomo',
  size: 'position-sizing',
  revenge: 'revenge-trading',
  no_plan: 'following-a-plan',
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

function priorIndependentCount(uid: string, conceptId: string): number {
  return useCompetencyEvidenceStore
    .getState()
    .evidenceFor(uid, conceptId)
    .filter((item) => isIndependentEvidence(normalizeEvidenceRecord(item)) && item.result === 'pass').length;
}

function withProvenance(
  input: CompetencyEvidenceInput,
): CompetencyEvidenceInput {
  return {
    ...input,
    priorIndependentCount: input.priorIndependentCount ?? priorIndependentCount(input.uid, input.conceptId),
  };
}

export function ingestLessonCompletion(uid: string, lessonId: string, occurredAt = Date.now()): void {
  const conceptIds = resolveIds([...conceptsForLesson(lessonId), lessonId]);
  if (!conceptIds.length) return;
  recordAll(
    conceptIds.map((conceptId) =>
      withProvenance({
        uid,
        conceptId,
        sourceType: 'lesson_completion',
        sourceId: lessonId,
        occurredAt,
        result: 'observed',
        difficulty: 'foundations',
        independent: true,
      }),
    ),
  );
}

export function ingestKnowledgeCheck(
  uid: string,
  sourceId: string,
  conceptId: string,
  correct: boolean,
  occurredAt = Date.now(),
  options?: { helpLevel?: HelpLevel },
): void {
  const resolved = resolveIds([conceptId, ...conceptsForLesson(sourceId), sourceId]);
  if (!resolved.length) return;
  recordAll(
    resolved.map((id) =>
      withProvenance({
        uid,
        conceptId: id,
        sourceType: 'knowledge_check',
        sourceId,
        occurredAt,
        result: correct ? 'pass' : 'fail',
        difficulty: 'foundations',
        independent: (options?.helpLevel ?? 'none') === 'none',
        helpLevel: options?.helpLevel,
      }),
    ),
  );
}

export function ingestLessonExercise(
  uid: string,
  lessonId: string,
  conceptId: string | undefined,
  correct: boolean,
  occurredAt = Date.now(),
  options?: {
    helpLevel?: HelpLevel;
    kind?: LessonExerciseKind | string;
    exerciseId?: string;
    asTransfer?: boolean;
    scenarioContext?: CompetencyScenarioContext;
    interactingConceptIds?: string[];
  },
): void {
  const ids = resolveIds(conceptId ? [conceptId] : conceptsForLesson(lessonId));
  if (!ids.length) return;
  const calculation = ids.some((id) => recipeFor(id).requirements.some((req) => req.role === 'calculation'));
  const sourceType = options?.asTransfer ? 'transfer_exercise' : sourceTypeForLessonExercise(options?.kind, calculation);
  const recognition = sourceType === 'knowledge_check';
  const interacting = resolveIds(options?.interactingConceptIds ?? []).filter((id) => !ids.includes(id));
  recordAll(
    ids.map((id) =>
      withProvenance({
        uid,
        conceptId: id,
        sourceType,
        sourceId: `${lessonId}:exercise:${options?.exerciseId ?? 'main'}`,
        occurredAt,
        result: correct ? 'pass' : 'fail',
        difficulty: recognition ? 'foundations' : options?.asTransfer ? 'complex' : 'applied',
        independent: (options?.helpLevel ?? 'none') === 'none',
        helpLevel: options?.helpLevel,
        transferDistance: options?.asTransfer ? 'far' : undefined,
        scenarioContext: options?.scenarioContext,
        interactingConceptIds: interacting.length ? interacting : undefined,
      }),
    ),
  );
}

export function ingestPracticeAttempt(
  uid: string,
  drillId: string,
  correct: boolean,
  occurredAt = Date.now(),
  options?: { helpLevel?: HelpLevel; asTransfer?: boolean },
): void {
  const conceptIds = resolveIds([...conceptsForDrill(drillId), drillId]);
  if (!conceptIds.length) return;
  const asCalculation = CALCULATION_DRILLS.has(drillId);
  const sourceType: CompetencyEvidenceType = options?.asTransfer || isTransferDrill(drillId)
    ? 'transfer_exercise'
    : isEventDrill(drillId)
      ? 'event_exercise'
      : asCalculation
        ? 'calculation_exercise'
        : 'practice_drill';
  recordAll(
    conceptIds.map((conceptId) =>
      withProvenance({
        uid,
        conceptId,
        sourceType,
        sourceId: drillId,
        occurredAt,
        result: correct ? 'pass' : 'fail',
        difficulty: options?.asTransfer || isTransferDrill(drillId) ? 'complex' : 'applied',
        independent: (options?.helpLevel ?? 'none') === 'none',
        helpLevel: options?.helpLevel,
        transferDistance: options?.asTransfer || isTransferDrill(drillId) ? 'far' : undefined,
      }),
    ),
  );
}

export function ingestEventExercise(
  uid: string,
  drillId: string,
  correct: boolean,
  occurredAt = Date.now(),
  options?: { helpLevel?: HelpLevel },
): void {
  ingestPracticeAttempt(uid, drillId, correct, occurredAt, options);
}

export function ingestTransferExercise(input: {
  uid: string;
  sourceId: string;
  conceptIds: string[];
  occurredAt?: number;
  correct?: boolean;
  processQuality?: number;
  helpLevel?: HelpLevel;
  scenarioContext?: CompetencyScenarioContext;
  assetClass?: CompetencyEvidenceInput['assetClass'];
}): void {
  const conceptIds = resolveIds(input.conceptIds);
  if (!conceptIds.length) return;
  const independent = (input.helpLevel ?? 'none') === 'none';
  recordAll(
    conceptIds.map((conceptId) =>
      withProvenance({
        uid: input.uid,
        conceptId,
        sourceType: 'transfer_exercise',
        sourceId: input.sourceId,
        occurredAt: input.occurredAt,
        result:
          typeof input.processQuality === 'number'
            ? undefined
            : input.correct === false
              ? 'fail'
              : 'pass',
        difficulty: 'complex',
        independent,
        helpLevel: input.helpLevel,
        scenarioContext: input.scenarioContext,
        assetClass: input.assetClass,
        transferDistance: 'far',
        processMetrics:
          typeof input.processQuality === 'number' ? { processQuality: input.processQuality } : undefined,
      }),
    ),
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
  helpLevel?: HelpLevel;
  assetClass?: CompetencyEvidenceInput['assetClass'];
}): void {
  const conceptIds = resolveIds([
    ...(input.conceptIds ?? []),
    ...input.skills.map((skill) => REPLAY_SKILL_TO_CONCEPT[skill]),
    ...input.skills,
  ]);
  if (!conceptIds.length) return;
  const surprise = isSurpriseReplay(input.episodeId);
  recordAll(
    conceptIds.map((conceptId) =>
      withProvenance({
        uid: input.uid,
        conceptId,
        sourceType: surprise ? 'surprise_assessment' : 'replay_decision',
        sourceId: `${input.episodeId}:${input.checkpointId}`,
        occurredAt: input.occurredAt,
        difficulty: surprise ? 'complex' : 'applied',
        independent: (input.helpLevel ?? 'none') === 'none',
        helpLevel: input.helpLevel,
        scenarioContext: input.scenarioContext,
        assetClass: input.assetClass,
        transferDistance: surprise ? 'far' : undefined,
        processMetrics: { processQuality: input.processQuality },
      }),
    ),
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
  const surprise = isSurpriseReplay(input.episodeId);
  recordAll(
    conceptIds.map((conceptId) =>
      withProvenance({
        uid: input.uid,
        conceptId,
        sourceType: surprise ? 'surprise_assessment' : 'replay_decision',
        sourceId: input.episodeId,
        occurredAt: input.occurredAt,
        difficulty: surprise ? 'complex' : 'applied',
        independent: true,
        scenarioContext: input.scenarioContext,
        transferDistance: surprise ? 'far' : undefined,
        processMetrics: { processQuality: input.processQuality },
      }),
    ),
  );
}

export function ingestSurpriseAssessment(input: {
  uid: string;
  sourceId: string;
  conceptIds: string[];
  processQuality: number;
  occurredAt?: number;
  scenarioContext?: CompetencyScenarioContext;
  helpLevel?: HelpLevel;
}): void {
  const conceptIds = resolveIds(input.conceptIds);
  if (!conceptIds.length) return;
  recordAll(
    conceptIds.map((conceptId) =>
      withProvenance({
        uid: input.uid,
        conceptId,
        sourceType: 'surprise_assessment',
        sourceId: input.sourceId,
        occurredAt: input.occurredAt,
        difficulty: 'complex',
        independent: (input.helpLevel ?? 'none') === 'none',
        helpLevel: input.helpLevel,
        scenarioContext: input.scenarioContext,
        transferDistance: 'far',
        processMetrics: { processQuality: input.processQuality },
      }),
    ),
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
  uncertainty?: number;
  confirmation?: number;
  eventAwareness?: number;
  emotionalDiscipline?: number;
  reflection?: number;
  simulatedPnl?: number;
  simulatedProfitable?: boolean;
  flags?: ProcessFlags;
  scenarioContext?: CompetencyScenarioContext;
  conceptIds?: string[];
  helpLevel?: HelpLevel;
  assetClass?: CompetencyEvidenceInput['assetClass'];
  interactingConceptIds?: string[];
  transferDistance?: CompetencyEvidenceInput['transferDistance'];
}): void {
  const ids = resolveIds(
    input.conceptIds ??
      [
        'thesis',
        'invalidation',
        'position-sizing',
        input.flags?.fomoEntry ? 'fomo' : undefined,
        'evidence-quality',
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
      return withProvenance({
        uid: input.uid,
        conceptId,
        sourceType: 'simulation_decision',
        sourceId: input.sourceId,
        occurredAt: input.occurredAt,
        difficulty: 'complex',
        independent: (input.helpLevel ?? 'none') === 'none',
        helpLevel: input.helpLevel,
        scenarioContext: input.scenarioContext,
        assetClass: input.assetClass,
        interactingConceptIds: input.interactingConceptIds,
        transferDistance: input.transferDistance,
        processMetrics: {
          processQuality: qualityForConcept,
          thesis: input.thesis,
          evidence: input.evidence,
          invalidation: input.invalidation,
          risk: input.risk,
          discipline: input.discipline,
          positionSizing: input.positionSizing,
          uncertainty: input.uncertainty,
          confirmation: input.confirmation,
          eventAwareness: input.eventAwareness,
          emotionalDiscipline: input.emotionalDiscipline,
          reflection: input.reflection,
          simulatedPnl: input.simulatedPnl,
          simulatedProfitable: input.simulatedProfitable,
          flags: input.flags,
        },
      });
    }),
  );
}

/** Process-only checkpoint. Simulated P/L is stored as context and never grades the result. */
export function ingestSimulationCheckpoint(input: {
  uid: string;
  sourceId: string;
  option: string;
  reasoningPresent: boolean;
  windowKind?: string;
  occurredAt?: number;
  scenarioContext?: CompetencyScenarioContext;
  assetClass?: CompetencyEvidenceInput['assetClass'];
  helpLevel?: HelpLevel;
  conceptIds?: string[];
  simulatedPnl?: number;
  simulatedProfitable?: boolean;
}): void {
  const named = input.reasoningPresent;
  let processQuality = named ? 74 : 52;
  if (input.option === 'wait' || input.option === 'research' || input.option === 'reduce') processQuality += 8;
  if (input.option === 'ignore' && !named) processQuality = 32;
  if (input.option === 'enter' && !named) processQuality = Math.min(processQuality, 40);
  processQuality = Math.max(0, Math.min(100, processQuality));

  const conceptIds = resolveIds([
    ...(input.conceptIds ?? []),
    ...(CHECKPOINT_KIND_TO_CONCEPTS[input.windowKind ?? ''] ?? ['uncertainty', 'thesis']),
  ]);
  if (!conceptIds.length) return;

  recordAll(
    conceptIds.map((conceptId) =>
      withProvenance({
        uid: input.uid,
        conceptId,
        sourceType: 'simulation_checkpoint',
        sourceId: input.sourceId,
        occurredAt: input.occurredAt,
        difficulty: 'complex',
        independent: (input.helpLevel ?? 'none') === 'none',
        helpLevel: input.helpLevel,
        scenarioContext: input.scenarioContext,
        assetClass: input.assetClass,
        processMetrics: {
          processQuality,
          simulatedPnl: input.simulatedPnl,
          simulatedProfitable: input.simulatedProfitable,
        },
      }),
    ),
  );
}

export function ingestJournalReflection(input: {
  uid: string;
  sourceId: string;
  occurredAt?: number;
  mistakeCategory?: string | null;
  planAdhered?: boolean | null;
  journalSignals?: JournalEvidenceSignals;
  strategy?: string | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  quantity?: number | null;
  regimeNote?: string | null;
  lessonsLearned?: string | null;
  improvementCommitment?: string | null;
}): void {
  const signals =
    input.journalSignals ??
    journalSignalsFromFields({
      strategy: input.strategy,
      stopLoss: input.stopLoss,
      takeProfit: input.takeProfit,
      quantity: input.quantity,
      regimeNote: input.regimeNote,
      lessonsLearned: input.lessonsLearned,
      improvementCommitment: input.improvementCommitment,
      planAdhered: input.planAdhered,
    });
  const conceptIds = resolveIds([
    input.mistakeCategory ? MISTAKE_TO_CONCEPT[input.mistakeCategory] : undefined,
    input.planAdhered === false || input.planAdhered === true ? 'following-a-plan' : undefined,
    'journaling',
  ]);
  const base: CompetencyEvidenceInput['result'] =
    input.mistakeCategory || input.planAdhered === false
      ? 'fail'
      : input.planAdhered === true
        ? 'pass'
        : 'observed';

  recordAll(
    conceptIds.map((conceptId) =>
      withProvenance({
        uid: input.uid,
        conceptId,
        sourceType: 'journal_reflection',
        sourceId: input.sourceId,
        occurredAt: input.occurredAt,
        result: conceptId === 'journaling' && journalSignalCount(signals) < 2 ? 'observed' : base,
        difficulty: 'applied',
        independent: true,
        journalSignals: signals,
      }),
    ),
  );

  const namedLesson = Boolean(input.lessonsLearned?.trim() || input.improvementCommitment?.trim());
  if (namedLesson) {
    ingestReviewFinding({
      uid: input.uid,
      sourceId: `${input.sourceId}:review`,
      occurredAt: input.occurredAt,
      journalSignals: signals,
      result: base === 'fail' ? 'fail' : 'pass',
    });
  }
}

export function ingestReviewFinding(input: {
  uid: string;
  sourceId: string;
  occurredAt?: number;
  conceptIds?: string[];
  result?: CompetencyEvidenceInput['result'];
  journalSignals?: JournalEvidenceSignals;
}): void {
  const conceptIds = resolveIds(input.conceptIds ?? [...REVIEW_ACTION_CONCEPTS]);
  if (!conceptIds.length) return;
  recordAll(
    conceptIds.map((conceptId) =>
      withProvenance({
        uid: input.uid,
        conceptId,
        sourceType: 'review_finding',
        sourceId: input.sourceId,
        occurredAt: input.occurredAt,
        result: input.result ?? 'observed',
        difficulty: 'applied',
        independent: true,
        journalSignals: input.journalSignals,
      }),
    ),
  );
}

export { sourceTypeForLessonExercise, journalSignalsFromFields };
