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
