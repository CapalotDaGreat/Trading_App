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
          accessibilityRole="button"
          accessibilityLabel={`Ask: ${suggestion}`}
          accessibilityState={{ disabled }}
          className={cn(
            'min-h-11 justify-center rounded-full border border-border bg-surface-glass px-4 py-2',
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

/** Credibility-first prompts — research desk, not signal bot. */
export const DEFAULT_CHAT_PROMPTS = [
  'What supports vs contradicts this idea?',
  'What evidence is missing?',
  'What would invalidate this thesis?',
  'How reliable is this research pack?',
  'Help me write a why-not skip',
];

export const DEFAULT_ANALYSIS_PROMPTS = [
  'Daily research desk summary',
  'Risk process check for NVDA',
  'Explain ascending triangle (educational)',
  'Portfolio concentration risks',
  'Psychology after a process break',
];
