import { Pressable, View } from 'react-native';

import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import type { Lesson } from '../services/academy.service';

interface LessonCardProps {
  lesson: Lesson;
  onPress?: (lesson: Lesson) => void;
}

const difficultyVariant: Record<Lesson['difficulty'], 'success' | 'warning' | 'danger'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
};

export function LessonCard({ lesson, onPress }: LessonCardProps) {
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const isLocked = lesson.isPremium && !isPremium;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isLocked}
      onPress={() => onPress?.(lesson)}
    >
      <GlassCard className={isLocked ? 'mb-2 p-3 opacity-60' : 'mb-2 p-3'}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <View className="mb-1 flex-row flex-wrap items-center gap-2">
              <Badge label={lesson.difficulty} variant={difficultyVariant[lesson.difficulty]} size="sm" />
              <Badge label={lesson.category.replace('_', ' ')} variant="outline" size="sm" />
              {lesson.isPremium ? <Badge label="Premium" variant="accent" size="sm" /> : null}
            </View>
            <Text variant="h3" numberOfLines={2}>
              {isLocked ? '🔒 ' : ''}{lesson.title}
            </Text>
            <Text variant="body-sm" numberOfLines={2} className="mt-1">
              {lesson.description}
            </Text>
          </View>
          <Text variant="caption" className="text-text-tertiary">
            {lesson.durationMinutes} min
          </Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}
