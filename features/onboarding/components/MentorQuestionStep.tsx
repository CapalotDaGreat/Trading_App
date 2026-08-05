import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

import type { MentorQuestionDefinition } from '../content/mentor-setup.questions';

import { WhyHint } from './WhyHint';

interface MentorQuestionStepProps {
  question: MentorQuestionDefinition;
  selected: Array<string | number>;
  onToggle: (value: string | number) => void;
}

export function MentorQuestionStep({ question, selected, onToggle }: MentorQuestionStepProps) {
  return (
    <View>
      <Text variant="h2" className="text-text-primary">
        {question.title}
      </Text>
      <WhyHint text={question.why} />
      <View className="mt-5 gap-2">
        {question.options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole={question.mode === 'multi' ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: active }}
              onPress={() => onToggle(option.value)}
              className={cn(
                'min-h-14 justify-center rounded-2xl border px-4 py-3',
                active ? 'border-accent bg-accent-muted' : 'border-border bg-background-elevated',
              )}
            >
              <Text
                variant="body"
                className={cn('font-medium', active ? 'text-accent' : 'text-text-primary')}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {question.mode === 'multi' ? (
        <Text variant="caption" className="mt-3 text-text-tertiary">
          Select all that apply
        </Text>
      ) : null}
    </View>
  );
}
