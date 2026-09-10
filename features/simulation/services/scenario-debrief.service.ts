import type { SimulationAccount } from '../types/simulation.types';
import type { SimulationScenario } from '../types/scenario.types';
import { scoreSimulationProcess, type SimulationProcessScore } from './scenario-process.service';
import { resolvedScenarioEvents } from './scenario-visibility.service';

export interface SimulationFinancialOutcome {
  totalReturnPct: number;
  maxDrawdownPct: number;
  tradeCount: number;
  endingEquity: number;
  currency: string;
}

export interface SimulationDebriefEntry {
  day: number;
  knew: string[];
  decided?: string;
  happened: string;
  evidence: string[];
  riskNote?: string;
}

export interface SimulationEducationFollowup {
  concepts: string[];
  lessonId: string;
  lessonHref: string;
  drillId: string;
  drillHref: string;
  replayHref: string;
  nextFocusLabel: string;
}

export interface SimulationDebrief {
  financial: SimulationFinancialOutcome;
  process: SimulationProcessScore;
  timeline: SimulationDebriefEntry[];
  followup: SimulationEducationFollowup;
  reminder: string;
}

function conceptFromGaps(process: SimulationProcessScore, scenario?: SimulationScenario): string[] {
  const concepts: string[] = [];
  if (process.risk < 60) concepts.push('Position sizing and risk per decision');
  if (process.uncertainty < 60) concepts.push('Invalidation and incomplete information');
  if (process.thesis < 60) concepts.push('Writing a thesis before size');
  if (scenario?.focus === 'false_breakouts' || scenario?.events.some((item) => item.kind === 'false_breakout')) {
    concepts.push('False breakouts and confirmation');
  }
  if (scenario?.events.some((item) => item.kind === 'rate_decision' || item.kind === 'inflation')) {
    concepts.push('Macro surprises and volatility');
  }
  if (concepts.length === 0) concepts.push('Process review after an uncertain path');
  return concepts.slice(0, 3);
}

export function recommendAfterSimulation(
  process: SimulationProcessScore,
  scenario?: SimulationScenario,
): SimulationEducationFollowup {
  const concepts = conceptFromGaps(process, scenario);
  if (process.risk < 55) {
    return {
      concepts,
      lessonId: 'risk-position-sizing',
      lessonHref: '/academy/lesson/risk-position-sizing',
      drillId: 'position-size',
      drillHref: '/practice?drill=position-size',
      replayHref: '/decision/replay-tv',
      nextFocusLabel: 'Next simulation will put more weight on sizing under volatility.',
    };
  }
  if (concepts.some((item) => item.toLowerCase().includes('breakout'))) {
    return {
      concepts,
      lessonId: 'ta-trend-range',
      lessonHref: '/academy/lesson/ta-trend-range',
      drillId: 'breakout-quality',
      drillHref: '/practice?drill=breakout-quality',
      replayHref: '/decision/replay-tv',
      nextFocusLabel: 'Next simulation will include more failed breakout structure.',
    };
  }
  if (process.uncertainty < 55) {
    return {
      concepts,
      lessonId: 'dec-uncertainty',
      lessonHref: '/academy/lesson/dec-uncertainty',
      drillId: 'missing-evidence',
      drillHref: '/practice?drill=missing-evidence',
      replayHref: '/decision/replay-tv',
      nextFocusLabel: 'Next simulation will withhold more of the print until it happens.',
    };
  }
  return {
    concepts,
    lessonId: 'dec-quality',
    lessonHref: '/academy/lesson/dec-quality',
    drillId: 'rr-compare',
    drillHref: '/practice?drill=rr-compare',
    replayHref: '/decision/replay-tv',
    nextFocusLabel: 'Complexity can rise. Process still grades the book, not the P/L.',
  };
}

export function buildSimulationTimeline(account: SimulationAccount): SimulationDebriefEntry[] {
  const scenario = account.scenario;
  if (!scenario) return [];
  const entries: SimulationDebriefEntry[] = [];
  const decisionsByDay = new Map<number, string[]>();
  for (const window of scenario.decisionWindows ?? []) {
    if (!window.response) continue;
    const list = decisionsByDay.get(window.day) ?? [];
    list.push(`${window.prompt} → ${window.response.option}${window.response.reasoning ? ` (${window.response.reasoning})` : ''}`);
    decisionsByDay.set(window.day, list);
  }
  for (const tx of account.transactions) {
    const day = scenario.clockDay;
    const list = decisionsByDay.get(day) ?? [];
    list.push(`${tx.side.toUpperCase()} ${tx.quantity} ${tx.symbol} @ ${tx.executionPrice}`);
    decisionsByDay.set(day, list);
  }

  const days = new Set<number>([
    ...scenario.events.map((item) => item.announceDay),
    ...scenario.events.map((item) => item.resolveDay),
    ...[...decisionsByDay.keys()],
  ]);

  for (const day of [...days].sort((a, b) => a - b)) {
    if (day > scenario.clockDay) continue;
    const announced = scenario.events.filter((item) => item.announceDay === day);
    const resolved = scenario.events.filter((item) => item.resolveDay === day);
    const knew = [
      `Day ${day} tape only — later sessions were hidden.`,
      ...announced.map((item) => item.briefing),
      ...resolvedScenarioEvents({ ...scenario, clockDay: day - 1 }).map((item) => `Already resolved: ${item.title}`),
    ];
    const happened = resolved.length
      ? resolved.map((item) => item.outcome).join(' ')
      : announced.length
        ? 'A scheduled item became visible. The outcome was still unknown.'
        : 'The session printed. No scheduled headline resolved.';
    const decided = decisionsByDay.get(day)?.join(' ');
    const ignored = resolved.length && !decided ? 'Information arrived without a recorded response.' : undefined;
    entries.push({
      day,
      knew,
      decided,
      happened,
      evidence: resolved.flatMap((item) => [item.actualValue, item.outcome].filter((value): value is string => Boolean(value))),
      riskNote: ignored,
    });
  }
  return entries.slice(0, 12);
}

export function debriefSimulation(account: SimulationAccount): SimulationDebrief {
  const process = scoreSimulationProcess(account);
  return {
    financial: {
      totalReturnPct: account.totalReturn * 100,
      maxDrawdownPct: Math.abs(account.maxDrawdown) * 100,
      tradeCount: account.transactions.length,
      endingEquity: account.equity,
      currency: account.currency,
    },
    process,
    timeline: buildSimulationTimeline(account),
    followup: recommendAfterSimulation(process, account.scenario),
    reminder:
      'The financial result is one dimension. A profitable book can still show a weak process. A losing book can still show discipline.',
  };
}
