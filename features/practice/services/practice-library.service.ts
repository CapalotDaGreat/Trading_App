import type { LearningTopic } from '@/shared/constants/learning-topics';
import { LEARNING_TOPICS } from '@/shared/constants/learning-topics';

import type { PracticeAttempt } from '../stores/practice-progress.store';
import {
  PRACTICE_DRILLS,
  type PracticeDifficulty,
  type PracticeDrill,
  type PracticeTimeBucket,
} from '../content/practice-drills';

export type PracticeCompletionFilter = 'all' | 'completed' | 'not_completed';
export type PracticeTimeFilter = 'all' | PracticeTimeBucket;
export type PracticeTopicFilter = 'all' | LearningTopic;
export type PracticeDifficultyFilter = 'all' | PracticeDifficulty;

export interface PracticeLibraryFilters {
  topic: PracticeTopicFilter;
  difficulty: PracticeDifficultyFilter;
  time: PracticeTimeFilter;
  completion: PracticeCompletionFilter;
}

export const DEFAULT_PRACTICE_FILTERS: PracticeLibraryFilters = {
  topic: 'all',
  difficulty: 'all',
  time: 'all',
  completion: 'all',
};

export const PRACTICE_TOPIC_FILTERS: PracticeTopicFilter[] = ['all', ...LEARNING_TOPICS];

export function practiceTimeBucket(minutes: number): PracticeTimeBucket {
  return minutes <= 4 ? 'short' : 'medium';
}

export function parsePracticeTopicParam(value: string | string[] | undefined): PracticeTopicFilter | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || raw === 'all') return null;
  return LEARNING_TOPICS.includes(raw as LearningTopic) ? (raw as LearningTopic) : null;
}

export function isDrillCompleted(drillId: string, attempts: PracticeAttempt[]): boolean {
  return attempts.some((attempt) => attempt.drillId === drillId);
}

export function filterPracticeDrills(
  drills: readonly PracticeDrill[],
  filters: PracticeLibraryFilters,
  attempts: PracticeAttempt[],
): PracticeDrill[] {
  return drills.filter((drill) => {
    if (filters.topic !== 'all' && drill.topic !== filters.topic) return false;
    if (filters.difficulty !== 'all' && drill.difficulty !== filters.difficulty) return false;
    if (filters.time !== 'all' && practiceTimeBucket(drill.estimatedMinutes) !== filters.time) {
      return false;
    }
    if (filters.completion === 'completed' && !isDrillCompleted(drill.id, attempts)) return false;
    if (filters.completion === 'not_completed' && isDrillCompleted(drill.id, attempts)) return false;
    return true;
  });
}

/** Library helper for browsing drills. The Training Planner ranks the next activity. */
export function recommendPracticeDrill(input: {
  attempts: PracticeAttempt[];
  nextLessonId?: string;
  preferredDrillIds?: string[];
}): PracticeDrill {
  const misses = new Map<string, number>();
  for (const attempt of input.attempts) {
    if (attempt.correct) continue;
    misses.set(attempt.drillId, (misses.get(attempt.drillId) ?? 0) + 1);
  }
  const repeatedId = [...misses.entries()].sort((a, b) => b[1] - a[1]).find(([, count]) => count >= 2)?.[0];
  const repeated = PRACTICE_DRILLS.find((drill) => drill.id === repeatedId);
  if (repeated) return repeated;

  const preferred = (input.preferredDrillIds ?? [])
    .map((id) => PRACTICE_DRILLS.find((drill) => drill.id === id))
    .find((drill): drill is PracticeDrill => Boolean(drill));
  if (preferred) return preferred;

  if (input.nextLessonId) {
    const linked = PRACTICE_DRILLS.find((drill) => drill.lessonId === input.nextLessonId);
    if (linked) return linked;
  }

  const attempted = new Set(input.attempts.map((attempt) => attempt.drillId));
  return PRACTICE_DRILLS.find((drill) => !attempted.has(drill.id)) ?? PRACTICE_DRILLS[0]!;
}
