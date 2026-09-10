import type { JournalMistakeCategory } from '@/features/journal/types/journal.types';

import type {
  CompetencyEvidenceInput,
  CompetencyEvidenceRecord,
  CompetencyEvidenceType,
  EvidenceResult,
  JournalEvidenceSignals,
} from '../types/competency.types';
import { createEvidenceForConcepts, createEvidenceRecord, journalSignalCount } from './evidence.service';

const MISTAKE_TO_CONCEPT: Partial<Record<JournalMistakeCategory, string>> = {
  invalidation: 'invalidation',
  fomo: 'fomo',
  size: 'position-sizing',
  revenge: 'revenge-trading',
  no_plan: 'following-a-plan',
};

const MCQ_KINDS = new Set(['identify', 'select', 'rank', 'choose']);
const APPLIED_KINDS = new Set(['scenario', 'compare', 'explain', 'annotate']);

/**
 * Map an in-lesson exercise kind onto an evidence type.
 * Multiple-choice recognition is never treated as independent application.
 * Unknown/missing kinds stay conservative (practice or calculation).
 */
export function sourceTypeForLessonExercise(
  kind?: string,
  calculationFallback = false,
): CompetencyEvidenceType {
  if (kind === 'calculate' || (!kind && calculationFallback)) return 'calculation_exercise';
  if (kind && APPLIED_KINDS.has(kind)) return 'applied_exercise';
  if (kind && MCQ_KINDS.has(kind)) return 'knowledge_check';
  if (calculationFallback) return 'calculation_exercise';
  return 'practice_drill';
}

/**
 * Structured journal flags only. Never inspect free-form notes.
 * Thesis specificity is a length gate on the strategy field, not NLP.
 */
export function journalSignalsFromFields(input: {
  strategy?: string | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  quantity?: number | null;
  regimeNote?: string | null;
  lessonsLearned?: string | null;
  improvementCommitment?: string | null;
  planAdhered?: boolean | null;
}): JournalEvidenceSignals {
  const strategy = input.strategy?.trim() ?? '';
  const hasStop = typeof input.stopLoss === 'number' && Number.isFinite(input.stopLoss);
  const hasTarget = typeof input.takeProfit === 'number' && Number.isFinite(input.takeProfit);
  return {
    thesisPresent: strategy.length > 0,
    thesisSpecificity: strategy.length === 0 ? 'absent' : strategy.length >= 12 ? 'specific' : 'vague',
    invalidationPresent: hasStop,
    riskConsidered: Boolean(input.quantity && input.quantity > 0 && (hasStop || hasTarget)),
    uncertaintyAcknowledged: Boolean(input.regimeNote?.trim()),
    reflectionCompleted: Boolean(
      input.lessonsLearned?.trim() || input.improvementCommitment?.trim() || input.planAdhered != null,
    ),
  };
}

function journalBaseResult(input: {
  mistakeCategory?: JournalMistakeCategory | string | null;
  planAdhered?: boolean | null;
}): EvidenceResult {
  if (input.mistakeCategory || input.planAdhered === false) return 'fail';
  if (input.planAdhered === true) return 'pass';
  return 'observed';
}

function journalResultForConcept(
  conceptId: string,
  base: EvidenceResult,
  signals: JournalEvidenceSignals | undefined,
): EvidenceResult {
  if (conceptId === 'journaling' && journalSignalCount(signals) < 2) return 'observed';
  return base;
}

/**
 * Structured journal flags only. Never persist free-form notes here.
 */
export function evidenceFromJournalReflection(input: {
  uid: string;
  sourceId: string;
  occurredAt?: number;
  mistakeCategory?: JournalMistakeCategory | null;
  planAdhered?: boolean | null;
  conceptIds?: string[];
  journalSignals?: JournalEvidenceSignals;
  strategy?: string | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  quantity?: number | null;
  regimeNote?: string | null;
  lessonsLearned?: string | null;
  improvementCommitment?: string | null;
}): CompetencyEvidenceRecord[] {
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
  const conceptIds = new Set(input.conceptIds ?? []);
  if (input.mistakeCategory && MISTAKE_TO_CONCEPT[input.mistakeCategory]) {
    conceptIds.add(MISTAKE_TO_CONCEPT[input.mistakeCategory]!);
  }
  if (input.planAdhered === false || input.planAdhered === true) conceptIds.add('following-a-plan');
  conceptIds.add('journaling');

  const base = journalBaseResult(input);

  return [...conceptIds].flatMap((conceptId) =>
    createEvidenceForConcepts(
      {
        uid: input.uid,
        sourceType: 'journal_reflection',
        sourceId: input.sourceId,
        occurredAt: input.occurredAt,
        result: journalResultForConcept(conceptId, base, signals),
        difficulty: 'applied',
        independent: true,
        journalSignals: signals,
      },
      [conceptId],
    ),
  );
}

