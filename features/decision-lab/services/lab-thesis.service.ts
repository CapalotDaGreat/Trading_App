import type { MarketRegime, TraderMemory } from '@/features/decision/types/decision.types';
import type { Holding } from '@/features/portfolio/types/portfolio.types';

import type {
  LabAiCritique,
  LabBias,
  LabPosition,
  LabThesis,
  LabThesisChecklist,
  LabTradeScores,
} from '../types/lab.types';

export function computeRiskReward(
  bias: LabBias,
  entry: number,
  stop: number,
  target: number,
): number {
  const risk = Math.abs(entry - stop);
  const reward = Math.abs(target - entry);
  if (risk <= 0) return 0;
  return Math.round((reward / risk) * 100) / 100;
}

export function buildThesisChecklist(input: {
  bias?: LabBias;
  entryLow?: number;
  entryHigh?: number;
  stopLoss?: number;
  target?: number;
  riskReward?: number;
  catalyst?: string;
  invalidation?: string;
  confidence?: number;
  academyChecklistDone?: boolean;
}): LabThesisChecklist {
  const entryOk =
    typeof input.entryLow === 'number' &&
    typeof input.entryHigh === 'number' &&
    input.entryLow > 0 &&
    input.entryHigh >= input.entryLow;
  const stopOk = typeof input.stopLoss === 'number' && input.stopLoss > 0;
  const targetOk = typeof input.target === 'number' && input.target > 0;
  const rr = input.riskReward ?? 0;

  return {
    biasDefined: input.bias === 'long' || input.bias === 'short',
    entryDefined: entryOk,
    stopDefined: stopOk,
    targetDefined: targetOk,
    rrAcceptable: rr >= 1.5,
    catalystDefined: Boolean(input.catalyst?.trim() && input.catalyst.trim().length >= 4),
    invalidationDefined: Boolean(
      input.invalidation?.trim() && input.invalidation.trim().length >= 4,
    ),
    confidenceSet:
      typeof input.confidence === 'number' &&
      input.confidence >= 1 &&
      input.confidence <= 100,
    academyChecklistDone: Boolean(input.academyChecklistDone),
  };
}

export function isThesisComplete(checklist: LabThesisChecklist): boolean {
  return Object.values(checklist).every(Boolean);
}

export function thesisBlockers(checklist: LabThesisChecklist): string[] {
  const map: { key: keyof LabThesisChecklist; label: string }[] = [
    { key: 'biasDefined', label: 'Define bias (long/short)' },
    { key: 'entryDefined', label: 'Define entry zone' },
    { key: 'stopDefined', label: 'Define stop loss' },
    { key: 'targetDefined', label: 'Define target' },
    { key: 'rrAcceptable', label: 'Risk/Reward must be ≥ 1.5:1' },
    { key: 'catalystDefined', label: 'Name a catalyst' },
    { key: 'invalidationDefined', label: 'Write invalidation' },
    { key: 'confidenceSet', label: 'Set process confidence (1–100)' },
    { key: 'academyChecklistDone', label: 'Complete pre-trade checklist' },
  ];
  return map.filter((m) => !checklist[m.key]).map((m) => m.label);
}

export function validateThesisGeometry(thesis: Pick<
  LabThesis,
  'bias' | 'entryLow' | 'entryHigh' | 'stopLoss' | 'target'
>): string | null {
  const mid = (thesis.entryLow + thesis.entryHigh) / 2;
  if (thesis.bias === 'long') {
    if (thesis.stopLoss >= mid) return 'Long stop must sit below the entry zone.';
    if (thesis.target <= mid) return 'Long target must sit above the entry zone.';
  } else {
    if (thesis.stopLoss <= mid) return 'Short stop must sit above the entry zone.';
    if (thesis.target >= mid) return 'Short target must sit below the entry zone.';
  }
  return null;
}

