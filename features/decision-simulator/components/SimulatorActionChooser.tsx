import { Pressable, View } from 'react-native';

import type { SimulatorAction } from '@/features/decision-simulator/types/simulator.types';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

const ACTIONS: {
  id: SimulatorAction;
  label: string;
  detail: string;
}[] = [
  {
    id: 'research',
    label: 'Research',
    detail: 'This deserves a focused research block',
  },
  {
    id: 'wait',
    label: 'Wait',
    detail: 'Evidence is incomplete — patience is the decision',
  },
  {
    id: 'ignore',
    label: 'Ignore',
    detail: 'Opportunity cost — protect attention',
  },
  {
    id: 'create_thesis',
    label: 'Create Thesis',
    detail: 'Structure the idea before any commitment',
  },
];

interface SimulatorActionChooserProps {
  disabled?: boolean;
  onChoose: (action: SimulatorAction) => void;
}

export function SimulatorActionChooser({ disabled, onChoose }: SimulatorActionChooserProps) {
  return (
    <View className="gap-2" testID="simulator-action-chooser">
      <Text variant="caption" className="mb-1 font-semibold uppercase tracking-wide text-text-tertiary">
        Your decision
      </Text>
      {ACTIONS.map((action) => (
        <Pressable
          key={action.id}
          accessibilityRole="button"
          accessibilityLabel={`${action.label}. ${action.detail}`}
          disabled={disabled}
          testID={`simulator-action-${action.id}`}
          onPress={() => onChoose(action.id)}
          className={cn(
            'min-h-14 rounded-2xl border border-border bg-background-elevated px-4 py-3 active:opacity-90',
            disabled && 'opacity-50',
          )}
        >
          <Text variant="label" className="text-text-primary">
            {action.label}
          </Text>
          <Text variant="caption" className="mt-0.5 text-text-secondary">
            {action.detail}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
