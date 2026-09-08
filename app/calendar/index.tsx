import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { CalendarEventCard } from '@/features/calendar/components/CalendarEventCard';
import { useEconomicCalendar } from '@/features/calendar/hooks/useEconomicCalendar';
import type { EventImpact } from '@/features/calendar/services/economic-calendar.service';
import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { StatusState } from '@/shared/components/feedback/StatusState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';
import { formatDate } from '@/shared/utils/date';

const IMPACTS: EventImpact[] = ['high', 'medium', 'low'];

export default function CalendarScreen() {
  const router = useRouter();
  const { grouped, events, impactFilter, toggleImpact, isLoading, isError, refetch } =
    useEconomicCalendar();
  const usesMock = events.some((event) => event.source === 'mock');

  if (isLoading) {
    return (
      <ScreenScaffold
        title="Economic calendar"
        scrollable={false}
        contentClassName="justify-center"
        showBack
        onBack={() => router.back()}
      >
        <StatusState
          status="loading"
          title="Loading calendar"
          description="Events that may affect research attention — not a reason to rush."
        />
      </ScreenScaffold>
    );
  }

  if (isError) {
    return (
      <ScreenScaffold
        title="Economic calendar"
        showBack
        onBack={() => router.back()}
        contentClassName="pb-8"
      >
        <EmptyState
          title="Calendar unavailable"
          description="We will not invent events. Your last verified calendar data is not on this device. Try again when you have a connection."
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </ScreenScaffold>
    );
  }

  const dates = Array.from(grouped.keys()).sort();

  return (
    <ScreenScaffold
      title="Economic calendar"
      subtitle="Which events might change research conditions?"
      showBack
      onBack={() => router.back()}
      contentClassName="pb-8"
    >
      {usesMock ? (
        <View className="flex-row items-center gap-2">
          <DataSourceBadge kind="mock" />
          <Text variant="caption" className="flex-1 text-text-tertiary">
            Sample calendar for Guest/demo — not a live economic schedule.
          </Text>
        </View>
      ) : null}

      <View className="mt-4 gap-4">
        <View className="flex-row gap-2">
          {IMPACTS.map((impact) => (
            <Pressable
              key={impact}
              accessibilityRole="checkbox"
              accessibilityLabel={`${impact} impact events`}
              accessibilityState={{ checked: impactFilter.includes(impact) }}
              onPress={() => toggleImpact(impact)}
              className={cn(
                'min-h-11 justify-center rounded-lg border px-3 capitalize',
                impactFilter.includes(impact)
                  ? 'border-border-strong bg-accent-muted'
                  : 'border-border opacity-50',
              )}
            >
              <Text
                variant="caption"
                className={impactFilter.includes(impact) ? 'text-accent' : 'text-text-secondary'}
              >
                {impact}
              </Text>
            </Pressable>
          ))}
        </View>

        {dates.length === 0 ? (
          <EmptyState
            title="Nothing on the calendar"
            description="No events match these filters. Waiting is a valid state."
          />
        ) : (
          dates.map((date) => (
            <View key={date}>
              <Text variant="label" className="mb-2">
                {formatDate(Date.parse(date), { weekday: 'short' })}
              </Text>
              {(grouped.get(date) ?? []).map((event) => (
                <CalendarEventCard key={event.id} event={event} />
              ))}
            </View>
          ))
        )}
      </View>
    </ScreenScaffold>
  );
}
