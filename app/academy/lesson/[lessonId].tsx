import { useEffect } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { getLocalLessonById } from '@/features/academy/content';
import { LessonQuiz } from '@/features/academy/components/LessonQuiz';
import { LessonSections } from '@/features/academy/components/LessonSections';
import { useLesson } from '@/features/academy/hooks/useAcademy';
import { CATEGORY_LABELS } from '@/features/academy/types/academy.types';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';
import { useTheme } from '@/shared/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

function withLessonQuery(href: string, lessonId: string): string {
  const join = href.includes('?') ? '&' : '?';
  return `${href}${join}fromLesson=${encodeURIComponent(lessonId)}`;
}

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
  } = useLesson(lessonId ?? '');

  useEffect(() => {
    if (lesson?.id) markOpened(lesson.id);
  }, [lesson?.id, markOpened]);

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </Screen>
    );
  }

  if (!lesson) {
    return (
      <Screen>
        <Header title="Lesson" onBack={() => router.back()} />
        <Text variant="body" className="mt-6">
          Lesson not found.
        </Text>
      </Screen>
    );
  }

  const locked = lesson.isPremium && !isPremiumUser;

  if (locked) {
    return (
      <Screen scrollable>
        <Header title={lesson.title} onBack={() => router.back()} />
        <View className="mt-8 items-center px-4">
          <Ionicons name="lock-closed-outline" size={40} color={colors.accent.primary} />
          <Text variant="h3" className="mt-4 text-center">
            Premium lesson
          </Text>
          <Text variant="body-sm" className="mt-2 text-center">
            Foundations stay free. Advanced modules unlock with Premium.
          </Text>
          <Button className="mt-6" onPress={() => router.push('/subscription' as never)}>
            Go Premium
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
      />

      <View className="mt-3 flex-row flex-wrap gap-2">
        <Badge
          label={lesson.difficulty}
          variant={
            lesson.difficulty === 'beginner'
              ? 'success'
              : lesson.difficulty === 'intermediate'
                ? 'warning'
                : 'danger'
          }
          size="sm"
        />
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

      <Text variant="body-sm" className="mt-3">
        {lesson.description}
      </Text>

      <View className="mt-6">
        <LessonSections sections={lesson.sections} />
      </View>

      {lesson.keyTakeaways.length > 0 ? (
        <View className="mt-6 rounded-2xl bg-background-elevated p-4">
          <Text variant="h3" className="mb-2">
            Key takeaways
          </Text>
          {lesson.keyTakeaways.map((item) => (
            <View key={item} className="mb-2 flex-row gap-2">
              <Text variant="body" className="text-accent">
                •
              </Text>
              <Text variant="body-sm" className="flex-1 text-text-primary">
                {item}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {lesson.practiceLinks.length > 0 ? (
        <View className="mt-6">
          <Text variant="h3" className="mb-1">
            Practice gate
          </Text>
          <Text variant="caption" className="mb-2 text-text-secondary">
            Soft-mandatory: you can mark read without this — practiced status unlocks mastery
            surfacing.
          </Text>
          {lesson.practiceLinks.map((link) => (
            <Pressable
              key={link.href + link.label}
              onPress={() => {
                markPracticed(lesson.id, link.href);
                router.push(withLessonQuery(link.href, lesson.id) as never);
              }}
              className="mb-2 flex-row items-center rounded-2xl bg-surface px-4 py-3 active:opacity-80"
            >
              <View className="flex-1">
                <Text variant="body" className="font-semibold">
                  {link.label}
                </Text>
                {link.description ? (
                  <Text variant="caption" className="mt-0.5">
                    {link.description}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="arrow-forward" size={16} color={colors.accent.primary} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {lesson.quiz.length > 0 ? (
        <View className="mt-6">
          <LessonQuiz
            questions={lesson.quiz}
            bestScore={progress?.quizBestScore}
            onComplete={(score) => recordQuizScore(lesson.id, score)}
          />
        </View>
      ) : null}

      {lesson.relatedLessonIds.length > 0 ? (
        <View className="mt-6">
          <Text variant="h3" className="mb-2">
            Related lessons
          </Text>
          {lesson.relatedLessonIds.map((id) => {
            const related = getLocalLessonById(id);
            return (
              <Pressable
                key={id}
                onPress={() => router.push(`/academy/lesson/${id}` as never)}
                className="mb-2 rounded-xl bg-surface px-3 py-2.5 active:opacity-80"
              >
                <Text variant="body-sm" className="text-accent">
                  {related?.title ?? id}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Button
        className="mt-8"
        variant={isRead ? 'secondary' : 'primary'}
        onPress={() => markCompleted(lesson.id)}
      >
        {isRead ? 'Marked as read' : 'Mark as read'}
      </Button>
      {!isPracticed && lesson.practiceLinks.length > 0 ? (
        <Text variant="caption" className="mt-2 text-center text-text-tertiary">
          Tip: open a practice gate above to earn Practiced — never blocked from reading.
        </Text>
      ) : null}
    </Screen>
  );
}
