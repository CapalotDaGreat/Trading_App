import type { DecisionBrief, SetupCardData } from '../types/decision.types';

export interface ResearchPriority {
  symbol: string;
  setup: SetupCardData;
  estimatedMinutes: number;
  score: number;
  reason: string;
}

function estimateResearchMinutes(setup: SetupCardData, eventCount: number): number {
  let minutes = 8;
  if (setup.confidence < 55) minutes += 6;
  if (setup.why.length > 3) minutes += 4;
  if (setup.bias === 'neutral') minutes += 5;
  if (eventCount > 0) minutes += Math.min(10, eventCount * 3);
  if (setup.risk === 'high') minutes += 5;
  return Math.min(45, minutes);
}

/** Rank 1–3 symbols for a user time budget (minutes). */
export function prioritizeResearch(
  brief: DecisionBrief,
  setups: SetupCardData[],
  budgetMinutes: number,
): ResearchPriority[] {
  const eventCount = brief.highImpactEvents.length;

  const ranked = setups
    .map((setup) => {
      const rvs = setup.researchValueScore ?? setup.confidence;
      const estimatedMinutes = estimateResearchMinutes(setup, eventCount);
      const memoryBoost = brief.suggestResearch.includes(setup.symbol) ? 8 : 0;
      const statusBoost =
        setup.status === 'confirmed' ? 12 : setup.status === 'forming' ? 6 : 0;
      const score =
        rvs + memoryBoost + statusBoost - Math.max(0, estimatedMinutes - budgetMinutes);

      return {
        symbol: setup.symbol,
        setup,
        estimatedMinutes,
        score,
        reason:
          estimatedMinutes <= budgetMinutes
            ? `Fits ~${budgetMinutes}m · RVS ${rvs} (research value, not price odds)`
            : `Higher complexity (~${estimatedMinutes}m) — only if top RVS priority`,
      };
    })
    .sort((a, b) => b.score - a.score);

  let remaining = budgetMinutes;
  const picked: ResearchPriority[] = [];

  for (const item of ranked) {
    if (picked.length >= 3) break;
    if (item.estimatedMinutes <= remaining || picked.length === 0) {
      picked.push(item);
      remaining -= item.estimatedMinutes;
    }
  }

  return picked.length ? picked : ranked.slice(0, Math.min(3, ranked.length));
}
