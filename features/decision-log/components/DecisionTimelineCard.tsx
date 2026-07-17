import { View } from 'react-native';

import type { DecisionTimelineEvent } from '@/features/decision-log/services/decision-log.service';
import { Text } from '@/shared/components/ui/Text';
import { formatRelativeTime } from '@/shared/utils/date';

interface DecisionTimelineCardProps {
  events: DecisionTimelineEvent[];
  title?: string;
}

export function DecisionTimelineCard({
  events,
  title = 'Decision timeline',
}: DecisionTimelineCardProps) {
  if (!events.length) return null;

  return (
    <View className="rounded-2xl bg-background-elevated p-4">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        {title.toUpperCase()}
      </Text>
      <Text variant="h3" className="mb-3">
        Setup journey
      </Text>
      {events.slice(-8).map((e, i) => (
        <View key={e.id} className="mb-2 flex-row gap-3">
          <View className="items-center">
            <View className="h-2.5 w-2.5 rounded-full bg-accent" />
            {i < Math.min(events.length, 8) - 1 ? (
              <View className="mt-1 w-px flex-1 bg-border" />
            ) : null}
          </View>
          <View className="mb-2 flex-1">
            <Text variant="label" className="text-text-primary">
              {e.label}
              {!title.includes(e.symbol) ? ` · ${e.symbol}` : ''}
            </Text>
            <Text variant="caption" className="text-text-tertiary">
              {formatRelativeTime(e.at)}
            </Text>
            {e.note ? (
              <Text variant="caption" className="mt-0.5 text-text-secondary" numberOfLines={2}>
                {e.note}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
