export type EventImpact = 'high' | 'medium' | 'low';
export type EventCategory =
  | 'employment'
  | 'inflation'
  | 'gdp'
  | 'interest_rate'
  | 'manufacturing'
  | 'consumer'
  | 'housing'
  | 'trade'
  | 'other';

export interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  countryCode: string;
  category: EventCategory;
  impact: EventImpact;
  actual?: string;
  forecast?: string;
  previous?: string;
  unit?: string;
  scheduledAt: number;
  source: string;
}

export interface CalendarFilter {
  country?: string;
  impact?: EventImpact[];
  from?: number;
  to?: number;
}

const FINNHUB_API_KEY = process.env.EXPO_PUBLIC_FINNHUB_API_KEY ?? '';
const FINNHUB_BASE = 'https://finnhub.io/api/v1';

interface FinnhubCalendarEvent {
  event?: string;
  country?: string;
  impact?: string;
  actual?: string;
  estimate?: string;
  prev?: string;
  unit?: string;
  time?: string;
}

interface FinnhubCalendarResponse {
  economicCalendar?: FinnhubCalendarEvent[];
}

function mapImpact(impact?: string): EventImpact {
  const normalized = impact?.toLowerCase() ?? '';
  if (normalized.includes('high') || normalized === '3') return 'high';
  if (normalized.includes('low') || normalized === '1') return 'low';
  return 'medium';
}

function mapCategory(title: string): EventCategory {
  const lower = title.toLowerCase();
  if (lower.includes('employment') || lower.includes('payroll') || lower.includes('jobless')) {
    return 'employment';
  }
  if (lower.includes('cpi') || lower.includes('inflation') || lower.includes('pce')) {
    return 'inflation';
  }
  if (lower.includes('gdp')) return 'gdp';
  if (lower.includes('rate') || lower.includes('fomc') || lower.includes('fed')) {
    return 'interest_rate';
  }
  if (lower.includes('pmi') || lower.includes('manufacturing') || lower.includes('industrial')) {
    return 'manufacturing';
  }
  if (lower.includes('retail') || lower.includes('consumer') || lower.includes('confidence')) {
    return 'consumer';
  }
  if (lower.includes('housing') || lower.includes('home')) return 'housing';
  if (lower.includes('trade') || lower.includes('export') || lower.includes('import')) {
    return 'trade';
  }
  return 'other';
}

function hashEventId(title: string, time: number, country: string): string {
  return `${country}-${time}-${title}`.replace(/\s+/g, '-').toLowerCase().slice(0, 64);
}

function getMockEvents(from: number, to: number): EconomicEvent[] {
  const events: EconomicEvent[] = [
    {
      id: 'us-nfp',
      title: 'Non-Farm Payrolls',
      country: 'United States',
      countryCode: 'US',
      category: 'employment',
      impact: 'high',
      forecast: '180K',
      previous: '175K',
      scheduledAt: from + 36 * 60 * 60 * 1000,
      source: 'mock',
    },
    {
      id: 'us-cpi',
      title: 'CPI m/m',
      country: 'United States',
      countryCode: 'US',
      category: 'inflation',
      impact: 'high',
      forecast: '0.3%',
      previous: '0.2%',
      scheduledAt: from + 72 * 60 * 60 * 1000,
      source: 'mock',
    },
    {
      id: 'eu-rate',
      title: 'ECB Interest Rate Decision',
      country: 'Eurozone',
      countryCode: 'EU',
      category: 'interest_rate',
      impact: 'high',
      forecast: '4.25%',
      previous: '4.50%',
      scheduledAt: from + 96 * 60 * 60 * 1000,
      source: 'mock',
    },
    {
      id: 'uk-gdp',
      title: 'GDP q/q',
      country: 'United Kingdom',
      countryCode: 'GB',
      category: 'gdp',
      impact: 'medium',
      forecast: '0.2%',
      previous: '0.1%',
      scheduledAt: from + 48 * 60 * 60 * 1000,
      source: 'mock',
    },
  ];

  return events.filter((e) => e.scheduledAt >= from && e.scheduledAt <= to);
}

async function fetchFromFinnhub(from: string, to: string): Promise<EconomicEvent[]> {
  const url = new URL(`${FINNHUB_BASE}/calendar/economic`);
  url.searchParams.set('from', from);
  url.searchParams.set('to', to);
  url.searchParams.set('token', FINNHUB_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Finnhub calendar error: ${response.status}`);
  }

  const data = (await response.json()) as FinnhubCalendarResponse;
  const raw = data.economicCalendar ?? [];

  return raw.map((event) => {
    const title = event.event ?? 'Economic Event';
    const scheduledAt = event.time ? Date.parse(event.time) : Date.now();
    const country = event.country ?? 'Unknown';

    return {
      id: hashEventId(title, scheduledAt, country),
      title,
      country,
      countryCode: country.slice(0, 2).toUpperCase(),
      category: mapCategory(title),
      impact: mapImpact(event.impact),
      actual: event.actual,
      forecast: event.estimate,
      previous: event.prev,
      unit: event.unit,
      scheduledAt,
      source: 'finnhub',
    };
  });
}

function applyFilter(events: EconomicEvent[], filter?: CalendarFilter): EconomicEvent[] {
  let result = [...events];

  if (filter?.country) {
    result = result.filter(
      (e) =>
        e.countryCode === filter.country ||
        e.country.toLowerCase().includes(filter.country!.toLowerCase()),
    );
  }

  if (filter?.impact?.length) {
    result = result.filter((e) => filter.impact!.includes(e.impact));
  }

  if (filter?.from) {
    result = result.filter((e) => e.scheduledAt >= filter.from!);
  }

  if (filter?.to) {
    result = result.filter((e) => e.scheduledAt <= filter.to!);
  }

  return result.sort((a, b) => a.scheduledAt - b.scheduledAt);
}

export async function fetchEconomicCalendar(filter?: CalendarFilter): Promise<EconomicEvent[]> {
  const now = Date.now();
  const fromMs = filter?.from ?? now - 24 * 60 * 60 * 1000;
  const toMs = filter?.to ?? now + 7 * 24 * 60 * 60 * 1000;
  const fromDate = new Date(fromMs).toISOString().split('T')[0] ?? '';
  const toDate = new Date(toMs).toISOString().split('T')[0] ?? '';

  if (FINNHUB_API_KEY) {
    try {
      const events = await fetchFromFinnhub(fromDate, toDate);
      return applyFilter(events, filter);
    } catch {
      return applyFilter(getMockEvents(fromMs, toMs), filter);
    }
  }

  return applyFilter(getMockEvents(fromMs, toMs), filter);
}

export function groupEventsByDate(events: EconomicEvent[]): Map<string, EconomicEvent[]> {
  const groups = new Map<string, EconomicEvent[]>();

  for (const event of events) {
    const dateKey = new Date(event.scheduledAt).toISOString().split('T')[0] ?? '';
    const existing = groups.get(dateKey) ?? [];
    existing.push(event);
    groups.set(dateKey, existing);
  }

  return groups;
}
