import {
  ALTERNATE_ACTIVITIES,
  CONTEXT_HREFS,
  MIXED_CONTEXTS,
  TRANSFER_CONTEXTS,
  remediationPlanFor,
} from '../content/remediation-catalog';
import { recipeFor } from '../content/demonstration-recipes';
import type {
  CompetencyAssetClass,
  CompetencyEvidenceRecord,
  CompetencyEvidenceType,
  CompetencyScenarioContext,
  DemonstrationPrompt,
  MisconceptionHint,
  RemediationPlan,
  RemediationStep,
  TransferKind,
} from '../types/competency.types';
import { isIndependentEvidence } from './evidence.service';
import { scoreTransferEvidence } from './transfer.service';

const FLAG_MISCONCEPTIONS: Array<{
  flag: keyof NonNullable<NonNullable<CompetencyEvidenceRecord['processMetrics']>['flags']>;
  conceptId: string;
  label: string;
}> = [
  { flag: 'exceededRiskLimit', conceptId: 'position-sizing', label: 'taking more risk than the written limit' },
  { flag: 'movedInvalidation', conceptId: 'invalidation', label: 'changing invalidation after entry' },
  { flag: 'missingInvalidation', conceptId: 'invalidation', label: 'entering without a named invalidation' },
  { flag: 'missingThesis', conceptId: 'thesis', label: 'entering without a usable thesis' },
  { flag: 'missingEvidence', conceptId: 'evidence-quality', label: 'acting without independent evidence' },
  { flag: 'fomoEntry', conceptId: 'fomo', label: 'entering after rapid price movement' },
];

export function buildRemediationPlan(
  conceptId: string,
  records: readonly CompetencyEvidenceRecord[] = [],
): RemediationPlan {
  const base = remediationPlanFor(conceptId);
  const misconception = inferMisconception(conceptId, records);
  const recentFailIds = records
    .filter((item) => item.result === 'fail')
    .slice(-4)
    .map((item) => item.sourceId);
  const nextContext = selectTransferContext(conceptId, records);
  const steps = base.steps.map((step) => rotateStep(step, recentFailIds, nextContext));
  const diagnosis = misconception
    ? `The underlying concept is ${conceptId}. Likely process pattern: ${misconception.label}. This area still needs practice.`
    : base.diagnosis;
  return {
    ...base,
    diagnosis,
    misconception: misconception ?? base.misconception,
    steps,
    verifyInNewContext: true,
  };
}

export function inferMisconception(
  conceptId: string,
  records: readonly CompetencyEvidenceRecord[],
): MisconceptionHint | null {
  const recent = records.slice(-6);
  const flags: string[] = [];
  let label: string | null = null;
  for (const row of FLAG_MISCONCEPTIONS) {
    const hits = recent.filter((item) => item.processMetrics?.flags?.[row.flag]).length;
    if (hits >= 1 && (row.conceptId === conceptId || hits >= 2)) {
      flags.push(row.flag);
      if (!label) label = row.label;
    }
  }
  if (!label) return null;
  return { conceptId, label, flags };
}

function rotateStep(
  step: RemediationStep,
  recentFailIds: string[],
  nextContext: CompetencyScenarioContext,
): RemediationStep {
  if (step.kind === 'redemonstration') {
    return {
      ...step,
      href: CONTEXT_HREFS[nextContext] ?? step.href,
      reason: `${step.reason} Verify improvement in a different scenario — not the same prompt.`,
    };
  }
  if (!step.sourceId || !recentFailIds.includes(step.sourceId)) return step;
  const alternate = (ALTERNATE_ACTIVITIES[step.sourceId] ?? []).find(
    (item) => !item.sourceId || !recentFailIds.includes(item.sourceId),
  );
  if (!alternate) return step;
  return { ...step, ...alternate };
}

function lastUsedContext(records: readonly CompetencyEvidenceRecord[]): CompetencyScenarioContext | null {
  const withContext = records.filter((item) => item.scenarioContext);
  return withContext.at(-1)?.scenarioContext ?? null;
}

function usedContexts(records: readonly CompetencyEvidenceRecord[]): Set<CompetencyScenarioContext> {
  return new Set(
    records
      .filter((item) => item.result === 'pass' && isIndependentEvidence(item))
      .map((item) => item.scenarioContext ?? 'standard'),
  );
}

function transferPoolFor(conceptId: string): CompetencyScenarioContext[] {
  return TRANSFER_CONTEXTS[conceptId] ?? MIXED_CONTEXTS;
}

