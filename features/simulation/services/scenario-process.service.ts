import type { SimulationAccount } from '../types/simulation.types';

export interface SimulationProcessScore {
  thesis: number;
  risk: number;
  evidence: number;
  uncertainty: number;
  discipline: number;
  adaptation: number;
  positionSizing: number;
  composite: number;
  outcomeNote: string;
  strengths: string[];
  gaps: string[];
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasText(value?: string): boolean {
  return Boolean(value?.trim() && value.trim().length >= 8);
}

/**
 * Grades process on the paper book. Simulated P/L is context only.
 */
export function scoreSimulationProcess(account: SimulationAccount): SimulationProcessScore {
  const decisions = account.decisions;
  if (decisions.length === 0) {
    return {
      thesis: 0,
      risk: 0,
      evidence: 0,
      uncertainty: 0,
      discipline: 0,
      adaptation: 0,
      positionSizing: 0,
      composite: 0,
      outcomeNote: 'No recorded decisions yet. Process scores appear after a thesis-backed fill.',
      strengths: [],
      gaps: ['Record a thesis before the next simulated buy.'],
    };
  }

  const thesisRate = decisions.filter((item) => hasText(item.thesis) || hasText(item.reasonForEntry)).length / decisions.length;
  const evidenceRate = decisions.filter((item) => hasText(item.evidence) || hasText(item.setup)).length / decisions.length;
  const invalidationRate = decisions.filter((item) => hasText(item.invalidation)).length / decisions.length;
  const sizeRate = decisions.filter((item) => hasText(item.intendedPositionSize) || hasText(item.expectedRisk)).length / decisions.length;
  const reviews = decisions.filter((item) => item.closeReview);
  const reviewRate = decisions.some((item) => item.closedAt) ? reviews.length / Math.max(1, decisions.filter((item) => item.closedAt).length) : 0;
  const humbleConfidence = decisions.filter((item) => item.confidence !== 'high').length / decisions.length;

  const answered =
    (account.scenario?.decisionWindows ?? []).filter((item) => item.response).length /
    Math.max(1, (account.scenario?.decisionWindows ?? []).filter((item) => item.day <= (account.scenario?.clockDay ?? 0)).length);
  const concentration = Math.max(0, ...account.positions.map((item) => item.portfolioWeight));
  const thesis = clamp(thesisRate * 100);
  const risk = clamp(sizeRate * 55 + (account.maxDrawdown > -0.08 ? 25 : 8) + (concentration < 0.35 ? 20 : 5));
  const evidence = clamp(evidenceRate * 100);
  const uncertainty = clamp(invalidationRate * 55 + humbleConfidence * 45);
  const discipline = clamp(reviewRate * 45 + answered * 25 + (account.lastChallengeViolation ? 5 : 30));
  const adaptation = clamp(answered * 70 + (account.scenario?.events.some((item) => item.resolveDay <= (account.scenario?.clockDay ?? 0)) ? 15 : 0));
  const positionSizing = clamp(sizeRate * 80 + (concentration < 0.25 ? 20 : concentration < 0.4 ? 10 : 0));
  const composite = clamp((thesis + risk + evidence + uncertainty + discipline + adaptation + positionSizing) / 7);

  const strengths: string[] = [];
  const gaps: string[] = [];
  if (thesis >= 70) strengths.push('You usually write a thesis before size.');
  else gaps.push('Buys still appear without a usable thesis.');
  if (uncertainty >= 65) strengths.push('Invalidation or modest confidence shows up often.');
  else gaps.push('Name what would prove the idea wrong before you add risk.');
  if (discipline >= 60) strengths.push('Closed trades are getting a process review.');
  else if (decisions.some((item) => item.closedAt)) gaps.push('Close the loop: what happened vs what you planned.');
  if (positionSizing >= 65) strengths.push('Size is being named with the thesis.');
  else gaps.push('Position sizing is still implicit — write the risk before the fill.');
  if (adaptation >= 60) strengths.push('You responded when the tape or a window asked a question.');
  else if ((account.scenario?.decisionWindows ?? []).some((item) => item.day <= (account.scenario?.clockDay ?? 0))) {
    gaps.push('Decision windows were skipped. Adaptation is part of the grade.');
  }

  const profitable = account.totalReturn > 0;
  const outcomeNote = profitable
    ? 'Simulated P/L is positive. That does not mean the process was strong.'
    : 'Simulated P/L is negative or flat. That does not mean the process was weak.';

  return {
    thesis,
    risk,
    evidence,
    uncertainty,
    discipline,
    adaptation,
    positionSizing,
    composite,
    outcomeNote,
    strengths,
    gaps,
  };
}
