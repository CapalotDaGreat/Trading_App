import { View } from 'react-native';

import { PremiumOsGate } from '@/features/decision/components/PremiumOsGate';
import { Button } from '@/shared/components/ui/Button';
import { Chip } from '@/shared/components/ui/Chip';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import { PROCESS_GOAL_LABELS } from '../services/dna-mentor-summary.service';
import { useDnaGoalsStore } from '../stores/dna-goals.store';
import type { ProcessGoalId } from '../types/personal-intelligence.types';

const ALL_GOALS = Object.keys(PROCESS_GOAL_LABELS) as ProcessGoalId[];

interface DnaProcessGoalsCardProps {
  isPremium: boolean;
}

export function DnaProcessGoalsCard({ isPremium }: DnaProcessGoalsCardProps) {
  const selectedGoals = useDnaGoalsStore((s) => s.selectedGoals);
  const toggleGoal = useDnaGoalsStore((s) => s.toggleGoal);

  const picker = (
    <View className="mt-3 flex-row flex-wrap gap-2">
      {ALL_GOALS.map((goalId) => {
        const selected = selectedGoals.includes(goalId);
        return (
          <Chip
            key={goalId}
            label={PROCESS_GOAL_LABELS[goalId]}
            selected={selected}
            onPress={() => {
              if (!isPremium) return;
              void toggleGoal(goalId);
            }}
          />
        );
      })}
    </View>
  );

  return (
    <Surface testID="dna-process-goals-card">
      <Text variant="label" className="text-accent">
        PROCESS GOALS
      </Text>
      <Text variant="h3" headingLevel={2} className="mt-1">
        Choose one or two process goals
      </Text>
      <Text variant="body-sm" className="mt-2 text-text-secondary">
        Coaching adapts around these goals. Never profitability targets.
      </Text>
      {isPremium ? (
        picker
      ) : (
        <PremiumOsGate feature="tradingDnaInsights">
          <Text variant="body-sm" className="text-text-secondary">
            Free includes suggested goals from your DNA. Premium saves and tracks up to two process
            goals.
          </Text>
          <Button className="mt-3" size="sm" variant="outline" onPress={() => undefined}>
            Suggested from DNA
          </Button>
        </PremiumOsGate>
      )}
      {isPremium && selectedGoals.length ? (
        <Text variant="caption" className="mt-3 text-text-tertiary">
          Tracking: {selectedGoals.map((g) => PROCESS_GOAL_LABELS[g]).join(' · ')}
        </Text>
      ) : null}
    </Surface>
  );
}
