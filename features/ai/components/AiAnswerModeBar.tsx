import { Pressable, ScrollView } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

import { AI_ANSWER_MODES } from '../services/ai-mentor-response.service';
import type { AiAnswerMode } from '../types/ai-trust.types';

interface AiAnswerModeBarProps {
  value: AiAnswerMode;
  onChange: (mode: AiAnswerMode) => void;
  disabled?: boolean;
}

export function AiAnswerModeBar({ value, onChange, disabled = false }: AiAnswerModeBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID="ai-answer-mode-bar"
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {AI_ANSWER_MODES.map((mode) => {
        const selected = mode.value === value;
        return (
          <Pressable
            key={mode.value}
            disabled={disabled}
            onPress={() => onChange(mode.value)}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={`${mode.label} answer mode`}
            className={cn(
              'min-h-11 justify-center rounded-full border px-3',
              selected ? 'border-accent bg-accent-muted' : 'border-border bg-surface-glass',
              disabled && 'opacity-50',
            )}
          >
            <Text variant="caption" className={selected ? 'text-accent' : 'text-text-secondary'}>
              {mode.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
