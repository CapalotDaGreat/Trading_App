import { mapMistakeToLesson } from '@/features/academy/services/curriculum.service';
import { buildWeeklyReview } from '@/features/decision/services/coaching-loop.service';
import type { JournalCoachInsight } from '@/features/decision/types/decision.types';
import {
  buildDecisionTimeline,
  summarizeDecisionLog,
  type DecisionLogSummary,
  type DecisionRecord,
} from '@/features/decision-log/services/decision-log.service';
import {
  buildLearningInsights,
  buildWeeklyGameTape,
} from '@/features/decision-replay/services/decision-replay.service';
import {
  buildMonthlySummaries,
  buildQuarterlySummaries,
  buildYearlySummaries,
} from '@/features/decision-passport/services/passport-profile.service';
import { calculateJournalStats } from '@/features/journal/services/journal.service';
import { buildJournalPsychologyTrends } from '@/features/journal/services/journal-psychology.service';
import { buildJournalStrategyInsights } from '@/features/journal/services/journal-strategy-insights.service';
import type { JournalLearningJourney } from '@/features/journal/types/journal-learning-journey.types';
import type { JournalEntry } from '@/features/journal/types/journal.types';
import type { TraderMemory } from '@/features/decision/types/decision.types';
import type {
  DecisionGraphSnapshot,
  DnaEvolutionPoint,
  TradingDnaProfile,
} from '@/features/personal-intelligence/types/personal-intelligence.types';

export interface BuildJournalLearningJourneyInput {
  entries: JournalEntry[];
  records: DecisionRecord[];
  logSummary?: DecisionLogSummary | null;
  coach?: JournalCoachInsight | null;
  memory?: TraderMemory | null;
  dna?: TradingDnaProfile | null;
  dnaEvolution?: DnaEvolutionPoint[];
  decisionGraph?: DecisionGraphSnapshot | null;
  academyNext?: { lessonId: string; title: string; reason: string } | null;
  nowMs?: number;
}

function buildImprovements(input: {
  coach: JournalCoachInsight | null | undefined;
  psychologyHint: string;
  behavior: string[];
  tapeLesson?: string;
}): string[] {
  const out: string[] = [];
  if (input.coach?.recommendation) out.push(input.coach.recommendation);
  if (input.psychologyHint) out.push(input.psychologyHint);
  if (input.tapeLesson) out.push(input.tapeLesson);
  for (const b of input.behavior.slice(0, 2)) out.push(b);
  if (input.coach?.avoid) out.push(`Avoid: ${input.coach.avoid}`);
  return [...new Set(out)].slice(0, 6);
}

function buildReplayReferences(entries: JournalEntry[], records: DecisionRecord[]) {
  const links: JournalLearningJourney['replayReferences'] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (entry.linkedReplayHref && !seen.has(entry.linkedReplayHref)) {
      seen.add(entry.linkedReplayHref);
      links.push({
        label: `${entry.symbol} replay link`,
        href: entry.linkedReplayHref,
        reason: 'Saved with this journal entry',
      });
    }
  }

  const replayCount = records.filter((r) => r.action === 'replay_completed').length;
  if (replayCount > 0) {
    links.push({
      label: 'Process Tape',
      href: '/decision/decision-replay?segment=process',
      reason: `${replayCount} replay events — ask what you learned, not P&L`,
    });
  }

  links.push({
    label: 'Decision Replay TV',
    href: '/decision/replay-tv',
    reason: 'Blind historical episodes to practice the process gaps in your journals',
  });

  return links.slice(0, 5);
}

/**
 * Compose the Journal Learning Journey from existing decision OS systems.
 * Does not invent P&L contests or buy/sell coaching.
 */
export function buildJournalLearningJourney(
  input: BuildJournalLearningJourneyInput,
): JournalLearningJourney {
  const nowMs = input.nowMs ?? Date.now();
  const stats = calculateJournalStats(input.entries);
  const summary = input.logSummary ?? summarizeDecisionLog(input.records);
  const weeklyReview = summary.total > 0 ? buildWeeklyReview(summary) : null;
  const weeklyTape = buildWeeklyGameTape(
    input.records,
    input.entries,
    input.memory ?? undefined,
    nowMs,
  );
  const behaviorInsights = buildLearningInsights(
    input.records,
    input.memory ?? undefined,
    input.entries,
  );
  const psychology = buildJournalPsychologyTrends(input.entries, nowMs);
  const strategyInsights = buildJournalStrategyInsights(input.entries);
  const timeline = buildDecisionTimeline(input.records).slice(-40).reverse();

  const mistakeText = [
    input.coach?.mostCommonMistake,
    weeklyReview?.biggestMistake,
    weeklyTape.mostRepeatedMistake,
    psychology.narrative,
  ]
    .filter(Boolean)
    .join(' ');

  const curriculumHint = mapMistakeToLesson(mistakeText);
  const academyRecommendations: JournalLearningJourney['academyRecommendations'] = [];
  if (input.academyNext) {
    academyRecommendations.push(input.academyNext);
  }
  if (curriculumHint) {
    academyRecommendations.push({
      lessonId: curriculumHint.lesson.id,
      title: curriculumHint.lesson.title,
      reason: curriculumHint.reason,
    });
  }
  for (const entry of input.entries) {
    for (const lessonId of entry.linkedAcademyLessonIds ?? []) {
      if (academyRecommendations.some((a) => a.lessonId === lessonId)) continue;
      academyRecommendations.push({
        lessonId,
        title: 'Linked Academy lesson',
        reason: `Referenced from ${entry.symbol} journal`,
      });
    }
  }

  const improvements = buildImprovements({
    coach: input.coach,
    psychologyHint: psychology.improvementHint,
    behavior: behaviorInsights.map((b) => b.statement),
    tapeLesson: weeklyTape.lessonForNextWeek,
  });

  const headline =
    input.entries.length === 0
      ? 'Start your learning journey — every journal becomes process memory.'
      : stats.lessonsRate >= 50
        ? 'Your journals are compounding into a real learning loop.'
        : 'Close more loops: tag emotion, name the lesson, link a replay or Academy practice.';

  return {
    generatedAt: nowMs,
    headline,
    processCoverage: {
      entries: input.entries.length,
      emotionTaggedRate: Math.round(stats.emotionTaggedRate),
      lessonsRate: Math.round(stats.lessonsRate),
      planAdherenceRate: Math.round(stats.planAdherenceRate),
    },
    timeline,
    weeklyReview,
    weeklyTape,
    monthly: buildMonthlySummaries(input.records, nowMs, 4),
    quarterly: buildQuarterlySummaries(input.records, nowMs, 4),
    yearly: buildYearlySummaries(input.records, nowMs, 3),
    behaviorInsights,
    psychology,
    strategyInsights,
    coach: input.coach ?? null,
    improvements,
    replayReferences: buildReplayReferences(input.entries, input.records),
    academyRecommendations: academyRecommendations.slice(0, 4),
    dna: input.dna ?? null,
    dnaEvolution: input.dnaEvolution ?? [],
    decisionGraph: input.decisionGraph ?? null,
    curriculumHint,
  };
}
