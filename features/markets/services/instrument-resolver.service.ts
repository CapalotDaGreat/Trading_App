import {
  findExactCanonicalInstrument,
  getCanonicalInstrumentById,
  searchCanonicalInstruments,
  UNSUPPORTED_INSTRUMENT_EXAMPLES,
} from '@/features/markets/content/canonical-instruments';
import {
  assertSafeInstrumentQuery,
  instrumentMatchKey,
  normalizeInstrumentQuery,
} from '@/features/markets/services/instrument-normalize.service';
import {
  fetchQuoteWithMetadata,
  MarketDataUnavailableError,
} from '@/features/markets/services/market-data.service';
import { searchMarkets, type SearchResult } from '@/features/markets/services/market-search.service';
import type {
  Instrument,
  InstrumentConfidence,
  InstrumentProvider,
  InstrumentResolution,
  InstrumentSearchHit,
} from '@/features/markets/types/instrument.types';
import type { AssetClass, MarketType } from '@/shared/types/market';

import { INSTRUMENT_RESOLUTION_COPY } from '@/features/markets/types/instrument.types';

const CAPABILITY_PROBE_LIMIT = 5;
const RESOLVE_CACHE_TTL_MS = 60_000;

const resolveCache = new Map<string, { at: number; value: InstrumentResolution }>();

export function clearInstrumentResolveCache(): void {
  resolveCache.clear();
}

function cacheGet(key: string): InstrumentResolution | undefined {
  const hit = resolveCache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > RESOLVE_CACHE_TTL_MS) {
    resolveCache.delete(key);
    return undefined;
  }
  return hit.value;
}

function cacheSet(key: string, value: InstrumentResolution): InstrumentResolution {
  resolveCache.set(key, { at: Date.now(), value });
  return value;
}

const UNSUPPORTED_REASON = `${INSTRUMENT_RESOLUTION_COPY.couldNotVerify} ${INSTRUMENT_RESOLUTION_COPY.reliableDataOnly}`;
const NOT_FOUND_REASON =
  "We couldn't find a supported market asset. Try a company name, ticker, crypto, currency pair, or commodity name. Examples: Apple, AAPL, Bitcoin, BTC/USD, Gold.";
const AMBIGUOUS_REASON = INSTRUMENT_RESOLUTION_COPY.whichAsset;

function providerForMarket(marketType: MarketType, assetClass: AssetClass): InstrumentProvider {
  if (marketType === 'crypto' || assetClass === 'crypto') return 'coingecko';
  if (marketType === 'forex' || assetClass === 'forex') return 'exchange-rate-api';
  return 'finnhub';
}

function makeInstrumentId(marketType: MarketType, canonicalSymbol: string): string {
  const prefix =
    marketType === 'crypto'
      ? 'crypto'
      : marketType === 'forex'
        ? 'forex'
        : marketType === 'commodities'
          ? 'commodity'
          : marketType === 'indices'
            ? 'index'
            : 'equity';
  return `${prefix}:${canonicalSymbol.replace(/\//g, '-')}`;
}

export function searchResultToInstrument(result: SearchResult): Instrument {
  const canonicalSymbol = result.symbol.trim();
  const provider = providerForMarket(result.marketType, result.assetClass);
  const providerSymbol =
    result.marketType === 'crypto'
      ? String(result.id || canonicalSymbol.split('/')[0]?.toLowerCase() || canonicalSymbol)
      : canonicalSymbol;

  return {
    id: makeInstrumentId(result.marketType, canonicalSymbol),
    symbol: canonicalSymbol,
    canonicalSymbol,
    name: result.name,
    marketType: result.marketType,
    assetClass: result.assetClass,
    currency: result.currency || 'USD',
    exchange: result.exchange,
    logoUrl: result.logoUrl,
    isActive: result.isActive !== false,
    provider,
    providerSymbol,
    searchableAliases: [],
    isTradableDataSource: true,
    isSupported: true,
    dataCapabilities: {
      quote: false,
      candles: result.marketType !== 'options',
      news: true,
    },
  };
}

function validateInstrumentShape(raw: Instrument): Instrument | null {
  if (!raw.id || !raw.canonicalSymbol || !raw.name || !raw.provider || !raw.providerSymbol) {
    return null;
  }
  if (raw.canonicalSymbol.length < 1 || raw.canonicalSymbol.length > 24) return null;
  if (raw.name.length < 1 || raw.name.length > 120) return null;
  return raw;
}

