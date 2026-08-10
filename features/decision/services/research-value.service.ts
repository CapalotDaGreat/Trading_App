import type {
  DecisionBias,
  ImpactLevel,
  MarketRegime,
  SetupCardData,
  TraderMemory,
} from '../types/decision.types';

export interface ResearchValueResult {
  score: number;
  explanation: string;
  factors: { label: string; impact: number; detail: string }[];
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * Research Value Score — "How valuable is spending time researching this?"
 * Never a price-direction probability.
 */
export function computeResearchValueScore(input: {
  setup: SetupCardData;
  regime?: MarketRegime;
  memory?: TraderMemory;
  portfolioSymbols?: string[];
  eventCount?: number;
  timeBudgetMinutes?: number;
}): ResearchValueResult {
  const { setup, regime, memory, portfolioSymbols = [], eventCount = 0, timeBudgetMinutes = 20 } =
    input;
  const factors: ResearchValueResult['factors'] = [];
  let score = 45;

  // Setup quality / structure
  const structure = setup.confidence;
  const structureImpact = (structure - 50) * 0.35;
  score += structureImpact;
  factors.push({
    label: 'Setup quality',
    impact: structureImpact,
    detail: `Structure/fit input ${structure}/100`,
  });

  // Regime alignment
  let regimeImpact = 0;
  if (regime === 'high_volatility' && setup.risk === 'high') {
    regimeImpact = -12;
  } else if (regime === 'ranging' && /breakout/i.test(setup.title + setup.why.join(' '))) {
    regimeImpact = -10;
  } else if (regime === 'trending' && setup.bias !== 'neutral') {
    regimeImpact = 10;
  } else if (regime === 'risk_off' && setup.bias === 'bullish') {
    regimeImpact = -6;
  } else if (regime) {
    regimeImpact = 4;
  }
  score += regimeImpact;
  factors.push({
    label: 'Regime alignment',
    impact: regimeImpact,
    detail: regime ? `Current regime: ${regime.replace('_', ' ')}` : 'Regime unknown',
  });

  // Portfolio correlation / concentration
  const alreadyHeld = portfolioSymbols.some(
    (s) => s.toUpperCase() === setup.symbol.toUpperCase(),
  );
  const themeHeavy =
    portfolioSymbols.length >= 3 &&
    portfolioSymbols.filter((s) => s.toUpperCase().startsWith(setup.symbol.slice(0, 2))).length >= 2;
  let portfolioImpact = 0;
  if (alreadyHeld) {
    portfolioImpact = -8;
    factors.push({
      label: 'Portfolio overlap',
      impact: portfolioImpact,
      detail: 'Already held — research may add less new edge',
    });
  } else if (themeHeavy) {
    portfolioImpact = -5;
    factors.push({
      label: 'Theme concentration',
      impact: portfolioImpact,
      detail: 'Similar names already open — opportunity cost rises',
    });
  } else {
    portfolioImpact = 5;
    factors.push({
      label: 'Portfolio relevance',
      impact: portfolioImpact,
      detail: 'Not currently concentrated in this name',
    });
  }
  score += portfolioImpact;

  // Historical / DNA fit
  let historyImpact = 0;
  if (memory) {
    const hay = `${setup.title} ${setup.why.join(' ')}`.toLowerCase();
    if (memory.bestSetups.some((b) => hay.includes(b.toLowerCase().split(' ')[0] ?? ''))) {
      historyImpact = 8;
    } else if (
      memory.weakestSetups.some((w) => hay.includes(w.toLowerCase().split(' ')[0] ?? ''))
    ) {
      historyImpact = -10;
    }
  }
  score += historyImpact;
  factors.push({
    label: 'Trader strengths',
    impact: historyImpact,
    detail:
      historyImpact > 0
        ? 'Aligns with setups you historically execute well'
        : historyImpact < 0
          ? 'Similar to a documented weak spot — demand extra proof'
          : 'No strong personal history match',
  });

  // Catalyst / events
  const catalystImpact = eventCount > 0 ? Math.min(8, eventCount * 3) : -2;
  score += catalystImpact;
  factors.push({
    label: 'Catalyst quality',
    impact: catalystImpact,
    detail:
      eventCount > 0
        ? `${eventCount} nearby calendar item(s) — research timing matters`
        : 'No high-impact calendar catalyst nearby',
  });

  // Time budget fit
  const estMinutes =
    setup.risk === 'high' ? 18 : setup.status === 'forming' ? 12 : 9;
  const timeImpact =
    estMinutes <= timeBudgetMinutes ? 6 : -Math.min(12, estMinutes - timeBudgetMinutes);
  score += timeImpact;
  factors.push({
    label: 'Available research time',
    impact: timeImpact,
    detail: `~${estMinutes}m vs ${timeBudgetMinutes}m budget`,
  });

  // Status
  const statusImpact =
    setup.status === 'confirmed' ? 8 : setup.status === 'forming' ? 4 : setup.status === 'invalidated' ? -25 : 0;
  score += statusImpact;

  const finalScore = clamp(score);
  const top = [...factors].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))[0];
  const explanation = `Research value ${finalScore}/100 — ${top?.detail ?? 'balanced factors'}. This scores attention worthiness, not price direction.`;

  return { score: finalScore, explanation, factors };
}

