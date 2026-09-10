import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { educationForEvent } from '@/features/events/services/event-education.service';
import { lifecycleForEvent, LIFECYCLE_LABELS } from '@/features/events/services/event-status.service';
import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { formatMarketTime } from '@/shared/utils/date';

import type { EconomicEvent } from '../services/economic-calendar.service';

interface CalendarEventCardProps {
  event: EconomicEvent;
}

const impactVariant: Record<EconomicEvent['impact'], 'danger' | 'warning' | 'outline'> = {
  high: 'danger',
  medium: 'warning',
  low: 'outline',
};

export function CalendarEventCard({ event }: CalendarEventCardProps) {
  const router = useRouter();
  const education = educationForEvent(event);
  const lifecycle = lifecycleForEvent({ scheduledAt: event.scheduledAt, actual: event.actual });
  return (
    <GlassCard className="mb-2 p-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <View className="mb-1 flex-row flex-wrap items-center gap-2">
            <Badge label={LIFECYCLE_LABELS[lifecycle]} variant="outline" size="sm" />
            <Badge label={event.countryCode} variant="outline" size="sm" />
            <Badge label={event.impact} variant={impactVariant[event.impact]} size="sm" />
            {event.source === 'mock' ? <DataSourceBadge kind="mock" /> : <DataSourceBadge kind="delayed" />}
          </View>
          <Text variant="h3" numberOfLines={2}>
            {event.title}
          </Text>
          <Text variant="caption" className="mt-1 text-text-tertiary">
            {event.country} · {event.category.replace('_', ' ')}
          </Text>
        </View>
        <Text variant="mono" className="text-accent">
          {formatMarketTime(event.scheduledAt)}
        </Text>
      </View>

      <Text variant="caption" className="mt-3 text-text-secondary">
        Why a trader might care: {education.whyTradersCare}
      </Text>
      <Button
        className="mt-2"
        size="sm"
        variant="ghost"
        onPress={() => router.push(`/academy/lesson/${education.relatedLessonId}` as never)}
      >
        Learn: {education.relatedLessonTitle}
      </Button>

      {(event.forecast || event.previous || event.actual) ? (
        <View className="mt-3 flex-row gap-4 border-t border-border pt-2">
          {event.actual ? <Metric label="Actual" value={event.actual} /> : null}
          {event.forecast ? <Metric label="Forecast" value={event.forecast} /> : null}
          {event.previous ? <Metric label="Previous" value={event.previous} /> : null}
        </View>
      ) : null}
    </GlassCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text variant="caption" className="text-text-tertiary">
        {label}
      </Text>
      <Text variant="mono">{value}</Text>
    </View>
  );
}
