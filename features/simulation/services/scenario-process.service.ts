import type { SimulationAccount } from '../types/simulation.types';

export interface SimulationProcessScore {
  thesis: number;
  invalidation: number;
  risk: number;
  evidence: number;
  uncertainty: number;
  discipline: number;
  reflection: number;
  adaptation: number;
  positionSizing: number;
  informationResponse: number;
  behavioral: number;
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

const EMPTY_SCORE: SimulationProcessScore = {
  thesis: 0,
  invalidation: 0,
  risk: 0,
  evidence: 0,
  uncertainty: 0,
  discipline: 0,
  reflection: 0,
  adaptation: 0,
  positionSizing: 0,
  informationResponse: 0,
  behavioral: 0,
  composite: 0,
  outcomeNote: 'No recorded decisions yet. Process scores appear after a thesis-backed fill.',
  strengths: [],
  gaps: ['Record a thesis before the next simulated buy.'],
};

/**
 * Grades process on the paper book. Simulated P/L is context only.
 */
export function scoreSimulationProcess(account: SimulationAccount): SimulationProcessScore {
  const decisions = account.decisions;
  if (decisions.length === 0) {
    return { ...EMPTY_SCORE };
  }

  const thesisRate = decisions.filter((item) => hasText(item.thesis) || hasText(item.reasonForEntry)).length / decisions.length;
  const evidenceRate = decisions.filter((item) => hasText(item.evidence) || hasText(item.setup)).length / decisions.length;
  const invalidationRate = decisions.filter((item) => hasText(item.invalidation)).length / decisions.length;
  const sizeRate = decisions.filter((item) => hasText(item.intendedPositionSize) || hasText(item.expectedRisk)).length / decisions.length;
  const reviews = decisions.filter((item) => item.closeReview);
  const closedCount = Math.max(1, decisions.filter((item) => item.closedAt).length);
  const reviewRate = decisions.some((item) => item.closedAt) ? reviews.length / closedCount : 0;
  const humbleConfidence = decisions.filter((item) => item.confidence !== 'high').length / decisions.length;
  const namedUncertainty = decisions.filter((item) => hasText(item.expectedScenarios)).length / decisions.length;

  const answeredWindows = (account.scenario?.decisionWindows ?? []).filter((item) => item.response);
  const dueWindows = (account.scenario?.decisionWindows ?? []).filter(
    (item) => item.day <= (account.scenario?.clockDay ?? 0),
  );
  const answered = answeredWindows.length / Math.max(1, dueWindows.length);
  const reducedIntoEvent = answeredWindows.filter((item) => item.response?.option === 'reduce').length;
  const highConfNoInvalidation = decisions.filter(
    (item) => item.confidence === 'high' && !hasText(item.invalidation),
  ).length;
  const namedExpected = namedUncertainty;
  const checkpoints = account.checkpoints ?? [];
  const concentration = Math.max(0, ...account.positions.map((item) => item.portfolioWeight));
  const thesis = clamp(thesisRate * 100);
  const invalidation = clamp(invalidationRate * 100);
  const risk = clamp(sizeRate * 55 + (account.maxDrawdown > -0.08 ? 25 : 8) + (concentration < 0.35 ? 20 : 5));
  const evidence = clamp(evidenceRate * 100);
  const uncertainty = clamp(invalidationRate * 40 + humbleConfidence * 35 + namedUncertainty * 25);
  const discipline = clamp(reviewRate * 45 + answered * 25 + (account.lastChallengeViolation ? 5 : 30));
  const reflection = clamp(
    reviewRate * 70 +
      (reviews.some((item) => hasText(item.closeReview?.whatHappened) && hasText(item.closeReview?.thesisCorrect))
        ? 30
        : reviews.length
          ? 10
          : 0),
  );
  const adaptation = clamp(answered * 70 + (account.scenario?.events.some((item) => item.resolveDay <= (account.scenario?.clockDay ?? 0)) ? 15 : 0));
  const positionSizing = clamp(sizeRate * 80 + (concentration < 0.25 ? 20 : concentration < 0.4 ? 10 : 0));
  const informationResponse = clamp(
    answered * 50 + Math.min(30, reducedIntoEvent * 15) + namedExpected * 20 + Math.min(20, checkpoints.filter((item) => item.kind === 'window').length * 8),
  );
  const behavioral = clamp(
    100 - highConfNoInvalidation * 18 - (account.lastChallengeViolation ? 25 : 0) + (humbleConfidence > 0.5 ? 8 : 0),
  );
  const composite = clamp(
    (thesis +
      invalidation +
      risk +
      evidence +
      uncertainty +
      discipline +
      reflection +
      adaptation +
      positionSizing +
      informationResponse +
      behavioral) /
      11,
  );

  const strengths: string[] = [];
  const gaps: string[] = [];
  if (thesis >= 70) strengths.push('You usually write a thesis before size.');
  else gaps.push('Buys still appear without a usable thesis.');
  if (invalidation >= 70) strengths.push('Invalidation is named before size.');
  else gaps.push('Name what would prove the idea wrong before you add risk.');
  if (uncertainty >= 65) strengths.push('Uncertainty or modest confidence shows up often.');
  else if (!gaps.some((item) => item.toLowerCase().includes('invalidation'))) {
    gaps.push('Say what you do not know before you size.');
  }
  if (discipline >= 60) strengths.push('Closed trades are getting a process review.');
  else if (decisions.some((item) => item.closedAt)) gaps.push('Close the loop: what happened vs what you planned.');
  if (reflection >= 60) strengths.push('Reviews compare the plan with what happened.');
  else if (decisions.some((item) => item.closedAt)) gaps.push('Reflection is still thin — write what changed versus the thesis.');
  if (positionSizing >= 65) strengths.push('Size is being named with the thesis.');
  else gaps.push('Position sizing is still implicit — write the risk before the fill.');
  if (adaptation >= 60) strengths.push('You responded when the tape or a window asked a question.');
  else if (dueWindows.length) {
    gaps.push('Decision windows were skipped. Adaptation is part of the grade.');
  }
  if (informationResponse >= 60) strengths.push('You treated new information as a reason to re-check the plan.');
  else if (dueWindows.length) gaps.push('Changing information did not always get a recorded response.');
  if (behavioral < 55) gaps.push('High conviction without invalidation is a process pattern, not a medical label.');

  const profitable = account.totalReturn > 0;
  const outcomeNote = profitable
    ? 'Simulated P/L is positive. That does not mean the process was strong.'
    : 'Simulated P/L is negative or flat. That does not mean the process was weak.';

  return {
    thesis,
    invalidation,
    risk,
    evidence,
    uncertainty,
    discipline,
    reflection,
    adaptation,
    positionSizing,
    informationResponse,
    behavioral,
    composite,
    outcomeNote,
    strengths,
    gaps,
  };
}
