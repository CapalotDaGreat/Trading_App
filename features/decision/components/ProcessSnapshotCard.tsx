import { View } from 'react-native';

import type { DecisionDebtSnapshot } from '@/features/decision/types/decision.types';
import {
  researchConsistencyLabel,
  waitingReviewCount,
} from '@/features/decision/services/decision-os.service';
import { MetricRow } from '@/shared/components/patterns/MetricRow';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { CALM_ATTENTION, TRUST_LANGUAGE, waitingReviewCopy } from '@/shared/constants/trust-language';

interface ProcessSnapshotCardProps {
  processScore?: number | null;
  researched?: number;
  journaled?: number;
  skipped?: number;
  total?: number;
  debt?: DecisionDebtSnapshot | null;
  insight?: string | null;
  debtHidden?: boolean;
  onReview?: () => void;
  onDismiss?: () => void;
  onDefer?: () => void;
}

export function ProcessSnapshotCard({
  processScore,
  researched = 0,
  journaled = 0,
  skipped = 0,
  total = 0,
  debt,
  insight,
  debtHidden = false,
  onReview,
  onDismiss,
  onDefer,
}: ProcessSnapshotCardProps) {
  const consistency = researchConsistencyLabel({ researched, journaled, skipped, total });
  const waiting = debt ? waitingReviewCount(debt) : 0;
  const dqsValue = processScore != null ? String(processScore) : '—';
  const showDebtActions = Boolean(debt && waiting > 0 && !debtHidden && (onReview || onDismiss || onDefer));

  return (
    <Surface padding="md" testID="today-process-insight">
      <Text variant="caption" className="mb-1 font-medium text-text-tertiary">
        Your process
      </Text>
      <Text variant="h3" headingLevel={2} className="mb-2">
        How the desk is holding
      </Text>
      {insight ? (
        <Text variant="body-sm" className="mb-2 leading-6 text-text-secondary">
          {insight}
        </Text>
      ) : null}

      <MetricRow
        label={TRUST_LANGUAGE.dqs.short}
        value={dqsValue}
        detail={TRUST_LANGUAGE.dqs.meaning}
      />
      <MetricRow label="Research consistency" value={consistency.value} detail={consistency.detail} />
      <MetricRow
        label="Waiting for review"
        value={debtHidden ? 'Hidden' : String(waiting)}
        detail={debtHidden ? 'Hidden for this session.' : waitingReviewCopy(waiting)}
      />

      {showDebtActions ? (
        <View className="mt-3 gap-2">
          {debt?.items.slice(0, 3).map((item) => (
            <Text key={item.id} variant="caption" className="leading-5 text-text-tertiary">
              {item.label}
            </Text>
          ))}
          <View className="mt-1 flex-row flex-wrap gap-2">
            {onReview ? (
              <Button size="sm" onPress={onReview} accessibilityLabel="Review waiting items">
                Review
              </Button>
            ) : null}
            {onDefer ? (
              <Button
                size="sm"
                variant="outline"
                onPress={onDefer}
                accessibilityLabel="Defer waiting reviews until later"
              >
                Defer
              </Button>
            ) : null}
            {onDismiss ? (
              <Button
                size="sm"
                variant="ghost"
                onPress={onDismiss}
                accessibilityLabel="Dismiss waiting reviews for this session"
              >
                Dismiss
              </Button>
            ) : null}
          </View>
        </View>
      ) : null}

      {debtHidden ? (
        <Text variant="caption" className="mt-2 leading-5 text-text-tertiary">
          {CALM_ATTENTION.waitingReviewEmpty} Waiting reviews are hidden for this session.
        </Text>
      ) : null}
    </Surface>
  );
}
