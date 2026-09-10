import { recipeFor } from '../content/demonstration-recipes';
import type {
  CompetenceState,
  CompetencyEvidenceRecord,
  CompetencyEvidenceType,
  CompetencyMastery,
  CompetencyMasteryState,
  DemonstrationRecipe,
  EvidenceRole,
  RevisitKind,
} from '../types/competency.types';
import { selectNextDemonstration, buildRemediationPlan } from './context.service';
import { assertSafeCopy, COMPETENCY_DISCLAIMER, userLabelFor } from './copy.service';
import { isExposureOnlyRecord, isIndependentEvidence } from './evidence.service';
import { scoreEvidenceQuality } from './quality.service';
import { computeRedemonstrationDueAt } from './schedule.service';
import { getCompetencyConcept } from './taxonomy.service';
import { scoreTransferEvidence, strongestEvidenceNote, detectFalseMastery, isFamiliarRecord } from './transfer.service';

const DAY = 24 * 60 * 60 * 1000;

export { COMPETENCY_DISCLAIMER };

const DIFFICULTY_WEIGHT = {
  foundations: 0.85,
  applied: 1,
  complex: 1.15,
} as const;

const DEMONSTRATION_SOURCES = new Set<CompetencyEvidenceType>([
  'knowledge_check',
  'calculation_exercise',
  'practice_drill',
  'applied_exercise',
  'event_exercise',
  'replay_decision',
  'simulation_decision',
  'simulation_checkpoint',
  'remediation_exercise',
  're_demonstration',
  'transfer_exercise',
  'surprise_assessment',
]);

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function outcomeValue(result: CompetencyEvidenceRecord['result']): number | null {
  if (result === 'pass') return 1;
  if (result === 'partial') return 0.55;
  if (result === 'fail') return 0;
  return null;
}

function recencyDecay(occurredAt: number, now: number): number {
  const ageDays = Math.max(0, (now - occurredAt) / DAY);
  return Math.exp((-Math.LN2 * ageDays) / 28);
}

function isDemonstration(record: CompetencyEvidenceRecord): boolean {
  if (isExposureOnlyRecord(record)) return false;
  if (!DEMONSTRATION_SOURCES.has(record.sourceType)) return false;
  if (record.result !== 'pass' && record.result !== 'partial') return false;
  if (record.result === 'partial' && (record.processMetrics?.processQuality ?? 55) < 70) {
    return record.sourceType === 're_demonstration';
  }
  return true;
}

function gradedRecords(records: CompetencyEvidenceRecord[]): CompetencyEvidenceRecord[] {
  return records
    .filter((item) => !isExposureOnlyRecord(item) && outcomeValue(item.result) != null)
    .sort((a, b) => a.occurredAt - b.occurredAt);
}

function strengthOf(records: CompetencyEvidenceRecord[], now: number): number | null {
  let weight = 0;
  let sum = 0;
  for (const item of records) {
    if (isExposureOnlyRecord(item)) continue;
    const raw = outcomeValue(item.result);
    if (raw == null) continue;
    const independent = isIndependentEvidence(item);
    const assistedOutcome = independent ? raw : raw * 0.65;
    const w = item.reliability * DIFFICULTY_WEIGHT[item.difficulty] * recencyDecay(item.occurredAt, now);
    weight += w;
    sum += assistedOutcome * w;
  }
  if (weight === 0) return null;
  return clamp((sum / weight) * 100);
}

function recordFitsRequirement(
  record: CompetencyEvidenceRecord,
  sources: CompetencyEvidenceType[] | undefined,
): boolean {
  if (!isIndependentEvidence(record)) return false;
  if (record.result !== 'pass' && record.result !== 'partial') return false;
  if (record.result === 'partial' && (record.processMetrics?.processQuality ?? 55) < 70) return false;
  if (!sources?.length) return true;
  return sources.includes(record.sourceType);
}

export function missingRecipeRoles(
  recipe: DemonstrationRecipe,
  records: readonly CompetencyEvidenceRecord[],
): EvidenceRole[] {
  const remaining = records
    .filter((item) => recordFitsRequirement(item, undefined) || item.result === 'pass')
    .slice()
    .sort((a, b) => a.occurredAt - b.occurredAt);
  const pool = remaining.filter((item) => isIndependentEvidence(item) && item.result !== 'fail');
  const unused = [...pool];
  const missing: EvidenceRole[] = [];

  for (const requirement of recipe.requirements) {
    const assigned: CompetencyEvidenceRecord[] = [];
    for (const record of unused.slice()) {
      if (assigned.length >= requirement.minIndependent) break;
      if (!recordFitsRequirement(record, requirement.sources)) continue;
      assigned.push(record);
      unused.splice(unused.indexOf(record), 1);
    }
    if (assigned.length < requirement.minIndependent) {
      missing.push(requirement.role);
      continue;
    }
    if (requirement.variedContexts) {
      const application = records.filter(
        (item) =>
          isIndependentEvidence(item) &&
          (item.result === 'pass' || item.result === 'partial') &&
          (requirement.sources ?? []).includes(item.sourceType),
      );
      const contexts = new Set(application.map((item) => item.scenarioContext ?? 'standard'));
      if (contexts.size < requirement.variedContexts) missing.push(requirement.role);
    }
  }

  return missing;
}

