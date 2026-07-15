import { View } from 'react-native';

import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { formatDate, formatTime } from '@/shared/utils/date';

import type { EconomicEvent } from '../services/dashboard.service';

interface EconomicEventsPreviewProps {
  events?: EconomicEvent[];
  isLoading?: boolean;
}

const IMPACT_VARIANTS: Record<EconomicEvent['impact'], 'danger' | 'warning' | 'default'> = {
  high: 'danger',
  medium: 'warning',
  low: 'default',
};

export function EconomicEventsPreview({ events, isLoading }: EconomicEventsPreviewProps) {
  if (isLoading || !events) {
    return (
      <GlassCard className="p-4">
        <Skeleton height={20} width="60%" className="mb-3" />
        <View className="gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={52} />
          ))}
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <Text variant="h3" className="mb-3">
        Economic Calendar
      </Text>

      {events.length === 0 ? (
        <Text variant="body-sm" className="py-4 text-center">
          No upcoming events scheduled.
        </Text>
      ) : (
        <View className="gap-2">
          {events.map((event) => (
            <View
              key={event.id}
              className="rounded-xl border border-border/50 bg-surface/30 px-3 py-2.5"
            >
              <View className="mb-1 flex-row items-center justify-between">
                <Text variant="label" className="flex-1" numberOfLines={1}>
                  {event.title}
                </Text>
                <Badge label={event.impact} variant={IMPACT_VARIANTS[event.impact]} size="sm" />
              </View>

              <View className="flex-row items-center justify-between">
                <Text variant="caption">
                  {event.country} · {formatDate(event.scheduledAt, { weekday: 'short' })}{' '}
                  {formatTime(event.scheduledAt)}
                </Text>
                {event.forecast ? (
                  <Text variant="caption" className="text-accent">
                    Est. {event.forecast}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}
