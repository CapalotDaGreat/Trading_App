import type { SkillModelSnapshot, WeeklyTrainingPlan } from '../types/progress.types';
import { SKILL_DOMAIN_LABELS } from '@/shared/constants/skill-domains';
import type { PracticeDrill } from '@/features/practice/content/practice-drills';
import type { CurriculumRecommendation } from '@/features/academy/services/curriculum.service';

export function buildWeeklyTrainingPlan(input: {
  skill: SkillModelSnapshot;
  nextLesson: CurriculumRecommendation | null;
  drill: PracticeDrill;
}): WeeklyTrainingPlan {
  const focus = input.skill.weakest;
  const lessonHref = input.nextLesson
    ? `/academy/lesson/${input.nextLesson.lesson.id}`
    : '/academy/path/path-foundations';
  const lessonTitle = input.nextLesson?.lesson.title ?? 'Foundations: how markets work';

  return {
    title: focus ? `This week: ${SKILL_DOMAIN_LABELS[focus]}` : 'This week: start the loop',
    focusDomain: focus,
    items: [
      { order: 1, title: `Complete “${lessonTitle}”`, href: lessonHref, kind: 'learn' },
      { order: 2, title: `Three drills: ${input.drill.title}`, href: `/practice?drill=${input.drill.id}`, kind: 'practice' },
      { order: 3, title: 'Replay one related historical room', href: '/decision/replay-tv', kind: 'replay' },
      { order: 4, title: 'Run one uncertain paper scenario', href: '/simulate', kind: 'simulate' },
      { order: 5, title: 'Review the last five decisions', href: '/review', kind: 'review' },
    ],
    reminder:
      'A profitable week on the paper book is not the goal. Completing the loop with honest notes is.',
  };
}
