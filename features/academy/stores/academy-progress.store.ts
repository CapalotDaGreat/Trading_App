import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

/**
 * Soft-mandatory practice model:
 * - "read"  = lesson marked complete / quiz passed (knowledge exposure)
 * - "practiced" = user opened an in-app practice gate from the lesson
 * Mastery-related surfacing rewards practiced; completion is never blocked.
 */
export interface LessonProgress {
  /** @deprecated use `read` — kept for persisted payloads */
  completed: boolean;
  /** Lesson was read / quiz passed — does not require practice. */
  read: boolean;
  readAt?: string;
  completedAt?: string;
  /** User followed a practice link (Lab / Replay / Radar / Journal…). */
  practiced: boolean;
  practicedAt?: string;
  lastPracticeHref?: string;
  quizBestScore?: number;
  quizAttempts: number;
  lastOpenedAt?: string;
}

interface AcademyDisciplineDay {
  day: string;
  brief: boolean;
  lesson: boolean;
  journal: boolean;
}

interface AcademyProgressState {
  lessons: Record<string, LessonProgress>;
  discipline: AcademyDisciplineDay | null;
  disciplineStreakDays: number;
  markOpened: (lessonId: string) => void;
  /** Soft complete = read (never requires practice). */
  markCompleted: (lessonId: string) => void;
  markPracticed: (lessonId: string, href?: string) => void;
  recordQuizScore: (lessonId: string, scorePercent: number) => void;
  markDisciplineAction: (action: 'brief' | 'lesson' | 'journal') => void;
  isCompleted: (lessonId: string) => boolean;
  isRead: (lessonId: string) => boolean;
  isPracticed: (lessonId: string) => boolean;
  getProgress: (lessonId: string) => LessonProgress | undefined;
  completedCount: (lessonIds: string[]) => number;
  practicedCount: (lessonIds: string[]) => number;
  getDisciplineStreak: () => {
    days: number;
    today: { brief: boolean; lesson: boolean; journal: boolean };
  };
  resetProgress: () => void;
}

const emptyProgress = (): LessonProgress => ({
  completed: false,
  read: false,
  practiced: false,
  quizAttempts: 0,
});

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

function normalizeProgress(raw: LessonProgress | undefined): LessonProgress {
  if (!raw) return emptyProgress();
  const read = Boolean(raw.read || raw.completed);
  return {
    ...emptyProgress(),
    ...raw,
    read,
    completed: read,
    practiced: Boolean(raw.practiced),
  };
}

export const useAcademyProgressStore = create<AcademyProgressState>()(
  persist(
    (set, get) => ({
      lessons: {},
      discipline: null,
      disciplineStreakDays: 0,

      markOpened: (lessonId) => {
        const current = normalizeProgress(get().lessons[lessonId]);
        set({
          lessons: {
            ...get().lessons,
            [lessonId]: {
              ...current,
              lastOpenedAt: new Date().toISOString(),
            },
          },
        });
      },

      markCompleted: (lessonId) => {
        const current = normalizeProgress(get().lessons[lessonId]);
        const now = new Date().toISOString();
        set({
          lessons: {
            ...get().lessons,
            [lessonId]: {
              ...current,
              completed: true,
              read: true,
              readAt: current.readAt ?? now,
              completedAt: current.completedAt ?? now,
              lastOpenedAt: now,
            },
          },
        });
        get().markDisciplineAction('lesson');
      },

      markPracticed: (lessonId, href) => {
        const current = normalizeProgress(get().lessons[lessonId]);
        const now = new Date().toISOString();
        set({
          lessons: {
            ...get().lessons,
            [lessonId]: {
              ...current,
              practiced: true,
              practicedAt: current.practicedAt ?? now,
              lastPracticeHref: href ?? current.lastPracticeHref,
              lastOpenedAt: now,
            },
          },
        });
        get().markDisciplineAction('lesson');
      },

      recordQuizScore: (lessonId, scorePercent) => {
        const current = normalizeProgress(get().lessons[lessonId]);
        const best = Math.max(current.quizBestScore ?? 0, scorePercent);
        const now = new Date().toISOString();
        const read = current.read || scorePercent >= 70;
        set({
          lessons: {
            ...get().lessons,
            [lessonId]: {
              ...current,
              quizBestScore: best,
              quizAttempts: current.quizAttempts + 1,
              read,
              completed: read,
              readAt: read ? (current.readAt ?? now) : current.readAt,
              completedAt: read ? (current.completedAt ?? now) : current.completedAt,
              lastOpenedAt: now,
            },
          },
        });
        if (read) get().markDisciplineAction('lesson');
      },

      markDisciplineAction: (action) => {
        const day = todayKey();
        const prev = get().discipline;
        let streak = get().disciplineStreakDays;

        let next: AcademyDisciplineDay;
        if (prev?.day === day) {
          next = { ...prev };
        } else {
          // New calendar day — if yesterday was fully complete, keep streak; else reset base
          if (prev?.day === yesterdayKey() && prev.brief && prev.lesson && prev.journal) {
            // streak continues; increment happens when today completes
          } else if (prev && prev.day !== day) {
            streak = 0;
          }
          next = { day, brief: false, lesson: false, journal: false };
        }

        const wasComplete = next.brief && next.lesson && next.journal;
        next[action] = true;
        const nowComplete = next.brief && next.lesson && next.journal;

        if (nowComplete && !wasComplete) {
          if (prev?.day === yesterdayKey() && prev.brief && prev.lesson && prev.journal) {
            streak = streak + 1;
          } else if (streak === 0) {
            streak = 1;
          } else if (prev?.day === day) {
            streak = Math.max(1, streak);
          } else {
            streak = 1;
          }
        }

        set({ discipline: next, disciplineStreakDays: streak });
      },

      isCompleted: (lessonId) => normalizeProgress(get().lessons[lessonId]).read,
      isRead: (lessonId) => normalizeProgress(get().lessons[lessonId]).read,
      isPracticed: (lessonId) => normalizeProgress(get().lessons[lessonId]).practiced,
      getProgress: (lessonId) => {
        const raw = get().lessons[lessonId];
        return raw ? normalizeProgress(raw) : undefined;
      },
      completedCount: (lessonIds) =>
        lessonIds.filter((id) => normalizeProgress(get().lessons[id]).read).length,
      practicedCount: (lessonIds) =>
        lessonIds.filter((id) => normalizeProgress(get().lessons[id]).practiced).length,
      getDisciplineStreak: () => {
        const d = get().discipline;
        const day = todayKey();
        const today =
          d?.day === day
            ? { brief: d.brief, lesson: d.lesson, journal: d.journal }
            : { brief: false, lesson: false, journal: false };
        return { days: get().disciplineStreakDays, today };
      },
      resetProgress: () => set({ lessons: {}, discipline: null, disciplineStreakDays: 0 }),
    }),
    {
      name: 'tradevision-academy-progress',
      storage: createPersistedStorage(),
      version: 2,
      migrate: (persisted: unknown) => {
        const state = persisted as {
          lessons?: Record<string, LessonProgress>;
          discipline?: AcademyDisciplineDay | null;
          disciplineStreakDays?: number;
        };
        const lessons: Record<string, LessonProgress> = {};
        for (const [id, raw] of Object.entries(state?.lessons ?? {})) {
          lessons[id] = normalizeProgress(raw);
        }
        return {
          lessons,
          discipline: state?.discipline ?? null,
          disciplineStreakDays: state?.disciplineStreakDays ?? 0,
        };
      },
    },
  ),
);
