import type { LearnerModelSnapshot } from '@/features/learner-model';

import type {
  ReviewActivityContext,
  ReviewBrief,
  ReviewBriefItem,
} from '../types/home-review.types';
import type { TrainingPlan } from '../types/training-planner.types';

const FORBIDDEN_GRADE = /made money|paper profit as|equity is the grade|trading mastery|streak days/i;

function qualityNote(score: number | null, skill: string): string {
  if (score == null) return `Not enough ${skill} records yet. Process quality is graded from written evidence, not simulated P/L.`;
  if (score >= 70) return `Recent records usually include ${skill}.`;
  if (score >= 45) return `${skill} is inconsistent across recent records. Name it before the next size.`;
  return `${skill} is often missing from recent records. That is the training target — not the paper result.`;
}

function journalNote(stats: ReviewActivityContext['journal']): string {
  if (stats.count === 0) {
    return 'A short thesis, invalidation, and what you would change is enough. Simulated P/L is context.';
  }
  const reflectionRate = stats.withReflection / stats.count;
  const noteRate = stats.withUsableNotes / stats.count;
  if (reflectionRate >= 0.6) {
    return 'Recent notes name what you would change. That is the review — not the paper result.';
  }
  if (noteRate >= 0.5) {
    return 'Notes exist. Adding what you would change next would strengthen the review.';
  }
  if (stats.withProcessTag >= 1) {
    return 'Process tags are present. A sentence on thesis and invalidation would make the next review more useful.';
  }
  return 'Journal volume is not the grade. A specific thesis and invalidation beat a long P/L note.';
}

function simulationNote(sim: NonNullable<ReviewActivityContext['simulation']>): string {
  const lead =
    sim.processGaps[0] ??
    sim.processStrengths[0] ??
    (sim.decisionCount === 0
      ? 'No recorded simulated decisions yet. Process notes appear after a thesis-backed fill.'
      : `${sim.thesisBackedCount} of ${sim.decisionCount} fills have a usable thesis. ${sim.closeReviewCount} close reviews.`);
  return `${lead} Simulated P/L is context, not the grade.`;
}

function replayNote(count: number): string | null {
  if (count <= 0) return null;
  return `${count} replay session${count === 1 ? '' : 's'} completed. Outcome is one chapter, not the grade.`;
}

function improvementsOf(learner: LearnerModelSnapshot): ReviewBriefItem[] {
  const fromLongitudinal = learner.longitudinal.concepts
    .filter((row) => row.improvement === 'improving')
    .map((row) => {
      const concept = learner.concepts.find((item) => item.conceptId === row.conceptId);
      return {
        title: concept?.title ?? row.conceptId,
        note: 'Independent attempts are clearer than they were. Re-demonstrate in a new context before calling it settled.',
      };
    });
  const fromPatterns = learner.mistakePatterns.patterns
    .filter((row) => row.improvementTrend === 'improving')
    .map((row) => ({
      title: row.title,
      note: 'Less frequent recently. History is kept; the next check is in a new context.',
    }));
  const unique = new Map<string, ReviewBriefItem>();
  for (const item of [...fromLongitudinal, ...fromPatterns]) {
    if (!unique.has(item.title)) unique.set(item.title, item);
  }
  return [...unique.values()].slice(0, 3);
}

function unresolvedOf(learner: LearnerModelSnapshot): ReviewBriefItem[] {
  const fromPatterns = learner.mistakePatterns.patterns
    .filter((row) => row.recommendationPriority === 'high' || row.recommendationPriority === 'medium')
    .map((row) => ({ title: row.title, note: row.summary }));
  const fromStates = learner.concepts
    .filter((row) => row.state === 'needs_revisit' || row.state === 'transfer_unproven')
    .map((row) => ({
      title: row.title,
      note:
        row.state === 'transfer_unproven'
          ? `${row.title} has not yet been shown in a second context.`
          : `${row.title} still needs another demonstration. Retrieval, not a trophy.`,
    }));
  const unique = new Map<string, ReviewBriefItem>();
  for (const item of [...fromPatterns, ...fromStates]) {
    if (!unique.has(item.title)) unique.set(item.title, item);
  }
  return [...unique.values()].slice(0, 3);
}

function headlineOf(
  learner: LearnerModelSnapshot,
  unresolved: ReviewBriefItem[],
  improvements: ReviewBriefItem[],
  empty: boolean,
): string {
  if (empty) return 'Your decisions will appear here';
  const pattern = learner.mistakePatterns.patterns.find(
    (row) => row.recommendationPriority === 'high' || row.recommendationPriority === 'medium',
  );
  if (pattern) return pattern.title;
  if (unresolved[0]) return unresolved[0].title;
  if (improvements[0]) return `Clearer process on ${improvements[0].title.toLowerCase()}`;
  if (learner.explanation.practiceNext[0]) return `Next: ${learner.explanation.practiceNext[0]}`;
  return 'Review the last decision, then name what you would repeat.';
}

function insightOf(
  learner: LearnerModelSnapshot,
  activity: ReviewActivityContext,
  empty: boolean,
): string {
  if (empty) {
    return 'Journal, simulation history, and replay results become coaching only after you record a decision.';
  }
  const pattern = learner.mistakePatterns.patterns[0];
  if (pattern) return pattern.summary;
  if (learner.explanation.helpReliance) {
    const weak = learner.explanation.weak[0] ?? learner.explanation.transferUnproven[0];
    if (weak) {
      return `${weak} is the current process question. Grade reasoning, risk, and plan adherence — not simulated profit.`;
    }
  }
  if (activity.journal.count > 0) {
    return 'Ask: what did you believe, what evidence did you have, and what would you change? Simulated P/L is context.';
  }
  return 'Grade reasoning, risk, and plan adherence — not simulated profit.';
}

export function composeReviewBrief(input: {
  plan: TrainingPlan;
  learner: LearnerModelSnapshot;
  activity: ReviewActivityContext;
}): ReviewBrief {
  const { plan, learner, activity } = input;
  const empty =
    activity.journal.count === 0 &&
    (activity.simulation?.decisionCount ?? 0) === 0 &&
    activity.replayCompletedCount === 0 &&
    learner.concepts.length === 0;
  const improvements = empty ? [] : improvementsOf(learner);
  const unresolved = empty ? [] : unresolvedOf(learner);

  return {
    empty,
    headline: headlineOf(learner, unresolved, improvements, empty),
    processInsight: insightOf(learner, activity, empty),
    improvements,
    unresolved,
    evidenceQualityNote: qualityNote(learner.decisionQuality.evidenceQuality, 'named evidence'),
    journalQualityNote: journalNote(activity.journal),
    simulationReflection: activity.simulation ? simulationNote(activity.simulation) : null,
    replayReflection: replayNote(activity.replayCompletedCount),
    nextTraining: plan.primary,
  };
}

export function reviewCopyLooksLikePnlGrade(brief: ReviewBrief): boolean {
  const headline = brief.headline.toLowerCase();
  if (FORBIDDEN_GRADE.test(`${brief.headline} ${brief.processInsight}`)) return true;
  if (/\b(p\/l|pnl|profit|equity)\b/.test(headline) && !/context|not the grade/.test(headline)) return true;
  return false;
}