export function inferScenarioContext(input: {
  totalReturn?: number;
  maxWeight?: number;
  highVolatility?: boolean;
  lowVolatility?: boolean;
  earningsEvent?: boolean;
  eventWindow?: boolean;
  ambiguous?: boolean;
}): CompetencyScenarioContext {
  if (input.earningsEvent) return 'earnings';
  if (input.highVolatility) return 'high_volatility';
  if (input.lowVolatility) return 'low_volatility';
  if ((input.maxWeight ?? 0) >= 0.35) return 'concentrated_portfolio';
  if ((input.totalReturn ?? 0) < 0) return 'losing_position';
  if (input.eventWindow) return 'event_window';
  if (input.ambiguous) return 'ambiguous_setup';
  return 'trend';
}

export function selectTransferContext(
  conceptId: string,
  records: readonly CompetencyEvidenceRecord[],
): CompetencyScenarioContext {
  const pool = transferPoolFor(conceptId);
  const last = lastUsedContext(records);
  const used = usedContexts(records);
  const unused = pool.filter((context) => context !== last && !used.has(context));
  const remaining = unused.length ? unused : pool.filter((context) => context !== last);
  return remaining[0] ?? pool[0] ?? 'standard';
}

function lastFormat(records: readonly CompetencyEvidenceRecord[]): CompetencyEvidenceType | null {
  return records.filter((item) => item.result === 'pass').at(-1)?.sourceType ?? null;
}

function lastAsset(records: readonly CompetencyEvidenceRecord[]): CompetencyAssetClass | null {
  return records.filter((item) => item.assetClass).at(-1)?.assetClass ?? null;
}

function pickTransferKind(
  records: readonly CompetencyEvidenceRecord[],
): { kind: TransferKind; sourceType: CompetencyEvidenceType; href?: string; assetClass?: CompetencyAssetClass } {
  const transfer = scoreTransferEvidence(records);
  const last = lastFormat(records);
  const asset = lastAsset(records);
  const sourceIds = new Set(records.filter((item) => item.result === 'pass').map((item) => item.sourceId));

  if (transfer.applicationCount < 1) {
    return { kind: 'same_format', sourceType: last ?? 'practice_drill' };
  }
  if (sourceIds.size < 2 && transfer.formats.length < 2) {
    const sourceType: CompetencyEvidenceType =
      last === 'practice_drill' || last === 'knowledge_check' ? 'practice_drill' : 're_demonstration';
    return { kind: 'new_example', sourceType };
  }
  if (transfer.contexts.filter((ctx) => ctx !== 'standard').length < 2) {
    return { kind: 'new_condition', sourceType: 're_demonstration' };
  }
  if (transfer.assetClasses.length < 2) {
    const nextAsset: CompetencyAssetClass = asset === 'fx' ? 'equity' : 'fx';
    return { kind: 'new_asset', sourceType: 'simulation_decision', href: '/simulate?start=1', assetClass: nextAsset };
  }
  if (transfer.formats.length < 2) {
    const sourceType: CompetencyEvidenceType =
      last === 'simulation_decision' || last === 're_demonstration' ? 'replay_decision' : 're_demonstration';
    return {
      kind: 'new_presentation',
      sourceType,
      href: sourceType === 'replay_decision' ? '/decision/replay-tv' : undefined,
    };
  }
  if (transfer.mixedConceptSourceIds.length < 1) {
    return { kind: 'mixed_concept', sourceType: 'transfer_exercise', href: '/simulate?start=1&focus=event_adaptation' };
  }
  return {
    kind: 'concealed_scenario',
    sourceType: 'surprise_assessment',
    href: '/decision/replay-tv?episode=nfp-surprise-lab',
  };
}

/**
 * Pick a mixed scenario for the next demonstration. Avoid repeating the last context.
 * When the recipe conceals the concept, the prompt does not name the skill.
 */
export function selectNextDemonstration(
  conceptId: string,
  records: readonly CompetencyEvidenceRecord[],
): DemonstrationPrompt {
  const recipe = recipeFor(conceptId);
  const context = selectTransferContext(conceptId, records);
  const picked = pickTransferKind(records);
  const concealConcept = recipe.concealOnRetest || picked.kind === 'concealed_scenario';
  const reason =
    picked.kind === 'concealed_scenario'
      ? 'A mixed situation using skills you have already practiced. This is a check, not a penalty. The skill under review is not named.'
      : concealConcept
        ? 'Assess this situation and make your decision. The skill under review is not named.'
        : picked.kind === 'new_asset'
          ? 'Re-demonstrate this process on a different asset type than last time.'
          : picked.kind === 'new_presentation'
            ? 'Re-demonstrate this process in a different activity format than last time.'
            : picked.kind === 'mixed_concept'
              ? 'Re-demonstrate this process where more than one concept is in play.'
              : picked.kind === 'new_example'
                ? 'Same skill, a different example than last time.'
                : 'Re-demonstrate this process in a different scenario than last time.';
  return {
    conceptId,
    context,
    sourceType: picked.sourceType,
    href: picked.href ?? CONTEXT_HREFS[context],
    concealConcept,
    reason,
    transferKind: picked.kind,
    assetClass: picked.assetClass,
  };
}
