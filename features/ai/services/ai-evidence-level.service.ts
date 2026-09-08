import { getDataFreshness } from '@/features/markets/constants/freshness';
import { EVIDENCE_LEVEL_COPY } from '@/shared/constants/trust-language';

import type { AiEnrichedContext } from '../types/ai.types';
import type { AiEvidenceLevel, EvidencePack } from '../types/ai-trust.types';

const LEVEL_ORDER: AiEvidenceLevel[] = ['insufficient', 'limited', 'moderate', 'high'];

export function evidenceLevelLabel(level: AiEvidenceLevel): string {
  return EVIDENCE_LEVEL_COPY[level].label;
}

export function evidenceLevelIndex(level: AiEvidenceLevel): number {
  const idx = LEVEL_ORDER.indexOf(level);
  return idx < 0 ? 0 : idx;
}

/** Never treat a later ask as stronger evidence than an earlier one. */
export function capEvidenceLevel(
  current: AiEvidenceLevel,
  prior?: AiEvidenceLevel | null,
): AiEvidenceLevel {
  if (!prior) return current;
  return evidenceLevelIndex(current) <= evidenceLevelIndex(prior) ? current : prior;
}

export function parseEvidenceLevelFromAssistantText(text: string): AiEvidenceLevel | null {
  const lower = text.toLowerCase();
  if (/\binsufficient evidence\b/.test(lower)) return 'insufficient';
  if (/\blimited evidence\b/.test(lower)) return 'limited';
  if (/\bmoderate evidence\b/.test(lower)) return 'moderate';
  if (/\bhigh evidence\b/.test(lower)) return 'high';
  return null;
}

export function priorEvidenceLevelFromHistory(
  history?: Array<{ role: string; content: string }> | null,
): AiEvidenceLevel | null {
  if (!history?.length) return null;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const msg = history[i];
    if (msg?.role !== 'assistant') continue;
    const parsed = parseEvidenceLevelFromAssistantText(msg.content);
    if (parsed) return parsed;
  }
  return null;
}

export function looksLikeRepeatAsk(prompt: string): boolean {
  return /\b(again|are you sure|but really|just tell me|same question|more confident|higher confidence|be more certain)\b/i.test(
    prompt,
  );
}

export interface EvidenceQualityExplanation {
  why: string[];
  whatWouldImprove: string[];
  honestyLead: string | null;
  available: string[];
  missing: string[];
}

/**
 * Visible evidence inventory — freshness is a trust feature, not decoration.
 */
export function inventoryEvidence(input: {
  context?: AiEnrichedContext | null;
  evidence?: EvidencePack | null;
}): { available: string[]; missing: string[] } {
  const context = input.context;
  const freshness = getDataFreshness(context?.assembledAt);
  const available: string[] = [];
  const missing: string[] = [];

  if (context?.quote?.price) available.push('verified quote');
  else missing.push('verified last price');

  if (context?.rsi || context?.trend || context?.macd || context?.adx != null) {
    available.push('historical data');
  } else {
    missing.push('historical structure data');
  }

  if (context?.newsHeadlines?.length) available.push('attached headlines');
  else missing.push('current news confirmation');

  if (freshness === 'live' || freshness === 'recent') {
    available.push(`${freshness} pack freshness`);
  } else {
    missing.push('current freshness (pack is delayed or unknown)');
  }

  if (context?.supportLevels?.length) available.push('named support / invalidation reference');
  else missing.push('explicit invalidation level');

  const present = (input.evidence?.items ?? []).filter((i) => i.present);
  if (present.length) available.push(`${present.length} populated evidence module${present.length === 1 ? '' : 's'}`);

  return { available, missing };
}

/**
 * Qualitative "why this evidence level" — never a probability of profit.
 */
export function explainEvidenceQuality(input: {
  context?: AiEnrichedContext | null;
  evidence?: EvidencePack | null;
  level: AiEvidenceLevel;
  conflicting?: boolean;
}): EvidenceQualityExplanation {
  const context = input.context;
  const freshness = getDataFreshness(context?.assembledAt);
  const hasQuote = Boolean(context?.quote?.price);
  const newsCount = context?.newsHeadlines?.length ?? 0;
  const present = (input.evidence?.items ?? []).filter((i) => i.present);
  const why: string[] = [];

  if (hasQuote) why.push('Price history is attached.');
  else why.push('No usable last price is attached.');

  if (context?.rsi && context?.trend) why.push('Two structure/momentum inputs are present.');
  else if (context?.rsi || context?.trend) why.push('One structure or momentum input is present.');
  else why.push('Structure and momentum inputs are thin.');

  if (newsCount > 0) why.push(`News context includes ${newsCount} attached headline${newsCount === 1 ? '' : 's'}.`);
  else why.push('News context is limited — none attached.');

  if (freshness === 'stale' || freshness === 'unknown') {
    why.push('Freshness is delayed or unknown, so this is not a live tape.');
  } else {
    why.push(`Attached pack freshness is ${freshness}.`);
  }

  if (input.conflicting) {
    why.push('Independent inputs disagree, so this stays a research question.');
  }

  if (present.length) {
    why.push(`${present.length} evidence module${present.length === 1 ? '' : 's'} populated.`);
  }

  const whatWouldImprove: string[] = [];
  if (!hasQuote) whatWouldImprove.push('A verified last price for the focus symbol.');
  if (!context?.newsHeadlines?.length) whatWouldImprove.push('Current headlines or event context.');
  if (freshness === 'stale' || freshness === 'unknown') {
    whatWouldImprove.push('A more recent pack so delayed inputs are not treated as live.');
  }
  if (!context?.supportLevels?.length) {
    whatWouldImprove.push('An explicit invalidation level written on the case.');
  }
  if (!(context?.rsi && context?.trend)) {
    whatWouldImprove.push('Additional timeframe or indicator confirmation.');
  }
  if (!whatWouldImprove.length) {
    whatWouldImprove.push('Independent confirmation that agrees with the attached pack — still not a forecast.');
  }

  const inventory = inventoryEvidence({ context, evidence: input.evidence });

  let honestyLead: string | null = null;
  if (input.level === 'insufficient') {
    honestyLead = "I don't have enough current data to evaluate this responsibly.";
  } else if (input.level === 'limited' && !hasQuote) {
    honestyLead =
      'I can explain the historical context, but I cannot verify the current market condition.';
  } else if (input.conflicting) {
    honestyLead =
      'Two available sources disagree, so confidence is limited.';
  }

  return {
    why: why.slice(0, 5),
    whatWouldImprove: whatWouldImprove.slice(0, 4),
    honestyLead,
    available: inventory.available,
    missing: inventory.missing,
  };
}

