import type { Asset, AssetClass, MarketType } from '@/shared/types/market';

import type { DataSourceKind } from '@/features/markets/constants/data-source';

/** Market-data providers used for instrument identity and quotes. */
export type InstrumentProvider =
  | 'finnhub'
  | 'alpha-vantage'
  | 'coingecko'
  | 'exchange-rate-api'
  | 'internal'
  | 'other';

export type InstrumentConfidence = 'exact' | 'high' | 'medium';

export interface InstrumentDataCapabilities {
  quote: boolean;
  candles: boolean;
  fundamentals?: boolean;
  news?: boolean;
}

/**
 * Canonical market instrument — shared identity for Portfolio, Decision OS, charts, AI.
 * Extends Asset fields; never trust raw user text as an instrument id.
 */
export interface Instrument extends Asset {
  /** Stable catalog / resolver id, e.g. equity:AAPL */
  id: string;
  /** Display / portfolio symbol (canonical form). */
  symbol: string;
  canonicalSymbol: string;
  provider: InstrumentProvider;
  /** Symbol string sent to the provider quote/candle APIs. */
  providerSymbol: string;
  searchableAliases: string[];
  isTradableDataSource: boolean;
  isSupported: boolean;
  dataCapabilities: InstrumentDataCapabilities;
  exchangeCode?: string;
  country?: string;
  lastVerifiedAt?: string;
  /** Honesty metadata from last capability probe (optional). */
  lastQuoteKind?: DataSourceKind;
  lastQuotePrice?: number;
}

export type InstrumentResolution =
  | {
      status: 'resolved';
      instrument: Instrument;
      confidence: InstrumentConfidence;
    }
  | {
      status: 'ambiguous';
      candidates: Instrument[];
      reason?: string;
    }
  | {
      status: 'unsupported';
      instrument?: Instrument;
      reason: string;
    }
  | {
      status: 'not_found';
      reason: string;
    };

export interface InstrumentSearchHit {
  instrument: Instrument;
  rankScore: number;
  matchKind: 'exact_symbol' | 'exact_name' | 'exact_pair' | 'prefix_symbol' | 'prefix_name' | 'alias' | 'fuzzy';
}

/** Display labels aligned with product copy (Equity → Stock). */
export const INSTRUMENT_CLASS_DISPLAY: Record<AssetClass, string> = {
  equity: 'Stock',
  etf: 'ETF',
  crypto: 'Crypto',
  forex: 'Forex',
  commodity: 'Commodity',
  metal: 'Metal',
  index: 'Index',
  option: 'Option',
  bond: 'Bond',
  futures: 'Futures',
};

export const INSTRUMENT_RESOLUTION_COPY = {
  couldNotVerify: "We couldn't verify this instrument.",
  reliableDataOnly:
    'TradeInsight can only manage assets for which reliable market data is available.',
  whichAsset: 'Which asset did you mean?',
  priceUnavailable: 'Price unavailable',
  neverGuess: 'Never guess silently — pick the asset you mean.',
} as const;

const COUNTRY_LABELS: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  EU: 'Eurozone',
  JP: 'Japan',
  CA: 'Canada',
  AU: 'Australia',
  CH: 'Switzerland',
  HK: 'Hong Kong',
  DE: 'Germany',
  FR: 'France',
};

export function instrumentCountryLabel(country?: string): string | undefined {
  if (!country?.trim()) return undefined;
  const trimmed = country.trim();
  if (trimmed.length > 3) return trimmed;
  return COUNTRY_LABELS[trimmed.toUpperCase()] ?? trimmed;
}

/** True only for a real, positive market price — never 0 / NaN / invented. */
export function isUsableMarketPrice(price: unknown): boolean {
  return typeof price === 'number' && Number.isFinite(price) && price > 0;
}

export function instrumentClassLabel(assetClass: AssetClass): string {
  return INSTRUMENT_CLASS_DISPLAY[assetClass] ?? assetClass;
}

export function instrumentsEqual(a: Pick<Instrument, 'id' | 'canonicalSymbol'>, b: Pick<Instrument, 'id' | 'canonicalSymbol'>): boolean {
  if (a.id && b.id && a.id === b.id) return true;
  return a.canonicalSymbol.toUpperCase() === b.canonicalSymbol.toUpperCase();
}

export type MarketTypeForInstrument = MarketType;
