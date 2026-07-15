import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

import { LessonCard } from '@/features/academy/components/LessonCard';
import { TradingChecklist } from '@/features/academy/components/TradingChecklist';
import { useAcademy } from '@/features/academy/hooks/useAcademy';
import { EmbeddedAiInsight } from '@/features/decision/components/EmbeddedAiInsight';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

export default function AcademyScreen() {
  const router = useRouter();
  const { lessons, isLoading } = useAcademy();

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" color="#00D4AA" />
      </Screen>
    );
  }

  return (
    <Screen scrollable contentClassName="pb-8">
      <Header title="Trading Academy" onBack={() => router.back()} />

      <View className="mt-4 gap-4">
        <EmbeddedAiInsight
          title="Train the decision muscle"
          body="Practice regime recognition and invalidation first. Pair lessons with Chart Replay so theory sticks under live structure."
          onExplain={() => router.push('/decision/replay' as never)}
        />

        <GlassCard className="p-4">
          <Text variant="h3">Widgets & desk tools</Text>
          <Text variant="body-sm" className="mt-2">
            Expo Go cannot install native home-screen widgets. Use Decision Brief + Setup Radar as
            your always-on desk view; pin key symbols in Markets watchlists.
          </Text>
          <Button
            size="sm"
            className="mt-3"
            variant="outline"
            onPress={() => router.push('/' as never)}
          >
            Open Decision Brief
          </Button>
        </GlassCard>

        <TradingChecklist />

        <View>
          <Text variant="h3" className="mb-2">
            Lessons
          </Text>
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </View>
      </View>
    </Screen>
  );
}
