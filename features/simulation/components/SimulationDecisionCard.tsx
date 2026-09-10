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
        placeholder="Optional: why this choice (thesis, invalidation, size)"
        value={reasoning}
        onChangeText={setReasoning}
      />
      <View className="mt-3 flex-row flex-wrap gap-2">
        {window.options.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={option === 'reduce' || option === 'wait' ? 'outline' : 'ghost'}
            onPress={() => onAnswer(option, reasoning)}
          >
            {DECISION_OPTION_LABELS[option]}
          </Button>
        ))}
      </View>
    </Surface>
  );
}
