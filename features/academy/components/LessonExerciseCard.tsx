import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

import { EducationalChart } from './EducationalChart';
import type { LessonExercise } from '../types/academy.types';

interface LessonExerciseCardProps {
  exercise: LessonExercise;
  onComplete: (result: { correct?: boolean; evidence?: string }) => void;
}

export function LessonExerciseCard({ exercise, onComplete }: LessonExerciseCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [rankPicks, setRankPicks] = useState<number[]>([]);
  const [numeric, setNumeric] = useState('');
  const [written, setWritten] = useState('');
  const [evidence, setEvidence] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState<boolean | undefined>(undefined);

  const choices = exercise.choices ?? [];
  const items = exercise.items ?? [];

  const reveal = (isCorrect: boolean | undefined) => {
    if (revealed) return;
    setCorrect(isCorrect);
    setRevealed(true);
    onComplete({
      correct: isCorrect,
      evidence: evidence.trim() || undefined,
    });
  };

  const submitChoice = () => {
    if (selected == null || exercise.correctIndex == null) return;
    reveal(selected === exercise.correctIndex);
  };

  const submitRank = () => {
    if (!exercise.correctOrder || rankPicks.length !== exercise.correctOrder.length) return;
    reveal(rankPicks.every((value, index) => value === exercise.correctOrder![index]));
  };

  const submitCalculate = () => {
    const value = Number(numeric);
    if (!Number.isFinite(value) || exercise.expectedValue == null) return;
    const tolerance = exercise.tolerance ?? 0.01;
    reveal(Math.abs(value - exercise.expectedValue) <= tolerance);
  };

  const submitExplain = () => {
    const min = exercise.minChars ?? 16;
    if (written.trim().length < min) return;
    reveal(undefined);
  };

  return (
    <View className="rounded-2xl bg-background-elevated p-4" testID={`lesson-exercise-${exercise.id}`}>
      <Text variant="label" className="text-text-tertiary">
        {exercise.kind === 'scenario' ? 'Scenario' : 'Interactive exercise'} · {exercise.kind}
      </Text>
      {exercise.situation ? (
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          {exercise.situation}
        </Text>
      ) : null}
      <Text variant="h3" className="mt-2">
        {exercise.prompt}
      </Text>
      {exercise.chart ? (
        <View className="mt-3">
          <EducationalChart spec={exercise.chart} />
        </View>
      ) : null}

      {exercise.kind === 'compare' ? (
        <View className="mt-3 gap-2">
          {[exercise.leftLabel, exercise.rightLabel].map((label, index) =>
            label ? (
              <Pressable
                key={label}
                disabled={revealed}
                onPress={() => setSelected(index)}
                className={cn(
                  'min-h-11 rounded-xl px-3 py-3',
                  selected === index ? 'bg-accent-muted' : 'bg-surface',
                )}
              >
                <Text variant="body-sm">{label}</Text>
              </Pressable>
            ) : null,
          )}
        </View>
      ) : null}

      {(exercise.kind === 'select' ||
        exercise.kind === 'identify' ||
        exercise.kind === 'choose' ||
        exercise.kind === 'scenario' ||
        exercise.kind === 'annotate') &&
      choices.length > 0 ? (
        <View className="mt-3 gap-2">
          {choices.map((choice, index) => (
            <Pressable
              key={choice}
              disabled={revealed}
              onPress={() => setSelected(index)}
              className={cn(
                'min-h-11 rounded-xl px-3 py-3',
                revealed && index === exercise.correctIndex && 'bg-background-secondary',
                !revealed && selected === index && 'bg-accent-muted',
                !revealed && selected !== index && 'bg-surface',
                revealed && selected === index && index !== exercise.correctIndex && 'bg-surface',
              )}
            >
              <Text variant="body-sm">{choice}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {exercise.kind === 'rank' && items.length > 0 ? (
        <View className="mt-3 gap-2">
          <Text variant="caption" className="text-text-secondary">
            Tap in order, strongest process first.
          </Text>
          {items.map((item, index) => {
            const order = rankPicks.indexOf(index);
            return (
              <Pressable
                key={item}
                disabled={revealed}
                onPress={() => {
                  if (rankPicks.includes(index)) {
                    setRankPicks(rankPicks.filter((value) => value !== index));
                    return;
                  }
                  setRankPicks([...rankPicks, index]);
                }}
                className={cn('min-h-11 rounded-xl px-3 py-3', order >= 0 ? 'bg-accent-muted' : 'bg-surface')}
              >
                <Text variant="body-sm">
                  {order >= 0 ? `${order + 1}. ` : ''}
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {exercise.kind === 'calculate' ? (
        <Input
          containerClassName="mt-3"
          label={exercise.unit ? `Your answer (${exercise.unit})` : 'Your answer'}
          keyboardType="decimal-pad"
          value={numeric}
          onChangeText={setNumeric}
          editable={!revealed}
        />
      ) : null}

      {exercise.kind === 'explain' ? (
        <Input
          containerClassName="mt-3"
          label="Your reasoning"
          value={written}
          onChangeText={setWritten}
          multiline
          editable={!revealed}
        />
      ) : null}

      {exercise.askEvidence && !revealed ? (
        <Input
          containerClassName="mt-3"
          label="What evidence led you to this answer?"
          value={evidence}
          onChangeText={setEvidence}
          multiline
        />
      ) : null}

      {!revealed ? (
        <Button
          className="mt-4"
          onPress={() => {
            if (exercise.kind === 'rank') return submitRank();
            if (exercise.kind === 'calculate') return submitCalculate();
            if (exercise.kind === 'explain') return submitExplain();
            return submitChoice();
          }}
        >
          Check
        </Button>
      ) : (
        <View className="mt-4">
          {correct != null ? (
            <Text variant="label">{correct ? 'That matches the teaching point.' : 'Not quite — read why.'}</Text>
          ) : (
            <Text variant="label">Saved. Compare with the model answer.</Text>
          )}
          {selected != null && exercise.choiceExplanations?.[selected] ? (
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {exercise.choiceExplanations[selected]}
            </Text>
          ) : null}
          {correct === false &&
          exercise.correctIndex != null &&
          exercise.choiceExplanations?.[exercise.correctIndex] ? (
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Stronger reading: {exercise.choiceExplanations[exercise.correctIndex]}
            </Text>
          ) : null}
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            {exercise.explanation}
          </Text>
          {exercise.modelAnswer ? (
            <Text variant="caption" className="mt-2 text-text-tertiary">
              Model answer: {exercise.modelAnswer}
            </Text>
          ) : null}
          {evidence.trim() ? (
            <Text variant="caption" className="mt-2 text-text-tertiary">
              Your evidence: {evidence.trim()}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}
