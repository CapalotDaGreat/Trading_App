import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { CurriculumRecommendation } from '@/features/academy/services/curriculum.service';
import { Text } from '@/shared/components/ui/Text';

interface NextLessonCardProps {
  recommendation: CurriculumRecommendation;
  /** When true, show Premium upsell chrome for personalized engine. */
  showPremiumBadge?: boolean;
}

export function NextLessonCard({ recommendation, showPremiumBadge }: NextLessonCardProps) {
  const router = useRouter();
  const { lesson, reason, evidence, isPersonalized } = recommendation;

  return (
    <Pressable
      onPress={() => router.push(`/academy/lesson/${lesson.id}` as never)}
      className="rounded-2xl bg-background-elevated p-4 active:opacity-80"
    >
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        {isPersonalized && showPremiumBadge ? 'YOUR NEXT LESSON · PERSONALIZED' : 'YOUR NEXT LESSON'}
      </Text>
      <Text variant="h3" className="mb-1">
        {lesson.title}
      </Text>
      <Text variant="body-sm" className="mb-2 text-text-secondary">
        {reason}
      </Text>
      {evidence.slice(0, 2).map((e) => (
        <Text key={e} variant="caption" className="mb-0.5 text-text-tertiary">
          · {e}
        </Text>
      ))}
      <Text variant="caption" className="mt-2 font-semibold text-accent">
        Open lesson →
      </Text>
    </Pressable>
  );
}

export function AcademyDisciplineCard({
  days,
  today,
}: {
  days: number;
  today: { brief: boolean; lesson: boolean; journal: boolean };
}) {
  const checks = [
    { key: 'brief', label: 'Today brief', done: today.brief },
    { key: 'lesson', label: 'Academy lesson', done: today.lesson },
    { key: 'journal', label: 'Journal', done: today.journal },
  ] as const;

  return (
    <View className="rounded-2xl bg-background-elevated p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text variant="caption" className="font-semibold text-text-tertiary">
          DISCIPLINE LOOP
        </Text>
        <Text variant="caption" className="text-accent">
          {days}d streak
        </Text>
      </View>
      <Text variant="body-sm" className="mb-3 text-text-secondary">
        Brief + one lesson + journal — no profit badges, no leaderboards.
      </Text>
      {checks.map((c) => (
        <Text
          key={c.key}
          variant="caption"
          className={c.done ? 'mb-1 text-bullish' : 'mb-1 text-text-secondary'}
        >
          {c.done ? '✓' : '○'} {c.label}
        </Text>
      ))}
    </View>
  );
}
