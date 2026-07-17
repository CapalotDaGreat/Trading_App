import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  getAllChecklists,
  getLearningPathById,
  getLearningPaths,
  getLessonById,
  getLessons,
  getLessonsByCategory,
  getPathLessons,
  getTradingChecklist,
  type LessonCategory,
} from '../services/academy.service';
import { useAcademyProgressStore } from '../stores/academy-progress.store';

const checklistQueryKey = (id: string) => ['academy-checklist', id] as const;

interface ChecklistProgressState {
  checkedItems: Record<string, string[]>;
  toggleItem: (checklistId: string, itemId: string) => void;
  resetChecklist: (checklistId: string) => void;
  isItemChecked: (checklistId: string, itemId: string) => boolean;
}

export const useChecklistStore = create<ChecklistProgressState>()(
  persist(
    (set, get) => ({
      checkedItems: {},
      toggleItem: (checklistId, itemId) => {
        const current = get().checkedItems[checklistId] ?? [];
        const next = current.includes(itemId)
          ? current.filter((id) => id !== itemId)
          : [...current, itemId];
        set({ checkedItems: { ...get().checkedItems, [checklistId]: next } });
      },
      resetChecklist: (checklistId) => {
        const { [checklistId]: _, ...rest } = get().checkedItems;
        set({ checkedItems: rest });
      },
      isItemChecked: (checklistId, itemId) =>
        (get().checkedItems[checklistId] ?? []).includes(itemId),
    }),
    {
      name: 'tradevision-checklist-progress',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function useAcademy(category?: LessonCategory) {
  // Always load full catalog; LessonCard / lesson screen enforce Premium locks.
  const lessonsQuery = useQuery({
    queryKey: category ? ['academy-lessons', category, 'full'] : ['academy-lessons', 'full'],
    queryFn: () => (category ? getLessonsByCategory(category, true) : getLessons(true)),
    staleTime: 30 * 60 * 1000,
  });

  const completedCount = useAcademyProgressStore((s) =>
    (lessonsQuery.data ?? []).filter((l) => s.isCompleted(l.id)).length,
  );

  return {
    lessons: lessonsQuery.data ?? [],
    completedCount,
    totalCount: lessonsQuery.data?.length ?? 0,
    isLoading: lessonsQuery.isLoading,
    isError: lessonsQuery.isError,
    refetch: () => {
      void lessonsQuery.refetch();
    },
  };
}

export function useLearningPaths() {
  const completedCount = useAcademyProgressStore((s) => s.completedCount);

  const query = useQuery({
    queryKey: ['academy-paths'],
    queryFn: getLearningPaths,
    staleTime: 60 * 60 * 1000,
  });

  const paths = (query.data ?? []).map((path) => ({
    ...path,
    completedCount: completedCount(path.lessonIds),
    totalCount: path.lessonIds.length,
  }));

  return {
    paths,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useLearningPath(pathId: string) {
  const isCompleted = useAcademyProgressStore((s) => s.isCompleted);

  const query = useQuery({
    queryKey: ['academy-path', pathId],
    queryFn: () => getPathLessons(pathId, true),
    staleTime: 30 * 60 * 1000,
    enabled: Boolean(pathId),
  });

  const lessons = query.data?.lessons ?? [];
  const path = query.data?.path ?? null;

  return {
    path,
    lessons,
    completedCount: lessons.filter((l) => isCompleted(l.id)).length,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useLesson(lessonId: string) {
  const query = useQuery({
    queryKey: ['academy-lesson', lessonId],
    queryFn: () => getLessonById(lessonId),
    staleTime: 30 * 60 * 1000,
    enabled: Boolean(lessonId),
  });

  const markOpened = useAcademyProgressStore((s) => s.markOpened);
  const markCompleted = useAcademyProgressStore((s) => s.markCompleted);
  const recordQuizScore = useAcademyProgressStore((s) => s.recordQuizScore);
  const progress = useAcademyProgressStore((s) => s.getProgress(lessonId));
  const isCompleted = useAcademyProgressStore((s) => s.isCompleted(lessonId));

  return {
    lesson: query.data ?? null,
    progress,
    isCompleted,
    markOpened,
    markCompleted,
    recordQuizScore,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useAcademyChecklists() {
  const query = useQuery({
    queryKey: ['academy-checklists'],
    queryFn: getAllChecklists,
    staleTime: 30 * 60 * 1000,
  });

  return {
    checklists: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function usePathMeta(pathId: string) {
  return useQuery({
    queryKey: ['academy-path-meta', pathId],
    queryFn: () => getLearningPathById(pathId),
    enabled: Boolean(pathId),
  });
}

export function useTradingChecklist(checklistId = 'pre-trade-checklist') {
  const query = useQuery({
    queryKey: checklistQueryKey(checklistId),
    queryFn: () => getTradingChecklist(checklistId),
    staleTime: 30 * 60 * 1000,
  });

  const toggleItem = useChecklistStore((s) => s.toggleItem);
  const resetChecklist = useChecklistStore((s) => s.resetChecklist);
  const isItemChecked = useChecklistStore((s) => s.isItemChecked);

  const checklist = query.data;
  const checkedCount = checklist
    ? checklist.items.filter((item) => isItemChecked(checklistId, item.id)).length
    : 0;

  return {
    checklist,
    checkedCount,
    totalCount: checklist?.items.length ?? 0,
    toggleItem: (itemId: string) => toggleItem(checklistId, itemId),
    resetChecklist: () => resetChecklist(checklistId),
    isItemChecked: (itemId: string) => isItemChecked(checklistId, itemId),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
