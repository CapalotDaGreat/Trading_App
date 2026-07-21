import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DecisionLogSummary } from '@/features/decision-log/services/decision-log.service';

import type {
  DecisionBrief,
  DisciplineStreak,
  ResearchQueueItem,
  TradingDayPlan,
  WeeklyReviewInsight,
} from '../types/decision.types';
import type { ResearchPriority } from './research-prioritizer.service';

const STREAK_KEY = 'tradevision-discipline-streak-v1';
const PLAN_DONE_KEY = 'tradevision-day-plan-done-v1';
const QUEUE_DONE_KEY = 'tradevision-research-queue-done-v1';

interface StreakStore {
  lastActiveDay: string;
  days: number;
  morningBrief: boolean;
  researchPlan: boolean;
  journal: boolean;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

export function buildResearchQueue(
  priorities: ResearchPriority[],
  completedSymbols: string[] = [],
): ResearchQueueItem[] {
  return priorities.map((p, index) => ({
    symbol: p.symbol,
    estimatedMinutes: p.estimatedMinutes,
    completed: completedSymbols.includes(p.symbol.toUpperCase()),
    rankReason: p.reason,
    learningValue:
      p.setup.historyNote ??
      (p.setup.decisionQualityScore != null && p.setup.decisionQualityScore < 60
        ? 'Practice defining invalidation before entry fantasy'
        : 'Reinforce regime + structure reads'),
    priority: (index === 0 ? 'high' : index === 1 ? 'medium' : 'low') as
      | 'high'
      | 'medium'
      | 'low',
    portfolioRelevance: p.setup.reasonsNotToResearch?.some((r) => /portfolio|held|theme/i.test(r))
      ? 'Check concentration before adding risk'
      : 'Fits as a standalone research candidate',
    researchValueScore: p.setup.researchValueScore ?? p.setup.confidence,
  }));
}

export function buildTradingDayPlan(brief: DecisionBrief): TradingDayPlan {
  const start = brief.startHereSymbol ?? brief.topSetups[0]?.symbol;
  const event = brief.highImpactEvents[0];
  const minutes =
    brief.estimatedResearchMinutes ??
    brief.researchQueue?.reduce((s, q) => s + q.estimatedMinutes, 0) ??
    18;

  const items: TradingDayPlan['items'] = [
    {
      id: 'before-setup',
      label: start ? `Review ${start} setup` : 'Review top setup',
      phase: 'before',
      done: false,
    },
    {
      id: 'before-event',
      label: event ? `Check event: ${event.title.slice(0, 42)}` : 'Scan calendar for catalysts',
      phase: 'before',
      done: false,
    },
    {
      id: 'before-watch',
      label: 'Confirm research queue order',
      phase: 'before',
      done: false,
    },
    {
      id: 'during-wait',
      label: 'Wait for confirmation — no FOMO entries',
      phase: 'during',
      done: false,
    },
    {
      id: 'after-journal',
      label: 'Journal decisions (acted or skipped)',
      phase: 'after',
      done: false,
    },
  ];

  return { items, estimatedMinutes: minutes };
}

export async function loadPlanCompletions(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(PLAN_DONE_KEY);
    const parsed = raw ? (JSON.parse(raw) as { day: string; ids: string[] }) : null;
    if (!parsed || parsed.day !== todayKey()) return new Set();
    return new Set(parsed.ids);
  } catch {
    return new Set();
  }
}

export async function togglePlanItem(id: string): Promise<Set<string>> {
  const current = await loadPlanCompletions();
  if (current.has(id)) current.delete(id);
  else current.add(id);
  await AsyncStorage.setItem(
    PLAN_DONE_KEY,
    JSON.stringify({ day: todayKey(), ids: [...current] }),
  );
  return current;
}

export async function loadQueueCompletions(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_DONE_KEY);
    const parsed = raw ? (JSON.parse(raw) as { day: string; symbols: string[] }) : null;
    if (!parsed || parsed.day !== todayKey()) return new Set();
    return new Set(parsed.symbols.map((s) => s.toUpperCase()));
  } catch {
    return new Set();
  }
}

