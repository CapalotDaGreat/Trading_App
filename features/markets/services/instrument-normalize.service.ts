const MAX_QUERY_LENGTH = 64;

const CRYPTO_BASES = new Set([
  'BTC',
  'ETH',
  'SOL',
  'BNB',
  'XRP',
  'ADA',
  'DOGE',
  'DOT',
  'AVAX',
  'MATIC',
  'LINK',
  'UNI',
  'ATOM',
  'LTC',
]);

const FOREX_BASES = new Set([
  'EUR',
  'GBP',
  'USD',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
  'NZD',
]);

export class InstrumentQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InstrumentQueryError';
  }
}

/** Strip control chars and zero-width; collapse whitespace. */
export function sanitizeInstrumentQuery(raw: string): string {
  return raw
    .replace(/[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize user search input without changing instrument meaning.
 * Returns null when the query is empty or unsafe.
 */
export function normalizeInstrumentQuery(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = sanitizeInstrumentQuery(raw);
  if (!cleaned || cleaned.length > MAX_QUERY_LENGTH) return null;
  if (/[<>`\\]/.test(cleaned)) return null;

  // Pair-like compact forms: btcusd, eurusd, xaausd (quote is always last 3 letters)
  const compact = cleaned.toUpperCase().replace(/\s+/g, '').replace(/\//g, '').replace(/_/g, '').replace(/-/g, '');

  // Metals first — avoid ambiguous compact splits
  if (compact === 'XAUUSD') return 'XAU/USD';
  if (compact === 'XAGUSD') return 'XAG/USD';

  if (compact.length >= 6 && compact.length <= 9 && compact.endsWith('USD')) {
    const base = compact.slice(0, -3);
    if (CRYPTO_BASES.has(base)) {
      return `${base}/USD`;
    }
  }
  if (compact.length === 6) {
    const base = compact.slice(0, 3);
    const quote = compact.slice(3);
    if (FOREX_BASES.has(base) && FOREX_BASES.has(quote)) {
      return `${base}/${quote}`;
    }
  }

  // Slash already present — normalize casing for known pairs
  if (cleaned.includes('/')) {
    const [left, right] = cleaned.split('/').map((p) => p.trim());
    if (left && right && left.length <= 6 && right.length <= 6) {
      const base = left.toUpperCase();
      const quote = right.toUpperCase();
      if (
        CRYPTO_BASES.has(base) ||
        FOREX_BASES.has(base) ||
        base === 'XAU' ||
        base === 'XAG'
      ) {
        return `${base}/${quote}`;
      }
    }
  }

  // Compact ticker codes → uppercase. Longer letter-only tokens stay name-like ("apple", "tesla").
  if (/^[A-Za-z0-9.^=-]{1,12}$/.test(cleaned) && !/\s/.test(cleaned)) {
    if (/[0-9.=^]/.test(cleaned) || cleaned === cleaned.toUpperCase() || cleaned.length <= 4) {
      return cleaned.toUpperCase();
    }
    return cleaned;
  }

  // Name-like: preserve original casing for search matching
  return cleaned;
}

/** Uppercase key for alias / symbol maps. */
export function instrumentMatchKey(value: string): string {
  return value.toUpperCase().replace(/\s+/g, ' ').trim();
}

export function assertSafeInstrumentQuery(raw: unknown): string {
  const normalized = normalizeInstrumentQuery(raw);
  if (!normalized) {
    throw new InstrumentQueryError(
      'Enter a company name, ticker, crypto, currency pair, or commodity name.',
    );
  }
  return normalized;
}

export { MAX_QUERY_LENGTH };
