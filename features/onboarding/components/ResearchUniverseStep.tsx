import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

import { RESEARCH_UNIVERSE_MAX } from '../types/mentor-setup.types';

import { WhyHint } from './WhyHint';

interface ResearchUniverseStepProps {
  symbols: string[];
  onChange: (symbols: string[]) => void;
}

export function ResearchUniverseStep({ symbols, onChange }: ResearchUniverseStepProps) {
  const [query, setQuery] = useState('');
  const remaining = RESEARCH_UNIVERSE_MAX - symbols.length;

  const canAdd = useMemo(() => {
    const normalized = query.trim().toUpperCase();
    return Boolean(normalized) && !symbols.includes(normalized) && symbols.length < RESEARCH_UNIVERSE_MAX;
  }, [query, symbols]);

  const addSymbol = () => {
    const normalized = query.trim().toUpperCase();
    if (!normalized || symbols.includes(normalized) || symbols.length >= RESEARCH_UNIVERSE_MAX) return;
    onChange([...symbols, normalized]);
    setQuery('');
  };

  const toggle = (symbol: string) => {
    if (symbols.includes(symbol)) {
      onChange(symbols.filter((item) => item !== symbol));
      return;
    }
    if (symbols.length >= RESEARCH_UNIVERSE_MAX) return;
    onChange([...symbols, symbol]);
  };

  return (
    <View>
      <Text variant="h2">Choose your starting research universe</Text>
      <Text variant="body-sm" className="mt-2 text-text-secondary">
        We&apos;ve prepared a few assets based on your goals. Edit freely — this becomes the
        foundation for personalisation.
      </Text>
      <WhyHint text="We'll use this to personalise Today, AI Mentor, Replay, Academy, Research Queue, and Alerts." />

      <View className="mt-5 flex-row flex-wrap gap-2">
        {symbols.map((symbol) => (
          <Pressable
            key={symbol}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${symbol}`}
            onPress={() => toggle(symbol)}
            className="rounded-full border border-accent bg-accent-muted px-3 py-2"
          >
            <Text variant="body-sm" className="font-semibold text-accent">
              ✓ {symbol}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mt-5">
        <Input
          label="Search for your own"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="characters"
          placeholder="e.g. AMD"
          onSubmitEditing={addSymbol}
          returnKeyType="done"
        />
        <Pressable
          disabled={!canAdd}
          onPress={addSymbol}
          className={cn(
            'mt-2 min-h-11 items-center justify-center rounded-2xl px-4',
            canAdd ? 'bg-accent' : 'bg-surface',
          )}
        >
          <Text variant="body-sm" className={cn('font-semibold', canAdd ? 'text-text-inverse' : 'text-text-tertiary')}>
            Add symbol {remaining > 0 ? `(${remaining} left)` : '(max reached)'}
          </Text>
        </Pressable>
      </View>

      <Text variant="caption" className="mt-4 text-text-tertiary">
        {symbols.length} of {RESEARCH_UNIVERSE_MAX} selected · tap a chip to remove
      </Text>
    </View>
  );
}
