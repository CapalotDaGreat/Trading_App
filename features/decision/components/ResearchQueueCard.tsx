import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { PremiumOsGate } from '@/features/decision/components/PremiumOsGate';
import {
  loadQueueCompletions,
  toggleQueueSymbol,
} from '@/features/decision/services/coaching-loop.service';
import type { ResearchQueueItem } from '@/features/decision/types/decision.types';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

interface ResearchQueueCardProps {
  queue: ResearchQueueItem[];
  regime: string;
  onOutcome?: (item: ResearchQueueItem, action: 'researched' | 'skipped') => void;
  /** Keep this many ranked items free; any remaining queue is a real Premium capability. */
  freeItemLimit?: number;
  variant?: 'compact' | 'expanded';
  eyebrow?: string;
  title?: string;
  description?: string;
}

export function ResearchQueueCard({
  queue,
  regime,
  onOutcome,
  freeItemLimit = Number.POSITIVE_INFINITY,
  variant = 'expanded',
  eyebrow = 'RESEARCH QUEUE',
  title = 'Highest research value now',
  description,
}: ResearchQueueCardProps) {
  const router = useRouter();
  const appendDecision = useAppendDecisionRecord();
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    void loadQueueCompletions().then(setDone);
  }, []);

  if (!queue.length) return null;

  const items = queue.map((q) => ({
    ...q,
    completed: done.has(q.symbol.toUpperCase()) || q.completed,
  }));
  const pending = items.filter((i) => !i.completed);
  const completed = items.filter((i) => i.completed);
  const totalMinutes = pending.reduce((s, i) => s + i.estimatedMinutes, 0);
  const freePending = pending.slice(0, freeItemLimit);
  const deeperPending = pending.slice(freeItemLimit);
  const visiblePending = variant === 'compact' ? freePending.slice(0, 1) : freePending;
  const recordOutcome = (item: ResearchQueueItem, action: 'researched' | 'skipped') => {
    appendDecision.mutate({
      symbol: item.symbol,
      regime,
      action,
      researchValueScore: item.researchValueScore,
      note: `Research queue · ${item.rankReason ?? `${item.estimatedMinutes} minute review`}`,
      eventKey: `queue-outcome:${item.symbol.toUpperCase()}:${action}:${new Date().toISOString().slice(0, 10)}`,
    });
    onOutcome?.(item, action);
  };

  return (
    <Surface padding="md" testID="research-queue-card">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        {eyebrow}
      </Text>
      <Text variant="h3" className="mb-1">
        {title}
      </Text>
      <Text variant="caption" className="mb-3 text-text-secondary">
        {description ??
          `${pending.length} item${pending.length === 1 ? '' : 's'} · ~${totalMinutes} min remaining · ranked for research, not trading`}
      </Text>

      {visiblePending.map((item, index) => (
        <View key={item.symbol} className="mb-2 rounded-xl bg-surface px-3 py-2.5">
          <View className="flex-row items-center justify-between gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.symbol} research`}
              className="min-h-11 min-w-0 flex-1 justify-center"
              onPress={() => router.push(`/asset/${encodeURIComponent(item.symbol)}` as never)}
              testID={`research-queue-symbol-${item.symbol}`}
            >
              <Text variant="label" className="text-text-primary">
                {index + 1}. {item.symbol}
                {item.priority === 'high' ? ' · Priority' : ''}
              </Text>
              <Text variant="caption" className="mt-0.5 text-text-secondary">
                ~{item.estimatedMinutes} min
                {item.researchValueScore != null ? ` · RVS ${item.researchValueScore}` : ''}
                {item.decisionQualityScore != null ? ` · DQS ${item.decisionQualityScore}` : ''}
              </Text>
              {item.rankReason ? (
                <Text variant="caption" className="mt-0.5 text-text-tertiary" numberOfLines={2}>
                  {item.rankReason}
                </Text>
              ) : null}
              {item.learningValue ? (
                <Text variant="caption" className="mt-0.5 text-accent" numberOfLines={1}>
                  Learn: {item.learningValue}
                </Text>
              ) : null}
            </Pressable>
            <View className="items-end gap-1">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Research ${item.symbol}`}
                testID={`research-queue-research-${item.symbol}`}
                onPress={() => {
                  recordOutcome(item, 'researched');
                  router.push(`/asset/${encodeURIComponent(item.symbol)}` as never);
                }}
                className="min-h-11 justify-center rounded-full bg-accent px-3 py-2"
              >
                <Text variant="caption" className="font-semibold text-text-inverse">
                  Research
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Skip ${item.symbol}`}
                testID={`research-queue-skip-${item.symbol}`}
                onPress={() => {
                  recordOutcome(item, 'skipped');
                  void toggleQueueSymbol(item.symbol).then(setDone);
                }}
                className="min-h-11 justify-center rounded-full bg-accent-muted px-3 py-2"
              >
                <Text variant="caption" className="text-accent">
                  Skip
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ))}

      {variant === 'expanded' && deeperPending.length ? (
        <PremiumOsGate feature="advancedResearchQueue">
          <View testID="research-queue-deeper-items">
            {deeperPending.map((item, offset) => (
              <View key={item.symbol} className="mb-2 rounded-xl bg-surface px-3 py-2.5">
                <View className="flex-row items-center justify-between gap-2">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${item.symbol} research`}
                    className="min-h-11 min-w-0 flex-1 justify-center"
                    onPress={() => router.push(`/asset/${encodeURIComponent(item.symbol)}` as never)}
                    testID={`research-queue-symbol-${item.symbol}`}
                  >
                    <Text variant="label" className="text-text-primary">
                      {freePending.length + offset + 1}. {item.symbol}
                      {item.priority === 'high' ? ' · Priority' : ''}
                    </Text>
                    <Text variant="caption" className="mt-0.5 text-text-secondary">
                      ~{item.estimatedMinutes} min
                      {item.researchValueScore != null ? ` · RVS ${item.researchValueScore}` : ''}
                      {item.decisionQualityScore != null ? ` · DQS ${item.decisionQualityScore}` : ''}
                    </Text>
                    {item.rankReason ? (
                      <Text
                        variant="caption"
                        className="mt-0.5 text-text-tertiary"
                        numberOfLines={2}
                      >
                        {item.rankReason}
                      </Text>
                    ) : null}
                  </Pressable>
                  <View className="items-end gap-1">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Research ${item.symbol}`}
                      testID={`research-queue-research-${item.symbol}`}
                      onPress={() => {
                        recordOutcome(item, 'researched');
                        router.push(`/asset/${encodeURIComponent(item.symbol)}` as never);
                      }}
                      className="min-h-11 justify-center rounded-full bg-accent px-3 py-2"
                    >
                      <Text variant="caption" className="font-semibold text-text-inverse">
                        Research
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Skip ${item.symbol}`}
                      testID={`research-queue-skip-${item.symbol}`}
                      onPress={() => {
                        recordOutcome(item, 'skipped');
                        void toggleQueueSymbol(item.symbol).then(setDone);
                      }}
                      className="min-h-11 justify-center rounded-full bg-accent-muted px-3 py-2"
                    >
                      <Text variant="caption" className="text-accent">
                        Skip
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </PremiumOsGate>
      ) : null}

      {variant === 'expanded' && completed.length > 0 ? (
        <View className="mt-1">
          <Text variant="caption" className="mb-1 text-text-tertiary">
            Completed
          </Text>
          {completed.map((item) => (
            <Pressable
              key={item.symbol}
              accessibilityRole="button"
              accessibilityLabel={`Mark ${item.symbol} incomplete`}
              onPress={() => void toggleQueueSymbol(item.symbol).then(setDone)}
              className="mb-1 min-h-11 flex-row items-center gap-2"
            >
              <Text variant="caption" className="text-bullish">
                ✓
              </Text>
              <Text variant="caption" className={cn('text-text-tertiary line-through')}>
                {item.symbol}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Surface>
  );
}
