import {
  findExactCanonicalInstrument,
  getCanonicalInstrumentById,
} from '@/features/markets/content/canonical-instruments';
import {
  instrumentMatchKey,
  normalizeInstrumentQuery,
} from '@/features/markets/services/instrument-normalize.service';
import type { Instrument, InstrumentProvider } from '@/features/markets/types/instrument.types';
import type { Asset, AssetClass, MarketType } from '@/shared/types/market';

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

const METAL_BASES = new Set(['XAU', 'XAG']);

export interface MarketIdentity {
  displaySymbol: string;
  quoteSymbol: string;
  marketType: MarketType;
  assetClass: AssetClass;
  name: string;
  exchange?: string;
  country?: string;
  provider?: InstrumentProvider;
  instrument?: Instrument;
}

/**
 * Sync catalog lookup — the shared identity used by Markets, Charts, Research,
 * Decision, Portfolio, Alerts, AI, Journal, and Replay. Never treats raw user
 * text as an instrument id.
 */
export function lookupCanonicalInstrument(raw: string): Instrument | undefined {
  const normalized = normalizeInstrumentQuery(raw);
  if (!normalized) return undefined;
  return findExactCanonicalInstrument(normalized);
}

export function lookupCanonicalInstrumentById(id: string): Instrument | undefined {
  return getCanonicalInstrumentById(id);
}

function inferMarketTypeFromSymbol(symbol: string): MarketType {
  if (symbol.includes('/')) {
    const [base = ''] = symbol.split('/');
    const upper = base.toUpperCase();
    if (CRYPTO_BASES.has(upper)) return 'crypto';
    if (METAL_BASES.has(upper)) return 'commodities';
    return 'forex';
  }
  if (symbol.endsWith('=F')) return 'commodities';
  if (symbol.startsWith('^')) return 'indices';
  return 'stocks';
}

function inferAssetClass(type: MarketType): AssetClass {
  if (type === 'crypto') return 'crypto';
  if (type === 'forex') return 'forex';
  if (type === 'commodities') return 'commodity';
  if (type === 'indices') return 'index';
  if (type === 'options') return 'option';
  return 'equity';
}

/**
 * Canonical market identity for a user-facing or stored symbol.
 * Quote/candle fetches must use `quoteSymbol`; UI must use `displaySymbol`.
 */
export function resolveMarketIdentity(symbol: string, marketType?: MarketType): MarketIdentity {
  const catalog = lookupCanonicalInstrument(symbol);
  if (catalog) {
    return {
      displaySymbol: catalog.canonicalSymbol,
      quoteSymbol: catalog.providerSymbol || catalog.canonicalSymbol,
      marketType: catalog.marketType,
      assetClass: catalog.assetClass,
      name: catalog.name,
      exchange: catalog.exchange,
      country: catalog.country,
      provider: catalog.provider,
      instrument: catalog,
    };
  }

  const trimmed = symbol.trim();
  const type = marketType ?? inferMarketTypeFromSymbol(trimmed);
  return {
    displaySymbol: trimmed,
    quoteSymbol: trimmed,
    marketType: type,
    assetClass: inferAssetClass(type),
    name: trimmed,
  };
}

/** Provider symbol for live quotes — never invent a ticker. */
export function quoteSymbolForHolding(holding: {
  symbol: string;
  canonicalSymbol?: string;
  providerSymbol?: string;
  instrumentId?: string;
}): string {
  if (holding.instrumentId) {
    const byId = lookupCanonicalInstrumentById(holding.instrumentId);
    if (byId?.providerSymbol) return byId.providerSymbol;
  }
  if (holding.providerSymbol?.trim()) return holding.providerSymbol.trim();
  const catalog = lookupCanonicalInstrument(holding.canonicalSymbol ?? holding.symbol);
  return catalog?.providerSymbol ?? holding.symbol;
}

export function instrumentToAsset(instrument: Instrument): Asset {
  return {
    id: instrument.id,
    symbol: instrument.canonicalSymbol,
    name: instrument.name,
    marketType: instrument.marketType,
    assetClass: instrument.assetClass,
    currency: instrument.currency,
    exchange: instrument.exchange,
    logoUrl: instrument.logoUrl,
    isActive: instrument.isActive,
  };
}

export function sameInstrumentKey(a: string, b: string): boolean {
  return instrumentMatchKey(a) === instrumentMatchKey(b);
}
