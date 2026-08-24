import { useRouter } from 'expo-router';
import { View } from 'react-native';

import type { ResearchQueueItem, SetupCardData } from '@/features/decision/types/decision.types';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { CALM_ATTENTION, TRUST_LANGUAGE } from '@/shared/constants/trust-language';

export type StartHereAction = 'researched' | 'skipped';

interface StartHereCardProps {
  symbol: string;
  setup?: SetupCardData;
  queueItem?: ResearchQueueItem;
  regime: string;
  onOutcome?: (action: StartHereAction) => void;
}

export function startHereEventKey(symbol: string, action: StartHereAction, day: string): string {
  return `start-here-outcome:${symbol.toUpperCase()}:${action}:${day}`;
}

export function StartHereCard({ symbol, setup, queueItem, regime, onOutcome }: StartHereCardProps) {
  const router = useRouter();
  const appendDecision = useAppendDecisionRecord();
  const normalizedSymbol = symbol.toUpperCase();
  const rvs = setup?.researchValueScore ?? queueItem?.researchValueScore;
  const dqs = setup?.decisionQualityScore ?? queueItem?.decisionQualityScore ?? setup?.confidence;
  const context =
    setup?.researchValueExplanation ??
    queueItem?.rankReason ??
    setup?.why[0] ??
    'Review the evidence and invalidation before deciding whether this deserves more time.';

  const recordOutcome = (action: StartHereAction) => {
    appendDecision.mutate({
      symbol: normalizedSymbol,
      regime,
      action,
      setupScore: setup?.confidence,
      bias: setup?.bias ?? queueItem?.bias,
      invalidation: setup?.invalidation ?? queueItem?.invalidation,
      researchValueScore: rvs,
      decisionQualityScore: dqs,
      note: `Start here · ${context}`,
      eventKey: startHereEventKey(normalizedSymbol, action, new Date().toISOString().slice(0, 10)),
    });
    onOutcome?.(action);
  };

  const minutes = queueItem?.estimatedMinutes;

  return (
    <Surface padding="md" emphasis="outlined" testID="today-start-here">
      <Text variant="caption" className="mb-1 font-medium text-text-tertiary">
        {CALM_ATTENTION.worthResearching}
      </Text>
      <Text variant="h2" headingLevel={2} className="mb-1">
        {normalizedSymbol}
        {setup?.setupTypeLabel || queueItem?.setupTitle
          ? ` · ${setup?.setupTypeLabel ?? queueItem?.setupTitle}`
          : ''}
      </Text>
      <Text
        variant="caption"
        className="mb-2 text-text-secondary"
        accessibilityLabel={[
          minutes ? `${minutes} minutes estimated research` : null,
          rvs != null ? `${TRUST_LANGUAGE.rvs.short} ${rvs}. ${TRUST_LANGUAGE.rvs.meaning}` : null,
          dqs != null ? `${TRUST_LANGUAGE.dqs.short} ${dqs}. ${TRUST_LANGUAGE.dqs.meaning}` : null,
        ]
          .filter(Boolean)
          .join('. ')}
      >
        {[
          minutes ? `${minutes} min estimated research` : null,
          rvs != null ? `RVS ${rvs}` : null,
          dqs != null ? `DQS ${dqs}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      <Text variant="body-sm" className="mb-1 leading-relaxed text-text-primary">
        {context}
      </Text>
      <Text variant="caption" className="mb-3 text-text-tertiary">
        RVS ranks research attention. DQS grades decision process, not price direction.
      </Text>
      <View className="flex-row gap-2">
        <Button
          className="flex-1"
          accessibilityLabel={`Research ${normalizedSymbol} from Start Here`}
          testID="start-here-research"
          onPress={() => {
            recordOutcome('researched');
            router.push(`/asset/${encodeURIComponent(normalizedSymbol)}` as never);
          }}
        >
          Research
        </Button>
        <Button
          className="flex-1"
          variant="outline"
          accessibilityLabel={`Skip ${normalizedSymbol} from Start Here`}
          testID="start-here-skip"
          onPress={() => recordOutcome('skipped')}
        >
          Skip
        </Button>
      </View>
    </Surface>
  );
}
