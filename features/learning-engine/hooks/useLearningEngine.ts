import { useMemo } from 'react';

import { ALL_LESSONS } from '@/features/academy/content';
import { useNextAcademyLesson } from '@/features/academy/hooks/useAcademy';
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { useReplayTvStore } from '@/features/decision-replay-tv/stores/replay-tv.store';
import { useMarketEvents } from '@/features/events/hooks/useMarketEvents';
import { useJournal } from '@/features/journal/hooks/useJournal';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import { usePracticeProgressStore } from '@/features/practice/stores/practice-progress.store';
import { buildSkillModel } from '@/features/progress/services/skill-model.service';
import { useSimulation } from '@/features/simulation/hooks/useSimulation';
import { scoreSimulationProcess } from '@/features/simulation/services/scenario-process.service';

import { buildLearningEvidence } from '../services/learning-evidence.service';
import { nextAfterLesson } from '../services/lesson-next.service';
import { composeTodaysTraining } from '../services/practice-queue.service';
import { useLearningQueueStore } from '../stores/learning-queue.store';

export function useLearningEngine(options?: { lessonId?: string }) {
  const { recommendation } = useNextAcademyLesson();
  const lessonProgress = useAcademyProgressStore((state) => state.lessons);
  const conceptResults = useAcademyProgressStore((state) => state.conceptResults);
  const attempts = usePracticeProgressStore((state) => state.attempts);
  const replay = useReplayTvStore((state) => state.progress);
  const { entries } = useJournal();
  const { account } = useSimulation();
  const { profile } = useCoachProfile();
  const dispositions = useLearningQueueStore((state) => state.dispositions);
  const skip = useLearningQueueStore((state) => state.skip);
  const defer = useLearningQueueStore((state) => state.defer);
  const bookmark = useLearningQueueStore((state) => state.bookmark);

  const skill = useMemo(
    () =>
      buildSkillModel({
        lessons: ALL_LESSONS,
        lessonProgress,
        attempts,
        journalCount: entries.length,
        thesisDecisionCount: account?.decisions.filter((item) => item.thesis.trim().length >= 8).length ?? 0,
      }),
    [account?.decisions, attempts, entries.length, lessonProgress],
  );

  const { trainingPlan } = useMarketEvents({ weakness: skill.weakest });

  const snapshot = useMemo(() => {
    const process = account ? scoreSimulationProcess(account) : undefined;
    return buildLearningEvidence({
      lessonProgress,
      conceptResults,
      attempts,
      journal: entries.map((entry) => ({
        mistakeCategory: entry.mistakeCategory,
        emotion: entry.emotion,
        createdAt: entry.createdAt,
      })),
      replay: {
        completedEpisodeIds: replay.completedEpisodeIds,
        bestProcessByEpisode: replay.bestProcessByEpisode,
      },
      simulation: process
        ? { gaps: process.gaps, composite: process.composite, decisionCount: account?.decisions.length ?? 0 }
        : undefined,
      hasSimulation: Boolean(account),
      nextLessonId: recommendation?.lesson.id ?? null,
      experience: profile.experience,
      eventPlan: trainingPlan,
    });
  }, [
    account,
    attempts,
    conceptResults,
    entries,
    lessonProgress,
    profile.experience,
    recommendation?.lesson.id,
    replay.bestProcessByEpisode,
    replay.completedEpisodeIds,
    trainingPlan,
  ]);

  const today = useMemo(() => composeTodaysTraining(snapshot, dispositions), [dispositions, snapshot]);
  const lessonChain = options?.lessonId ? nextAfterLesson(options.lessonId) : today.lessonChain;

  return {
    today,
    lessonChain,
    skill,
    snapshot,
    skip,
    defer,
    bookmark,
    isBookmarked: (id: string) => Boolean(dispositions[id]?.bookmarked),
  };
}