export function evidenceFromSimulationDecision(input: {
  uid: string;
  sourceId: string;
  conceptIds: string[];
  occurredAt?: number;
  processQuality: number;
  simulatedPnl?: number;
  simulatedProfitable?: boolean;
  difficulty?: CompetencyEvidenceInput['difficulty'];
  hintsUsed?: boolean;
  helpLevel?: CompetencyEvidenceInput['helpLevel'];
  scenarioContext?: CompetencyEvidenceInput['scenarioContext'];
  assetClass?: CompetencyEvidenceInput['assetClass'];
  interactingConceptIds?: string[];
  processMetrics?: CompetencyEvidenceInput['processMetrics'];
  transferDistance?: CompetencyEvidenceInput['transferDistance'];
}): CompetencyEvidenceRecord[] {
  return createEvidenceForConcepts(
    {
      uid: input.uid,
      sourceType: 'simulation_decision',
      sourceId: input.sourceId,
      occurredAt: input.occurredAt,
      difficulty: input.difficulty ?? 'complex',
      hintsUsed: input.hintsUsed,
      helpLevel: input.helpLevel,
      independent: !input.hintsUsed && (input.helpLevel ?? 'none') === 'none',
      scenarioContext: input.scenarioContext,
      assetClass: input.assetClass,
      interactingConceptIds: input.interactingConceptIds,
      transferDistance: input.transferDistance,
      processMetrics: {
        processQuality: input.processQuality,
        simulatedPnl: input.simulatedPnl,
        simulatedProfitable: input.simulatedProfitable,
        ...input.processMetrics,
      },
    },
    input.conceptIds,
  );
}

export function evidenceFromReplayDecision(input: {
  uid: string;
  sourceId: string;
  conceptIds: string[];
  occurredAt?: number;
  processQuality: number;
  hintsUsed?: boolean;
  helpLevel?: CompetencyEvidenceInput['helpLevel'];
  difficulty?: CompetencyEvidenceInput['difficulty'];
  scenarioContext?: CompetencyEvidenceInput['scenarioContext'];
  assetClass?: CompetencyEvidenceInput['assetClass'];
  interactingConceptIds?: string[];
  sourceType?: Extract<CompetencyEvidenceType, 'replay_decision' | 'surprise_assessment' | 'transfer_exercise'>;
}): CompetencyEvidenceRecord[] {
  return createEvidenceForConcepts(
    {
      uid: input.uid,
      sourceType: input.sourceType ?? 'replay_decision',
      sourceId: input.sourceId,
      occurredAt: input.occurredAt,
      difficulty: input.difficulty ?? 'applied',
      hintsUsed: input.hintsUsed,
      helpLevel: input.helpLevel,
      independent: !input.hintsUsed && (input.helpLevel ?? 'none') === 'none',
      scenarioContext: input.scenarioContext,
      assetClass: input.assetClass,
      interactingConceptIds: input.interactingConceptIds,
      processMetrics: { processQuality: input.processQuality },
    },
    input.conceptIds,
  );
}

export function evidenceFromPracticeDrill(input: {
  uid: string;
  sourceId: string;
  conceptIds: string[];
  occurredAt?: number;
  correct: boolean;
  hintsUsed?: boolean;
  helpLevel?: CompetencyEvidenceInput['helpLevel'];
  difficulty?: CompetencyEvidenceInput['difficulty'];
  asCalculation?: boolean;
  sourceType?: CompetencyEvidenceType;
  transferDistance?: CompetencyEvidenceInput['transferDistance'];
}): CompetencyEvidenceRecord[] {
  const sourceType =
    input.sourceType ?? (input.asCalculation ? 'calculation_exercise' : 'practice_drill');
  return createEvidenceForConcepts(
    {
      uid: input.uid,
      sourceType,
      sourceId: input.sourceId,
      occurredAt: input.occurredAt,
      result: input.correct ? 'pass' : 'fail',
      difficulty: input.difficulty ?? 'applied',
      hintsUsed: input.hintsUsed,
      helpLevel: input.helpLevel,
      independent: !input.hintsUsed && (input.helpLevel ?? 'none') === 'none',
      transferDistance: input.transferDistance,
    },
    input.conceptIds,
  );
}

export function evidenceFromLessonCompletion(input: {
  uid: string;
  sourceId: string;
  conceptIds: string[];
  occurredAt?: number;
}): CompetencyEvidenceRecord[] {
  return createEvidenceForConcepts(
    {
      uid: input.uid,
      sourceType: 'lesson_completion',
      sourceId: input.sourceId,
      occurredAt: input.occurredAt,
      result: 'observed',
      difficulty: 'foundations',
      independent: true,
    },
    input.conceptIds,
  );
}

export function evidenceFromKnowledgeCheck(input: {
  uid: string;
  sourceId: string;
  conceptIds: string[];
  occurredAt?: number;
  correct: boolean;
  hintsUsed?: boolean;
  helpLevel?: CompetencyEvidenceInput['helpLevel'];
}): CompetencyEvidenceRecord[] {
  return createEvidenceForConcepts(
    {
      uid: input.uid,
      sourceType: 'knowledge_check',
      sourceId: input.sourceId,
      occurredAt: input.occurredAt,
      result: input.correct ? 'pass' : 'fail',
      difficulty: 'foundations',
      hintsUsed: input.hintsUsed,
      helpLevel: input.helpLevel,
      independent: !input.hintsUsed && (input.helpLevel ?? 'none') === 'none',
    },
    input.conceptIds,
  );
}

export { createEvidenceRecord, createEvidenceForConcepts };
