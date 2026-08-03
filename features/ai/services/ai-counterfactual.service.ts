import { buildCounterfactuals } from '@/features/decision/services/explainability.service';
import type { ExplainabilityFactor } from '@/features/decision/types/decision.types';

import type { AiEnrichedContext } from '../types/ai.types';
import type { AiCounterfactual, ConfidenceBreakdown } from '../types/ai-trust.types';

/**
 * “What would change this conclusion?” — reuses Decision OS counterfactuals
 * and adds AI-context-specific educational flips.
 */
export function buildAiCounterfactuals(
  context: AiEnrichedContext,
  breakdown: ConfidenceBreakdown,
): AiCounterfactual[] {
  const factors: ExplainabilityFactor[] = breakdown.pillars.map((p) => ({
    label: p.label,
    agrees: p.agrees,
    detail: p.explanation,
  }));

  const base = buildCounterfactuals({
    confidence: breakdown.overall,
    factors,
    rsiSignal: context.rsi?.signal,
    mtfMismatch: undefined,
  }).map((c) => ({ label: c.label, detail: c.detail }));

  const extras: AiCounterfactual[] = [];

  if (context.rsi && context.rsi.value < 60) {
    extras.push({
      label: 'If RSI moves above 60',
      detail:
        'Momentum evidence would look less washed-out — revisit whether the research thesis still needs attention.',
    });
  }
  if (context.rsi && context.rsi.value > 40) {
    extras.push({
      label: 'If RSI slips below 40',
      detail:
        'Momentum would weaken further — check invalidation and whether skipping saves research time.',
    });
  }
  if ((context.quote?.volume ?? 0) < 500_000) {
    extras.push({
      label: 'If volume expands materially',
      detail:
        'Participation quality would improve — confirmation research becomes more worthwhile.',
    });
  }
  if ((context.newsHeadlines?.length ?? 0) === 0) {
    extras.push({
      label: 'If a material catalyst (e.g. earnings surprise) appears',
      detail:
        'News evidence would enter the pack — re-score research priority; still not a trade signal.',
    });
  }
  if (context.fearGreedIndex != null && context.fearGreedIndex > 35) {
    extras.push({
      label: 'If inflation or risk sentiment shifts sharply',
      detail:
        'Macro pillar would move — re-check regime fit before expanding the research queue.',
    });
  }
  if (context.adx != null && context.adx < 25) {
    extras.push({
      label: 'If ADX rises above 25',
      detail:
        'Trend-strength evidence would improve — breakout/continuation research may deserve more time.',
    });
  }

  const merged = [...base, ...extras];
  const seen = new Set<string>();
  const unique: AiCounterfactual[] = [];
  for (const item of merged) {
    if (seen.has(item.label)) continue;
    seen.add(item.label);
    unique.push(item);
    if (unique.length >= 5) break;
  }
  return unique;
}
