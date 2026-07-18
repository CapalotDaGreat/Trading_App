import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Badge } from '@/shared/components/ui/Badge';
import { Text } from '@/shared/components/ui/Text';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';
import { useTheme } from '@/shared/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

import { useAcademyProgressStore } from '../stores/academy-progress.store';
import { CATEGORY_LABELS, type Lesson } from '../types/academy.types';

interface LessonCardProps {
  lesson: Lesson;
}

const difficultyVariant: Record<Lesson['difficulty'], 'success' | 'warning' | 'danger'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
};

export function LessonCard({ lesson }: LessonCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const isLocked = lesson.isPremium && !isPremium;
  const read = useAcademyProgressStore((s) => s.isRead(lesson.id));
  const practiced = useAcademyProgressStore((s) => s.isPracticed(lesson.id));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (isLocked) {
          router.push('/subscription' as never);
          return;
        }
        router.push(`/academy/lesson/${lesson.id}` as never);
      }}
      className="mb-2 flex-row items-start rounded-2xl bg-background-elevated p-3.5 active:opacity-80"
    >
      <View className="mr-3 mt-0.5">
        <Ionicons
          name={
            isLocked
              ? 'lock-closed-outline'
              : practiced
                ? 'ribbon-outline'
                : read
                  ? 'checkmark-circle'
                  : 'ellipse-outline'
          }
          size={22}
          color={
            practiced
              ? colors.accent.primary
              : read
                ? colors.bullish.primary
                : isLocked
                  ? colors.text.tertiary
                  : colors.accent.primary
          }
        />
      </View>
      <View className="min-w-0 flex-1 pr-2">
        <View className="mb-1 flex-row flex-wrap items-center gap-1.5">
          <Badge label={lesson.difficulty} variant={difficultyVariant[lesson.difficulty]} size="sm" />
          <Badge label={CATEGORY_LABELS[lesson.category]} variant="outline" size="sm" />
          {lesson.isPremium ? <Badge label="Premium" variant="accent" size="sm" /> : null}
          {lesson.track === 'decision' ? (
            <Badge label="Coach" variant="default" size="sm" />
          ) : null}
          {practiced ? (
            <Badge label="Practiced" variant="accent" size="sm" />
          ) : read ? (
            <Badge label="Read" variant="success" size="sm" />
          ) : null}
        </View>
        <Text variant="h3" numberOfLines={2}>
          {lesson.title}
        </Text>
        <Text variant="body-sm" numberOfLines={2} className="mt-1">
          {lesson.description}
        </Text>
      </View>
      <Text variant="caption" className="text-text-tertiary">
        {lesson.durationMinutes}m
      </Text>
    </Pressable>
  );
}