export async function toggleQueueSymbol(symbol: string): Promise<Set<string>> {
  const current = await loadQueueCompletions();
  const key = symbol.toUpperCase();
  if (current.has(key)) current.delete(key);
  else current.add(key);
  await AsyncStorage.setItem(
    QUEUE_DONE_KEY,
    JSON.stringify({ day: todayKey(), symbols: [...current] }),
  );
  return current;
}

export async function loadDisciplineStreak(): Promise<DisciplineStreak> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    const store = raw ? (JSON.parse(raw) as StreakStore) : null;
    const day = todayKey();
    if (!store) {
      return {
        days: 0,
        completedToday: { morningBrief: false, researchPlan: false, journal: false },
      };
    }
    if (store.lastActiveDay !== day && store.lastActiveDay !== yesterdayKey()) {
      return {
        days: 0,
        completedToday: { morningBrief: false, researchPlan: false, journal: false },
      };
    }
    return {
      days: store.days,
      completedToday: {
        morningBrief: store.lastActiveDay === day && store.morningBrief,
        researchPlan: store.lastActiveDay === day && store.researchPlan,
        journal: store.lastActiveDay === day && store.journal,
      },
    };
  } catch {
    return {
      days: 0,
      completedToday: { morningBrief: false, researchPlan: false, journal: false },
    };
  }
}

export async function markDisciplineAction(
  action: 'morningBrief' | 'researchPlan' | 'journal',
): Promise<DisciplineStreak> {
  const day = todayKey();
  let store: StreakStore = {
    lastActiveDay: day,
    days: 1,
    morningBrief: false,
    researchPlan: false,
    journal: false,
  };

  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (raw) {
      const prev = JSON.parse(raw) as StreakStore;
      if (prev.lastActiveDay === day) {
        store = { ...prev };
      } else if (prev.lastActiveDay === yesterdayKey()) {
        store = {
          lastActiveDay: day,
          days: prev.days + 1,
          morningBrief: false,
          researchPlan: false,
          journal: false,
        };
      }
    }
  } catch {
    // fresh store
  }

  store[action] = true;
  store.lastActiveDay = day;
  await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(store));

  return {
    days: store.days,
    completedToday: {
      morningBrief: store.morningBrief,
      researchPlan: store.researchPlan,
      journal: store.journal,
    },
  };
}

export function buildWeeklyReview(summary: DecisionLogSummary): WeeklyReviewInsight {
  const isSunday = new Date().getDay() === 0;
  const passed = summary.skipped + summary.ignored;
  const bestDecision =
    passed >= 2
      ? `Passed on ${passed} low-quality ideas — discipline`
      : summary.journaled >= 1
        ? 'Journaled decisions for later coaching'
        : 'Opened the brief and stayed selective';

  const biggestMistake =
    summary.researched > 8 && summary.journaled === 0
      ? 'Researched many names without journaling outcomes'
      : passed === 0 && summary.total >= 5
        ? 'Rarely skipped — may be over-engaging every idea'
        : 'None clear — keep logging';

  const researchHoursEstimate = Math.round((summary.researched * 12) / 60 * 10) / 10;

  return {
    decisionsMade: summary.total,
    bestDecision,
    biggestMistake,
    aiLesson:
      passed >= 3
        ? 'Skipping or ignoring is a decision. Keep filtering with Why-Not reasons.'
        : 'Define invalidation before deep research — it raises decision quality.',
    researched: summary.researched,
    skipped: passed,
    marketsStudied: [],
    researchHoursEstimate,
    decisionQualityTrend: summary.processScore,
    journalConsistency:
      summary.journaled === 0
        ? 'No journals this week — close the learning loop'
        : summary.journaled >= 3
          ? 'Strong journaling cadence'
          : 'Light journaling — aim for one note per researched idea',
    mostImprovedSkill:
      passed >= summary.researched
        ? 'Selectivity / opportunity cost'
        : 'Research follow-through',
    recommendedFocus:
      summary.journaled < 2
        ? 'Journal every researched or skipped idea this week'
        : 'Pair Chart Replay with one Academy decision lesson',
    celebrateDiscipline:
      passed >= 2
        ? 'You protected attention by passing — that is elite process.'
        : 'Showing up to the brief counts. Keep the streak.',
    isSundayReview: isSunday,
  };
}
