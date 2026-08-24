const SYMBOL_RE = /^[A-Za-z0-9./^=:_-]{1,24}$/;
const INTERVALS = new Set(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M']);

export function parseSymbol(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw new Error('invalid_symbol');
  }
  const symbol = raw.trim();
  if (!SYMBOL_RE.test(symbol)) {
    throw new Error('invalid_symbol');
  }
  return symbol;
}

export function parseInterval(raw: unknown): string {
  if (typeof raw !== 'string' || !INTERVALS.has(raw)) {
    throw new Error('invalid_interval');
  }
  return raw;
}

export function parseLimit(raw: unknown, max = 500): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 1) return 100;
  return Math.min(Math.floor(n), max);
}

export function parseQuery(raw: unknown, max = 64): string {
  if (typeof raw !== 'string') {
    throw new Error('invalid_query');
  }
  const q = raw.trim();
  if (q.length < 1 || q.length > max) {
    throw new Error('invalid_query');
  }
  return q;
}

export function parseMarketType(raw: unknown): string {
  const allowed = new Set(['stocks', 'crypto', 'forex', 'commodities', 'indices']);
  if (typeof raw !== 'string' || !allowed.has(raw)) return 'stocks';
  return raw;
}

const NEWS_CATEGORIES = new Set([
  'business',
  'entertainment',
  'general',
  'health',
  'science',
  'sports',
  'technology',
]);

export function parseNewsCategory(raw: unknown): string {
  if (typeof raw !== 'string' || !NEWS_CATEGORIES.has(raw)) return 'business';
  return raw;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const ms = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(ms)) return false;
  return new Date(ms).toISOString().slice(0, 10) === value;
}

const MAX_CALENDAR_RANGE_MS = 31 * 86_400_000;

export function parseCalendarRange(
  fromRaw: unknown,
  toRaw: unknown,
  nowMs = Date.now(),
): { from: string; to: string } {
  const fromDefault = new Date(nowMs).toISOString().slice(0, 10);
  const toDefault = new Date(nowMs + 7 * 86_400_000).toISOString().slice(0, 10);
  const from = typeof fromRaw === 'string' ? fromRaw : fromDefault;
  const to = typeof toRaw === 'string' ? toRaw : toDefault;
  if (!isIsoDate(from) || !isIsoDate(to)) {
    throw new Error('invalid_calendar_range');
  }
  const fromMs = Date.parse(`${from}T00:00:00.000Z`);
  const toMs = Date.parse(`${to}T00:00:00.000Z`);
  if (fromMs > toMs || toMs - fromMs > MAX_CALENDAR_RANGE_MS) {
    throw new Error('invalid_calendar_range');
  }
  return { from, to };
}
