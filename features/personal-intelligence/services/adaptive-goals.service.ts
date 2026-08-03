import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import type { DecisionDebtSnapshot } from '@/features/decision/types/decision.types';

import type {
  AdaptiveGoal,
  PersonalizedTodayFocus,
  TradingDnaProfile,
} from '../types/personal-intelligence.types';

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * Adaptive goals from DNA growth edges, decision debt, and recent log activity.
 * Derived only — no goal store.
 */
export function buildAdaptiveGoals(input: {
  records: DecisionRecord[];
  dna: TradingDnaProfile;
  today: PersonalizedTodayFocus;
  debt?: DecisionDebtSnapshot | null;
  academyNextTitle?: string | null;
  nowMs?: number;
}): AdaptiveGoal[] {
  const now = input.nowMs ?? Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const week = input.records.filter((r) => r.createdAt >= weekAgo);
  const replay = week.filter((r) => r.action === 'replay_completed').length;
  const journaled = week.filter((r) => r.action === 'journaled').length;
  const researched = week.filter((r) => r.action === 'researched').length;
  const skipped = week.filter((r) => r.action === 'skipped').length;

  const patienceScore = input.dna.traits.find((t) => t.id === 'patience')?.score ?? 50;
  const goals: AdaptiveGoal[] = [];

  if (input.today.archetype === 'experienced' || replay < 3) {
    goals.push({
      id: 'replay_sessions',
      title: 'Finish 3 replay sessions',
      detail: 'Process Tape reflections — ask what you learned, not what you made.',
      progress: Math.min(3, replay),
      target: 3,
      href: '/decision/decision-replay',
      priority: input.today.archetype === 'experienced' ? 'high' : 'medium',
    });
  }

  if (patienceScore < 70 || input.dna.growthEdges.includes('Patience')) {
    goals.push({
      id: 'patience',
      title: 'Improve patience',
      detail: 'Skip or defer at least 2 low-clarity setups this week before researching.',
      progress: Math.min(2, skipped),
      target: 2,
      href: '/decision/mentor',
      priority: 'high',
    });
  }

  if (input.academyNextTitle || (input.debt?.unfinishedLessons ?? 0) > 0) {
    goals.push({
      id: 'academy_lesson',
      title: 'Complete Academy lesson',
      detail: input.academyNextTitle
        ? `Next: ${input.academyNextTitle}`
        : 'Open Learn and finish one Decision Operator lesson with practice.',
      progress: 0,
      target: 1,
      href: '/academy',
      priority: input.today.archetype === 'new_trader' ? 'high' : 'medium',
    });
  }

  if (researched >= 5 && journaled < researched * 0.5) {
    goals.push({
      id: 'reduce_overtrading',
      title: 'Reduce overtrading research',
      detail: 'Cap research depth: journal or skip before opening a fourth symbol today.',
      progress: clamp((journaled / Math.max(1, researched)) * 100),
      target: 100,
      href: '/journal',
      priority: 'high',
    });
  }

  if (input.today.archetype === 'poor_discipline' || journaled < 2) {
    goals.push({
      id: 'journal',
      title: 'Complete journal',
      detail: 'Close the loop on researched or skipped setups twice this week.',
      progress: Math.min(2, journaled),
      target: 2,
      href: '/journal',
      priority: input.today.archetype === 'poor_discipline' ? 'high' : 'medium',
    });
  }

  goals.push({
    id: 'research_loop',
    title: 'Run one full decision loop',
    detail: 'Brief → Start Here or skip → journal. Process score only.',
    progress: researched > 0 && journaled > 0 ? 2 : researched > 0 || journaled > 0 ? 1 : 0,
    target: 2,
    href: '/',
    priority: 'medium',
  });

  const weakest = input.dna.growthEdges[0];
  if (weakest) {
    goals.push({
      id: 'dna_growth',
      title: `Grow ${weakest}`,
      detail: `Your DNA marks ${weakest} as a growth edge — one deliberate session moves the needle.`,
      progress: clamp(100 - (input.dna.traits.find((t) => t.label === weakest)?.score ?? 50)),
      target: 100,
      href: '/decision/intelligence',
      priority: 'low',
    });
  }

  const priorityRank = { high: 0, medium: 1, low: 2 } as const;
  return goals.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]).slice(0, 5);
}
