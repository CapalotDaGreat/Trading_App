/**
 * Canonical activity → competency concept bindings.
 * Do not invent parallel concept IDs. Resolve through `resolveCompetencyId`.
 */
export const LESSON_CONCEPT_IDS: Record<string, readonly string[]> = {
  'ta-rsi': ['rsi', 'momentum'],
  'ta-momentum': ['momentum', 'trend-identification'],
  'ta-divergence': ['divergence', 'rsi'],
  'ta-structure': ['support'],
  'ta-false-breakouts': ['false-breakouts', 'breakouts'],
  'ta-trend-range': ['trend-identification', 'chart-interpretation'],
  'ta-candles': ['chart-interpretation'],
  'ta-moving-averages': ['moving-averages', 'trend-identification'],
  'ta-macd': ['moving-averages', 'momentum'],
  'ta-volume': ['volume'],
  'ta-mtf': ['multi-timeframe'],
  'risk-position-sizing': ['position-sizing', 'risk-per-trade'],
  'risk-per-trade': ['risk-per-trade', 'risk-reward'],
  'risk-stops': ['invalidation', 'stop-logic'],
  'risk-drawdown': ['drawdown-management'],
  'risk-ruin': ['drawdown-management', 'position-sizing'],
  'risk-expectancy': ['risk-reward', 'risk-per-trade'],
  'risk-exposure': ['concentration-risk', 'diversification'],
  'risk-correlation': ['concentration-risk', 'diversification'],
  'dec-invalidation': ['invalidation'],
  'dec-thesis': ['thesis', 'evidence-quality'],
  'dec-uncertainty': ['uncertainty'],
  'dec-quality': ['evidence-quality', 'thesis'],
  'dec-psychology': ['confirmation-bias', 'emotional-decision-making'],
  'dec-research-filter': ['evidence-quality', 'confirmation-bias'],
  'dec-regime': ['trend-identification', 'scenario-thinking'],
  'dec-setup-quality': ['evidence-quality', 'thesis'],
  'dec-time-budget': ['discipline', 'following-a-plan'],
  'dec-portfolio-risk': ['concentration-risk', 'position-sizing'],
  'dec-journaling': ['journaling', 'post-decision-review'],
  'dec-why-not': ['thesis', 'uncertainty'],
  'dec-trading-dna': ['decision-consistency', 'discipline'],
  'psych-confirmation': ['confirmation-bias'],
  'psych-overconfidence': ['overconfidence'],
  'psych-fomo': ['fomo'],
  'psych-revenge': ['revenge-trading'],
  'psych-loss-aversion': ['loss-aversion'],
  'psych-recency': ['recency-bias'],
  'psych-discipline': ['discipline'],
  'fund-calendar': ['event-risk', 'earnings-events', 'fundamental-uncertainty'],
  'fund-economy': ['interest-rates', 'economic-releases', 'fundamental-uncertainty'],
  'fund-statements': ['earnings', 'revenue-growth', 'balance-sheet'],
  'fund-valuation-quality': ['valuation', 'competitive-position', 'business-quality'],
  'fund-basics': ['business-quality', 'fundamental-uncertainty', 'earnings'],
  'foundations-fx': ['fx'],
  'foundations-asset-classes': ['fx', 'liquidity'],
  'foundations-price': ['chart-interpretation'],
  'foundations-timeframes': ['multi-timeframe'],
  'foundations-volatility': ['volatility-aware-risk'],
  'foundations-liquidity': ['liquidity'],
  'foundations-market': ['chart-interpretation', 'liquidity'],
  'port-diversification': ['diversification'],
  'port-allocation': ['diversification', 'concentration-risk'],
  'basics-orders': ['risk-per-trade'],
  'basics-rr': ['risk-reward'],
  'opt-basics': ['uncertainty', 'risk-per-trade'],
  'crypto-structure': ['chart-interpretation', 'volatility-aware-risk'],
  'prep-simulation-vs-live': ['following-a-plan', 'uncertainty'],
};

export const DRILL_CONCEPT_IDS: Record<string, readonly string[]> = {
  'identify-trend': ['trend-identification', 'momentum'],
  'find-support': ['support'],
  'breakout-quality': ['false-breakouts', 'breakouts'],
  'rr-compare': ['risk-per-trade', 'risk-reward'],
  'position-size': ['position-sizing'],
  'missing-evidence': ['thesis', 'evidence-quality'],
  'confirmation-bias': ['confirmation-bias'],
  'fx-convert': ['fx'],
  'inflation-asset-effects': ['inflation', 'event-risk', 'event-volatility'],
  'rate-decision-uncertainty': ['interest-rates', 'central-bank', 'uncertainty'],
  'compare-two-businesses': ['business-quality', 'competitive-position'],
  'changing-margins': ['earnings', 'revenue-growth'],
  'balance-sheet-risk': ['balance-sheet', 'business-quality'],
  'growth-vs-quality': ['revenue-growth', 'business-quality', 'earnings'],
  'valuation-uncertainty': ['valuation', 'fundamental-uncertainty'],
  'name-invalidation': ['invalidation'],
  'volatility-size': ['volatility-aware-risk'],
  'fomo-chase': ['fomo'],
  'revenge-interrupt': ['revenge-trading'],
  'confidence-check': ['overconfidence'],
  'loss-aversion': ['loss-aversion'],
  'premature-entry': ['thesis', 'invalidation'],
};

export const EVENT_DRILL_IDS = new Set(['inflation-asset-effects', 'rate-decision-uncertainty']);

export const TRANSFER_DRILL_IDS = new Set(['growth-vs-quality']);

export const SURPRISE_REPLAY_IDS = new Set([
  'nfp-surprise-lab',
  'brexit-gap',
  'ecb-statement-twist',
]);

export const REVIEW_ACTION_CONCEPTS = ['post-decision-review', 'extracting-lessons'] as const;

/** Navigation helper: first bound concept. */
export const LESSON_PRIMARY_CONCEPT: Record<string, string> = Object.fromEntries(
  Object.entries(LESSON_CONCEPT_IDS).map(([id, concepts]) => [id, concepts[0]!]),
);

export const DRILL_TO_CONCEPT: Record<string, string> = Object.fromEntries(
  Object.entries(DRILL_CONCEPT_IDS).map(([id, concepts]) => [id, concepts[0]!]),
);

export function conceptsForLesson(lessonId: string): string[] {
  return [...(LESSON_CONCEPT_IDS[lessonId] ?? [])];
}

export function conceptsForDrill(drillId: string): string[] {
  return [...(DRILL_CONCEPT_IDS[drillId] ?? [])];
}

export function isEventDrill(drillId: string): boolean {
  return EVENT_DRILL_IDS.has(drillId);
}

export function isTransferDrill(drillId: string): boolean {
  return TRANSFER_DRILL_IDS.has(drillId);
}

export function isSurpriseReplay(episodeId: string): boolean {
  return SURPRISE_REPLAY_IDS.has(episodeId) || episodeId.includes('surprise');
}
