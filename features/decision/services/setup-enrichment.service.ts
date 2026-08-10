import type {
  ResearchChecklistItem,
  SetupCardData,
  TraderMemory,
  TradingDna,
} from '../types/decision.types';

export function buildTradingDna(memory: TraderMemory): TradingDna {
  if (memory.dna) return memory.dna;

  const styleMap: Record<string, string> = {
    swing: 'Swing Trader',
    day: 'Day Trader',
    position: 'Position Trader',
    scalp: 'Scalper',
  };

  const styleLabel =
    styleMap[memory.tradingStyle.toLowerCase()] ??
    `${memory.tradingStyle.charAt(0).toUpperCase()}${memory.tradingStyle.slice(1)} Trader`;

  const strengths = [
    ...memory.bestSetups.slice(0, 2).map((s) => s),
    memory.riskTolerance === 'conservative' ? 'Risk awareness' : 'Willingness to take defined risk',
  ].slice(0, 3);

  const weaknesses = memory.typicalMistakes.slice(0, 3);

  const bestConditions =
    memory.notes.length > 0
      ? memory.notes.slice(0, 2)
      : ['Trending markets with clear structure'];

  const avoidConditions = memory.weakestSetups.length
    ? memory.weakestSetups.slice(0, 2)
    : ['Low-ADX ranges', 'News-chasing without a plan'];

  return {
    styleLabel,
    strengths,
    weaknesses: weaknesses.length ? weaknesses : ['Early entries', 'Revenge trades after losses'],
    bestConditions,
    avoidConditions,
    bestSetups: memory.bestSetups.slice(0, 4),
    worstSetups: memory.weakestSetups.slice(0, 4),
    preferredRegimes: bestConditions,
    avgHoldHint: memory.avgHoldHint,
    riskTolerance: memory.riskTolerance,
    psychologyPatterns: memory.typicalMistakes.slice(0, 3),
    commonMistakes: memory.typicalMistakes.slice(0, 4),
    bestWeekdays: ['Tuesday', 'Wednesday'],
    preferredIndicators: memory.favoriteIndicators.slice(0, 5),
    mostProfitableCategories: memory.bestSetups.slice(0, 3),
  };
}

export function buildSetupResearchChecklist(setup: SetupCardData): ResearchChecklistItem[] {
  const hasTrend = setup.why.some((w) => /trend|structure|daily/i.test(w));
  const hasMomentum = setup.why.some((w) => /rsi|macd|momentum/i.test(w));
  const hasRisk = Boolean(setup.invalidation);
  const confirmed = setup.status === 'confirmed' || setup.status === 'forming';

  return [
    { id: 'trend', label: 'Trend', done: hasTrend || setup.bias !== 'neutral' },
    { id: 'catalyst', label: 'Catalyst / structure', done: hasMomentum || setup.why.length >= 2 },
    { id: 'entry', label: 'Structure confirmation', done: confirmed && setup.confidence >= 65 },
    { id: 'risk', label: 'Risk defined', done: hasRisk },
  ];
}

export function historyNoteForSetup(setup: SetupCardData, memory: TraderMemory): string | undefined {
  const match = memory.bestSetups.find((b) => {
    const token = b.toLowerCase().split(/\s+/)[0] ?? '';
    return token.length > 2 && setup.title.toLowerCase().includes(token);
  });
  if (match) {
    return `Your history: you tend to do well with “${match}” style ideas.`;
  }
  const weak = memory.weakestSetups.find((w) => {
    const token = w.toLowerCase().split(/\s+/)[0] ?? '';
    return token.length > 2 && (setup.title + setup.why.join(' ')).toLowerCase().includes(token);
  });
  if (weak) {
    return `Caution: similar to a weak spot (“${weak}”) — demand extra confirmation.`;
  }
  return undefined;
}