export function buildLabAiCritique(input: {
  thesis: LabThesis;
  regime?: MarketRegime;
  memory?: TraderMemory;
  holdings?: Holding[];
}): LabAiCritique {
  const { thesis, regime, memory, holdings = [] } = input;
  const suggestions: string[] = [];
  let cautionCount = 0;

  // Risk
  let risk =
    thesis.riskReward >= 2
      ? `R:R ${thesis.riskReward}:1 meets a disciplined minimum.`
      : `R:R ${thesis.riskReward}:1 is thin — raise target or tighten risk definition.`;
  if (thesis.riskReward < 2) {
    cautionCount += 1;
    suggestions.push('Improve risk/reward before size — process first.');
  }

  // Confirmation / checklist
  const checksDone = Object.values(thesis.checklist).filter(Boolean).length;
  const confirmation =
    checksDone === 9
      ? 'Thesis checklist is complete — confirmation gate passed.'
      : `Checklist incomplete (${checksDone}/9) — do not open until every field is defined.`;
  if (checksDone < 9) cautionCount += 2;

  // Regime
  let regimeNote = 'Regime unknown — confirm market condition before treating this as A+ practice.';
  if (regime === 'ranging' && thesis.scenarioId === 'breakouts') {
    regimeNote = 'Ranging tape vs breakout scenario — demand extra confirmation or skip.';
    cautionCount += 1;
    suggestions.push('Breakouts in ranges often fail — wait or pick a range-fit scenario.');
  } else if (regime === 'trending' && thesis.scenarioId === 'trend_following') {
    regimeNote = 'Trending regime aligns with trend-following practice.';
  } else if (regime === 'high_volatility') {
    regimeNote = 'High volatility — size smaller in the lab; widen invalidation honesty.';
    cautionCount += 1;
  } else if (regime) {
    regimeNote = `Current regime: ${regime.replace(/_/g, ' ')}. Check scenario fit.`;
  }

  // Concentration
  const held = holdings.some((h) => h.symbol.toUpperCase() === thesis.symbol.toUpperCase());
  const concentration = held
    ? `${thesis.symbol} already appears in tracked holdings — lab practice still fine, but note real concentration.`
    : 'No obvious overlap with tracked holdings for this symbol.';
  if (held) {
    suggestions.push('If this were live, review Portfolio Health before adding correlated risk.');
  }

  // Checklist narrative
  const checklist = thesis.checklist.academyChecklistDone
    ? 'Pre-trade checklist marked complete.'
    : 'Mark the pre-trade checklist complete — Lab will not open without it.';

  // Psychology
  let psychology =
    thesis.confidence >= 80
      ? 'High confidence — verify you are not forcing certainty. Confidence ≠ prediction.'
      : thesis.confidence < 40
        ? 'Low confidence — Lab is for practice, but unclear theses teach less. Clarify invalidation.'
        : 'Confidence is moderate — good for deliberate practice.';
  if (thesis.confidence >= 85) {
    cautionCount += 1;
    suggestions.push('Dial ego down: write what would prove you wrong.');
  }

  // DNA
  let dna = 'No Trading DNA match yet — journal Lab results to enrich memory.';
  if (memory) {
    const hay = `${thesis.catalyst} ${thesis.notes} ${thesis.scenarioId}`.toLowerCase();
    if (memory.weakestSetups.some((w) => hay.includes(w.toLowerCase().split(/\s+/)[0] ?? ''))) {
      dna = `Scenario resembles a DNA weak spot (“${memory.weakestSetups[0]}”) — demand extra process rigor.`;
      cautionCount += 1;
      suggestions.push('Practice the weak spot slowly — one Lab trade, full journal.');
    } else if (memory.bestSetups.some((b) => hay.includes(b.toLowerCase().split(/\s+/)[0] ?? ''))) {
      dna = `Aligns with a DNA strength (“${memory.bestSetups[0]}”) — still require the full thesis.`;
    } else {
      dna = `Style: ${memory.tradingStyle} · risk ${memory.riskTolerance}. Stay inside your rules.`;
    }
  }

  const overall: LabAiCritique['overall'] =
    !isThesisComplete(thesis.checklist) || validateThesisGeometry(thesis)
      ? 'block'
      : cautionCount >= 3
        ? 'caution'
        : cautionCount >= 1
          ? 'caution'
          : 'ready';

  const summary =
    overall === 'block'
      ? 'Thesis incomplete or geometry invalid — Lab will not open a position.'
      : overall === 'caution'
        ? 'Process caution flags raised — you may practice, but address suggestions first when possible.'
        : 'Thesis structure looks disciplined enough for a Lab practice open.';

  if (suggestions.length === 0) {
    suggestions.push('Keep journaling after the close — process compounds.');
  }

  return {
    overall,
    summary,
    risk,
    confirmation,
    regime: regimeNote,
    concentration,
    checklist,
    psychology,
    dna,
    suggestions: suggestions.slice(0, 4),
    disclaimer:
      'Decision Lab critiques process only. This is not a trade recommendation or broker order.',
  };
}

export function scoreClosedLabTrade(input: {
  position: LabPosition;
  stopHonored: boolean;
  journaled: boolean;
}): LabTradeScores {
  const { position, stopHonored, journaled } = input;
  const checklistScore = Math.round(
    (Object.values(position.thesis.checklist).filter(Boolean).length / 9) * 100,
  );

  const disciplineScore = Math.min(
    100,
    (stopHonored ? 55 : 15) +
      (journaled ? 25 : 0) +
      (position.thesis.riskReward >= 2 ? 20 : 10),
  );

  const riskScore = Math.min(
    100,
    Math.round(
      Math.min(40, position.thesis.riskReward * 15) +
        (position.thesis.invalidation.length >= 8 ? 25 : 10) +
        (position.critique.overall !== 'block' ? 20 : 0) +
        (stopHonored ? 15 : 0),
    ),
  );

  const processScore = Math.round(
    checklistScore * 0.35 + disciplineScore * 0.35 + riskScore * 0.3,
  );

  const mistakes: string[] = [];
  if (!stopHonored) mistakes.push('Stop was not respected in the Lab close.');
  if (!journaled) mistakes.push('Close without journaling weakens the learning loop.');
  if (position.thesis.riskReward < 2) mistakes.push('Accepted R:R below 2:1.');

  const learningSummary =
    mistakes.length === 0
      ? 'Clean process loop: thesis → critique → sized practice → honored plan → journal.'
      : `Process gaps: ${mistakes.join(' ')} Focus next Lab trade on fixing one gap.`;

  const journalPrompt = [
    `Lab ${position.thesis.symbol} ${position.thesis.bias}.`,
    `Did you respect invalidation (“${position.thesis.invalidation.slice(0, 60)}”)?`,
    'What would you change in the thesis — not the P&L?',
    stopHonored ? 'Stop honored — capture why the plan worked.' : 'Stop violated — write the trigger that caused it.',
  ].join(' ');

  return {
    processScore,
    disciplineScore,
    riskScore,
    checklistScore,
    journalPrompt,
    learningSummary,
  };
}
