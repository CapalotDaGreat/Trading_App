import type { CurriculumRecommendation } from '@/features/academy/services/curriculum.service';
import type { PracticeDrill } from '@/features/practice/content/practice-drills';
import { BRAND } from '@/shared/constants/brand';
import type { SkillDomain } from '@/shared/constants/skill-domains';
import { SKILL_DOMAIN_LABELS } from '@/shared/constants/skill-domains';
import type { TrainingLoopPlan, TrainingStep } from '../types/progress.types';

export function composeTrainingLoop(input: {
  nextLesson: CurriculumRecommendation | null;
  drill: PracticeDrill;
  weakness: SkillDomain | null;
  hasSimulation: boolean;
  hasJournal: boolean;
  hasReplayProgress: boolean;
  upcomingEventTitle?: string | null;
}): TrainingLoopPlan {
  const chain: TrainingStep[] = [];

  if (input.nextLesson) {
    chain.push({
      kind: 'learn',
      title: input.nextLesson.lesson.title,
      reason: input.nextLesson.reason,
      href: `/academy/lesson/${input.nextLesson.lesson.id}`,
    });
  } else {
    chain.push({
      kind: 'learn',
      title: 'Start with Foundations',
      reason: 'Literacy before tactics.',
      href: '/academy/path/path-foundations',
    });
  }

  chain.push({
    kind: 'practice',
    title: input.drill.title,
    reason: input.drill.whyItMatters,
    href: `/practice?drill=${input.drill.id}`,
  });

  chain.push({
    kind: 'replay',
    title: input.hasReplayProgress ? 'Continue a historical room' : 'Open a blind historical scenario',
    reason: 'Decide with only the information available at that freeze. Outcome is not the grade.',
    href: '/decision/replay-tv',
  });

  chain.push({
    kind: 'simulate',
    title: input.hasSimulation ? 'Advance the uncertain paper book' : 'Start a $100,000 simulation',
    reason: 'Each book generates a unique synthetic path. You cannot memorize tomorrow.',
    href: '/simulate',
  });

  chain.push({
    kind: 'review',
    title: input.hasJournal ? 'Review the last decision' : 'Journal the reasoning',
    reason: 'Name process, risk, and what you would change. Simulated P/L is context.',
    href: input.hasJournal ? '/review' : '/journal',
  });

  if (input.upcomingEventTitle) {
    chain.push({
      kind: 'events',
      title: input.upcomingEventTitle,
      reason: 'Prepare with the related lesson — never a buy/sell call.',
      href: '/events',
    });
  }

  const suggestedNext = !input.nextLesson
    ? chain[0]!
    : !input.hasJournal && chain.find((item) => item.kind === 'practice')
      ? chain[1]!
      : chain[0]!;

  return {
    suggestedNext,
    chain,
    weaknessLabel: input.weakness ? SKILL_DOMAIN_LABELS[input.weakness] : null,
    processReminder: `The loop is ${BRAND.loop}. Profit on the paper book is not the score.`,
  };
}
