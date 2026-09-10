import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ALL_LESSONS } from '@/features/academy/content';
import { useAcademy, useNextAcademyLesson } from '@/features/academy/hooks/useAcademy';
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { useJournal } from '@/features/journal/hooks/useJournal';
import { PRACTICE_DRILLS } from '@/features/practice/content/practice-drills';
import { usePracticeProgressStore } from '@/features/practice/stores/practice-progress.store';
import { assessTrainingReadiness } from '@/features/progress/services/readiness.service';
import { buildSkillModel } from '@/features/progress/services/skill-model.service';
import { buildWeeklyTrainingPlan } from '@/features/progress/services/weekly-training-plan.service';
import { useLearningEngine } from '@/features/learning-engine/hooks/useLearningEngine';
import { useLearnerModel } from '@/features/learner-model';
import { preferredPracticeDrillIds } from '@/features/mistake-library/services/mistake-library.service';
import { recommendPracticeDrill } from '@/features/practice/services/practice-library.service';
import { useSimulation } from '@/features/simulation/hooks/useSimulation';
import { SKILL_DOMAIN_LABELS } from '@/shared/constants/skill-domains';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

export default function ReadinessScreen() {
  const router = useRouter();
  const { completedCount, practicedCount } = useAcademy();
  const { recommendation } = useNextAcademyLesson();
  const { primary } = useLearningEngine();
  const lessonProgress = useAcademyProgressStore((state) => state.lessons);
  const attempts = usePracticeProgressStore((state) => state.attempts);
  const { entries } = useJournal();
  const { account } = useSimulation();
  const learner = useLearnerModel();
  const drill = useMemo(
    () =>
      recommendPracticeDrill({
        attempts,
        nextLessonId: recommendation?.lesson.id,
        preferredDrillIds: preferredPracticeDrillIds(learner.mistakePatterns),
      }),
    [attempts, learner.mistakePatterns, recommendation?.lesson.id],
  );

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

  const accuracy =
    attempts.length === 0 ? 0 : attempts.filter((item) => item.correct).length / attempts.length;
  const readiness = assessTrainingReadiness({
    skill,
    lessonsRead: completedCount,
    practiced: practicedCount,
    journalCount: entries.length,
    thesisDecisions: account?.decisions.filter((item) => item.thesis.trim().length >= 8).length ?? 0,
    closeReviews: account?.decisions.filter((item) => item.closeReview).length ?? 0,
    practiceAccuracy: accuracy,
  });
  const weekly = buildWeeklyTrainingPlan({
    skill,
    nextLesson: recommendation,
    drill,
    plannerPrimary: primary,
  });

  return (
    <ScreenScaffold
      title="Training readiness"
      subtitle="Educational feedback about your record. Not a claim that you are ready to trade real money."
      showBack
      onBack={() => router.back()}
      contentClassName="pb-12"
      testID="readiness-screen"
    >
      <Surface tone="accent" emphasis="outlined">
        <Text variant="label" className="text-accent">
          What the record shows
        </Text>
        <Text variant="h3" headingLevel={3} className="mt-2">
          {readiness.headline}
        </Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          {readiness.disclaimer}
        </Text>
      </Surface>

      <Surface className="mt-4">
        <Text variant="label">This week</Text>
        <Text variant="h3" headingLevel={3} className="mt-2">
          {weekly.title}
        </Text>
        <View className="mt-3 gap-2">
          {weekly.items.map((item) => (
            <Button
              key={item.order}
              size="sm"
              variant="outline"
              onPress={() => router.push(item.href as never)}
            >
              {item.order}. {item.title}
            </Button>
          ))}
        </View>
        <Text variant="caption" className="mt-3 text-text-tertiary">
          {weekly.reminder}
        </Text>
      </Surface>

      <View className="mt-4 gap-2">
        {readiness.dimensions.map((item) => (
          <Surface key={item.id} tone="subtle">
            <Text variant="label">
              {item.label} · {item.evidence}
            </Text>
            <Text variant="body-sm" className="mt-1 text-text-secondary">
              {item.note}
            </Text>
          </Surface>
        ))}
      </View>

      {skill.weakest ? (
        <Text variant="caption" className="mt-4 text-text-tertiary">
          Area to improve: {SKILL_DOMAIN_LABELS[skill.weakest]}. {skill.evidenceNote}
        </Text>
      ) : null}

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button size="sm" onPress={() => router.push((primary?.href ?? readiness.nextHref) as never)}>
          {primary?.title ?? readiness.nextLabel}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onPress={() => router.push('/academy/lesson/prep-simulation-vs-live' as never)}
        >
          Simulation vs real money
        </Button>
      </View>
    </ScreenScaffold>
  );
}
