import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import type { TradingDayPlan } from '@/features/decision/types/decision.types';
import {
  loadPlanCompletions,
  togglePlanItem,
} from '@/features/decision/services/coaching-loop.service';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

interface TradingDayPlanCardProps {
  plan: TradingDayPlan;
}

const PHASE_LABEL = {
  before: 'Before market',
  during: 'During market',
  after: 'After market',
} as const;

export function TradingDayPlanCard({ plan }: TradingDayPlanCardProps) {
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    void loadPlanCompletions().then(setDone);
  }, []);

  const items = plan.items.map((item) => ({
    ...item,
    done: done.has(item.id) || item.done,
  }));

  return (
    <GlassCard className="p-4">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        Today&apos;s plan
      </Text>
      <Text variant="h3" className="mb-3">
        Your trading day · ~{plan.estimatedMinutes}m
      </Text>

      {(['before', 'during', 'after'] as const).map((phase) => {
        const phaseItems = items.filter((i) => i.phase === phase);
        if (!phaseItems.length) return null;
        return (
          <View key={phase} className="mb-3">
            <Text variant="caption" className="mb-1.5 font-semibold text-text-secondary">
              {PHASE_LABEL[phase]}
            </Text>
            {phaseItems.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.done }}
                onPress={() => {
                  void togglePlanItem(item.id).then(setDone);
                }}
                className="mb-1.5 flex-row items-start gap-2"
              >
                <Text
                  variant="caption"
                  className={cn('mt-0.5 font-bold', item.done ? 'text-bullish' : 'text-text-tertiary')}
                >
                  {item.done ? '✓' : '○'}
                </Text>
                <Text
                  variant="body-sm"
                  className={cn(
                    'flex-1 leading-relaxed',
                    item.done ? 'text-text-tertiary line-through' : 'text-text-primary',
                  )}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        );
      })}
    </GlassCard>
  );
}
