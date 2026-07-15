import { ScrollView, Pressable } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

interface PromptSuggestionsProps {
  suggestions: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  className?: string;
}

export function PromptSuggestions({
  suggestions,
  onSelect,
  disabled = false,
  className,
}: PromptSuggestionsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn('flex-grow-0', className)}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
    >
      {suggestions.map((suggestion) => (
        <Pressable
          key={suggestion}
          disabled={disabled}
          onPress={() => onSelect(suggestion)}
          className={cn(
            'rounded-full border border-border bg-surface-glass px-4 py-2',
            disabled && 'opacity-50',
          )}
        >
          <Text variant="caption" className="text-text-secondary">
            {suggestion}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export const DEFAULT_CHAT_PROMPTS = [
  'What is RSI and how do I use it?',
  'Explain support and resistance',
  'How should I manage risk?',
  'Analyze SPY technicals',
  'What affects market sentiment?',
];

export const DEFAULT_ANALYSIS_PROMPTS = [
  'Daily market summary',
  'Risk analysis for NVDA',
  'Explain ascending triangle pattern',
  'Portfolio diversification tips',
  'Trading psychology after losses',
];
