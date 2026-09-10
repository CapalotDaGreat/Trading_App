import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import type { SimulationDebrief } from '../services/scenario-debrief.service';

function tone(score: number): string {
  if (score >= 70) return 'Strong';
  if (score >= 45) return 'Moderate';
  return 'Needs work';
}

interface SimulationDebriefPanelProps {
  debrief: SimulationDebrief;
}

export function SimulationDebriefPanel({ debrief }: SimulationDebriefPanelProps) {
  const router = useRouter();
  const { financial, process, timeline, followup, reminder } = debrief;

  return (
    <Surface className="mb-4" testID="simulate-debrief">
      <Text variant="label">Simulation debrief</Text>
      <Text variant="caption" className="mt-2 text-text-tertiary">
        {reminder}
      </Text>

      <View className="mt-3 gap-1">
        <Text variant="body-sm">
          Return: {financial.totalReturnPct >= 0 ? '+' : ''}
          {financial.totalReturnPct.toFixed(1)}% · Max drawdown: {financial.maxDrawdownPct.toFixed(1)}%
        </Text>
        <Text variant="body-sm">
          Risk discipline: {tone(process.risk)} · Thesis consistency: {tone(process.thesis)}
        </Text>
        <Text variant="body-sm">
          Position sizing: {tone(process.positionSizing)} · Adaptation: {tone(process.adaptation)}
        </Text>
        <Text variant="body-sm">
          Invalidation: {tone(process.invalidation)} · Evidence: {tone(process.evidence)}
        </Text>
        <Text variant="body-sm">
          Uncertainty: {tone(process.uncertainty)} · Reflection: {tone(process.reflection)}
        </Text>
        <Text variant="body-sm">
          Information response: {tone(process.informationResponse)} · Behavioral patterns: {tone(process.behavioral)}
        </Text>
        <Text variant="caption" className="mt-1 text-text-tertiary">
          Process composite {process.composite}. Simulated P/L is context, not the grade.
        </Text>
      </View>

      {timeline.length ? (
        <View className="mt-4 gap-3">
          <Text variant="label">What you knew vs what happened</Text>
          {timeline.slice(0, 6).map((entry) => (
            <View key={entry.day} className="rounded-xl bg-background px-3 py-2">
              <Text variant="caption" className="text-text-tertiary">
                Day {entry.day}
              </Text>
              <Text variant="body-sm" className="mt-1 text-text-secondary">
                Knew: {entry.knew[0]}
              </Text>
              {entry.decided ? (
                <Text variant="body-sm" className="mt-1">
                  Decided: {entry.decided}
                </Text>
              ) : null}
              <Text variant="body-sm" className="mt-1">
                Then: {entry.happened}
              </Text>
              {entry.riskNote ? (
                <Text variant="caption" className="mt-1 text-text-tertiary">
                  {entry.riskNote}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <View className="mt-4">
        <Text variant="label">Relevant concepts</Text>
        {followup.concepts.map((concept) => (
          <Text key={concept} variant="body-sm" className="mt-1 text-text-secondary">
            · {concept}
          </Text>
        ))}
        <Text variant="caption" className="mt-2 text-text-tertiary">
          {followup.nextFocusLabel}
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Button size="sm" onPress={() => router.push(followup.lessonHref as never)}>
            Lesson
          </Button>
          <Button size="sm" variant="outline" onPress={() => router.push(followup.drillHref as never)}>
            Exercise
          </Button>
          <Button size="sm" variant="ghost" onPress={() => router.push(followup.replayHref as never)}>
            Historical replay
          </Button>
        </View>
      </View>
    </Surface>
  );
}
