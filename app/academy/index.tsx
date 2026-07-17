import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { CategoryChips, type CategoryFilter } from '@/features/academy/components/CategoryChips';
import { LessonCard } from '@/features/academy/components/LessonCard';
import { PathCard } from '@/features/academy/components/PathCard';
import { TradingChecklist } from '@/features/academy/components/TradingChecklist';
import {
  useAcademy,
  useAcademyChecklists,
  useLearningPaths,
} from '@/features/academy/hooks/useAcademy';
import { EmbeddedAiInsight } from '@/features/decision/components/EmbeddedAiInsight';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

export default function AcademyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const { lessons, completedCount, totalCount, isLoading } = useAcademy();
  const { paths, isLoading: pathsLoading } = useLearningPaths();
  const { checklists } = useAcademyChecklists();

  const filteredLessons = useMemo(() => {
    if (filter === 'all') return lessons;
    if (filter === 'decision' || filter === 'classic') {
      return lessons.filter((l) => l.track === filter);
    }
    return lessons.filter((l) => l.category === filter);
  }, [filter, lessons]);

  if (isLoading || pathsLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </Screen>
    );
  }

  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Screen scrollable contentClassName="pb-10">
      <Header
        title="Trading Academy"
        subtitle="Decision coaching + trading school"
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-6">
        <View className="rounded-2xl bg-background-elevated p-4">
          <Text variant="label" className="text-text-tertiary">
            YOUR PROGRESS
          </Text>
          <Text variant="h2" className="mt-1">
            {completedCount}/{totalCount} lessons
          </Text>
          <View className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
            <View
              className="h-full rounded-full bg-accent"
              style={{ width: `${progressPct}%` }}
            />
          </View>
          <Text variant="caption" className="mt-2">
            Complete lessons and pass quizzes (70%+) to build durable process skills.
          </Text>
        </View>

        <EmbeddedAiInsight
          title="Train the decision muscle"
          body="Start with Decision Coach Foundations, then reinforce with Chart Replay. Classic lessons deepen mechanics once your filter is sharp."
          onExplain={() => router.push('/decision/replay' as never)}
        />

        <View>
          <Text variant="h3" className="mb-2">
            Learning paths
          </Text>
          <Text variant="body-sm" className="mb-3">
            Guided sequences — decision track first, classic school alongside.
          </Text>
          {paths.map((path) => (
            <PathCard
              key={path.id}
              id={path.id}
              title={path.title}
              description={path.description}
              icon={path.icon}
              track={path.track}
              completedCount={path.completedCount}
              totalCount={path.totalCount}
            />
          ))}
        </View>

        <View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text variant="h3">Desk checklists</Text>
            <Pressable onPress={() => router.push('/academy/checklist/pre-trade-checklist' as never)}>
              <Text variant="caption" className="text-accent">
                Open full
              </Text>
            </Pressable>
          </View>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {checklists.map((list) => (
              <Pressable
                key={list.id}
                onPress={() => router.push(`/academy/checklist/${list.id}` as never)}
                className="flex-row items-center gap-1.5 rounded-full bg-surface px-3 py-1.5"
              >
                <Ionicons name="checkbox-outline" size={14} color={colors.accent.primary} />
                <Text variant="caption" className="text-text-primary">
                  {list.title}
                </Text>
              </Pressable>
            ))}
          </View>
          <TradingChecklist compact />
        </View>

        <View>
          <Text variant="h3" className="mb-2">
            All lessons
          </Text>
          <CategoryChips value={filter} onChange={setFilter} />
          {filteredLessons.length === 0 ? (
            <Text variant="body-sm">No lessons in this filter.</Text>
          ) : (
            filteredLessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)
          )}
        </View>
      </View>
    </Screen>
  );
}