function lastRemediationExitAt(records: readonly CompetencyEvidenceRecord[]): number | null {
  const rem = records.filter((item) => item.sourceType === 'remediation_exercise' && item.result === 'pass');
  return rem.at(-1)?.occurredAt ?? null;
}

function hadRepeatedProcessMisses(graded: CompetencyEvidenceRecord[]): boolean {
  const recent = graded.slice(-4);
  if (recent.length < 2) return false;
  const misses = recent.filter((item) => item.result === 'fail').length;
  return misses >= 2 && misses / recent.length >= 0.5;
}

function isStrongBand(input: {
  applicationCount: number;
  contextCount: number;
  transferProven: boolean;
  independence: number | null;
  recency: number | null;
  consistency: number | null;
}): boolean {
  if (!input.transferProven) return false;
  if (input.applicationCount < 4 || input.contextCount < 2) return false;
  if ((input.independence ?? 0) < 65) return false;
  if ((input.recency ?? 0) < 45) return false;
  if (input.consistency != null && input.consistency < 50) return false;
  return true;
}

function deriveCompetenceState(input: {
  machine: CompetencyMasteryState;
  transferProven: boolean;
  hasIndependentApplication: boolean;
  strong: boolean;
  falseMastery: boolean;
}): { competenceState: CompetenceState; revisitKind?: RevisitKind } {
  if (input.machine === 'not_started') return { competenceState: 'not_started' };
  if (input.machine === 'learning') return { competenceState: 'learning' };
  if (input.machine === 'needs_remediation') return { competenceState: 'needs_revisit', revisitKind: 'remediation' };
  if (input.machine === 'due_for_redemonstration') return { competenceState: 'needs_revisit', revisitKind: 'retention' };
  if (input.machine === 'practiced') {
    if (input.hasIndependentApplication && !input.transferProven) {
      return { competenceState: 'transfer_unproven', revisitKind: 'transfer' };
    }
    return { competenceState: 'developing' };
  }
  if (input.machine === 'demonstrated') {
    if (input.falseMastery) {
      return { competenceState: 'demonstrated', revisitKind: 'transfer' };
    }
    if (input.hasIndependentApplication && !input.transferProven) {
      return { competenceState: 'transfer_unproven', revisitKind: 'transfer' };
    }
    if (input.strong) return { competenceState: 'strong' };
    return { competenceState: 'demonstrated' };
  }
  return { competenceState: 'developing' };
}

function diagnosisFromFlags(records: readonly CompetencyEvidenceRecord[], fallback: string): string {
  const flags = records.flatMap((item) => item.processMetrics?.flags ?? []);
  const recentFlags = records.slice(-6);
  const flagHits = {
    exceededRiskLimit: recentFlags.filter((item) => item.processMetrics?.flags?.exceededRiskLimit).length,
    movedInvalidation: recentFlags.filter((item) => item.processMetrics?.flags?.movedInvalidation).length,
    fomoEntry: recentFlags.filter((item) => item.processMetrics?.flags?.fomoEntry).length,
  };
  if (flagHits.exceededRiskLimit >= 2) {
    return 'Recent decisions show a recurring pattern of taking more risk than the written limit. Position sizing needs practice.';
  }
  if (flagHits.movedInvalidation >= 2) {
    return 'Recent decisions show a recurring pattern of changing invalidation after entry.';
  }
  if (flagHits.fomoEntry >= 2) {
    return 'Your recent decisions show a recurring pattern of entering after rapid price movement.';
  }
  void flags;
  return fallback;
}

