import { getLocalLessonById } from '@/features/academy/content';
import type { Lesson } from '@/features/academy/types/academy.types';

import type { ReinforcementTraitId } from '@/features/decision/types/decision-reinforcement.types';

/**
 * Explicit trait → existing Academy lesson map.
 * Never invents a lesson. If the mapped id is missing, recommend nothing.
 */
export const REINFORCEMENT_LESSON_MAP: Record<ReinforcementTraitId, string> = {
  invalidationDiscipline: 'dec-invalidation',
  patience: 'dec-time-budget',
  uncertaintyHandling: 'dec-time-budget',
  evidenceDiscipline: 'dec-research-filter',
  researchEfficiency: 'dec-time-budget',
  confirmationResistance: 'dec-why-not',
  decisionStamina: 'dec-psychology',
  adaptability: 'dec-regime',
};

export function resolveAcademyLessonForTrait(
  traitId: ReinforcementTraitId,
  lessonById: (id: string) => Lesson | null = getLocalLessonById,
): Lesson | null {
  const lessonId = REINFORCEMENT_LESSON_MAP[traitId];
  if (!lessonId) return null;
  return lessonById(lessonId);
}
