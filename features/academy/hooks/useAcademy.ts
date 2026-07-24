import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { useRegime } from '@/features/decision/hooks/useDecision';
import type { DecisionDebtSnapshot, TraderMemory } from '@/features/decision/types/decision.types';
import { useDecisionLabStore } from '@/features/decision-lab/stores/lab.store';
import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import { LEARNING_PATHS, type AcademyPathMeta } from '../content/paths-and-checklists';
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
import {
  buildDefaultNextLesson,
  buildPersonalizedCurriculum,
  evaluatePathUnlocks,
  getDefaultOperatorPath,
  type CurriculumRecommendation,
} from '../services/curriculum.service';
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
      storage: createPersistedStorage(),
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
    (lessonsQuery.data ?? []).filter((l) => s.isRead(l.id)).length,
  );
  const practicedCount = useAcademyProgressStore((s) =>
    (lessonsQuery.data ?? []).filter((l) => s.isPracticed(l.id)).length,
  );

  return {
    lessons: lessonsQuery.data ?? [],
    completedCount,
    practicedCount,
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
  const practicedCount = useAcademyProgressStore((s) => s.practicedCount);
  const positions = useDecisionLabStore((s) => s.positions);
  const getChallenges = useDecisionLabStore((s) => s.getChallenges);

  const query = useQuery({
    queryKey: ['academy-paths'],
    queryFn: getLearningPaths,
    staleTime: 60 * 60 * 1000,
  });

  // Recompute when Lab positions change (challenge progress)
  const challenges = useMemo(() => getChallenges(), [positions, getChallenges]);
  const unlocks = evaluatePathUnlocks(challenges);
  const unlockById = new Map(unlocks.map((u) => [u.path.id, u]));

  const paths = (query.data ?? LEARNING_PATHS).map((path) => {
    const meta = path as AcademyPathMeta;
    const unlock = unlockById.get(path.id);
    return {
      ...meta,
      completedCount: completedCount(path.lessonIds),
      practicedCount: practicedCount(path.lessonIds),
      totalCount: path.lessonIds.length,
      masteryUnlocked: unlock?.masteryUnlocked ?? true,
      unlockHint: unlock?.unlockHint,
    };
  });

  // Decision Operator first
  paths.sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    paths,
    defaultPath: getDefaultOperatorPath(),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useNextAcademyLesson(input?: {
  memory?: TraderMemory;
  debt?: DecisionDebtSnapshot;
}): {
  recommendation: CurriculumRecommendation | null;
  isPersonalized: boolean;
} {
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const isRead = useAcademyProgressStore((s) => s.isRead);
  const isPracticed = useAcademyProgressStore((s) => s.isPracticed);

  if (isPremium) {
    const personalized = buildPersonalizedCurriculum({
      memory: input?.memory,
      debt: input?.debt,
      isRead,
      isPracticed,
      limit: 1,
    });
    if (personalized[0]) {
      return { recommendation: personalized[0], isPersonalized: true };
    }
  }

  return {
    recommendation: buildDefaultNextLesson({ isRead, isPracticed }),
    isPersonalized: false,
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
  const markPracticed = useAcademyProgressStore((s) => s.markPracticed);
  const recordQuizScore = useAcademyProgressStore((s) => s.recordQuizScore);
  const progress = useAcademyProgressStore((s) => s.getProgress(lessonId));
  const isCompleted = useAcademyProgressStore((s) => s.isCompleted(lessonId));
  const isRead = useAcademyProgressStore((s) => s.isRead(lessonId));
  const isPracticed = useAcademyProgressStore((s) => s.isPracticed(lessonId));

  return {
    lesson: query.data ?? null,
    progress,
    isCompleted,
    isRead,
    isPracticed,
    markOpened,
    markCompleted,
    markPracticed,
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

  const toggleItemStore = useChecklistStore((s) => s.toggleItem);
  const resetChecklist = useChecklistStore((s) => s.resetChecklist);
  const isItemChecked = useChecklistStore((s) => s.isItemChecked);
  const appendDecision = useAppendDecisionRecord();
  const regimeQuery = useRegime();

  const checklist = query.data;
  const checkedCount = checklist
    ? checklist.items.filter((item) => isItemChecked(checklistId, item.id)).length
    : 0;

  const toggleItem = (itemId: string) => {
    const before = useChecklistStore.getState().checkedItems[checklistId] ?? [];
    const requiredIds = (checklist?.items ?? []).filter((i) => i.isRequired).map((i) => i.id);
    const wasComplete =
      requiredIds.length > 0 && requiredIds.every((id) => before.includes(id));

    toggleItemStore(checklistId, itemId);

    const after = useChecklistStore.getState().checkedItems[checklistId] ?? [];
    const nowComplete =
      requiredIds.length > 0 && requiredIds.every((id) => after.includes(id));

    if (nowComplete && !wasComplete && checklist) {
      const day = new Date().toISOString().slice(0, 10);
      void appendDecision.mutateAsync({
        symbol: 'PROCESS',
        regime: regimeQuery.data?.regime ?? 'unknown',
        action: 'checklist_done',
        note: `Completed ${checklist.title}`,
        eventKey: `checklist:${checklistId}:${day}`,
      });
    }
  };

  return {
    checklist,
    checkedCount,
    totalCount: checklist?.items.length ?? 0,
    toggleItem,
    resetChecklist: () => resetChecklist(checklistId),
    isItemChecked: (itemId: string) => isItemChecked(checklistId, itemId),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