export function scoreCompetencyMastery(
  conceptId: string,
  records: readonly CompetencyEvidenceRecord[],
  now = Date.now(),
): CompetencyMastery {
  const node = getCompetencyConcept(conceptId);
  const canonicalId = node?.id ?? conceptId;
  const mine = records
    .filter((item) => item.conceptId === canonicalId)
    .slice()
    .sort((a, b) => a.occurredAt - b.occurredAt);

  const recipe = recipeFor(canonicalId);
  const explanations: string[] = [];
  const lessons = mine.filter((item) => item.sourceType === 'lesson_completion');
  const graded = gradedRecords(mine);
  const reflections = mine.filter(
    (item) => item.sourceType === 'journal_reflection' || item.sourceType === 'review_finding',
  );

  const demonstrations = mine.filter(isDemonstration);
  const independentDemos = demonstrations.filter((item) => isIndependentEvidence(item));
  const contexts = new Set(
    independentDemos.map((item) => item.scenarioContext ?? item.sourceType),
  );

  const lastEvidenceAt = mine.at(-1)?.occurredAt ?? null;
  const lastIndependentSuccessAt = independentDemos.at(-1)?.occurredAt ?? null;
  const quality = scoreEvidenceQuality(mine, now);
  const strength = strengthOf(mine, now);
  const lastDifficulty = independentDemos.at(-1)?.difficulty ?? 'applied';
  const transferPreview = scoreTransferEvidence(mine);
  const recentFailCount = mine.filter(
    (item) => item.result === 'fail' && now - item.occurredAt <= 14 * DAY,
  ).length;
  const nextRedemonstrationAt =
    lastIndependentSuccessAt != null
      ? computeRedemonstrationDueAt({
          lastIndependentSuccessAt,
          importance: recipe.importance,
          quality,
          strength,
          lastDifficulty,
          independentCount: independentDemos.length,
          transferProven: transferPreview.proven,
          recentFailCount,
        })
      : null;

  const missingRoles = missingRecipeRoles(recipe, mine);
  const hasIndependentPass = mine.some(
    (item) =>
      isIndependentEvidence(item) &&
      (item.result === 'pass' || item.result === 'partial') &&
      !isExposureOnlyRecord(item),
  );
  const recipeMetNow = missingRoles.length === 0 && hasIndependentPass;

  const remExit = lastRemediationExitAt(mine);
  const freshAfterRemediation =
    remExit == null ||
    independentDemos.some(
      (item) =>
        item.occurredAt > remExit &&
        (item.sourceType === 're_demonstration' ||
          item.sourceType === 'simulation_decision' ||
          item.sourceType === 'replay_decision'),
    );
  const lastGraded = graded.at(-1);
  const recoveredAfterRemediation =
    lastGraded?.result === 'pass' &&
    (lastGraded.sourceType === 'remediation_exercise' || lastGraded.sourceType === 're_demonstration');
  const falseMasterySignal = detectFalseMastery(mine);
  const remediationPool = falseMasterySignal.detected ? graded.filter(isFamiliarRecord) : graded;
  const needsRemediation = !recoveredAfterRemediation && hadRepeatedProcessMisses(remediationPool);

  const peakRecords = lastIndependentSuccessAt
    ? mine.filter((item) => item.occurredAt <= lastIndependentSuccessAt)
    : [];
  const previouslyDemonstrated =
    recipeMetNow ||
    (peakRecords.length > 0 && missingRecipeRoles(recipe, peakRecords).length === 0);

  const stale = Boolean(
    recipeMetNow &&
      nextRedemonstrationAt != null &&
      now >= nextRedemonstrationAt &&
      !needsRemediation,
  );

  const demonstratedEligible = recipeMetNow && !needsRemediation && freshAfterRemediation && !stale;
  const transferBase = scoreTransferEvidence(mine);
  const transfer = falseMasterySignal.detected ? { ...transferBase, proven: false } : transferBase;
  const strong = isStrongBand({
    applicationCount: transfer.applicationCount,
    contextCount: transfer.contexts.filter((ctx) => ctx !== 'standard').length,
    transferProven: transfer.proven,
    independence: quality.independence,
    recency: quality.recency,
    consistency: quality.consistency,
  });

  let state: CompetencyMasteryState = 'not_started';

  if (mine.length === 0) {
    state = 'not_started';
    explanations.push('No evidence yet. A concept without practice stays not started.');
  } else if (graded.length === 0 && lessons.length > 0 && reflections.length === 0) {
    state = 'learning';
    explanations.push('A lesson was completed. That is exposure, not demonstrated skill.');
  } else if (graded.length === 0 && reflections.length > 0 && demonstrations.length === 0) {
    state = 'learning';
    explanations.push('A structured reflection was recorded. It is a starting signal, not mastery.');
  } else if (needsRemediation) {
    state = 'needs_remediation';
    explanations.push(
      previouslyDemonstrated
        ? 'Earlier demonstrations still count. This area still needs practice.'
        : 'This area still needs practice.',
    );
  } else if (stale && previouslyDemonstrated) {
    state = 'due_for_redemonstration';
    explanations.push(
      'Due for a spaced re-demonstration. The aim is retention, not punishment. Re-demonstrate in a different scenario.',
    );
  } else if (demonstratedEligible) {
    state = 'demonstrated';
    if (falseMasterySignal.detected && falseMasterySignal.explanation) {
      explanations.push(falseMasterySignal.explanation);
    } else if (!transfer.proven) {
      explanations.push(
        'You demonstrated this skill in one format. Transfer to a new context is still unproven.',
      );
    } else if (strong) {
      explanations.push(
        'You demonstrated this skill. Your evidence is strongest in independent application across more than one context.',
      );
    } else {
      explanations.push(
        'You demonstrated this skill inside TradeAcademy’s training environment. Process counts; simulated P/L does not.',
      );
    }
  } else if (demonstrations.length > 0 || graded.length > 0) {
    state = 'practiced';
    if (recoveredAfterRemediation && !freshAfterRemediation) {
      explanations.push(
        'Remediation was completed. Evidence history is kept. A fresh independent demonstration is still needed.',
      );
    }
    if (independentDemos.length === 0 && demonstrations.length > 0) {
      explanations.push('A guided success is useful. Independent application is still needed before this can be demonstrated.');
    } else if (missingRoles.length) {
      explanations.push('This area still needs practice before it can be demonstrated.');
    } else if (!freshAfterRemediation) {
      explanations.push(
        'A successful remediation does not skip back to demonstrated. Show the process independently once more.',
      );
    } else {
      explanations.push('This area still needs practice.');
    }
  } else if (lessons.length > 0) {
    state = 'learning';
    explanations.push('A lesson was completed. That is exposure, not demonstrated skill.');
  }

  if (graded.some((item) => item.processMetrics?.simulatedProfitable && item.result === 'fail')) {
    explanations.push('A profitable simulation with weak process does not raise mastery.');
  }
  if (graded.some((item) => item.processMetrics?.simulatedProfitable === false && item.result === 'pass')) {
    explanations.push('A losing simulation with strong process can still count as evidence.');
  }
  const strongest = strongestEvidenceNote(transfer);
  if (strongest && (state === 'demonstrated' || state === 'practiced')) {
    explanations.push(strongest);
  }

  if (explanations.length === 0) {
    explanations.push('Insufficient evidence to describe this competency yet.');
  }

  const { competenceState, revisitKind } = deriveCompetenceState({
    machine: state,
    transferProven: transfer.proven,
    hasIndependentApplication: transfer.applicationCount > 0,
    strong,
    falseMastery: falseMasterySignal.detected,
  });

  const remediation = state === 'needs_remediation' ? buildRemediationPlan(canonicalId, mine) : null;
  if (remediation) {
    remediation.diagnosis = diagnosisFromFlags(mine, remediation.diagnosis);
  }

  const nextDemonstration =
    state === 'due_for_redemonstration' ||
    state === 'needs_remediation' ||
    (state === 'practiced' && missingRoles.length > 0) ||
    competenceState === 'transfer_unproven' ||
    falseMasterySignal.detected ||
    (state === 'demonstrated' && !transfer.proven)
      ? selectNextDemonstration(canonicalId, mine)
      : null;

  for (const line of explanations) assertSafeCopy(line);
  if (remediation) assertSafeCopy(remediation.diagnosis);

  const userLabel = userLabelFor(competenceState);

  return {
    conceptId: canonicalId,
    title: node?.title ?? canonicalId,
    family: node?.family ?? null,
    state,
    competenceState,
    userLabel,
    revisitKind,
    strength,
    quality,
    transfer,
    falseMastery: falseMasterySignal.detected,
    explanations,
    demonstrationCount: demonstrations.length,
    independentDemonstrationCount: independentDemos.length,
    contextCount: contexts.size,
    recipeMet: recipeMetNow,
    missingRoles,
    previouslyDemonstrated,
    lastEvidenceAt,
    lastIndependentSuccessAt,
    nextRedemonstrationAt,
    remediation,
    nextDemonstration,
    disclaimer: COMPETENCY_DISCLAIMER,
  };
}

export function scoreAllCompetencyMastery(
  records: readonly CompetencyEvidenceRecord[],
  now = Date.now(),
): CompetencyMastery[] {
  const ids = [...new Set(records.map((item) => item.conceptId))];
  return ids.map((id) => scoreCompetencyMastery(id, records, now));
}

export function emptyCompetencyMastery(conceptId: string): CompetencyMastery {
  return scoreCompetencyMastery(conceptId, []);
}
