import { forwardRef } from 'react';
import { View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';

interface ActivationStepHeaderProps {
  step: number;
  isDemo: boolean;
}

export const ActivationStepHeader = forwardRef<View, ActivationStepHeaderProps>(
  function ActivationStepHeader({ step, isDemo }, ref) {
    return (
      <View
        ref={ref}
        accessible
        accessibilityRole="header"
        className="mt-2"
        testID={`activation-step-${step}`}
      >
        <Text variant="h1">{activationStepTitle(step, isDemo)}</Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          {activationStepSubtitle(step, isDemo)}
        </Text>
      </View>
    );
  },
);

export function activationStepTitle(step: number, isDemo: boolean): string {
  if (step === 0) return 'Make the coach yours';
  if (step === 1) return isDemo ? 'See a coherent demo brief' : 'Your first decision brief';
  return 'Make one attention decision';
}

export function activationStepSubtitle(step: number, isDemo: boolean): string {
  if (step === 0) return 'Choose a realistic time budget, coaching goal, and focused universe.';
  if (step === 1) {
    return isDemo
      ? 'This uses the seeded demo universe and its real decision-brief pipeline.'
      : 'Generated from your selected universe and research budget.';
  }
  return 'Research or skip is a process outcome—not a buy or sell signal.';
}
