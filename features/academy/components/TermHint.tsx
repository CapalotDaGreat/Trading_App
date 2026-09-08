import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '@/shared/components/ui/Text';

import type { GlossaryTerm } from '../content/glossary';

interface TermHintProps {
  term: GlossaryTerm;
}

export function TermHint({ term }: TermHintProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${term.term}. ${open ? 'Hide' : 'Show'} short explanation`}
        onPress={() => setOpen((value) => !value)}
        className="min-h-11 justify-center rounded-xl bg-surface px-3 py-2"
      >
        <Text variant="label">{term.term}</Text>
        {open ? (
          <Text variant="body-sm" className="mt-1 leading-5 text-text-secondary">
            {term.short}
          </Text>
        ) : (
          <Text variant="caption" className="mt-0.5 text-text-tertiary">
            Tap for a short explanation
          </Text>
        )}
      </Pressable>
      {open && term.lessonId ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Learn about ${term.term}`}
          onPress={() => router.push(`/academy/lesson/${term.lessonId}` as never)}
          className="mt-1 min-h-11 justify-center px-3"
        >
          <Text variant="label" className="text-accent">
            Learn about {term.term}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
