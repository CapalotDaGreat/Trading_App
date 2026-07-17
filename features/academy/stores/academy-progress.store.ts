import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface LessonProgress {
  completed: boolean;
  completedAt?: string;
  quizBestScore?: number;
  quizAttempts: number;
  lastOpenedAt?: string;
}

interface AcademyProgressState {
  lessons: Record<string, LessonProgress>;
  markOpened: (lessonId: string) => void;
  markCompleted: (lessonId: string) => void;
  recordQuizScore: (lessonId: string, scorePercent: number) => void;
  isCompleted: (lessonId: string) => boolean;
  getProgress: (lessonId: string) => LessonProgress | undefined;
  completedCount: (lessonIds: string[]) => number;
  resetProgress: () => void;
}

const emptyProgress = (): LessonProgress => ({
  completed: false,
  quizAttempts: 0,
});

export const useAcademyProgressStore = create<AcademyProgressState>()(
  persist(
    (set, get) => ({
      lessons: {},
      markOpened: (lessonId) => {
        const current = get().lessons[lessonId] ?? emptyProgress();
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
        const current = get().lessons[lessonId] ?? emptyProgress();
        set({
          lessons: {
            ...get().lessons,
            [lessonId]: {
              ...current,
              completed: true,
              completedAt: new Date().toISOString(),
              lastOpenedAt: new Date().toISOString(),
            },
          },
        });
      },
      recordQuizScore: (lessonId, scorePercent) => {
        const current = get().lessons[lessonId] ?? emptyProgress();
        const best = Math.max(current.quizBestScore ?? 0, scorePercent);
        const completed = current.completed || scorePercent >= 70;
        set({
          lessons: {
            ...get().lessons,
            [lessonId]: {
              ...current,
              quizBestScore: best,
              quizAttempts: current.quizAttempts + 1,
              completed,
              completedAt: completed
                ? (current.completedAt ?? new Date().toISOString())
                : current.completedAt,
              lastOpenedAt: new Date().toISOString(),
            },
          },
        });
      },
      isCompleted: (lessonId) => Boolean(get().lessons[lessonId]?.completed),
      getProgress: (lessonId) => get().lessons[lessonId],
      completedCount: (lessonIds) =>
        lessonIds.filter((id) => get().lessons[id]?.completed).length,
      resetProgress: () => set({ lessons: {} }),
    }),
    {
      name: 'tradevision-academy-progress',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