function rankScore(query: string, instrument: Instrument): InstrumentSearchHit {
  const q = instrumentMatchKey(query);
  const symbol = instrumentMatchKey(instrument.canonicalSymbol);
  const name = instrumentMatchKey(instrument.name);
  const aliases = instrument.searchableAliases.map(instrumentMatchKey);
  const compactQ = q.replace(/[\/\s-]/g, '');
  const compactSymbol = symbol.replace(/[\/\s-]/g, '');

  if (symbol === q || compactSymbol === compactQ) {
    return { instrument, rankScore: 100, matchKind: 'exact_symbol' };
  }
  if (name === q) {
    return { instrument, rankScore: 95, matchKind: 'exact_name' };
  }
  if (aliases.includes(q)) {
    return { instrument, rankScore: 92, matchKind: 'exact_pair' };
  }
  if (symbol.includes('/') && (symbol === q || compactSymbol === compactQ)) {
    return { instrument, rankScore: 90, matchKind: 'exact_pair' };
  }
  if (symbol.startsWith(q) || compactSymbol.startsWith(compactQ)) {
    return { instrument, rankScore: 80, matchKind: 'prefix_symbol' };
  }
  if (name.startsWith(q)) {
    return { instrument, rankScore: 70, matchKind: 'prefix_name' };
  }
  if (aliases.some((a) => a.startsWith(q))) {
    return { instrument, rankScore: 65, matchKind: 'alias' };
  }
  if (name.includes(q) || aliases.some((a) => a.includes(q)) || symbol.includes(q)) {
    return { instrument, rankScore: 40, matchKind: 'fuzzy' };
  }
  return { instrument, rankScore: 10, matchKind: 'fuzzy' };
}

function confidenceFromHit(hit: InstrumentSearchHit): InstrumentConfidence {
  if (hit.matchKind === 'exact_symbol' || hit.matchKind === 'exact_name' || hit.matchKind === 'exact_pair') {
    return 'exact';
  }
  if (hit.rankScore >= 65) return 'high';
  return 'medium';
}

/** Quote probe — uses providerSymbol for commodities mapped to futures. */
export async function probeInstrumentCapabilities(
  instrument: Instrument,
): Promise<Instrument> {
  if (!instrument.isSupported || !instrument.isTradableDataSource) {
    return {
      ...instrument,
      dataCapabilities: { ...instrument.dataCapabilities, quote: false, candles: false },
    };
  }

  const quoteSymbol = instrument.canonicalSymbol;

  try {
    const result = await fetchQuoteWithMetadata(quoteSymbol, instrument.marketType);
    const price = result.quote?.price;
    if (!Number.isFinite(price) || price <= 0) {
      throw new MarketDataUnavailableError(quoteSymbol, 'quote', 'Quote price unavailable');
    }
    return {
      ...instrument,
      dataCapabilities: {
        ...instrument.dataCapabilities,
        quote: true,
        candles: instrument.dataCapabilities.candles,
      },
      lastVerifiedAt: new Date().toISOString(),
      lastQuoteKind: result.kind,
      lastQuotePrice: price,
    };
  } catch {
    return {
      ...instrument,
      dataCapabilities: { ...instrument.dataCapabilities, quote: false },
      isSupported: false,
    };
  }
}

function dedupeInstruments(items: Instrument[]): Instrument[] {
  const map = new Map<string, Instrument>();
  for (const item of items) {
    const key = item.id || instrumentMatchKey(item.canonicalSymbol);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
      continue;
    }
    // Prefer catalog entries with richer aliases
    if (item.searchableAliases.length > existing.searchableAliases.length) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

/**
 * Search instruments for UI lists (catalog + remote), ranked, without full resolve outcome.
 */
export async function searchInstruments(
  query: string,
  options?: { limit?: number; skipRemote?: boolean },
): Promise<InstrumentSearchHit[]> {
  const normalized = normalizeInstrumentQuery(query);
  if (!normalized) return [];

  const limit = options?.limit ?? 20;
  const catalogHits = searchCanonicalInstruments(normalized, limit).map((item) =>
    rankScore(normalized, item),
  );

  let remote: Instrument[] = [];
  if (!options?.skipRemote) {
    try {
      const results = await searchMarkets({ query: normalized, limit });
      remote = results
        .map(searchResultToInstrument)
        .map(validateInstrumentShape)
        .filter((x): x is Instrument => Boolean(x));
    } catch {
      remote = [];
    }
  }

  const merged = dedupeInstruments([
    ...catalogHits.map((h) => h.instrument),
    ...remote,
  ]);

  return merged
    .map((item) => rankScore(normalized, item))
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, limit);
}

