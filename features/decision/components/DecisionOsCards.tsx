import { View } from 'react-native';

import type {
  DecisionDebtSnapshot,
  DecisionFatigueInsight,
} from '@/features/decision/types/decision.types';
import { Text } from '@/shared/components/ui/Text';

export function DecisionFatigueCard({ fatigue }: { fatigue: DecisionFatigueInsight }) {
  return (
    <View
      className={
        fatigue.shouldStop
          ? 'rounded-2xl bg-warning-muted p-4'
          : 'rounded-2xl bg-background-elevated p-4'
      }
    >
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        DECISION FATIGUE
      </Text>
      <Text variant="h3" className="mb-1">
        {fatigue.shouldStop ? 'Stop researching' : 'Research load'}
      </Text>
      <Text variant="body-sm" className="text-text-secondary">
        {fatigue.message}
      </Text>
      <Text variant="caption" className="mt-2 text-text-tertiary">
        Reviewed {fatigue.reviewedToday}/{fatigue.softCap} soft cap today
      </Text>
    </View>
  );
}

export function DecisionDebtCard({ debt }: { debt: DecisionDebtSnapshot }) {
  if (debt.score === 0 && debt.items.length === 0) {
    return (
      <View className="rounded-2xl bg-background-elevated p-4">
        <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
          DECISION DEBT
        </Text>
        <Text variant="h3" className="mb-1 text-bullish">
          Desk clear
        </Text>
        <Text variant="body-sm" className="text-text-secondary">
          {debt.encouragement}
        </Text>
      </View>
    );
  }

  return (
    <View className="rounded-2xl bg-background-elevated p-4">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        DECISION DEBT · {debt.score}/100
      </Text>
      <Text variant="h3" className="mb-2">
        Finish before hunting
      </Text>
      {debt.items.slice(0, 4).map((item) => (
        <Text key={item.id} variant="caption" className="mb-1 text-text-secondary">
          • {item.label}
        </Text>
      ))}
      <Text variant="caption" className="mt-2 text-accent">
        {debt.encouragement}
      </Text>
    </View>
  );
}