/**
 * Decision Quality Score — process checklist quality (not market direction).
 */
export function computeDecisionQualityScore(setup: SetupCardData): {
  score: number;
  explanation: string;
  checks: { id: string; label: string; passed: boolean }[];
} {
  const checks = [
    {
      id: 'trend',
      label: 'Trend alignment',
      passed:
        setup.bias !== 'neutral' ||
        setup.why.some((w) => /trend|structure|higher high|lower low/i.test(w)),
    },
    {
      id: 'risk',
      label: 'Risk defined',
      passed: Boolean(setup.invalidation),
    },
    {
      id: 'timeframe',
      label: 'Timeframe agreement',
      passed: setup.why.some((w) => /daily|4h|weekly|mtf|multi/i.test(w)) || setup.confidence >= 60,
    },
    {
      id: 'catalyst',
      label: 'Catalyst / structure',
      passed: setup.why.length >= 2,
    },
    {
      id: 'confirmation',
      label: 'Confirmation',
      passed: setup.status === 'confirmed' || setup.status === 'forming',
    },
    {
      id: 'checklist',
      label: 'Checklist completion',
      passed:
        (setup.researchChecklist?.filter((c) => c.done).length ?? 0) >=
        Math.ceil((setup.researchChecklist?.length ?? 4) * 0.75),
    },
  ];

  const passed = checks.filter((c) => c.passed).length;
  const score = clamp((passed / checks.length) * 100);
  const missing = checks.filter((c) => !c.passed).map((c) => c.label);
  const explanation =
    missing.length === 0
      ? `Decision quality ${score}/100 — all process checks passed. This grades your process, not whether price will rise.`
      : `Decision quality ${score}/100 — missing: ${missing.slice(0, 3).join(', ')}. Improve process before size.`;

  return { score, explanation, checks };
}

export function buildResearchBalance(setup: SetupCardData, alternatives: string[] = []): {
  reasonsToResearch: string[];
  reasonsNotToResearch: string[];
  missingConfirmations: string[];
  alternativeSymbols: string[];
} {
  const reasonsToResearch = [
    ...setup.why.slice(0, 3),
    setup.status === 'confirmed' ? 'Status confirmed — criteria met for deeper look' : '',
    setup.historyNote ?? '',
  ].filter(Boolean);

  const reasonsNotToResearch = [
    ...(setup.whyNot?.reasons ?? []).slice(0, 3),
    setup.risk === 'high' ? 'Elevated case risk — only if size discipline is clear' : '',
    setup.bias === 'neutral' ? 'Neutral bias — unclear edge until confirmation' : '',
  ].filter(Boolean);

  const missingConfirmations =
    setup.researchChecklist?.filter((c) => !c.done).map((c) => c.label) ??
    ['Structure confirmation', 'Risk defined'].filter(
      (l) => l === 'Risk defined' && !setup.invalidation,
    );

  return {
    reasonsToResearch: reasonsToResearch.length
      ? reasonsToResearch
      : ['Clear enough structure to spend a short research block'],
    reasonsNotToResearch: reasonsNotToResearch.length
      ? reasonsNotToResearch
      : ['Opportunity cost — other ideas may deserve the same minutes'],
    missingConfirmations,
    alternativeSymbols: alternatives.filter(
      (s) => s.toUpperCase() !== setup.symbol.toUpperCase(),
    ).slice(0, 3),
  };
}

export function riskLabelToImpact(risk: ImpactLevel): number {
  return risk === 'high' ? 3 : risk === 'medium' ? 2 : 1;
}

export function biasAllowsSize(bias: DecisionBias): boolean {
  return bias !== 'neutral';
}
