import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { mapMistakeToLesson } from '@/features/academy/services/curriculum.service';
import type {
  LearningInsight,
  WeeklyGameTape,
} from '@/features/decision-replay/services/decision-replay.service';
import { Text } from '@/shared/components/ui/Text';

export function LearningInsightsCard({ insights }: { insights: LearningInsight[] }) {
  const router = useRouter();
  if (!insights.length) return null;

  return (
    <View className="rounded-2xl bg-background-elevated p-4">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        LEARNING INSIGHTS
      </Text>
      <Text variant="h3" className="mb-3">
        Evidence-backed patterns
      </Text>
      {insights.map((insight) => {
        const mapped = mapMistakeToLesson(
          `${insight.statement} ${insight.evidence.join(' ')}`,
        );
        return (
          <View
            key={insight.id}
            className="mb-3 border-b border-border pb-3 last:mb-0 last:border-0 last:pb-0"
          >
            <Text variant="label" className="mb-1 text-text-primary">
              {insight.statement}
            </Text>
            {insight.evidence.map((e) => (
              <Text key={e} variant="caption" className="mb-0.5 text-text-tertiary">
                · {e}
              </Text>
            ))}
            {mapped ? (
              <Pressable
                onPress={() =>
                  router.push(`/academy/lesson/${mapped.lesson.id}` as never)
                }
                className="mt-2 rounded-xl bg-accent-muted/40 px-3 py-2"
              >
                <Text variant="caption" className="font-semibold text-accent">
                  Revisit Academy: {mapped.lesson.title}
                </Text>
                <Text variant="caption" className="mt-0.5 text-text-secondary">
                  {mapped.reason}
                </Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function WeeklyGameTapeCard({ tape }: { tape: WeeklyGameTape }) {
  const router = useRouter();
  const mapped = mapMistakeToLesson(
    `${tape.mostRepeatedMistake} ${tape.lessonForNextWeek} ${tape.worstDecision}`,
  );

  const rows: { label: string; value: string }[] = [
    { label: 'Best decision', value: tape.bestDecision },
    { label: 'Worst decision', value: tape.worstDecision },
    { label: 'Most disciplined', value: tape.mostDisciplined },
    { label: 'Most emotional', value: tape.mostEmotional },
    { label: 'Most improved habit', value: tape.mostImprovedHabit },
    { label: 'Most repeated mistake', value: tape.mostRepeatedMistake },
  ];

  return (
    <View className="rounded-2xl bg-background-elevated p-4">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        WEEKLY GAME TAPE
      </Text>
      <Text variant="h3" className="mb-1">
        Sunday review
      </Text>
      <Text variant="caption" className="mb-3 text-text-secondary">
        Process score {tape.processScore} · celebrate discipline, not P&L
      </Text>
      {rows.map((row) => (
        <View key={row.label} className="mb-2.5">
          <Text variant="caption" className="mb-0.5 font-semibold text-text-tertiary">
            {row.label}
          </Text>
          <Text variant="body-sm" className="text-text-primary">
            {row.value}
          </Text>
        </View>
      ))}
      <View className="mt-2 rounded-xl bg-accent-muted/40 px-3 py-2.5">
        <Text variant="caption" className="mb-0.5 font-semibold text-accent">
          One lesson for next week
        </Text>
        <Text variant="body-sm" className="text-text-primary">
          {tape.lessonForNextWeek}
        </Text>
      </View>
      {mapped ? (
        <Pressable
          onPress={() => router.push(`/academy/lesson/${mapped.lesson.id}` as never)}
          className="mt-3"
        >
          <Text variant="caption" className="font-semibold text-accent">
            Open mapped Academy lesson: {mapped.lesson.title} →
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
