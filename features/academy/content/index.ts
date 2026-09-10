import { LESSON_CONCEPT_IDS } from '@/features/competency/content/activity-concept-map';
import type { Lesson, LearningPath, PracticeLink, TradingChecklist } from '../types/academy.types';

import { CHART_LESSONS } from './chart-lessons';
import { CLASSIC_LESSONS } from './classic-lessons';
import { DECISION_LESSONS } from './decision-lessons';
import { FLAGSHIP_LESSONS } from './flagship-lessons';
import { FLAGSHIP_PROCESS_LESSONS } from './flagship-process-lessons';
import { READINESS_LESSONS } from './readiness-lessons';
import { DEFAULT_CHECKLISTS, LEARNING_PATHS } from './paths-and-checklists';

const DEFAULT_PRACTICE: PracticeLink = {
  label: 'Practice this skill',
  href: '/practice',
  description: 'A short judgment drill. Reasoning first, not a predicted tick.',
};

const DEFAULT_SIMULATION: PracticeLink = {
  label: 'Apply in simulated trading',
  href: '/simulate',
  description: 'Paper capital only. Simulated P/L does not grade the decision.',
};

const DEFAULT_REPLAY: PracticeLink = {
  label: 'Replay a historical decision',
  href: '/decision/replay-tv',
  description: 'Commit before the outcome is visible. Process is the grade — not the next print.',
};

function ensureAcademyLoop(lesson: Lesson): Lesson {
  const practiceLinks = lesson.practiceLinks.length ? lesson.practiceLinks : [DEFAULT_PRACTICE];
  const hasSimulate =
    Boolean(lesson.simulationLinks?.length) ||
    practiceLinks.some((link) => /simulate/i.test(`${link.href} ${link.label}`));
  const hasReplay =
    Boolean(lesson.replayLinks?.length) ||
    practiceLinks.some((link) => /replay/i.test(`${link.href} ${link.label}`));
  const conceptIds =
    lesson.conceptIds?.length ? lesson.conceptIds : [...(LESSON_CONCEPT_IDS[lesson.id] ?? [])];
  return {
    ...lesson,
    conceptIds,
    practiceLinks,
    simulationLinks: hasSimulate
      ? lesson.simulationLinks?.length
        ? lesson.simulationLinks
        : [DEFAULT_SIMULATION]
      : [DEFAULT_SIMULATION],
    replayLinks: hasReplay
      ? lesson.replayLinks?.length
        ? lesson.replayLinks
        : practiceLinks.filter((link) => /replay/i.test(`${link.href} ${link.label}`))
      : [DEFAULT_REPLAY],
    journalHref: lesson.journalHref ?? '/journal?from=academy',
    learningObjectives: lesson.learningObjectives?.length ? lesson.learningObjectives : [lesson.description],
    whyItMatters: lesson.whyItMatters ?? lesson.description,
  };
}

export const ALL_LESSONS: Lesson[] = [
  ...DECISION_LESSONS,
  ...CLASSIC_LESSONS,
  ...CHART_LESSONS,
  ...FLAGSHIP_LESSONS,
  ...FLAGSHIP_PROCESS_LESSONS,
  ...READINESS_LESSONS,
]
  .map(ensureAcademyLoop)
  .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

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
