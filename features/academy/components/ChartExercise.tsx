import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

import type { EducationalChartExercise } from '../types/educational-chart.types';

interface ChartExerciseProps {
  exercise: EducationalChartExercise;
  onAttempt?: (result: { correct: boolean; selectedIndex: number }) => void;
}

export function ChartExercise({ exercise, onAttempt }: ChartExerciseProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const revealed = selected != null;

  const choose = useCallback(
    (index: number) => {
      if (selected != null) return;
      setSelected(index);
      onAttempt?.({ correct: index === exercise.correctIndex, selectedIndex: index });
    },
    [exercise.correctIndex, onAttempt, selected],
  );

  return (
    <View className="border-t border-border px-3 py-3" testID="chart-exercise">
      <Text variant="label">Chart exercise</Text>
      <Text variant="body-sm" className="mt-1 text-text-secondary">
        {exercise.prompt}
      </Text>
      <View className="mt-2 gap-2">
        {exercise.choices.map((choice, index) => {
          const isSelected = selected === index;
          const isCorrect = index === exercise.correctIndex;
          const showState = revealed && (isSelected || isCorrect);
          return (
            <Pressable
              key={choice}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => choose(index)}
              className={cn(
                'min-h-11 rounded-xl border border-border bg-surface px-3 py-2.5',
                showState && isCorrect && 'border-bullish bg-bullish-muted',
                showState && isSelected && !isCorrect && 'border-bearish bg-bearish-muted',
              )}
            >
              <Text variant="body-sm">{choice}</Text>
            </Pressable>
          );
        })}
      </View>
      {revealed ? (
        <Text variant="caption" className="mt-2 leading-5 text-text-secondary">
          {exercise.explanation}
        </Text>
      ) : null}
    </View>
  );
}