/**
 * Map coverage + freshness + conflict to a qualitative level.
 * Never treat this as P(price up).
 */
export function resolveAiEvidenceLevel(input: {
  context?: AiEnrichedContext | null;
  evidence?: EvidencePack | null;
  conflictingPillars?: number;
}): AiEvidenceLevel {
  const context = input.context;
  const items = input.evidence?.items ?? [];
  const present = items.filter((i) => i.present).length;
  const total = items.length;
  const coverage = total > 0 ? present / total : 0;
  const freshness = getDataFreshness(context?.assembledAt);
  const hasQuote = Boolean(context?.quote?.price);
  const conflicts = input.conflictingPillars ?? 0;

  if (!context || (!hasQuote && present === 0 && !context.symbol)) {
    return 'insufficient';
  }
  if (!hasQuote && coverage < 0.25) return 'insufficient';
  if (freshness === 'stale' || freshness === 'unknown') {
    if (coverage < 0.5) return 'insufficient';
    return 'limited';
  }
  if (conflicts >= 4 || coverage < 0.4) return 'limited';
  const sourceConflicts = detectAttachedEvidenceConflicts(context);
  if (sourceConflicts.length > 0) {
    return coverage < 0.5 ? 'insufficient' : 'limited';
  }
  if (coverage >= 0.7 && (freshness === 'live' || freshness === 'recent') && conflicts <= 1 && hasQuote) {
    return 'high';
  }
  if (coverage >= 0.45) return 'moderate';
  return 'limited';
}

export function downgradeEvidenceLevel(
  level: AiEvidenceLevel,
  steps = 1,
): AiEvidenceLevel {
  const order: AiEvidenceLevel[] = ['high', 'moderate', 'limited', 'insufficient'];
  const idx = Math.min(order.length - 1, order.indexOf(level) + Math.max(1, steps));
  return order[idx] ?? 'insufficient';
}

export interface AttachedEvidenceConflict {
  summary: string;
  sources: [string, string];
}

/**
 * Independent attached inputs that disagree. Never silently pick the side that
 * supports a conclusion.
 */
export function detectAttachedEvidenceConflicts(
  context?: AiEnrichedContext | null,
): AttachedEvidenceConflict[] {
  if (!context) return [];
  const out: AttachedEvidenceConflict[] = [];
  const bias = context.overallBias;
  const rsi = context.rsi?.signal;
  const macd = context.macd?.signal;
  const trend = context.trend?.toLowerCase();

  if (bias && bias !== 'neutral' && (rsi === 'overbought' || rsi === 'oversold')) {
    const stretch = rsi === 'overbought' ? 'overbought' : 'oversold';
    const vs = bias === 'bullish' ? 'a bullish pack bias' : 'a bearish pack bias';
    out.push({
      summary: `Two available sources disagree, so confidence is limited. RSI is ${stretch} while the pack still shows ${vs}.`,
      sources: ['RSI', 'pack bias'],
    });
  }
  if (
    macd &&
    rsi &&
    ((macd === 'bullish' && rsi === 'overbought') || (macd === 'bearish' && rsi === 'oversold'))
  ) {
    out.push({
      summary: `Two available sources disagree, so confidence is limited. MACD is ${macd} while RSI is ${rsi}.`,
      sources: ['MACD', 'RSI'],
    });
  }
  if (trend && bias && bias !== 'neutral') {
    const trendDown = /down|bear|lower/.test(trend);
    const trendUp = /up|bull|higher/.test(trend);
    if ((bias === 'bullish' && trendDown) || (bias === 'bearish' && trendUp)) {
      out.push({
        summary: `Two available sources disagree, so confidence is limited. Structure is labeled ${context.trend} while pack bias is ${bias}.`,
        sources: ['structure', 'pack bias'],
      });
    }
  }
  return out.slice(0, 3);
}
