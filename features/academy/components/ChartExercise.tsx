import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { getMinTouchTargetSize } from '@/shared/utils/accessibility';
import { cn } from '@/shared/utils/cn';

import { nextRetryExercise } from '../content/chart-exercise-retry';
import type { EducationalChartExercise, EducationalChartKind } from '../types/educational-chart.types';

export interface ChartExerciseAttempt {
  correct: boolean;
  selectedIndex: number;
  prompt: string;
  attempt: number;
  retry: boolean;
}

interface ChartExerciseProps {
  exercise: EducationalChartExercise;
  kind?: EducationalChartKind;
  retryBank?: EducationalChartExercise[];
  onAttempt?: (result: ChartExerciseAttempt) => void;
}

function choiceStateLabel(input: {
  revealed: boolean;
  isSelected: boolean;
  isCorrect: boolean;
}): string | null {
  if (!input.revealed) return input.isSelected ? 'Selected' : null;
  if (input.isCorrect) return 'Correct';
  if (input.isSelected) return 'Not this one';
  return null;
}

export function ChartExercise({ exercise, kind, retryBank, onAttempt }: ChartExerciseProps) {
  const [current, setCurrent] = useState(exercise);
  const [selected, setSelected] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [seenPrompts, setSeenPrompts] = useState<string[]>([exercise.prompt]);
  const revealed = selected != null;
  const missed = revealed && selected !== current.correctIndex;
  const retryCandidate =
    missed && kind
      ? retryBank?.find((item) => item.prompt !== current.prompt && !seenPrompts.includes(item.prompt)) ??
        nextRetryExercise(kind, current, seenPrompts)
      : missed && retryBank
        ? retryBank.find((item) => item.prompt !== current.prompt)
        : null;

  const choose = useCallback(
    (index: number) => {
      if (selected != null) return;
      setSelected(index);
      const correct = index === current.correctIndex;
      onAttempt?.({
        correct,
        selectedIndex: index,
        prompt: current.prompt,
        attempt: attempt + 1,
        retry: attempt > 0,
      });
      setAttempt((value) => value + 1);
    },
    [attempt, current.correctIndex, current.prompt, onAttempt, selected],
  );

  const retryDifferent = useCallback(() => {
    if (!retryCandidate) return;
    setSeenPrompts((prev) => [...prev, retryCandidate.prompt]);
    setCurrent(retryCandidate);
    setSelected(null);
  }, [retryCandidate]);

  return (
    <View className="border-t border-border px-3 py-3" testID="chart-exercise">
      <Text variant="label">Chart exercise</Text>
      <Text variant="body-sm" className="mt-1 text-text-secondary" testID="chart-exercise-prompt">
        {current.prompt}
      </Text>
      <View className="mt-2 gap-2">
        {current.choices.map((choice, index) => {
          const isSelected = selected === index;
          const isCorrect = index === current.correctIndex;
          const showState = revealed && (isSelected || isCorrect);
          const stateLabel = choiceStateLabel({ revealed, isSelected, isCorrect });
          return (
            <Pressable
              key={`${current.prompt}-${choice}`}
              accessibilityRole="button"
              accessibilityLabel={stateLabel ? `${choice}. ${stateLabel}` : choice}
              accessibilityState={{ selected: isSelected, disabled: revealed }}
              onPress={() => choose(index)}
              disabled={revealed}
              className={cn(
                'min-h-11 rounded-xl border border-border bg-surface px-3 py-2.5',
                showState && isCorrect && 'border-bullish bg-bullish-muted',
                showState && isSelected && !isCorrect && 'border-bearish bg-bearish-muted',
              )}
              style={{ minHeight: getMinTouchTargetSize() }}
              testID={`chart-exercise-choice-${index}`}
            >
              <Text variant="body-sm">{choice}</Text>
              {stateLabel ? (
                <Text variant="caption" className="mt-1 text-text-tertiary" testID={`chart-exercise-state-${index}`}>
                  {stateLabel}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {revealed ? (
        <Text variant="caption" className="mt-2 leading-5 text-text-secondary">
          {current.explanation}
        </Text>
      ) : null}
      {retryCandidate ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try a different example"
          onPress={retryDifferent}
          className="mt-3 min-h-11 items-center justify-center rounded-xl border border-border px-3"
          style={{ minHeight: getMinTouchTargetSize() }}
          testID="chart-exercise-retry"
        >
          <Text variant="label">Try a different example</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
