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
    (set, get) => ({
      events: [],
      fetchedAt: 0,
      source: null,
      remember: (events, fetchedAt, source) => {
        const current = get();
        const nextSource = source ?? events[0]?.source ?? null;
        if (
          current.fetchedAt === fetchedAt &&
          current.source === nextSource &&
          current.events.length === events.length &&
          (events.length === 0 || current.events[0]?.id === events[0]?.id)
        ) {
          return;
        }
        set({
          events,
          fetchedAt,
          source: nextSource,
        });
      },
    }),
    {
      name: 'tradeacademy-event-cache-v1',
      storage: createPersistedStorage(),
      version: 1,
    },
  ),
);
