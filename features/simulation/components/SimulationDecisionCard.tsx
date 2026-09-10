import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import { DECISION_OPTION_LABELS, type PublicDecisionWindow, type ScenarioDecisionOption } from '../types/scenario.types';

interface SimulationDecisionCardProps {
  window: PublicDecisionWindow;
  onAnswer: (option: ScenarioDecisionOption, reasoning?: string) => void;
}

export function SimulationDecisionCard({ window, onAnswer }: SimulationDecisionCardProps) {
  const [reasoning, setReasoning] = useState('');
  const [invalidation, setInvalidation] = useState('');
  const [size, setSize] = useState('');
  const [expected, setExpected] = useState('');

  const combinedReason = () => {
    const parts = [
      reasoning.trim(),
      invalidation.trim() ? `Invalidation: ${invalidation.trim()}` : '',
      size.trim() ? `Size: ${size.trim()}` : '',
      expected.trim() ? `Expected: ${expected.trim()}` : '',
    ].filter(Boolean);
    return parts.join('\n') || undefined;
  };

  return (
    <Surface className="mb-4" testID="simulate-decision-window">
      <Text variant="label">Decision window · day {window.day}</Text>
      <Text variant="body-sm" className="mt-2 text-text-secondary">
        {window.prompt}
      </Text>
      <Text variant="caption" className="mt-2 text-text-tertiary">
        The clock pauses here so you decide with what you know now. This is not a signal.
      </Text>
      <Input
        containerClassName="mt-3"
        placeholder="Why this choice (thesis, plan, uncertainty)"
        value={reasoning}
        onChangeText={setReasoning}
      />
      <Input
        containerClassName="mt-2"
        placeholder="Invalidation (optional)"
        value={invalidation}
        onChangeText={setInvalidation}
      />
      <Input
        containerClassName="mt-2"
        placeholder="Size / risk (optional)"
        value={size}
        onChangeText={setSize}
      />
      <Input
        containerClassName="mt-2"
        placeholder="What scenarios are you allowing for? (optional)"
        value={expected}
        onChangeText={setExpected}
      />
      <View className="mt-3 flex-row flex-wrap gap-2">
        {window.options.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={option === 'reduce' || option === 'wait' ? 'outline' : 'ghost'}
            onPress={() => onAnswer(option, combinedReason())}
          >
            {DECISION_OPTION_LABELS[option]}
          </Button>
        ))}
      </View>
    </Surface>
  );
}
