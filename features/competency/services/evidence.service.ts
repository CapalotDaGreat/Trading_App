import type {
  CompetencyEvidenceInput,
  CompetencyEvidenceRecord,
  CompetencyEvidenceType,
  EvidenceResult,
} from '../types/competency.types';
import { resolveCompetencyId } from './taxonomy.service';

export const COMPETENCY_EVIDENCE_VERSION = 1 as const;

/** Default reliability by source. Lesson completion is exposure, not skill. */
export const DEFAULT_RELIABILITY: Record<CompetencyEvidenceType, number> = {
  lesson_completion: 0.15,
  knowledge_check: 0.45,
  calculation_exercise: 0.55,
  practice_drill: 0.55,
  replay_decision: 0.75,
  simulation_decision: 0.8,
  journal_reflection: 0.4,
  review_finding: 0.5,
  remediation_exercise: 0.6,
  re_demonstration: 0.85,
};

const APPLICATION_SOURCES = new Set<CompetencyEvidenceType>([
  'replay_decision',
  'simulation_decision',
]);

export function isApplicationSource(sourceType: CompetencyEvidenceType): boolean {
  return APPLICATION_SOURCES.has(sourceType);
}

export function isExposureOnlySource(sourceType: CompetencyEvidenceType): boolean {
  return sourceType === 'lesson_completion';
}

/**
 * Process quality, when present, decides the result.
 * Simulated P/L never upgrades a weak process and never downgrades a strong one.
 */
export function resolveEvidenceResult(input: CompetencyEvidenceInput): EvidenceResult {
  const processQuality = input.processMetrics?.processQuality;
  if (typeof processQuality === 'number' && Number.isFinite(processQuality)) {
    if (processQuality >= 70) return 'pass';
    if (processQuality < 45) return 'fail';
    return 'partial';
  }
  return input.result ?? 'observed';
}

export function defaultEventKey(input: {
  uid: string;
  sourceType: CompetencyEvidenceType;
  sourceId: string;
  conceptId: string;
  occurredAt: number;
}): string {
  return `${input.uid}:${input.sourceType}:${input.sourceId}:${input.conceptId}:${input.occurredAt}`;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function stableId(eventKey: string): string {
  let hash = 0;
  for (let i = 0; i < eventKey.length; i += 1) {
    hash = (Math.imul(31, hash) + eventKey.charCodeAt(i)) | 0;
  }
  return `ev_${Math.abs(hash).toString(36)}`;
}

export function createEvidenceRecord(input: CompetencyEvidenceInput): CompetencyEvidenceRecord {
  const uid = input.uid.trim();
  if (!uid) throw new Error('Competency evidence requires a uid.');

  const conceptId = resolveCompetencyId(input.conceptId);
  if (!conceptId) throw new Error(`Unknown competency concept: ${input.conceptId}`);

  const occurredAt = input.occurredAt ?? Date.now();
  if (!Number.isFinite(occurredAt)) throw new Error('Competency evidence requires a timestamp.');

  const hintsUsed = Boolean(input.hintsUsed);
  const independent = input.independent ?? !hintsUsed;
  const result = resolveEvidenceResult(input);
  const reliability = clamp01(
    input.reliability ??
      DEFAULT_RELIABILITY[input.sourceType] * (independent && !hintsUsed ? 1 : 0.55),
  );

  const eventKey =
    input.eventKey ??
    defaultEventKey({
      uid,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      conceptId,
      occurredAt,
    });

  const record: CompetencyEvidenceRecord = {
    id: input.id ?? stableId(eventKey),
    eventKey,
    uid,
    conceptId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    occurredAt,
    result,
    difficulty: input.difficulty ?? 'applied',
    hintsUsed,
    independent,
    reliability,
    version: COMPETENCY_EVIDENCE_VERSION,
  };

  if (input.processMetrics) {
    record.processMetrics = { ...input.processMetrics };
  }
  if (input.scenarioContext) {
    record.scenarioContext = input.scenarioContext;
  }
  if (typeof input.score === 'number' && Number.isFinite(input.score)) {
    record.score = input.score;
  }

  return record;
}

/** One exercise can attach evidence to several concepts. */
export function createEvidenceForConcepts(
  input: Omit<CompetencyEvidenceInput, 'conceptId'>,
  conceptIds: string[],
): CompetencyEvidenceRecord[] {
  return conceptIds.map((conceptId) => createEvidenceRecord({ ...input, conceptId }));
}