/**
 * Full resolution pipeline for portfolio / Decision OS identity.
 * Never returns a creatable instrument without a successful quote capability check.
 * Never silently picks among multiple plausible matches.
 */
export async function resolveInstrument(query: string): Promise<InstrumentResolution> {
  const normalized = normalizeInstrumentQuery(query);
  if (!normalized) {
    return {
      status: 'not_found',
      reason: NOT_FOUND_REASON,
    };
  }

  const cached = cacheGet(normalized);
  if (cached) return cached;

  // Explicit unsupported demo identities
  const unsupportedHit = UNSUPPORTED_INSTRUMENT_EXAMPLES.find((item) => {
    const keys = [item.canonicalSymbol, item.name, ...item.searchableAliases].map(instrumentMatchKey);
    return keys.includes(instrumentMatchKey(normalized));
  });
  if (unsupportedHit) {
    return cacheSet(normalized, {
      status: 'unsupported',
      instrument: unsupportedHit,
      reason: UNSUPPORTED_REASON,
    });
  }

  const exact = findExactCanonicalInstrument(normalized);

  // Exact catalog identity — skip remote search (no unnecessary provider calls).
  if (exact?.isSupported && exact.isTradableDataSource) {
    const probed = await probeInstrumentCapabilities(exact);
    if (probed.dataCapabilities.quote && probed.isSupported) {
      return cacheSet(normalized, {
        status: 'resolved',
        instrument: probed,
        confidence: 'exact',
      });
    }
    return cacheSet(normalized, {
      status: 'unsupported',
      instrument: probed,
      reason: UNSUPPORTED_REASON,
    });
  }

  const hits = await searchInstruments(normalized, { limit: 12 });

  if (hits.length === 0) {
    return cacheSet(normalized, {
      status: 'not_found',
      reason: NOT_FOUND_REASON,
    });
  }

  const top = hits.slice(0, CAPABILITY_PROBE_LIMIT);
  const probed = await Promise.all(top.map((hit) => probeInstrumentCapabilities(hit.instrument)));
  const supported = probed
    .map((instrument, index) => ({
      instrument,
      hit: top[index]!,
    }))
    .filter(({ instrument }) => instrument.dataCapabilities.quote && instrument.isSupported);

  if (supported.length === 0) {
    const known = probed[0];
    if (known && !known.dataCapabilities.quote) {
      return cacheSet(normalized, {
        status: 'unsupported',
        instrument: known,
        reason: UNSUPPORTED_REASON,
      });
    }
    return cacheSet(normalized, {
      status: 'not_found',
      reason: NOT_FOUND_REASON,
    });
  }

  const best = supported[0]!;

  // Multiple usable matches → user must choose. Never guess silently.
  if (supported.length > 1) {
    return cacheSet(normalized, {
      status: 'ambiguous',
      candidates: supported.slice(0, 8).map((s) => s.instrument),
      reason: AMBIGUOUS_REASON,
    });
  }

  return cacheSet(normalized, {
    status: 'resolved',
    instrument: best.instrument,
    confidence: confidenceFromHit(best.hit),
  });
}

export function getInstrumentById(id: string): Instrument | undefined {
  return getCanonicalInstrumentById(id);
}

/** Validate a client-supplied instrument before portfolio create. */
export async function assertCreatableInstrument(
  instrument: Instrument,
): Promise<Instrument> {
  const shape = validateInstrumentShape(instrument);
  if (!shape) {
    throw new Error('Instrument identity is incomplete.');
  }
  const probed = await probeInstrumentCapabilities(shape);
  if (!probed.dataCapabilities.quote || !probed.isSupported) {
    throw new Error(UNSUPPORTED_REASON);
  }
  return probed;
}

export function requireNormalizedQuery(query: string): string {
  return assertSafeInstrumentQuery(query);
}
