import { ALL_LESSONS } from '@/features/academy/content';
import { isEventPersonalizationEligible } from '@/features/events/services/event-personalization.service';
import type { QueueDisposition, TodaysTraining, TrainingQueueItem } from '../types/learning-engine.types';
import { targetComplexityFor, pickDrillForConcept, pickReplayForConcept } from './adaptive-difficulty.service';
import { isSpacedReviewDue, scoreAllConceptMastery } from './concept-mastery.service';
import { detectFocusAreas } from './focus-area.service';
import type { LearningEvidenceSnapshot } from './learning-evidence.service';
import { lessonTitle, primaryConceptForLesson } from './learning-graph.service';
import { nextAfterLesson } from './lesson-next.service';

const EVENT_OK = new Set(['intermediate', 'advanced', 'professional']);

function visible(item: TrainingQueueItem, dispositions: Record<string, QueueDisposition>, now: number): boolean {
  const row = dispositions[item.id];
  if (!row) return true;
  if (row.skippedUntil && now < row.skippedUntil) return false;
  if (row.deferredUntil && now < row.deferredUntil) return false;
  return true;
}

export function composeTodaysTraining(
  snapshot: LearningEvidenceSnapshot,
  dispositions: Record<string, QueueDisposition> = {},
): TodaysTraining {
  const now = snapshot.now;
  const mastery = scoreAllConceptMastery(snapshot.byConcept, now);
  const focusAreas = detectFocusAreas(snapshot);
  const items: TrainingQueueItem[] = [];

  const continueId = snapshot.openedLessonIds[0] ?? snapshot.nextLessonId;
  if (continueId && ALL_LESSONS.some((lesson) => lesson.id === continueId)) {
    items.push({
      id: `continue-${continueId}`,
      kind: 'continue_lesson',
      title: `Continue: ${lessonTitle(continueId)}`,
      reason: snapshot.openedLessonIds.includes(continueId)
        ? 'You opened this lesson. Finish the idea, then demonstrate it.'
        : 'Next lesson on your path — chosen from the curriculum, not at random.',
      evidence: ['Academy progress / recommended path.'],
      href: `/academy/lesson/${continueId}`,
      conceptId: primaryConceptForLesson(continueId)?.id,
    });
  }

  const canEvent =
    snapshot.eventPlan &&
    snapshot.experience &&
    (isEventPersonalizationEligible(snapshot.experience) ||
      (EVENT_OK.has(snapshot.experience) &&
        mastery.some((row) => row.conceptId === 'event-risk' && row.state !== 'not_started')));
  if (canEvent && snapshot.eventPlan) {
    items.push({
      id: `event-${snapshot.eventPlan.eventTitle}`,
      kind: 'event_prep',
      title: snapshot.eventPlan.headline,
      reason: 'An upcoming event type matches your level. Prepare educationally — do not predict the print.',
      evidence: [snapshot.eventPlan.reminder],
      href: '/events',
    });
  }

  const developing = mastery.find((row) => row.state === 'developing');
  if (developing) {
    const complexity = targetComplexityFor(snapshot.byConcept[developing.conceptId]);
    const drill = pickDrillForConcept(developing.conceptId, complexity === 'complex' ? 'foundations' : complexity);
    items.push({
      id: `review-${developing.conceptId}`,
      kind: 'review_concept',
      title: `Review ${developing.title}`,
      reason: developing.evidence[0] ?? 'Repeated checks need another demonstration.',
      evidence: developing.evidence,
      href: drill ? `/practice?drill=${drill.id}` : `/learn`,
      conceptId: developing.conceptId,
      complexity: 'foundations',
    });
  }

  const due = mastery.find((row) => isSpacedReviewDue(row, now));
  if (due) {
    const drill = pickDrillForConcept(due.conceptId, 'foundations');
    items.push({
      id: `spaced-${due.conceptId}`,
      kind: 'spaced_review',
      title: `Spaced practice: ${due.title}`,
      reason: 'Important ideas return later so they stick. This is retrieval, not a new chapter.',
      evidence: due.lastSuccessAt
        ? [`Last successful demonstration ${new Date(due.lastSuccessAt).toISOString().slice(0, 10)}.`]
        : due.evidence,
      href: drill ? `/practice?drill=${drill.id}` : `/learn`,
      conceptId: due.conceptId,
    });
  }

  const exposed = mastery.find((row) => row.state === 'exposed');
  const chartConcept = exposed?.conceptId ?? developing?.conceptId ?? mastery.find((row) => row.state === 'practicing')?.conceptId;
  if (chartConcept) {
    const complexity = targetComplexityFor(snapshot.byConcept[chartConcept]);
    const drill = pickDrillForConcept(chartConcept, complexity);
    if (drill && !items.some((item) => item.href === `/practice?drill=${drill.id}`)) {
      items.push({
        id: `chart-${drill.id}`,
        kind: 'chart_exercise',
        title: drill.title,
        reason:
          complexity === 'complex'
            ? 'Recent checks were consistent. Complexity goes up — a harder idea, not a longer prompt.'
            : complexity === 'foundations'
              ? 'Keep this short and concrete while the idea is still forming.'
              : 'A chart check that matches what you just studied.',
        evidence: [`Target complexity: ${complexity}.`],
        href: `/practice?drill=${drill.id}`,
        conceptId: chartConcept,
        complexity,
      });
    }
  }

  const replayConcept = developing?.conceptId ?? chartConcept ?? 'support';
  const replayId = pickReplayForConcept(replayConcept, targetComplexityFor(snapshot.byConcept[replayConcept]));
  if (replayId) {
    items.push({
      id: `replay-${replayId}`,
      kind: 'historical_replay',
      title: 'Historical replay',
      reason: 'Practice the decision with a frozen tape. Outcome is not the grade.',
      evidence: [`Room linked to ${replayConcept}.`],
      href: `/decision/replay-tv?episode=${replayId}`,
      conceptId: replayConcept,
    });
  }

  items.push({
    id: 'sim-challenge',
    kind: 'simulation_challenge',
    title: snapshot.hasSimulation ? 'Advance the uncertain paper book' : 'Simulation challenge',
    reason: snapshot.hasSimulation
      ? 'Keep writing thesis and size. Simulated P/L does not grade the decision.'
      : 'Open a $100,000 fictional book and apply one concept under uncertainty.',
    evidence: ['Unique synthetic path. Seed is never shown.'],
    href: '/simulate?start=1',
  });

  items.push({
    id: 'journal-review',
    kind: 'journal_review',
    title: snapshot.hasJournal ? 'Journal review' : 'Start a decision journal',
    reason: snapshot.hasJournal
      ? 'Name process, invalidation, and what you would change. P/L is context.'
      : 'A written decision is evidence. The coach cannot guess what you meant.',
    evidence: snapshot.hasJournal ? ['Existing journal entries.'] : ['No journal yet.'],
    href: snapshot.hasJournal ? '/review' : '/journal',
  });

  const lessonChain = continueId ? nextAfterLesson(continueId, targetComplexityFor(snapshot.byConcept[primaryConceptForLesson(continueId)?.id ?? ''])) : null;

  const filtered = items.filter((item) => visible(item, dispositions, now)).slice(0, 6);
  const bookmarked = Object.entries(dispositions)
    .filter(([, row]) => row.bookmarked)
    .map(([id]) => items.find((item) => item.id === id))
    .filter((item): item is TrainingQueueItem => item != null && !filtered.some((row) => row.id === item.id));

  return {
    headline: filtered[0]?.title ?? 'Start with one short lesson',
    coachLine:
      'A personal training queue from your recent work — skip or defer anything. You are never trapped.',
    items: [...filtered, ...bookmarked].slice(0, 7),
    focusAreas,
    lessonChain,
  };
}
