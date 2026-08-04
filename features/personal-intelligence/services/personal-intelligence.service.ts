import type { AiLearningMemory } from '@/features/ai/types/ai-trust.types';
import type {
  DecisionDebtSnapshot,
  DisciplineStreak,
  JournalCoachInsight,
  TraderMemory,
} from '@/features/decision/types/decision.types';
import type {
  DecisionLogSummary,
  DecisionRecord,
} from '@/features/decision-log/services/decision-log.service';
import { buildDecisionHeatmap } from '@/features/decision-heatmap/services/heatmap.service';
import type { HeatmapLearningEvent } from '@/features/decision-heatmap/types/heatmap.types';

import type {
  CoachingReference,
  DecisionGraphPeriod,
  PersonalIntelligenceSnapshot,
} from '../types/personal-intelligence.types';
import { buildAdaptiveGoals } from './adaptive-goals.service';
import { buildAiMemoryTimeline } from './ai-memory-timeline.service';
import { buildDecisionGraph } from './decision-graph.service';
import { buildDnaEvolution } from './dna-evolution.service';
import { buildPersonalizedToday } from './personalized-today.service';
import { buildTradingDnaTraits } from './trading-dna-traits.service';

export function buildCoachingReferences(input: {
  dnaLabel: string;
  debt?: DecisionDebtSnapshot | null;
  academyNextTitle?: string | null;
}): CoachingReference[] {
  return [
    {
      id: 'passport',
      label: 'Decision Passport',
      reason: 'Credentials and process identity milestones.',
      href: '/decision/passport',
    },
    {
      id: 'replay',
      label: 'Decision Replay TV',
      reason: 'Blind historical episodes — process practice without hindsight.',
      href: '/decision/replay-tv',
    },
    {
      id: 'academy',
      label: 'Academy',
      reason: input.academyNextTitle
        ? `Next lesson: ${input.academyNextTitle}`
        : 'Structured lessons mapped to your mistakes.',
      href: '/academy',
    },
    {
      id: 'journal',
      label: 'Journal',
      reason: 'Close the loop so DNA and the graph can update.',
      href: '/journal',
    },
    {
      id: 'decisionGraph',
      label: 'Decision Graph',
      reason: 'Weekly / monthly / yearly process intensity.',
      href: '/decision/intelligence',
    },
    {
      id: 'dna',
      label: 'Trading DNA',
      reason: `Current becoming: ${input.dnaLabel}`,
      href: '/decision/intelligence',
    },
    {
      id: 'heatmap',
      label: 'Decision Heatmap',
      reason: 'Consistency and discipline at a glance.',
      href: '/decision/heatmap',
    },
    {
      id: 'decisionLog',
      label: 'Decision Log',
      reason:
        (input.debt?.score ?? 0) >= 50
          ? 'Debt is elevated — review skipped and unjournaled items.'
          : 'Event spine for every personal intelligence score.',
      href: '/(tabs)/review',
    },
  ];
}

export interface PersonalIntelligenceInput {
  memory: TraderMemory;
  records: DecisionRecord[];
  logSummary?: DecisionLogSummary | null;
  journalCoach?: JournalCoachInsight | null;
  streak?: DisciplineStreak | null;
  debt?: DecisionDebtSnapshot | null;
  aiMemory?: AiLearningMemory | null;
  academyPracticed?: number;
  academyNextTitle?: string | null;
  learningEvents?: HeatmapLearningEvent[];
  processScoreWeek?: number;
  startHereSymbol?: string | null;
  graphPeriod?: DecisionGraphPeriod;
  nowMs?: number;
}

/**
 * Personal Intelligence OS composer.
 * Reuses Decision Log, Memory, Heatmap, Academy, and AI learning memory — no duplicate event store.
 */
export function buildPersonalIntelligence(
  input: PersonalIntelligenceInput,
): PersonalIntelligenceSnapshot {
  const nowMs = input.nowMs ?? Date.now();
  const records = input.records ?? [];
  const heatmap = buildDecisionHeatmap({
    records,
    period: 'weekly',
    nowMs,
    learningEvents: input.learningEvents,
  });

  const dna = buildTradingDnaTraits({
    memory: input.memory,
    records,
    heatmapScores: heatmap.scores,
    journalCoach: input.journalCoach,
    processScoreWeek: input.processScoreWeek ?? input.logSummary?.processScore,
    nowMs,
  });

  const evolution = buildDnaEvolution({
    records,
    dna,
    nowMs,
  });

  const today = buildPersonalizedToday({
    dna,
    logSummary: input.logSummary,
    streak: input.streak,
    debt: input.debt,
    academyPracticed: input.academyPracticed,
    academyNextTitle: input.academyNextTitle,
    startHereSymbol: input.startHereSymbol,
  });

  const graph = buildDecisionGraph({
    records,
    dna,
    period: input.graphPeriod ?? 'weekly',
    academyEvents: input.learningEvents?.length ?? input.academyPracticed ?? 0,
    mentorSessionsHint: input.streak?.days ? Math.min(5, input.streak.days) : 0,
    nowMs,
  });

  const memoryTimeline = buildAiMemoryTimeline({
    dna,
    evolution,
    records,
    aiMemory: input.aiMemory,
    nowMs,
  });

  const goals = buildAdaptiveGoals({
    records,
    dna,
    today,
    debt: input.debt,
    academyNextTitle: input.academyNextTitle,
    nowMs,
  });

  const coachingReferences = buildCoachingReferences({
    dnaLabel: dna.becomingLabel,
    debt: input.debt,
    academyNextTitle: input.academyNextTitle,
  });

  return {
    generatedAt: nowMs,
    becomingQuestion: 'Who am I becoming as a trader?',
    today,
    dna,
    evolution,
    graph,
    memoryTimeline,
    goals,
    coachingReferences,
  };
}
