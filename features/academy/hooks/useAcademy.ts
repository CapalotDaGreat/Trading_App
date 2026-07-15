import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import {
  getAllChecklists,
  getLessonById,
  getLessons,
  getLessonsByCategory,
  getTradingChecklist,
  type LessonCategory,
} from '../services/academy.service';

const lessonsQueryKey = (includePremium: boolean) => ['academy-lessons', includePremium] as const;
const lessonQueryKey = (id: string) => ['academy-lesson', id] as const;
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
  const isPremium = useSubscriptionStore((s) => s.isPremium);

  const lessonsQuery = useQuery({
    queryKey: category
      ? ['academy-lessons', category, isPremium]
      : lessonsQueryKey(isPremium),
    queryFn: () =>
      category ? getLessonsByCategory(category, isPremium) : getLessons(isPremium),
    staleTime: 30 * 60 * 1000,
  });

  const checklistsQuery = useQuery({
    queryKey: ['academy-checklists'],
    queryFn: getAllChecklists,
    staleTime: 30 * 60 * 1000,
  });

  return {
    lessons: lessonsQuery.data ?? [],
    checklists: checklistsQuery.data ?? [],
    isLoading: lessonsQuery.isLoading || checklistsQuery.isLoading,
    isError: lessonsQuery.isError || checklistsQuery.isError,
    refetch: () => {
      void lessonsQuery.refetch();
      void checklistsQuery.refetch();
    },
  };
}

export function useLesson(lessonId: string) {
  const query = useQuery({
    queryKey: lessonQueryKey(lessonId),
    queryFn: () => getLessonById(lessonId),
    enabled: Boolean(lessonId),
  });

  return {
    lesson: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
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
