import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { LessonLearningLoop } from '@/features/academy/components/LessonLearningLoop';
import { LessonNextSteps } from '@/features/learning-engine/components/LessonNextSteps';
import { nextAfterLesson } from '@/features/learning-engine/services/lesson-next.service';
import { getLocalLessonById } from '@/features/academy/content';
import { useLesson } from '@/features/academy/hooks/useAcademy';
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { CATEGORY_LABELS } from '@/features/academy/types/academy.types';
import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { EducationalPanel } from '@/features/educational/components/EducationalPanel';
import { getLessonEducationalFraming } from '@/features/educational/services/lesson-framing.service';
import { StatusState } from '@/shared/components/feedback/StatusState';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';
import { useTheme } from '@/shared/hooks/useTheme';

export default function AcademyLessonScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const isPremiumUser = useSubscriptionStore((s) => s.isPremium);
  const {
    lesson,
    isLoading,
    isRead,
    isPracticed,
    progress,
    markOpened,
    markCompleted,
    markPracticed,
    recordQuizScore,
    recordConceptResult,
    recordExerciseAttempt,
  } = useLesson(lessonId ?? '');

  const isSaved = useAcademyProgressStore((s) => s.isSaved(lessonId ?? ''));
  const toggleSaved = useAcademyProgressStore((s) => s.toggleSaved);

  useEffect(() => {
    if (lesson?.id) markOpened(lesson.id);
  }, [lesson?.id, markOpened]);

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <StatusState
          status="loading"
          title="Loading lesson"
          description="Preparing the explanation, chart, and practice steps."
        />
      </Screen>
    );
  }

  if (!lesson) {
    return (
      <Screen>
        <Header title="Lesson" onBack={() => router.back()} />
        <StatusState
          status="empty"
          title="This lesson is not on this device"
          description="It may have been renamed, or Academy content has not finished loading. Search for the concept instead of the old title."
          actionLabel="Browse Academy"
          onAction={() => router.replace('/academy' as never)}
        />
      </Screen>
    );
  }

  const locked = lesson.isPremium && !isPremiumUser;
  const framing = getLessonEducationalFraming(lesson);

  if (locked) {
    return (
      <Screen scrollable>
        <Header title={lesson.title} onBack={() => router.back()} />
        <View className="mt-8 items-center px-4">
          <Ionicons name="lock-closed-outline" size={40} color={colors.accent.primary} />
          <Text variant="h3" className="mt-4 text-center">
            Premium lesson
          </Text>
          <Text variant="body-sm" className="mt-2 text-center text-text-secondary">
            Foundations stay free. This module is included with Premium — no need to interrupt a
            free lesson to see it.
          </Text>
          <Button className="mt-6" onPress={() => router.push('/subscription' as never)}>
            See Premium
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable contentClassName="pb-12">
      <Header
        title={lesson.title}
        subtitle={`${lesson.durationMinutes} min · ${CATEGORY_LABELS[lesson.category]}`}
        onBack={() => router.back()}
        rightAction={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Remove bookmark' : 'Save lesson for later'}
            onPress={() => toggleSaved(lesson.id)}
            className="h-11 w-11 items-center justify-center"
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={colors.accent.primary}
            />
          </Pressable>
        }
      />

      <EducationalModeBadge className="mt-3" />

      <View className="mt-3 flex-row flex-wrap gap-2">
        <Badge
          label={lesson.track === 'decision' ? 'Decision coach' : 'Trading school'}
          variant="accent"
          size="sm"
        />
        {isPracticed ? (
          <Badge label="Practiced" variant="accent" size="sm" />
        ) : isRead ? (
          <Badge label="Read" variant="success" size="sm" />
        ) : null}
      </View>

      {lesson.prerequisiteIds?.length ? (
        <View className="mt-4 rounded-2xl bg-surface p-3">
          <Text variant="caption" className="mb-2 text-text-tertiary">
            Helpful first
          </Text>
          {lesson.prerequisiteIds.map((id) => {
            const prior = getLocalLessonById(id);
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={`Open prerequisite ${prior?.title ?? id}`}
                onPress={() => router.push(`/academy/lesson/${id}` as never)}
                className="min-h-11 justify-center py-1"
              >
                <Text variant="body-sm" className="text-accent">
                  {prior?.title ?? id}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View className="mt-4 rounded-2xl border border-info/20 bg-info-muted p-4">
        <Text variant="caption" className="font-semibold text-info">
          Course card
        </Text>
        <Text variant="body-sm" className="mt-1.5 leading-relaxed text-text-primary">
          {framing.learningObjective}
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1">
          <Text variant="caption" className="text-text-secondary">
            ~{framing.estimatedMinutes} min
          </Text>
          <Text variant="caption" className="capitalize text-text-secondary">
            {framing.difficulty}
          </Text>
        </View>
        <Text variant="caption" className="mt-2 font-semibold text-text-tertiary">
          Skills practiced
        </Text>
        <Text variant="body-sm" className="mt-0.5 capitalize text-text-secondary">
          {framing.skillsPracticed.join(' · ')}
        </Text>
      </View>

      <LessonLearningLoop
        lesson={lesson}
        quizBestScore={progress?.quizBestScore}
        onPracticeLink={(href) => {
          markPracticed(lesson.id, href);
          router.push(href as never);
        }}
        onQuizComplete={(score) => recordQuizScore(lesson.id, score)}
        onQuizAnswer={({ correct, conceptId }) => {
          if (conceptId) recordConceptResult(conceptId, correct);
        }}
        onExerciseComplete={({ correct, conceptId }) => {
          recordExerciseAttempt(lesson.id, correct);
          if (conceptId && typeof correct === 'boolean') {
            recordConceptResult(conceptId, correct);
          }
        }}
      />

      {(() => {
        const chain = nextAfterLesson(lesson.id);
        return chain ? <LessonNextSteps chain={chain} /> : null;
      })()}

      <View className="mt-4 gap-3">
        <EducationalPanel
          variant="practice"
          title="Practice recommendation"
          body={framing.practiceRecommendation}
        />
        <EducationalPanel
          variant="tip"
          title="Apply in simulation"
          body={framing.simulationRecommendation}
          learnMoreHref="/simulate"
        />
        <EducationalPanel
          variant="tip"
          title="Suggested Replay"
          body={framing.suggestedReplay}
          learnMoreHref="/decision/decision-replay"
        />
        <EducationalPanel
          variant="why"
          title="Suggested Decision Lab exercise"
          body={framing.suggestedLabExercise}
          learnMoreHref="/decision/lab"
        />
      </View>

      <Button
        className="mt-8"
        variant={isRead ? 'secondary' : 'primary'}
        onPress={() => markCompleted(lesson.id)}
      >
        {isRead ? 'Marked as read' : 'Mark as read'}
      </Button>
      {!isPracticed && lesson.practiceLinks.length > 0 ? (
        <Text variant="caption" className="mt-2 text-center text-text-tertiary">
          Open Practice or Simulation in Apply to earn Practiced — reading is never blocked.
        </Text>
      ) : null}
    </Screen>
  );
}
