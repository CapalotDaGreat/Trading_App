import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import type { ResearchQueueItem } from '@/features/decision/types/decision.types';
import {
  loadQueueCompletions,
  toggleQueueSymbol,
} from '@/features/decision/services/coaching-loop.service';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

interface ResearchQueueCardProps {
  queue: ResearchQueueItem[];
  regime: string;
}

export function ResearchQueueCard({ queue, regime }: ResearchQueueCardProps) {
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
  const recordOutcome = (item: ResearchQueueItem, action: 'researched' | 'skipped') => {
    appendDecision.mutate({
      symbol: item.symbol,
      regime,
      action,
      researchValueScore: item.researchValueScore,
      note: `Research queue · ${item.rankReason ?? `${item.estimatedMinutes} minute review`}`,
      eventKey: `queue-outcome:${item.symbol.toUpperCase()}:${action}:${new Date().toISOString().slice(0, 10)}`,
    });
  };

  return (
    <View className="rounded-2xl bg-background-elevated p-4">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        TODAY&apos;S RESEARCH QUEUE
      </Text>
      <Text variant="h3" className="mb-1">
        Highest-value ideas only
      </Text>
      <Text variant="caption" className="mb-3 text-text-secondary">
        ~{totalMinutes} min remaining · ranked by research value
      </Text>

      {pending.map((item, index) => (
        <View key={item.symbol} className="mb-2 rounded-xl bg-surface px-3 py-2.5">
          <View className="flex-row items-center justify-between gap-2">
            <Pressable
              className="min-w-0 flex-1"
              onPress={() => router.push(`/asset/${encodeURIComponent(item.symbol)}` as never)}
            >
              <Text variant="label" className="text-text-primary">
                {index + 1}. {item.symbol}
                {item.priority === 'high' ? ' · Priority' : ''}
              </Text>
              <Text variant="caption" className="mt-0.5 text-text-secondary">
                ~{item.estimatedMinutes} min
                {item.researchValueScore != null ? ` · RVS ${item.researchValueScore}` : ''}
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
                onPress={() => {
                  recordOutcome(item, 'researched');
                  router.push(`/asset/${encodeURIComponent(item.symbol)}` as never);
                }}
                className="rounded-full bg-accent px-2.5 py-1"
              >
                <Text variant="caption" className="font-semibold text-text-inverse">
                  Research
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  recordOutcome(item, 'skipped');
                  void toggleQueueSymbol(item.symbol).then(setDone);
                }}
                className="rounded-full bg-accent-muted px-2.5 py-1"
              >
                <Text variant="caption" className="text-accent">
                  Skip
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ))}

      {completed.length > 0 ? (
        <View className="mt-1">
          <Text variant="caption" className="mb-1 text-text-tertiary">
            Completed
          </Text>
          {completed.map((item) => (
            <Pressable
              key={item.symbol}
              onPress={() => void toggleQueueSymbol(item.symbol).then(setDone)}
              className="mb-1 flex-row items-center gap-2"
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
    </View>
  );
}
