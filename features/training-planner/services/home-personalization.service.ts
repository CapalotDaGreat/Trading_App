import type { LearningEvidenceSnapshot } from '@/features/learning-engine/services/learning-evidence.service';
import { lessonTitle } from '@/features/learning-engine/services/learning-graph.service';
import type { LearnerModelSnapshot } from '@/features/learner-model';

import type { HomeInsightItem, HomePersonalization } from '../types/home-review.types';
import type { TrainingPlan, TrainingRecommendation } from '../types/training-planner.types';

const BEGINNER = new Set(['completely_new', 'beginner']);
const TROPHY = /trading mastery|\b\d{2,3}% mastery|streak days|made money|paper profit as|vanity metric/i;

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function sameHref(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return a.split('?')[0] === b.split('?')[0] && a === b;
}

function improvingFromLearner(learner: LearnerModelSnapshot): HomeInsightItem[] {
  const fromLongitudinal = learner.longitudinal.concepts
    .filter((row) => row.improvement === 'improving')
    .map((row) => {
      const concept = learner.concepts.find((item) => item.conceptId === row.conceptId);
      return {
        title: concept?.title ?? row.conceptId,
        note: 'Recent independent attempts are clearer than earlier ones. Keep the loop short.',
        href: concept?.nextHref,
      };
    });
  const fromPatterns = learner.mistakePatterns.patterns
    .filter((row) => row.improvementTrend === 'improving')
    .map((row) => ({
      title: row.title,
      note: 'This process pattern is showing up less often. History is kept; the next check is in a new context.',
      href: row.recommendedTraining[0]?.href,
    }));
  const fromDemonstrated = learner.explanation.demonstrated.slice(0, 2).map((title) => ({
    title,
    note: 'Demonstrated in training — not a live-trading grade. Revisit it later in a new context.',
  }));

  const unique = new Map<string, HomeInsightItem>();
  for (const item of [...fromLongitudinal, ...fromPatterns, ...fromDemonstrated]) {
    if (TROPHY.test(`${item.title} ${item.note}`)) continue;
    if (!unique.has(item.title)) unique.set(item.title, item);
  }
  return [...unique.values()].slice(0, 3);
}

function watchFromLearner(
  learner: LearnerModelSnapshot,
  plan: TrainingPlan,
): HomeInsightItem | null {
  const highPattern = learner.mistakePatterns.patterns.find(
    (row) => row.recommendationPriority === 'high' || row.recommendationPriority === 'medium',
  );
  if (highPattern) {
    return {
      title: highPattern.title,
      note: highPattern.summary,
      href: highPattern.recommendedTraining[0]?.href ?? plan.primary?.href,
    };
  }

  const transfer = learner.concepts.find((row) => row.state === 'transfer_unproven');
  if (transfer) {
    return {
      title: transfer.title,
      note:
        transfer.nextReason ??
        `${transfer.title} has been shown in one setting. The next check is a new context — not a reread.`,
      href: transfer.nextHref ?? plan.primary?.href,
    };
  }

  const weak = learner.concepts.find(
    (row) => row.state === 'needs_revisit' || learner.explanation.weak.includes(row.title),
  );
  if (weak) {
    return {
      title: weak.title,
      note:
        weak.nextReason ??
        `${weak.title} needs another look. Retrieval, not a new chapter. Simulated P/L is not the grade.`,
      href: weak.nextHref ?? plan.primary?.href,
    };
  }

  const stale = learner.concepts.find((row) => row.evidenceStale);
  if (stale) {
    return {
      title: stale.title,
      note: `${stale.title} has gone quiet. A short re-demonstration keeps it from being an old success.`,
      href: stale.nextHref ?? plan.primary?.href,
    };
  }

  const focus = plan.today.focusAreas[0];
  if (focus) {
    return { title: focus.title, note: focus.explanation, href: focus.href };
  }

  return null;
}

function continueFromSnapshot(
  snapshot: LearningEvidenceSnapshot,
  plan: TrainingPlan,
): HomeInsightItem | null {
  const primaryHref = plan.primary?.href;
  const openedId = snapshot.openedLessonIds[0];
  if (openedId) {
    const href = `/academy/lesson/${openedId}`;
    if (!sameHref(href, primaryHref)) {
      return {
        title: `Continue ${lessonTitle(openedId)}`,
        note: 'Unfinished lesson work — finish the loop before starting a new chapter.',
        href,
      };
    }
  }

  if (snapshot.hasSimulation && !snapshot.hasJournal && plan.primary?.activityType !== 'journal') {
    return {
      title: 'Journal the last simulated decision',
      note: 'The paper book needs a review note. Simulated P/L is context, not the grade.',
      href: '/journal',
    };
  }

  const continued = plan.queue.find(
    (row) => row.kind === 'continue_lesson' && row.id !== plan.primary?.id && !sameHref(row.href, primaryHref),
  );
  if (continued) {
    return {
      title: continued.title,
      note: continued.reason,
      href: continued.href,
    };
  }

  return null;
}

function nextStepFromPlan(plan: TrainingPlan): HomeInsightItem | null {
  const follow = plan.queue.find((row) => row.id !== plan.primary?.id && !row.isOptional);
  if (follow) {
    return {
      title: follow.title,
      note: follow.reason,
      href: follow.href,
    };
  }
  if (plan.emptyState === 'new_user') {
    return {
      title: 'A short exercise after Foundations',
      note: 'Literacy and risk first. Then a demonstration — not a market terminal.',
      href: '/learn',
    };
  }
  return null;
}

export function composeHomePersonalization(input: {
  plan: TrainingPlan;
  learner: LearnerModelSnapshot;
  snapshot: LearningEvidenceSnapshot;
}): HomePersonalization {
  const { plan, learner, snapshot } = input;
  const beginner = !snapshot.experience || BEGINNER.has(snapshot.experience);
  const improving = beginner && plan.emptyState === 'new_user' ? [] : improvingFromLearner(learner);
  const keepAnEyeOn = plan.emptyState === 'new_user' ? null : watchFromLearner(learner, plan);
  const continueWork = continueFromSnapshot(snapshot, plan);
  const nextStep = nextStepFromPlan(plan);

  return {
    emptyState: plan.emptyState ?? 'standard',
    stage: plan.stage,
    primary: plan.primary,
    todayTitle: plan.primary?.title ?? plan.headline,
    todayKind: plan.primary?.activityType ?? null,
    whyThis: clean(plan.whyPrimary),
    nextStep,
    improving,
    keepAnEyeOn,
    continueWork,
    beginner,
    emptyPersonalization: improving.length === 0 && !keepAnEyeOn && !continueWork,
  };
}

export function homePrimaryMatchesPlanner(
  home: HomePersonalization,
  primary: TrainingRecommendation | null,
): boolean {
  return home.primary?.id === primary?.id && home.whyThis === (primary?.reason ?? home.whyThis);
}

export function homeCopyLooksLikeTrophy(home: HomePersonalization): boolean {
  const blob = [
    home.todayTitle,
    home.whyThis,
    home.nextStep?.title,
    home.nextStep?.note,
    ...home.improving.map((item) => `${item.title} ${item.note}`),
    home.keepAnEyeOn ? `${home.keepAnEyeOn.title} ${home.keepAnEyeOn.note}` : '',
    home.continueWork ? `${home.continueWork.title} ${home.continueWork.note}` : '',
  ].join(' ');
  return TROPHY.test(blob);
}
