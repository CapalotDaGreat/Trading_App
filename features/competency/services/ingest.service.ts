import type { JournalMistakeCategory } from '@/features/journal/types/journal.types';

import type { CompetencyEvidenceInput, CompetencyEvidenceRecord } from '../types/competency.types';
import { createEvidenceForConcepts, createEvidenceRecord } from './evidence.service';

const MISTAKE_TO_CONCEPT: Partial<Record<JournalMistakeCategory, string>> = {
  invalidation: 'invalidation',
  fomo: 'fomo',
  size: 'position-sizing',
  revenge: 'revenge-trading',
  no_plan: 'following-a-plan',
};

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
}): CompetencyEvidenceRecord[] {
  const conceptIds = new Set(input.conceptIds ?? []);
  if (input.mistakeCategory && MISTAKE_TO_CONCEPT[input.mistakeCategory]) {
    conceptIds.add(MISTAKE_TO_CONCEPT[input.mistakeCategory]!);
  }
  if (input.planAdhered === false) conceptIds.add('following-a-plan');
  if (input.planAdhered === true) conceptIds.add('following-a-plan');
  if (conceptIds.size === 0) conceptIds.add('journaling');

  const result =
    input.mistakeCategory || input.planAdhered === false
      ? 'fail'
      : input.planAdhered === true
        ? 'pass'
        : 'observed';

  return createEvidenceForConcepts(
    {
      uid: input.uid,
      sourceType: 'journal_reflection',
      sourceId: input.sourceId,
      occurredAt: input.occurredAt,
      result,
      difficulty: 'applied',
      independent: true,
    },
    [...conceptIds],
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
  scenarioContext?: CompetencyEvidenceInput['scenarioContext'];
  processMetrics?: CompetencyEvidenceInput['processMetrics'];
}): CompetencyEvidenceRecord[] {
  return createEvidenceForConcepts(
    {
      uid: input.uid,
      sourceType: 'simulation_decision',
      sourceId: input.sourceId,
      occurredAt: input.occurredAt,
      difficulty: input.difficulty ?? 'complex',
      hintsUsed: input.hintsUsed,
      independent: !input.hintsUsed,
      scenarioContext: input.scenarioContext,
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
  difficulty?: CompetencyEvidenceInput['difficulty'];
  scenarioContext?: CompetencyEvidenceInput['scenarioContext'];
}): CompetencyEvidenceRecord[] {
  return createEvidenceForConcepts(
    {
      uid: input.uid,
      sourceType: 'replay_decision',
      sourceId: input.sourceId,
      occurredAt: input.occurredAt,
      difficulty: input.difficulty ?? 'applied',
      hintsUsed: input.hintsUsed,
      independent: !input.hintsUsed,
      scenarioContext: input.scenarioContext,
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
  difficulty?: CompetencyEvidenceInput['difficulty'];
  asCalculation?: boolean;
}): CompetencyEvidenceRecord[] {
  return createEvidenceForConcepts(
    {
      uid: input.uid,
      sourceType: input.asCalculation ? 'calculation_exercise' : 'practice_drill',
      sourceId: input.sourceId,
      occurredAt: input.occurredAt,
      result: input.correct ? 'pass' : 'fail',
      difficulty: input.difficulty ?? 'applied',
      hintsUsed: input.hintsUsed,
      independent: !input.hintsUsed,
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
      independent: !input.hintsUsed,
    },
    input.conceptIds,
  );
}

export { createEvidenceRecord, createEvidenceForConcepts };
