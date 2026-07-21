import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { ResearchQueueItem, SetupCardData } from '@/features/decision/types/decision.types';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

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

  return (
    <GlassCard className="border border-accent/30 p-4" testID="today-start-here">
      <Text variant="caption" className="mb-1 font-semibold text-accent">
        START HERE
      </Text>
      <Text variant="h2" className="mb-1">
        {normalizedSymbol}
        {setup?.setupTypeLabel || queueItem?.setupTitle
          ? ` · ${setup?.setupTypeLabel ?? queueItem?.setupTitle}`
          : ''}
      </Text>
      <Text variant="caption" className="mb-2 text-text-secondary">
        {[
          queueItem?.estimatedMinutes ? `~${queueItem.estimatedMinutes} min` : null,
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Research ${normalizedSymbol} from Start Here`}
          testID="start-here-research"
          onPress={() => {
            recordOutcome('researched');
            router.push(`/asset/${encodeURIComponent(normalizedSymbol)}` as never);
          }}
          className="min-h-11 flex-1 items-center justify-center rounded-xl bg-accent px-4"
        >
          <Text variant="label" className="text-text-inverse">
            Research
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Skip ${normalizedSymbol} from Start Here`}
          testID="start-here-skip"
          onPress={() => recordOutcome('skipped')}
          className="min-h-11 flex-1 items-center justify-center rounded-xl bg-accent-muted px-4"
        >
          <Text variant="label" className="text-accent">
            Skip
          </Text>
        </Pressable>
      </View>
    </GlassCard>
  );
}
