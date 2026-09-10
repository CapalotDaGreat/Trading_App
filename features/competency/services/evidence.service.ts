import type {
  CompetencyEvidenceInput,
  CompetencyEvidenceRecord,
  CompetencyEvidenceType,
  EvidenceLayer,
  EvidenceResult,
  HelpLevel,
  JournalEvidenceSignals,
  TransferDistance,
} from '../types/competency.types';
import { resolveCompetencyId } from './taxonomy.service';

export const COMPETENCY_EVIDENCE_VERSION = 2 as const;

/** Default reliability by source. Lesson completion is exposure, not skill. */
export const DEFAULT_RELIABILITY: Record<CompetencyEvidenceType, number> = {
  lesson_completion: 0.15,
  knowledge_check: 0.45,
  calculation_exercise: 0.55,
  practice_drill: 0.55,
  applied_exercise: 0.6,
  event_exercise: 0.6,
  replay_decision: 0.75,
  simulation_decision: 0.8,
  simulation_checkpoint: 0.75,
  journal_reflection: 0.4,
  review_finding: 0.5,
  remediation_exercise: 0.6,
  re_demonstration: 0.85,
  transfer_exercise: 0.8,
  surprise_assessment: 0.8,
};

const APPLICATION_SOURCES = new Set<CompetencyEvidenceType>([
  'replay_decision',
  'simulation_decision',
  'simulation_checkpoint',
  're_demonstration',
  'transfer_exercise',
  'surprise_assessment',
]);

export function isApplicationSource(sourceType: CompetencyEvidenceType): boolean {
  return APPLICATION_SOURCES.has(sourceType);
}

export function isExposureOnlySource(sourceType: CompetencyEvidenceType): boolean {
  return sourceType === 'lesson_completion';
}

export function isExposureOnlyRecord(record: {
  sourceType: CompetencyEvidenceType;
  evidenceLayer?: EvidenceLayer;
}): boolean {
  if (isExposureOnlySource(record.sourceType)) return true;
  return record.evidenceLayer === 'completion' || record.evidenceLayer === 'historical';
}

export function resolveHelpLevel(input: { helpLevel?: HelpLevel; hintsUsed?: boolean }): HelpLevel {
  if (input.helpLevel) return input.helpLevel;
  return input.hintsUsed ? 'hint' : 'none';
}

export function helpWasUsed(helpLevel: HelpLevel | undefined, hintsUsed?: boolean): boolean {
  return resolveHelpLevel({ helpLevel, hintsUsed }) !== 'none';
}

/** Independent means unaided. Help of any kind is scaffolding, not a defect. */
export function isIndependentEvidence(record: {
  independent: boolean;
  hintsUsed: boolean;
  helpLevel?: HelpLevel;
  evidenceLayer?: EvidenceLayer;
}): boolean {
  if (record.evidenceLayer === 'completion' || record.evidenceLayer === 'historical') return false;
  return record.independent && !helpWasUsed(record.helpLevel, record.hintsUsed);
}

export function journalSignalCount(signals?: JournalEvidenceSignals | null): number {
  if (!signals) return 0;
  return [
    signals.thesisPresent,
    signals.invalidationPresent,
    signals.riskConsidered,
    signals.uncertaintyAcknowledged,
    signals.reflectionCompleted,
    signals.thesisSpecificity === 'specific',
  ].filter(Boolean).length;
}

export function deriveTransferDistance(input: CompetencyEvidenceInput): TransferDistance {
  if (input.transferDistance) return input.transferDistance;
  if (
    input.sourceType === 'transfer_exercise' ||
    input.sourceType === 'surprise_assessment' ||
    input.sourceType === 're_demonstration'
  ) {
    return 'far';
  }
  const farContext = Boolean(input.assetClass && input.assetClass !== 'unknown' && input.assetClass !== 'equity');
  const interacting = (input.interactingConceptIds ?? []).length >= 2;
  if (farContext) return 'far';
  if (
    interacting &&
    input.scenarioContext &&
    input.scenarioContext !== 'standard' &&
    input.scenarioContext !== 'trend'
  ) {
    return 'far';
  }
  if (interacting || (input.scenarioContext && input.scenarioContext !== 'standard')) return 'near';
  return 'none';
}

