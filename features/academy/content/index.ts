import type { Lesson, LearningPath, TradingChecklist } from '../types/academy.types';

import { CLASSIC_LESSONS } from './classic-lessons';
import { DECISION_LESSONS } from './decision-lessons';
import { DEFAULT_CHECKLISTS, LEARNING_PATHS } from './paths-and-checklists';

export const ALL_LESSONS: Lesson[] = [...DECISION_LESSONS, ...CLASSIC_LESSONS].sort(
  (a, b) => a.sortOrder - b.sortOrder,
);

export { DEFAULT_CHECKLISTS, LEARNING_PATHS };

export function getLocalLessons(includePremium: boolean): Lesson[] {
  return includePremium ? ALL_LESSONS : ALL_LESSONS.filter((l) => !l.isPremium);
}

export function getLocalLessonById(lessonId: string): Lesson | null {
  return ALL_LESSONS.find((l) => l.id === lessonId) ?? null;
}

export function getLocalPaths(): LearningPath[] {
  return [...LEARNING_PATHS].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getLocalPathById(pathId: string): LearningPath | null {
  return LEARNING_PATHS.find((p) => p.id === pathId) ?? null;
}

export function getLocalChecklists(): TradingChecklist[] {
  return DEFAULT_CHECKLISTS;
}

export function getLocalChecklistById(checklistId: string): TradingChecklist {
  return DEFAULT_CHECKLISTS.find((c) => c.id === checklistId) ?? DEFAULT_CHECKLISTS[0];
}
