import { CONTEXT_HREFS, MIXED_CONTEXTS, TRANSFER_CONTEXTS, remediationPlanFor } from '../content/remediation-catalog';
import { recipeFor } from '../content/demonstration-recipes';
import type {
  CompetencyEvidenceRecord,
  CompetencyScenarioContext,
  DemonstrationPrompt,
  RemediationPlan,
} from '../types/competency.types';

export function buildRemediationPlan(conceptId: string): RemediationPlan {
  return remediationPlanFor(conceptId);
}

function lastUsedContext(records: readonly CompetencyEvidenceRecord[]): CompetencyScenarioContext | null {
  const withContext = records.filter((item) => item.scenarioContext);
  return withContext.at(-1)?.scenarioContext ?? null;
}

function usedContexts(records: readonly CompetencyEvidenceRecord[]): Set<CompetencyScenarioContext> {
  return new Set(
    records
      .filter((item) => item.result === 'pass' && item.independent && !item.hintsUsed)
      .map((item) => item.scenarioContext ?? 'standard'),
  );
}

function transferPoolFor(conceptId: string): CompetencyScenarioContext[] {
  return TRANSFER_CONTEXTS[conceptId] ?? MIXED_CONTEXTS;
}

/**
 * Pick a mixed scenario for the next demonstration. Avoid repeating the last context.
 * When the recipe conceals the concept, the prompt does not name the skill.
 */
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

export function selectNextDemonstration(
  conceptId: string,
  records: readonly CompetencyEvidenceRecord[],
): DemonstrationPrompt {
  const recipe = recipeFor(conceptId);
  const context = selectTransferContext(conceptId, records);
  const concealConcept = recipe.concealOnRetest;
  return {
    conceptId,
    context,
    sourceType: 're_demonstration',
    href: CONTEXT_HREFS[context],
    concealConcept,
    reason: concealConcept
      ? 'Assess this situation and make your decision. The skill under review is not named.'
      : 'Re-demonstrate this process in a different scenario than last time.',
  };
}
