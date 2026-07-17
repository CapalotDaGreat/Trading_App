import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

import type { QuizQuestion } from '../types/academy.types';

interface LessonQuizProps {
  questions: QuizQuestion[];
  onComplete: (scorePercent: number) => void;
  bestScore?: number;
}

export function LessonQuiz({ questions, onComplete, bestScore }: LessonQuizProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[index];
  const progressLabel = `${index + 1} / ${questions.length}`;

  const scorePercent = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round((correctCount / questions.length) * 100);
  }, [correctCount, questions.length]);

  if (!question) return null;

  if (finished) {
    const passed = scorePercent >= 70;
    return (
      <View className="rounded-2xl bg-background-elevated p-4">
        <Text variant="h3">{passed ? 'Quiz passed' : 'Keep practicing'}</Text>
        <Text variant="body-sm" className="mt-2">
          You scored {scorePercent}% ({correctCount}/{questions.length} correct).
          {bestScore != null ? ` Best so far: ${bestScore}%.` : ''}
        </Text>
        <Text variant="caption" className="mt-2">
          {passed
            ? 'Lesson marked complete. Revisit anytime to sharpen the concepts.'
            : 'You need 70% to auto-complete. Review the lesson and retry.'}
        </Text>
        <Button
          className="mt-4"
          variant="secondary"
          onPress={() => {
            setIndex(0);
            setSelected(null);
            setRevealed(false);
            setCorrectCount(0);
            setFinished(false);
          }}
        >
          Retry quiz
        </Button>
      </View>
    );
  }

  const onCheck = () => {
    if (selected == null || revealed) return;
    const isCorrect = selected === question.correctIndex;
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    setCorrectCount(nextCorrect);
    setRevealed(true);
  };

  const onNext = () => {
    if (!revealed) return;
    const isLast = index >= questions.length - 1;
    if (isLast) {
      const finalCorrect =
        correctCount; /* already includes this question via onCheck */
      const percent = Math.round((finalCorrect / questions.length) * 100);
      setFinished(true);
      onComplete(percent);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  };

  return (
    <View className="rounded-2xl bg-background-elevated p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text variant="label">Knowledge check</Text>
        <Text variant="caption">{progressLabel}</Text>
      </View>
      <Text variant="h3" className="mb-3">
        {question.prompt}
      </Text>
      <View className="gap-2">
        {question.choices.map((choice, choiceIndex) => {
          const isSelected = selected === choiceIndex;
          const isCorrectChoice = choiceIndex === question.correctIndex;
          const showCorrect = revealed && isCorrectChoice;
          const showWrong = revealed && isSelected && !isCorrectChoice;

          return (
            <Pressable
              key={choice}
              disabled={revealed}
              onPress={() => setSelected(choiceIndex)}
              className={cn(
                'rounded-xl px-3 py-3 active:opacity-80',
                showCorrect && 'bg-bullish-muted',
                showWrong && 'bg-bearish-muted',
                !revealed && isSelected && 'bg-accent-muted',
                !revealed && !isSelected && 'bg-surface',
                revealed && !showCorrect && !showWrong && 'bg-surface opacity-60',
              )}
            >
              <Text variant="body-sm" className="text-text-primary">
                {choice}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {revealed ? (
        <Text variant="body-sm" className="mt-3 text-text-secondary">
          {question.explanation}
        </Text>
      ) : null}

      <View className="mt-4 flex-row gap-2">
        {!revealed ? (
          <Button className="flex-1" disabled={selected == null} onPress={onCheck}>
            Check answer
          </Button>
        ) : (
          <Button className="flex-1" onPress={onNext}>
            {index >= questions.length - 1 ? 'Finish' : 'Next'}
          </Button>
        )}
      </View>
    </View>
  );
}
