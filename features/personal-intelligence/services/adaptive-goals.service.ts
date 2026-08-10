import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import type { DecisionDebtSnapshot } from '@/features/decision/types/decision.types';

import type {
  AdaptiveGoal,
  PersonalizedTodayFocus,
  ProcessGoalId,
  TradingDnaProfile,
} from '../types/personal-intelligence.types';
import { PROCESS_GOAL_LABELS } from './dna-mentor-summary.service';
import { getTraitScore } from './trading-dna-traits.service';

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

const GOAL_TO_TRAIT: Record<ProcessGoalId, Parameters<typeof getTraitScore>[1]> = {
  improve_patience: 'patience',
  improve_risk_awareness: 'riskAwareness',
  reduce_fomo: 'fomoResistance',
  improve_thesis_clarity: 'thesisClarity',
  research_efficiency: 'researchEfficiency',
  build_consistency: 'processConsistency',
  improve_invalidation: 'invalidationDiscipline',
  improve_reflection: 'reflectionQuality',
};

function selectedGoalCard(input: {
  goalId: ProcessGoalId;
  records: DecisionRecord[];
  weekAgo: number;
  dna: TradingDnaProfile;
}): AdaptiveGoal {
  const week = input.records.filter((r) => r.createdAt >= input.weekAgo);
  const skipped = week.filter((r) => r.action === 'skipped').length;
  const journaled = week.filter((r) => r.action === 'journaled').length;
  const replay = week.filter((r) => r.action === 'replay_completed').length;
  const researched = week.filter((r) => r.action === 'researched').length;
  const invalidated = week.filter((r) => r.action === 'invalidated').length;
  const traitScore = getTraitScore(input.dna, GOAL_TO_TRAIT[input.goalId]) ?? 40;

  const progressByGoal: Record<ProcessGoalId, { progress: number; target: number; href: string; detail: string }> =
    {
      improve_patience: {
        progress: Math.min(2, skipped),
        target: 2,
        href: '/decision/mentor',
        detail: 'Skip or defer at least 2 low-clarity setups this week before researching.',
      },
      improve_risk_awareness: {
        progress: Math.min(2, invalidated + journaled),
        target: 2,
        href: '/journal',
        detail: 'Define invalidation or risk notes on two cases this week.',
      },
      reduce_fomo: {
        progress: Math.min(2, skipped),
        target: 2,
        href: '/decision/decision-replay',
        detail: 'Pass on urgency twice — require one extra confirmation.',
      },
      improve_thesis_clarity: {
        progress: Math.min(2, journaled),
        target: 2,
        href: '/journal',
        detail: 'Write a one-sentence thesis on two research loops.',
      },
      research_efficiency: {
        progress: clamp((journaled / Math.max(1, researched)) * 100),
        target: 100,
        href: '/decision/radar',
        detail: 'Match research volume with closed loops and higher research value.',
      },
      build_consistency: {
        progress: Math.min(3, journaled + replay),
        target: 3,
        href: '/',
        detail: 'Complete three process loops this week (research/skip → journal or replay).',
      },
      improve_invalidation: {
        progress: Math.min(2, invalidated),
        target: 2,
        href: '/decision/replay-tv',
        detail: 'Mark invalidation on two cases or practise it in Replay.',
      },
      improve_reflection: {
        progress: Math.min(2, journaled + replay),
        target: 2,
        href: '/journal',
        detail: 'Close two reflections via Journal or Process Tape.',
      },
    };

  const spec = progressByGoal[input.goalId];
  return {
    id: input.goalId,
    title: PROCESS_GOAL_LABELS[input.goalId],
    detail: `${spec.detail} Current ${GOAL_TO_TRAIT[input.goalId]} signal: ${traitScore}.`,
    progress: spec.progress,
    target: spec.target,
    href: spec.href,
    priority: 'high',
    selected: true,
  };
}

/**
 * Adaptive goals from DNA growth edges, decision debt, selected process goals, and recent log activity.
 * Derived only — selected goals persist separately in dna-goals.store.
 */
export function buildAdaptiveGoals(input: {
  records: DecisionRecord[];
  dna: TradingDnaProfile;
  today: PersonalizedTodayFocus;
  debt?: DecisionDebtSnapshot | null;
  academyNextTitle?: string | null;
  selectedGoals?: ProcessGoalId[];
  nowMs?: number;
}): AdaptiveGoal[] {
  const now = input.nowMs ?? Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const week = input.records.filter((r) => r.createdAt >= weekAgo);
  const replay = week.filter((r) => r.action === 'replay_completed').length;
  const journaled = week.filter((r) => r.action === 'journaled').length;
  const researched = week.filter((r) => r.action === 'researched').length;
  const skipped = week.filter((r) => r.action === 'skipped').length;
  const selected = input.selectedGoals ?? [];

  const goals: AdaptiveGoal[] = selected.map((goalId) =>
    selectedGoalCard({ goalId, records: input.records, weekAgo, dna: input.dna }),
  );

  const patienceScore = getTraitScore(input.dna, 'patience') ?? 50;
  const suppressPatienceNag = selected.includes('improve_patience');
  const suppressOvertradeNag = selected.includes('research_efficiency') || selected.includes('reduce_fomo');

  if (!selected.length && (input.today.archetype === 'experienced' || replay < 3)) {
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

  if (
    !suppressPatienceNag &&
    (patienceScore < 70 || input.dna.growthEdges.includes('Patience'))
  ) {
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

  if (!suppressOvertradeNag && researched >= 5 && journaled < researched * 0.5) {
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
  if (weakest && !selected.length) {
    goals.push({
      id: 'dna_growth',
      title: `Grow ${weakest}`,
      detail: `Your DNA marks ${weakest} as a growth edge — one deliberate session moves the needle.`,
      progress: clamp(
        100 - (input.dna.traits.find((t) => t.label === weakest)?.score ?? 50),
      ),
      target: 100,
      href: '/decision/intelligence',
      priority: 'low',
    });
  }

  const priorityRank = { high: 0, medium: 1, low: 2 } as const;
  return goals.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]).slice(0, 5);
}
