import { Pressable, View } from 'react-native';

import type { DecisionReplayFrame } from '@/features/decision-replay/services/decision-replay.service';
import { Text } from '@/shared/components/ui/Text';
import { formatRelativeTime } from '@/shared/utils/date';
import { cn } from '@/shared/utils/cn';

interface DecisionReplayTimelineProps {
  frames: DecisionReplayFrame[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

function formatClock(at: number): string {
  const d = new Date(at);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function DecisionReplayTimeline({
  frames,
  activeIndex,
  onSelect,
}: DecisionReplayTimelineProps) {
  if (!frames.length) {
    return (
      <View className="rounded-2xl bg-background-elevated p-4">
        <Text variant="body-sm" className="text-text-secondary">
          No decision footage in this window yet. Open Today’s Brief, research or skip a setup, and
          come back — process improves with tape.
        </Text>
      </View>
    );
  }

  return (
    <View className="rounded-2xl bg-background-elevated p-4">
      <Text variant="caption" className="mb-3 font-semibold text-text-tertiary">
        DECISION TIMELINE
      </Text>
      {frames.map((frame, index) => {
        const active = index === activeIndex;
        return (
          <Pressable
            key={frame.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(index)}
            className={cn(
              'mb-1 flex-row gap-3 rounded-xl px-2 py-2.5',
              active ? 'bg-accent-muted' : undefined,
            )}
          >
            <View className="w-14 items-end pt-0.5">
              <Text variant="caption" className="font-semibold text-text-tertiary">
                {formatClock(frame.at)}
              </Text>
            </View>
            <View className="items-center">
              <View
                className={cn(
                  'mt-1 h-2.5 w-2.5 rounded-full',
                  frame.isKeyDecision ? 'bg-accent' : 'bg-border',
                  active ? 'bg-accent' : undefined,
                )}
              />
              {index < frames.length - 1 ? (
                <View className="my-1 w-px flex-1 min-h-[18px] bg-border" />
              ) : null}
            </View>
            <View className="min-w-0 flex-1">
              <Text
                variant="label"
                className={active ? 'text-accent' : 'text-text-primary'}
                numberOfLines={1}
              >
                {frame.label}
                {frame.symbol ? ` · ${frame.symbol}` : ''}
              </Text>
              <Text variant="caption" className="text-text-tertiary">
                {formatRelativeTime(frame.at)}
                {frame.isKeyDecision ? ' · key decision' : ''}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
