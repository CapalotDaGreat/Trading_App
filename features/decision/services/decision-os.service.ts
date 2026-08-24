import type {
  DecisionDebtSnapshot,
  DecisionFatigueInsight,
  DecisionIntelligenceContext,
  MarketRegime,
  TraderMemory,
} from '../types/decision.types';

const PSYCHOLOGY_REMINDERS = [
  'Process over outcome — a good skip counts as a win.',
  'If you cannot name invalidation, you do not have a setup.',
  'Protect attention: finish waiting reviews before opening new research.',
  'Size from risk, not from urgency.',
  'Flat is a position when criteria are not met.',
];

export function buildDecisionIntelligenceContext(input: {
  regime?: MarketRegime;
  regimeLabel?: string;
  timeBudgetMinutes?: number;
  watchlistSymbols?: string[];
  portfolioSymbols?: string[];
  traderMemory?: TraderMemory;
  processScoreWeek?: number;
  eventTitles?: string[];
  topSetupSymbols?: string[];
}): DecisionIntelligenceContext {
  const day = new Date().getDay();
  const psychologyReminder = PSYCHOLOGY_REMINDERS[day % PSYCHOLOGY_REMINDERS.length]!;
  const top = input.topSetupSymbols?.[0];
  const recommendedFocus = top
    ? `Research ${top} within your time budget, then stop.`
    : 'Protect the day — nothing deserving attention means no forced research.';

  return {
    assembledAt: Date.now(),
    regime: input.regime,
    regimeLabel: input.regimeLabel,
    timeBudgetMinutes: input.timeBudgetMinutes ?? 20,
    watchlistSymbols: input.watchlistSymbols ?? [],
    portfolioSymbols: input.portfolioSymbols ?? [],
    traderMemory: input.traderMemory,
    processScoreWeek: input.processScoreWeek,
    eventTitles: input.eventTitles ?? [],
    topSetupSymbols: input.topSetupSymbols ?? [],
    psychologyReminder,
    recommendedFocus,
  };
}

/** Soft daily research cap — after this many reviewed setups, recommend stopping. */
export const DEFAULT_RESEARCH_SOFT_CAP = 5;

export function buildDecisionFatigue(input: {
  reviewedToday: number;
  softCap?: number;
  queueRemaining?: number;
}): DecisionFatigueInsight {
  const softCap = input.softCap ?? DEFAULT_RESEARCH_SOFT_CAP;
  const reviewedToday = input.reviewedToday;
  const shouldStop = reviewedToday >= softCap && (input.queueRemaining ?? 0) === 0;

  return {
    shouldStop: reviewedToday >= softCap,
    reviewedToday,
    softCap,
    message: shouldStop
      ? 'No additional setups currently meet your research criteria. Protect decision quality — stop for today.'
      : reviewedToday >= softCap
        ? `You've reviewed ${reviewedToday} ideas today. Finish waiting reviews, then stop — tired process is weaker process.`
        : `Research load is healthy (${reviewedToday}/${softCap}). Stay selective.`,
  };
}

export function buildDecisionDebt(input: {
  unreviewedSetups?: number;
  incompleteJournals?: number;
  unfinishedReplay?: number;
  unfinishedLessons?: number;
  ignoredAlerts?: number;
}): DecisionDebtSnapshot {
  const unreviewedSetups = input.unreviewedSetups ?? 0;
  const incompleteJournals = input.incompleteJournals ?? 0;
  const unfinishedReplay = input.unfinishedReplay ?? 0;
  const unfinishedLessons = input.unfinishedLessons ?? 0;
  const ignoredAlerts = input.ignoredAlerts ?? 0;

  const items: DecisionDebtSnapshot['items'] = [];
  if (unreviewedSetups > 0) {
    items.push({
      id: 'unreviewed',
      label: `${unreviewedSetups} item${unreviewedSetups === 1 ? '' : 's'} waiting for a research or skip decision`,
      severity: unreviewedSetups >= 3 ? 'high' : 'medium',
    });
  }
  if (incompleteJournals > 0) {
    items.push({
      id: 'journal',
      label: `${incompleteJournals} journal note${incompleteJournals === 1 ? '' : 's'} waiting for review`,
      severity: 'medium',
    });
  }
  if (unfinishedReplay > 0) {
    items.push({
      id: 'replay',
      label: `${unfinishedReplay} replay session${unfinishedReplay === 1 ? '' : 's'} waiting for review`,
      severity: 'low',
    });
  }
  if (unfinishedLessons > 0) {
    items.push({
      id: 'academy',
      label: `${unfinishedLessons} lesson${unfinishedLessons === 1 ? '' : 's'} waiting to continue`,
      severity: 'low',
    });
  }
  if (ignoredAlerts > 0) {
    items.push({
      id: 'alerts',
      label: `${ignoredAlerts} alert${ignoredAlerts === 1 ? '' : 's'} waiting for review`,
      severity: ignoredAlerts >= 3 ? 'high' : 'medium',
    });
  }

  const raw =
    unreviewedSetups * 18 +
    incompleteJournals * 14 +
    unfinishedReplay * 8 +
    unfinishedLessons * 6 +
    ignoredAlerts * 10;
  const score = Math.min(100, raw);

  return {
    score,
    unreviewedSetups,
    incompleteJournals,
    unfinishedReplay,
    unfinishedLessons,
    ignoredAlerts,
    items,
    encouragement:
      score === 0
        ? 'The desk is clear. Looking for something new is optional.'
        : 'Finish waiting reviews when you have energy. New research can wait.',
  };
}

export function waitingReviewCount(debt: DecisionDebtSnapshot): number {
  return (
    debt.unreviewedSetups +
    debt.incompleteJournals +
    debt.unfinishedReplay +
    debt.unfinishedLessons +
    debt.ignoredAlerts
  );
}

export function researchConsistencyLabel(input: {
  researched: number;
  journaled: number;
  skipped: number;
  total: number;
}): { value: string; detail: string } {
  if (input.total === 0) {
    return {
      value: 'Not enough yet',
      detail: 'Log a few research or skip decisions first.',
    };
  }
  const journalRate = input.researched > 0 ? input.journaled / input.researched : 1;
  if (journalRate >= 0.6) {
    return {
      value: 'Steady',
      detail: 'Research and reflection are keeping pace.',
    };
  }
  if (journalRate >= 0.3) {
    return {
      value: 'Building',
      detail: 'A few more journal notes would close the loop.',
    };
  }
  return {
    value: 'Building',
    detail: 'Reflection can wait until you have energy — no rush.',
  };
}
