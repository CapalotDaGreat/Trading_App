import type { MarketEventFreshness, MarketEventLifecycle } from '../types/events.types';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const LIFECYCLE_LABELS: Record<MarketEventLifecycle, string> = {
  upcoming: 'Upcoming',
  released: 'Released',
  developing: 'Developing',
  historical: 'Historical',
};

export function lifecycleForEvent(input: {
  scheduledAt: number;
  actual?: string;
  forced?: MarketEventLifecycle;
  now?: number;
}): MarketEventLifecycle {
  if (input.forced) return input.forced;
  const now = input.now ?? Date.now();
  const delta = input.scheduledAt - now;
  if (input.scheduledAt < now - 14 * DAY) return 'historical';
  if (input.actual && input.actual.trim().length > 0 && delta < 2 * HOUR) return 'released';
  if (delta < -2 * HOUR) return 'released';
  if (Math.abs(delta) <= 2 * HOUR) return 'developing';
  return 'upcoming';
}

export function freshnessForSource(input: {
  source?: string;
  fromCache?: boolean;
  curated?: boolean;
}): { kind: MarketEventFreshness; note: string } {
  if (input.fromCache) {
    return {
      kind: 'cached',
      note: 'Showing the last saved calendar snapshot. It may be stale. This is not a live tape.',
    };
  }
  if (input.curated || input.source === 'mock') {
    return {
      kind: 'sample',
      note: 'Labelled sample / educational context. Not a live news wire.',
    };
  }
  if (input.source === 'finnhub') {
    return {
      kind: 'delayed',
      note: 'Vendor calendar is delayed. TradeAcademy will not call this live.',
    };
  }
  return {
    kind: 'approximate',
    note: 'Timing is approximate. Do not treat this as a live feed.',
  };
}

export function isStaleCalendarSnapshot(kind: MarketEventFreshness): boolean {
  return kind === 'cached';
}

export function whatHappenedOrExpected(input: {
  lifecycle: MarketEventLifecycle;
  actual?: string;
  forecast?: string;
  previous?: string;
  fallback: string;
}): string {
  if (input.lifecycle === 'released' && input.actual) {
    return `Released print (as reported): ${input.actual}${input.forecast ? `. Consensus guess was ${input.forecast}` : ''}${
      input.previous ? `. Previous: ${input.previous}` : ''
    }. A printed number is not a trade instruction.`;
  }
  if (input.lifecycle === 'upcoming' && input.forecast) {
    return `Expected (consensus guess): ${input.forecast}${
      input.previous ? `. Previous: ${input.previous}` : ''
    }. Consensus is not a forecast we endorse, and we do not predict the print.`;
  }
  return input.fallback;
}
