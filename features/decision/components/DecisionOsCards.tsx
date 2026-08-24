import { View } from 'react-native';

import type {
  DecisionDebtSnapshot,
  DecisionFatigueInsight,
} from '@/features/decision/types/decision.types';
import { waitingReviewCount } from '@/features/decision/services/decision-os.service';
import { Text } from '@/shared/components/ui/Text';
import { waitingReviewCopy } from '@/shared/constants/trust-language';

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
        RESEARCH LOAD
      </Text>
      <Text variant="h3" className="mb-1">
        {fatigue.shouldStop ? 'Enough for today' : 'Research load'}
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
  const waiting = waitingReviewCount(debt);

  if (debt.score === 0 && debt.items.length === 0) {
    return (
      <View className="rounded-2xl bg-background-elevated p-4">
        <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
          WAITING FOR REVIEW
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
        WAITING FOR REVIEW
      </Text>
      <Text variant="h3" className="mb-2">
        {waitingReviewCopy(waiting)}
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
