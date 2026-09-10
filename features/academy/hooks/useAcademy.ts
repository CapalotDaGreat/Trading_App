import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { ingestKnowledgeCheck, ingestLessonCompletion, ingestLessonExercise } from '@/features/competency';
import type { HelpLevel } from '@/features/competency';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { useRegime } from '@/features/decision/hooks/useDecision';
import type { DecisionDebtSnapshot, TraderMemory } from '@/features/decision/types/decision.types';
import { useDecisionLabStore } from '@/features/decision-lab/stores/lab.store';
import { useLearnerModel } from '@/features/learner-model';
import { usePracticeProgressStore } from '@/features/practice/stores/practice-progress.store';
import { DEMO_USER_UID } from '@/firebase/config';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import { ALL_LESSONS, getLocalChecklistById, getLocalChecklists, getLocalLessonById } from '../content';
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
  CONCEPT_TO_LESSON,
  collectWeakConcepts,
  scorePathMastery,
  type MasteryLabel,
} from '../services/academy-mastery.service';
import {
  buildDefaultNextLesson,
  buildPersonalizedCurriculum,
  evaluatePathUnlocks,
  getDefaultOperatorPath,
  type CurriculumRecommendation,
} from '../services/curriculum.service';
import { useAcademyProgressStore } from '../stores/academy-progress.store';
import { useChecklistStore } from '../stores/checklist.store';

export { useChecklistStore } from '../stores/checklist.store';

const checklistQueryKey = (id: string) => ['academy-checklist', id] as const;

export function useAcademy(category?: LessonCategory) {
  // Always load full catalog; LessonCard / lesson screen enforce Premium locks.
  const localCatalog = useMemo(
    () => (category ? ALL_LESSONS.filter((lesson) => lesson.category === category) : ALL_LESSONS),
    [category],
  );
  const lessonsQuery = useQuery({
    queryKey: category ? ['academy-lessons', category, 'full'] : ['academy-lessons', 'full'],
    queryFn: () => (category ? getLessonsByCategory(category, true) : getLessons(true)),
    staleTime: 30 * 60 * 1000,
    initialData: localCatalog,
    networkMode: 'offlineFirst',
  });

  const lessonProgress = useAcademyProgressStore((s) => s.lessons);
  const catalog = lessonsQuery.data ?? localCatalog;
  const completedCount = useMemo(
    () =>
      catalog.filter((lesson) => {
        const row = lessonProgress[lesson.id];
        return Boolean(row?.read || row?.completed);
      }).length,
    [catalog, lessonProgress],
  );
  const practicedCount = useMemo(
    () => catalog.filter((lesson) => Boolean(lessonProgress[lesson.id]?.practiced)).length,
    [catalog, lessonProgress],
  );

  return {
    lessons: catalog,
    completedCount,
    practicedCount,
    totalCount: catalog.length,
    isLoading: lessonsQuery.isLoading && catalog.length === 0,
    isError: lessonsQuery.isError,
    refetch: () => {
      void lessonsQuery.refetch();
    },
  };
}

