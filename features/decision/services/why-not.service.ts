import type {
  MarketRegime,
  SetupCardData,
  TraderMemory,
  WhyNotInsight,
} from '../types/decision.types';

/** Reasons to skip / deprioritize research — attention saver, not a short signal. */
export function buildWhyNot(
  setup: SetupCardData,
  regime: MarketRegime,
  memory?: TraderMemory | null,
  eventCount = 0,
): WhyNotInsight | undefined {
  const reasons: string[] = [];

  if (setup.bias === 'neutral') {
    reasons.push('Mixed bias — no clear research edge yet');
  }
  if (setup.confidence < 55) {
    reasons.push('Decision quality below 55% — structure not ready');
  }
  if (setup.status === 'invalidated') {
    reasons.push('Setup already invalidated on last close');
  }
  if (setup.risk === 'high') {
    reasons.push('Elevated risk label — size/process overhead is high');
  }
  if (regime === 'ranging' && /breakout/i.test(setup.title + setup.why.join(' '))) {
    reasons.push('Ranging regime — breakout ideas often fail');
  }
  if (regime === 'high_volatility' && setup.risk !== 'low') {
    reasons.push('High-vol tape — wider noise, easier to overtrade');
  }
  if (eventCount >= 2 && setup.confidence < 70) {
    reasons.push('Multiple calendar catalysts — wait for event dust to settle');
  }
  if (memory?.weakestSetups?.length) {
    const weak = memory.weakestSetups.find((w) =>
      setup.title.toLowerCase().includes(w.toLowerCase().split(' ')[0] ?? ''),
    );
    if (weak) {
      reasons.push(`Matches a weak spot in your history: ${weak}`);
    }
  }
  if (memory?.typicalMistakes?.some((m) => /early|chase|fomo/i.test(m)) && setup.status === 'watching') {
    reasons.push('Still forming — your history says early entries hurt');
  }

  if (reasons.length < 2) return undefined;

  const savedMinutes = Math.min(35, 8 + reasons.length * 5 + (setup.why.length > 2 ? 4 : 0));
  return {
    symbol: setup.symbol,
    reasons: reasons.slice(0, 4),
    savedMinutes,
    summary: `Skip deep dive on ${setup.symbol} — save ~${savedMinutes} minutes for higher-quality work.`,
  };
}

export function buildSkipSuggestions(
  setups: SetupCardData[],
  regime: MarketRegime,
  memory?: TraderMemory | null,
  eventCount = 0,
  max = 2,
): WhyNotInsight[] {
  const ranked = setups
    .map((s) => buildWhyNot(s, regime, memory, eventCount))
    .filter((w): w is WhyNotInsight => Boolean(w))
    .sort((a, b) => b.savedMinutes - a.savedMinutes);

  return ranked.slice(0, max);
}
