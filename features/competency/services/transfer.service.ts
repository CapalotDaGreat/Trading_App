import type {
  CompetencyAssetClass,
  CompetencyEvidenceRecord,
  CompetencyEvidenceType,
  CompetencyScenarioContext,
  TransferEvidenceSummary,
} from '../types/competency.types';
import { isApplicationSource, isExposureOnlyRecord, isIndependentEvidence } from './evidence.service';

const APPLIED_FORMATS = new Set<CompetencyEvidenceType>([
  'practice_drill',
  'calculation_exercise',
  'applied_exercise',
  'event_exercise',
  'replay_decision',
  'simulation_decision',
  'simulation_checkpoint',
  're_demonstration',
  'transfer_exercise',
  'surprise_assessment',
]);

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function independentApplication(records: readonly CompetencyEvidenceRecord[]): CompetencyEvidenceRecord[] {
  return records.filter(
    (item) =>
      !isExposureOnlyRecord(item) &&
      isIndependentEvidence(item) &&
      item.result === 'pass' &&
      (isApplicationSource(item.sourceType) || APPLIED_FORMATS.has(item.sourceType)),
  );
}

/**
 * Transfer is proven when at least two independent applications show diversity
 * in market condition, asset class, presentation format, or mixed-concept setting.
 * A single mixed-concept success is still one setting. Perfection is not required.
 */
export function scoreTransferEvidence(records: readonly CompetencyEvidenceRecord[]): TransferEvidenceSummary {
  const applied = independentApplication(records);
  const contexts = unique(
    applied.map((item) => item.scenarioContext ?? 'standard').filter((ctx): ctx is CompetencyScenarioContext => Boolean(ctx)),
  );
  const assetClasses = unique(
    applied.map((item) => item.assetClass).filter((item): item is CompetencyAssetClass => Boolean(item)),
  );
  const formats = unique(applied.map((item) => item.sourceType));
  const mixedConceptSourceIds = unique(
    records
      .filter((item) => (item.interactingConceptIds?.length ?? 0) >= 2)
      .map((item) => item.sourceId),
  );
  const mixedSettings = unique(
    applied
      .filter((item) => (item.interactingConceptIds?.length ?? 0) >= 2)
      .map(
        (item) =>
          `${item.scenarioContext ?? 'standard'}:${item.assetClass ?? 'unknown'}:${item.sourceType}`,
      ),
  );
  const nonStandard = contexts.filter((ctx) => ctx !== 'standard');
  const dimensions = [
    nonStandard.length >= 2,
    assetClasses.length >= 2,
    formats.length >= 2,
    mixedSettings.length >= 2,
  ].filter(Boolean).length;

  return {
    contexts,
    assetClasses,
    formats,
    mixedConceptSourceIds,
    applicationCount: applied.length,
    // One success, even mixed-concept, is still a single setting.
    proven: applied.length >= 2 && dimensions >= 1,
  };
}

const FAMILIAR_CONTEXTS = new Set<CompetencyScenarioContext>(['standard', 'trend']);

export function isFamiliarRecord(record: CompetencyEvidenceRecord): boolean {
  const context = record.scenarioContext ?? 'standard';
  const familiarContext = FAMILIAR_CONTEXTS.has(context);
  const familiarAsset = !record.assetClass || record.assetClass === 'equity' || record.assetClass === 'unknown';
  const near =
    record.transferDistance !== 'far' &&
    record.sourceType !== 'surprise_assessment' &&
    record.sourceType !== 'transfer_exercise';
  return familiarContext && familiarAsset && near;
}

function gradedApplication(records: readonly CompetencyEvidenceRecord[]): CompetencyEvidenceRecord[] {
  return records.filter(
    (item) =>
      !isExposureOnlyRecord(item) &&
      (item.result === 'pass' || item.result === 'fail' || item.result === 'partial') &&
      (isApplicationSource(item.sourceType) || APPLIED_FORMATS.has(item.sourceType)),
  );
}

/**
 * Strong familiar application with weak unfamiliar application.
 * Demonstrated skill is kept; transfer stays unproven.
 */
export function detectFalseMastery(records: readonly CompetencyEvidenceRecord[]): {
  detected: boolean;
  familiarPassRate: number | null;
  unfamiliarPassRate: number | null;
  explanation: string | null;
} {
  const graded = gradedApplication(records);
  const familiar = graded.filter(isFamiliarRecord);
  const unfamiliar = graded.filter((item) => !isFamiliarRecord(item));
  if (familiar.length < 2 || unfamiliar.length < 1) {
    return { detected: false, familiarPassRate: null, unfamiliarPassRate: null, explanation: null };
  }
  const familiarPassRate = familiar.filter((item) => item.result === 'pass').length / familiar.length;
  const unfamiliarPassRate = unfamiliar.filter((item) => item.result === 'pass').length / unfamiliar.length;
  if (familiarPassRate >= 0.75 && unfamiliarPassRate < 0.5) {
    return {
      detected: true,
      familiarPassRate,
      unfamiliarPassRate,
      explanation:
        'You demonstrated this skill in familiar settings. Your evidence is weaker in unfamiliar contexts. Transfer practice is the next step — not a penalty.',
    };
  }
  return { detected: false, familiarPassRate, unfamiliarPassRate, explanation: null };
}

export function strongestEvidenceNote(transfer: TransferEvidenceSummary): string | null {
  if (transfer.assetClasses.length >= 2) {
    return `Your evidence is strongest across more than one asset class (${transfer.assetClasses.join(', ')}).`;
  }
  if (transfer.contexts.filter((ctx) => ctx !== 'standard').length >= 2) {
    return 'Your evidence is strongest across more than one market condition.';
  }
  if (transfer.formats.length >= 2) {
    return 'Your evidence is strongest across more than one activity format.';
  }
  return null;
}
