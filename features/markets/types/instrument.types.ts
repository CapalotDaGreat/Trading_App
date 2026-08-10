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
  index: 'Index',
  option: 'Option',
  bond: 'Bond',
  futures: 'Futures',
};

export function instrumentClassLabel(assetClass: AssetClass): string {
  return INSTRUMENT_CLASS_DISPLAY[assetClass] ?? assetClass;
}

export function instrumentsEqual(a: Pick<Instrument, 'id' | 'canonicalSymbol'>, b: Pick<Instrument, 'id' | 'canonicalSymbol'>): boolean {
  if (a.id && b.id && a.id === b.id) return true;
  return a.canonicalSymbol.toUpperCase() === b.canonicalSymbol.toUpperCase();
}

export type MarketTypeForInstrument = MarketType;
