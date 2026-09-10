import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { EconomicEvent } from '@/features/calendar/services/economic-calendar.service';
import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

interface EventCacheState {
  events: EconomicEvent[];
  fetchedAt: number;
  source: string | null;
  remember: (events: EconomicEvent[], fetchedAt: number, source?: string) => void;
}

export const useEventCacheStore = create<EventCacheState>()(
  persist(
    (set) => ({
      events: [],
      fetchedAt: 0,
      source: null,
      remember: (events, fetchedAt, source) =>
        set({
          events,
          fetchedAt,
          source: source ?? events[0]?.source ?? null,
        }),
    }),
    {
      name: 'tradevision-event-cache-v1',
      storage: createPersistedStorage(),
      version: 1,
    },
  ),
);
