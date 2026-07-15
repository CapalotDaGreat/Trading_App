import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';

import {
  fetchEconomicCalendar,
  groupEventsByDate,
  type CalendarFilter,
  type EventImpact,
} from '../services/economic-calendar.service';

const calendarQueryKey = (filter: CalendarFilter) => ['economic-calendar', filter] as const;

interface CalendarUiState {
  impactFilter: EventImpact[];
  countryFilter: string | null;
  toggleImpact: (impact: EventImpact) => void;
  setCountryFilter: (country: string | null) => void;
  clearFilters: () => void;
}

export const useCalendarStore = create<CalendarUiState>((set, get) => ({
  impactFilter: ['high', 'medium', 'low'],
  countryFilter: null,
  toggleImpact: (impact) => {
    const current = get().impactFilter;
    const next = current.includes(impact)
      ? current.filter((i) => i !== impact)
      : [...current, impact];
    set({ impactFilter: next.length > 0 ? next : ['high', 'medium', 'low'] });
  },
  setCountryFilter: (country) => set({ countryFilter: country }),
  clearFilters: () => set({ impactFilter: ['high', 'medium', 'low'], countryFilter: null }),
}));

export function useEconomicCalendar(overrideFilter?: CalendarFilter) {
  const impactFilter = useCalendarStore((s) => s.impactFilter);
  const countryFilter = useCalendarStore((s) => s.countryFilter);
  const toggleImpact = useCalendarStore((s) => s.toggleImpact);
  const setCountryFilter = useCalendarStore((s) => s.setCountryFilter);
  const clearFilters = useCalendarStore((s) => s.clearFilters);

  const filter: CalendarFilter = {
    impact: impactFilter,
    country: countryFilter ?? overrideFilter?.country,
    from: overrideFilter?.from,
    to: overrideFilter?.to,
  };

  const query = useQuery({
    queryKey: calendarQueryKey(filter),
    queryFn: () => fetchEconomicCalendar(filter),
    staleTime: 15 * 60 * 1000,
  });

  const events = query.data ?? [];
  const grouped = groupEventsByDate(events);

  return {
    events,
    grouped,
    filter,
    impactFilter,
    countryFilter,
    toggleImpact,
    setCountryFilter,
    clearFilters,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
