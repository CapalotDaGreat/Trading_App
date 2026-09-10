import { ALL_LESSONS } from '@/features/academy/content';
import type { LessonNextChain, TargetComplexity, TrainingQueueItem } from '../types/learning-engine.types';
import { pickDrillForConcept, pickReplayForConcept } from './adaptive-difficulty.service';
import { drillTitle, getConcept, primaryConceptForLesson } from './learning-graph.service';

export function nextAfterLesson(
  lessonId: string,
  complexity: TargetComplexity = 'foundations',
): LessonNextChain | null {
  const lesson = ALL_LESSONS.find((item) => item.id === lessonId);
  const concept = primaryConceptForLesson(lessonId);
  if (!lesson || !concept) return null;

  const steps: TrainingQueueItem[] = [];
  const primary = pickDrillForConcept(concept.id, 'foundations');
  if (primary) {
    steps.push({
      id: `after-${lessonId}-drill-${primary.id}`,
      kind: 'chart_exercise',
      title: primary.title,
      reason: `Right after “${lesson.title}”, demonstrate the idea. Reading is not mastery.`,
      evidence: [`Linked exercise for ${concept.title}.`],
      href: `/practice?drill=${primary.id}`,
      conceptId: concept.id,
      complexity: 'foundations',
    });
  }

  const failureMode = concept.relatedIds
    .map((id) => getConcept(id))
    .find((node) => node && (node.id === 'false-breakouts' || node.id === 'invalidation' || node.id === 'false-signals'));
  const sameConceptHarder = pickDrillForConcept(concept.id, 'applied');
  const secondary =
    sameConceptHarder && sameConceptHarder.id !== primary?.id
      ? sameConceptHarder
      : failureMode
        ? pickDrillForConcept(failureMode.id, 'applied')
        : pickDrillForConcept(concept.relatedIds[0] ?? concept.id, 'applied');
  if (secondary && secondary.id !== primary?.id) {
    steps.push({
      id: `after-${lessonId}-drill-${secondary.id}`,
      kind: 'chart_exercise',
      title: secondary.title,
      reason: 'Then raise conceptual complexity — a related failure mode, not a longer article.',
      evidence: [`Next concept: ${failureMode?.title ?? concept.title}.`],
      href: `/practice?drill=${secondary.id}`,
      conceptId: failureMode?.id ?? concept.id,
      complexity: 'applied',
    });
  }

  const replayId = pickReplayForConcept(failureMode?.id ?? concept.id, complexity);
  if (replayId) {
    steps.push({
      id: `after-${lessonId}-replay-${replayId}`,
      kind: 'historical_replay',
      title: replayId === 'false-breakout-drill' ? 'Replay a historical breakout' : 'Replay a historical example',
      reason: 'Decide with only the information available at that freeze. The next event need not rhyme.',
      evidence: ['Historical room linked to this concept family.'],
      href: `/decision/replay-tv?episode=${replayId}`,
      conceptId: concept.id,
      complexity: 'applied',
    });
  }

  steps.push({
    id: `after-${lessonId}-sim`,
    kind: 'simulation_challenge',
    title: 'Apply the concept in Simulation',
    reason: 'A unique fictional path. Simulated P/L does not grade the decision.',
    evidence: ['Paper book — process only.'],
    href: concept.simulateHref,
    conceptId: concept.id,
    complexity: complexity === 'foundations' ? 'applied' : 'complex',
  });

  return {
    lessonId,
    lessonTitle: lesson.title,
    steps,
    reminder: `Lesson → ${steps[0] ? drillTitle(steps[0].href.split('drill=')[1] ?? '') || steps[0].title : 'exercise'} → deeper exercise → historical replay → fictional simulation.`,
  };
}
