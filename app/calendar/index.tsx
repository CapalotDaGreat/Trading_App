import { ActivityIndicator, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { CalendarEventCard } from '@/features/calendar/components/CalendarEventCard';
import { useEconomicCalendar } from '@/features/calendar/hooks/useEconomicCalendar';
import type { EventImpact } from '@/features/calendar/services/economic-calendar.service';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';
import { formatDate } from '@/shared/utils/date';

const IMPACTS: EventImpact[] = ['high', 'medium', 'low'];

export default function CalendarScreen() {
  const router = useRouter();
  const {
    grouped,
    impactFilter,
    toggleImpact,
    isLoading,
    isError,
    refetch,
  } = useEconomicCalendar();

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" color="#00D4AA" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <EmptyState
          title="Unable to load calendar"
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  const dates = Array.from(grouped.keys()).sort();

  return (
    <Screen scrollable contentClassName="pb-8">
      <Header title="Economic Calendar" onBack={() => router.back()} />

      <View className="mt-4 gap-4">
        <View className="flex-row gap-2">
          {IMPACTS.map((impact) => (
            <Pressable
              key={impact}
              accessibilityRole="button"
              onPress={() => toggleImpact(impact)}
              className={cn(
                'rounded-lg border px-3 py-1.5 capitalize',
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
          <EmptyState title="No events" description="No events match your filters." />
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
    </Screen>
  );
}
