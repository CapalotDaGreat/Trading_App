import { useEffect, useMemo } from 'react';

import { useEconomicCalendar } from '@/features/calendar/hooks/useEconomicCalendar';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import type { SkillDomain } from '@/shared/constants/skill-domains';

import { composeMarketEventHub } from '../services/event-hub.service';
import { useEventCacheStore } from '../stores/event-cache.store';

export function useMarketEvents(options?: { weakness?: SkillDomain | null; gapConceptIds?: string[] }) {
  const calendar = useEconomicCalendar();
  const { profile } = useCoachProfile();
  const cached = useEventCacheStore((state) => state.events);
  const cachedAt = useEventCacheStore((state) => state.fetchedAt);
  const remember = useEventCacheStore((state) => state.remember);

  useEffect(() => {
    if (calendar.isError || calendar.events.length === 0) return;
    remember(calendar.events, calendar.dataUpdatedAt || Date.now(), calendar.events[0]?.source);
  }, [calendar.dataUpdatedAt, calendar.events, calendar.isError, remember]);

  const fromCache = Boolean(calendar.isError && cached.length > 0);
  const calendarEvents = calendar.isError ? cached : calendar.events;
  const fetchedAt = fromCache ? cachedAt || Date.now() : calendar.dataUpdatedAt || Date.now();

  const hub = useMemo(
    () =>
      composeMarketEventHub({
        calendarEvents,
        calendarUnavailable: calendar.isError && cached.length === 0,
        fetchedAt,
        fromCache,
        experience: profile.experience,
        preferredTopics: profile.preferredTopics,
        struggles: profile.struggles,
        weakness: options?.weakness ?? null,
        gapConceptIds: options?.gapConceptIds,
      }),
    [
      calendar.isError,
      calendarEvents,
      cached.length,
      fetchedAt,
      fromCache,
      options?.weakness,
      options?.gapConceptIds,
      profile.experience,
      profile.preferredTopics,
      profile.struggles,
    ],
  );

  return {
    ...hub,
    calendarDegraded: calendar.isError,
    isCalendarLoading: calendar.isLoading && calendarEvents.length === 0 && !fromCache,
    isCalendarFetching: calendar.isFetching,
    refetchCalendar: calendar.refetch,
  };
}