export function deriveEvidenceLayer(input: CompetencyEvidenceInput, independent: boolean): EvidenceLayer {
  if (input.evidenceLayer) return input.evidenceLayer;
  if (input.sourceType === 'lesson_completion') return 'completion';
  if (input.sourceType === 'knowledge_check') return 'recognition';
  if (input.sourceType === 'journal_reflection' || input.sourceType === 'review_finding') {
    if (
      journalSignalCount(input.journalSignals) < 2 &&
      (input.result === 'observed' || input.result == null) &&
      !input.processMetrics
    ) {
      return 'completion';
    }
  }
  if (input.sourceType === 'transfer_exercise' || deriveTransferDistance(input) === 'far') {
    if (input.sourceType === 'surprise_assessment' || input.sourceType === 're_demonstration') return 'retention';
    return 'transfer';
  }
  if (input.sourceType === 'surprise_assessment' || input.sourceType === 're_demonstration') return 'retention';
  if ((input.priorIndependentCount ?? 0) >= 2 && independent) return 'repeated_application';
  if (
    independent &&
    (isApplicationSource(input.sourceType) ||
      input.sourceType === 'applied_exercise' ||
      input.sourceType === 'practice_drill' ||
      input.sourceType === 'calculation_exercise' ||
      input.sourceType === 'event_exercise' ||
      input.sourceType === 'remediation_exercise')
  ) {
    return 'independent_application';
  }
  if (
    input.sourceType === 'applied_exercise' ||
    input.sourceType === 'practice_drill' ||
    input.sourceType === 'calculation_exercise' ||
    input.sourceType === 'event_exercise' ||
    input.sourceType === 'simulation_checkpoint' ||
    input.sourceType === 'journal_reflection' ||
    input.sourceType === 'review_finding'
  ) {
    return 'guided_application';
  }
  return 'recognition';
}

export function normalizeEvidenceRecord(record: CompetencyEvidenceRecord): CompetencyEvidenceRecord {
  const legacy = record.version === 1 || record.helpLevel == null || record.evidenceLayer == null;
  const helpLevel = record.helpLevel ?? resolveHelpLevel(record);
  const transferDistance = record.transferDistance ?? 'none';
  let evidenceLayer = record.evidenceLayer;
  if (!evidenceLayer) {
    if (record.sourceType === 'lesson_completion') evidenceLayer = 'historical';
    else if (record.sourceType === 'knowledge_check') evidenceLayer = 'recognition';
    else if (record.sourceType === 'journal_reflection' && record.result === 'observed') evidenceLayer = 'completion';
    else if (legacy && !record.independent) evidenceLayer = 'historical';
    else {
      evidenceLayer = deriveEvidenceLayer(
        {
          uid: record.uid,
          conceptId: record.conceptId,
          sourceType: record.sourceType,
          sourceId: record.sourceId,
          helpLevel,
          hintsUsed: record.hintsUsed,
          independent: record.independent,
          scenarioContext: record.scenarioContext,
          result: record.result,
        },
        record.independent && !record.hintsUsed,
      );
      if (
        legacy &&
        (evidenceLayer === 'transfer' || evidenceLayer === 'retention' || evidenceLayer === 'repeated_application')
      ) {
        evidenceLayer = record.independent && !record.hintsUsed ? 'independent_application' : 'historical';
      }
    }
  }
  return {
    ...record,
    helpLevel,
    transferDistance: legacy && evidenceLayer === 'historical' ? 'none' : transferDistance,
    evidenceLayer,
    version: record.version === 2 ? 2 : record.version ?? 1,
  };
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

  const helpLevel = resolveHelpLevel(input);
  const hintsUsed = helpWasUsed(helpLevel, input.hintsUsed);
  const independent = input.independent ?? !hintsUsed;
  const result = resolveEvidenceResult(input);
  const transferDistance = deriveTransferDistance(input);
  const evidenceLayer = deriveEvidenceLayer({ ...input, transferDistance }, independent && !hintsUsed);
  const reliability = clamp01(
    input.reliability ??
      DEFAULT_RELIABILITY[input.sourceType] *
        (isIndependentEvidence({ independent, hintsUsed, helpLevel, evidenceLayer }) ? 1 : 0.55),
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
    helpLevel,
    independent,
    transferDistance,
    evidenceLayer,
    reliability,
    version: COMPETENCY_EVIDENCE_VERSION,
  };

  if (input.processMetrics) {
    record.processMetrics = { ...input.processMetrics };
  }
  if (input.scenarioContext) {
    record.scenarioContext = input.scenarioContext;
  }
  if (input.assetClass) {
    record.assetClass = input.assetClass;
  }
  if (input.interactingConceptIds?.length) {
    record.interactingConceptIds = [...new Set(input.interactingConceptIds.filter(Boolean))];
  }
  if (input.journalSignals) {
    record.journalSignals = { ...input.journalSignals };
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