export function useLearningPaths() {
  const completedCount = useAcademyProgressStore((s) => s.completedCount);
  const practicedCount = useAcademyProgressStore((s) => s.practicedCount);
  const isRead = useAcademyProgressStore((s) => s.isRead);
  const isPracticed = useAcademyProgressStore((s) => s.isPracticed);
  const getProgress = useAcademyProgressStore((s) => s.getProgress);
  const positions = useDecisionLabStore((s) => s.positions);
  const getChallenges = useDecisionLabStore((s) => s.getChallenges);

  const query = useQuery({
    queryKey: ['academy-paths'],
    queryFn: getLearningPaths,
    staleTime: 60 * 60 * 1000,
    initialData: LEARNING_PATHS,
    networkMode: 'offlineFirst',
  });

  // Recompute when Lab positions change (challenge progress)
  const challenges = useMemo(() => getChallenges(), [positions, getChallenges]);
  const unlocks = evaluatePathUnlocks(challenges);
  const unlockById = new Map(unlocks.map((u) => [u.path.id, u]));

  const paths = (query.data ?? LEARNING_PATHS).map((path) => {
    const meta = path as AcademyPathMeta;
    const unlock = unlockById.get(path.id);
    const mastery = scorePathMastery({
      lessonIds: path.lessonIds,
      isRead,
      isPracticed,
      quizBest: (id) => getProgress(id)?.quizBestScore,
    });
    return {
      ...meta,
      completedCount: completedCount(path.lessonIds),
      practicedCount: practicedCount(path.lessonIds),
      totalCount: path.lessonIds.length,
      masteryUnlocked: unlock?.masteryUnlocked ?? true,
      unlockHint: unlock?.unlockHint,
      masteryLabel: mastery.label as MasteryLabel,
      masteryEvidence: mastery.evidence,
    };
  });

  // Decision Operator first
  paths.sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    paths,
    defaultPath: getDefaultOperatorPath(),
    isLoading: query.isLoading && paths.length === 0,
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
  const conceptResults = useAcademyProgressStore((s) => s.conceptResults);
  const practiceAttempts = usePracticeProgressStore((s) => s.attempts);
  const learner = useLearnerModel();

  const weakConcepts = useMemo(() => {
    const fromAcademy = collectWeakConcepts({
      conceptResults,
      repeatedDrillIds: usePracticeProgressStore.getState().repeatedMistakes(),
    });
    const seen = new Set(fromAcademy.map((row) => row.lessonId));
    const fromLearner = learner.concepts
      .filter((row) => row.state === 'needs_revisit' || row.knowledge.misconceptionFlags.length > 0)
      .map((row) => {
        const lessonId = CONCEPT_TO_LESSON[row.conceptId];
        if (!lessonId || seen.has(lessonId)) return null;
        const lesson = ALL_LESSONS.find((item) => item.id === lessonId);
        if (!lesson) return null;
        seen.add(lessonId);
        return {
          conceptId: row.conceptId,
          lessonId,
          title: lesson.title,
          misses: Math.max(1, row.knowledge.misconceptionFlags.length),
          attempts: Math.max(2, row.application.practiceAttempts + row.knowledge.knowledgeCheckAttempts),
          reason: row.state === 'needs_revisit' ? `${row.title} needs another look.` : `Repeated process flags on ${row.title.toLowerCase()}.`,
          evidence: [`Learner model: ${row.label}. Process evidence, not a trophy score.`],
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null);
    return [...fromAcademy, ...fromLearner].slice(0, 5);
  }, [conceptResults, learner.concepts, practiceAttempts]);

  if (isPremium) {
    const personalized = buildPersonalizedCurriculum({
      memory: input?.memory,
      debt: input?.debt,
      isRead,
      isPracticed,
      weakConcepts,
      limit: 1,
    });
    if (personalized[0]) {
      return {
        recommendation: personalized[0],
        isPersonalized: personalized[0].source !== 'weakness',
      };
    }
  }

  const recommendation = buildDefaultNextLesson({ isRead, isPracticed, weakConcepts });
  return {
    recommendation,
    isPersonalized: Boolean(recommendation?.isPersonalized && recommendation.source !== 'weakness'),
  };
}

export function useLearningPath(pathId: string) {
  const isCompleted = useAcademyProgressStore((s) => s.isCompleted);

  const query = useQuery({
    queryKey: ['academy-path', pathId],
    queryFn: () => getPathLessons(pathId, true),
    staleTime: 30 * 60 * 1000,
    enabled: Boolean(pathId),
    networkMode: 'offlineFirst',
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
  const { user } = useAuth();
  const uid = user?.uid ?? DEMO_USER_UID;
  const localLesson = lessonId ? getLocalLessonById(lessonId) : null;
  const query = useQuery({
    queryKey: ['academy-lesson', lessonId],
    queryFn: () => getLessonById(lessonId),
    staleTime: 30 * 60 * 1000,
    enabled: Boolean(lessonId),
    initialData: localLesson ?? undefined,
    networkMode: 'offlineFirst',
  });

  const markOpened = useAcademyProgressStore((s) => s.markOpened);
  const storeMarkCompleted = useAcademyProgressStore((s) => s.markCompleted);
  const markPracticed = useAcademyProgressStore((s) => s.markPracticed);
  const storeRecordQuizScore = useAcademyProgressStore((s) => s.recordQuizScore);
  const storeRecordConceptResult = useAcademyProgressStore((s) => s.recordConceptResult);
  const storeRecordExerciseAttempt = useAcademyProgressStore((s) => s.recordExerciseAttempt);
  const progress = useAcademyProgressStore((s) => s.getProgress(lessonId));
  const isCompleted = useAcademyProgressStore((s) => s.isCompleted(lessonId));
  const isRead = useAcademyProgressStore((s) => s.isRead(lessonId));
  const isPracticed = useAcademyProgressStore((s) => s.isPracticed(lessonId));

  return {
    lesson: query.data ?? localLesson,
    progress,
    isCompleted,
    isRead,
    isPracticed,
    markOpened,
    markCompleted: (id: string) => {
      storeMarkCompleted(id);
      ingestLessonCompletion(uid, id);
    },
    markPracticed,
    recordQuizScore: (id: string, scorePercent: number) => {
      storeRecordQuizScore(id, scorePercent);
      ingestKnowledgeCheck(uid, id, id, scorePercent >= 70);
    },
    recordConceptResult: (conceptId: string, correct: boolean) => {
      storeRecordConceptResult(conceptId, correct);
      ingestKnowledgeCheck(uid, lessonId, conceptId, correct);
    },
    recordExerciseAttempt: (
      id: string,
      correct?: boolean,
      options?: {
        kind?: string;
        conceptId?: string;
        helpLevel?: HelpLevel;
        exerciseId?: string;
        asTransfer?: boolean;
        scenarioContext?: import('@/features/competency').CompetencyScenarioContext;
        interactingConceptIds?: string[];
      },
    ) => {
      storeRecordExerciseAttempt(id, correct);
      const passed = typeof correct === 'boolean' ? correct : options?.kind === 'explain' || options?.kind === 'annotate';
      if (passed === true || correct === false) {
        ingestLessonExercise(uid, id, options?.conceptId, correct === false ? false : true, Date.now(), {
          helpLevel: options?.helpLevel,
          kind: options?.kind,
          exerciseId: options?.exerciseId,
          asTransfer: options?.asTransfer,
          scenarioContext: options?.scenarioContext,
          interactingConceptIds: options?.interactingConceptIds,
        });
      }
    },
    isLoading: query.isLoading && !query.data && !localLesson,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useAcademyChecklists() {
  const query = useQuery({
    queryKey: ['academy-checklists'],
    queryFn: getAllChecklists,
    staleTime: 30 * 60 * 1000,
    initialData: getLocalChecklists(),
    networkMode: 'offlineFirst',
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
    initialData: getLocalChecklistById(checklistId),
    networkMode: 'offlineFirst',
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
