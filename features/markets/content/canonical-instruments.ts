import type { Instrument } from '@/features/markets/types/instrument.types';
import { instrumentMatchKey } from '@/features/markets/services/instrument-normalize.service';

type InstrumentDraft = Omit<
  Instrument,
  'isActive' | 'isTradableDataSource' | 'isSupported' | 'dataCapabilities' | 'searchableAliases'
> & {
  searchableAliases?: string[];
  dataCapabilities?: Partial<Instrument['dataCapabilities']>;
  isActive?: boolean;
  isTradableDataSource?: boolean;
  isSupported?: boolean;
};

function instrument(partial: InstrumentDraft): Instrument {
  const {
    searchableAliases,
    dataCapabilities,
    isActive = true,
    isTradableDataSource = true,
    isSupported = true,
    ...rest
  } = partial;

  return {
    ...rest,
    isActive,
    isTradableDataSource,
    isSupported,
    searchableAliases: searchableAliases ?? [],
    dataCapabilities: {
      quote: true,
      candles: true,
      fundamentals: rest.marketType === 'stocks' || rest.marketType === 'indices',
      news: true,
      ...dataCapabilities,
    },
  };
}

/** Curated instruments — exact/alias layer + demo/offline backbone. */
export const CANONICAL_INSTRUMENTS: Instrument[] = [
  instrument({
    id: 'equity:AAPL',
    symbol: 'AAPL',
    canonicalSymbol: 'AAPL',
    name: 'Apple Inc.',
    marketType: 'stocks',
    assetClass: 'equity',
    currency: 'USD',
    exchange: 'NASDAQ',
    exchangeCode: 'XNAS',
    country: 'US',
    provider: 'finnhub',
    providerSymbol: 'AAPL',
    searchableAliases: ['Apple', 'Apple Inc', 'Apple Inc.'],
  }),
  instrument({
    id: 'equity:MSFT',
    symbol: 'MSFT',
    canonicalSymbol: 'MSFT',
    name: 'Microsoft Corporation',
    marketType: 'stocks',
    assetClass: 'equity',
    currency: 'USD',
    exchange: 'NASDAQ',
    provider: 'finnhub',
    providerSymbol: 'MSFT',
    searchableAliases: ['Microsoft', 'Microsoft Corp'],
  }),
  instrument({
    id: 'equity:GOOGL',
    symbol: 'GOOGL',
    canonicalSymbol: 'GOOGL',
    name: 'Alphabet Inc.',
    marketType: 'stocks',
    assetClass: 'equity',
    currency: 'USD',
    exchange: 'NASDAQ',
    provider: 'finnhub',
    providerSymbol: 'GOOGL',
    searchableAliases: ['Google', 'Alphabet', 'GOOG'],
  }),
  instrument({
    id: 'equity:AMZN',
    symbol: 'AMZN',
    canonicalSymbol: 'AMZN',
    name: 'Amazon.com Inc.',
    marketType: 'stocks',
    assetClass: 'equity',
    currency: 'USD',
    exchange: 'NASDAQ',
    provider: 'finnhub',
    providerSymbol: 'AMZN',
    searchableAliases: ['Amazon'],
  }),
  instrument({
    id: 'equity:NVDA',
    symbol: 'NVDA',
    canonicalSymbol: 'NVDA',
    name: 'NVIDIA Corporation',
    marketType: 'stocks',
    assetClass: 'equity',
    currency: 'USD',
    exchange: 'NASDAQ',
    provider: 'finnhub',
    providerSymbol: 'NVDA',
    searchableAliases: ['Nvidia', 'NVIDIA'],
  }),
  instrument({
    id: 'equity:TSLA',
    symbol: 'TSLA',
    canonicalSymbol: 'TSLA',
    name: 'Tesla Inc.',
    marketType: 'stocks',
    assetClass: 'equity',
    currency: 'USD',
    exchange: 'NASDAQ',
    provider: 'finnhub',
    providerSymbol: 'TSLA',
    searchableAliases: ['Tesla'],
  }),
  instrument({
    id: 'equity:META',
    symbol: 'META',
    canonicalSymbol: 'META',
    name: 'Meta Platforms Inc.',
    marketType: 'stocks',
    assetClass: 'equity',
    currency: 'USD',
    exchange: 'NASDAQ',
    provider: 'finnhub',
    providerSymbol: 'META',
    searchableAliases: ['Meta', 'Facebook'],
  }),
  instrument({
    id: 'etf:SPY',
    symbol: 'SPY',
    canonicalSymbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    marketType: 'indices',
    assetClass: 'etf',
    currency: 'USD',
    exchange: 'NYSE Arca',
    provider: 'finnhub',
    providerSymbol: 'SPY',
    searchableAliases: ['S&P 500', 'S&P500', 'SPX', 'S and P 500', 'Spy ETF'],
  }),
  instrument({
    id: 'etf:QQQ',
    symbol: 'QQQ',
    canonicalSymbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    marketType: 'indices',
    assetClass: 'etf',
    currency: 'USD',
    exchange: 'NASDAQ',
    provider: 'finnhub',
    providerSymbol: 'QQQ',
    searchableAliases: ['Nasdaq 100', 'NASDAQ 100', 'NDX', 'QQQ ETF'],
  }),
  instrument({
    id: 'etf:DIA',
    symbol: 'DIA',
    canonicalSymbol: 'DIA',
    name: 'SPDR Dow Jones Industrial Average ETF',
    marketType: 'indices',
    assetClass: 'etf',
    currency: 'USD',
    exchange: 'NYSE Arca',
    provider: 'finnhub',
    providerSymbol: 'DIA',
    searchableAliases: ['Dow Jones', 'Dow', 'DJI', 'DJIA'],
  }),
  instrument({
    id: 'etf:IWM',
    symbol: 'IWM',
    canonicalSymbol: 'IWM',
    name: 'iShares Russell 2000 ETF',
    marketType: 'indices',
    assetClass: 'etf',
    currency: 'USD',
    exchange: 'NYSE Arca',
    provider: 'finnhub',
    providerSymbol: 'IWM',
    searchableAliases: ['Russell 2000'],
  }),
  instrument({
    id: 'crypto:BTC-USD',
    symbol: 'BTC/USD',
    canonicalSymbol: 'BTC/USD',
    name: 'Bitcoin',
    marketType: 'crypto',
    assetClass: 'crypto',
    currency: 'USD',
    provider: 'coingecko',
    providerSymbol: 'bitcoin',
    searchableAliases: ['BTC', 'Bitcoin', 'BTCUSD', 'BTC-USD'],
  }),
  instrument({
    id: 'crypto:ETH-USD',
    symbol: 'ETH/USD',
    canonicalSymbol: 'ETH/USD',
    name: 'Ethereum',
    marketType: 'crypto',
    assetClass: 'crypto',
    currency: 'USD',
    provider: 'coingecko',
    providerSymbol: 'ethereum',
    searchableAliases: ['ETH', 'Ethereum', 'ETHUSD', 'ETH-USD'],
  }),
  instrument({
    id: 'crypto:SOL-USD',
    symbol: 'SOL/USD',
    canonicalSymbol: 'SOL/USD',
    name: 'Solana',
    marketType: 'crypto',
    assetClass: 'crypto',
    currency: 'USD',
    provider: 'coingecko',
    providerSymbol: 'solana',
    searchableAliases: ['SOL', 'Solana', 'SOLUSD'],
  }),
  instrument({
    id: 'crypto:BNB-USD',
    symbol: 'BNB/USD',
    canonicalSymbol: 'BNB/USD',
    name: 'BNB',
    marketType: 'crypto',
    assetClass: 'crypto',
    currency: 'USD',
    provider: 'coingecko',
    providerSymbol: 'binancecoin',
    searchableAliases: ['BNB', 'Binance Coin'],
  }),
  instrument({
    id: 'crypto:XRP-USD',
    symbol: 'XRP/USD',
    canonicalSymbol: 'XRP/USD',
    name: 'XRP',
    marketType: 'crypto',
    assetClass: 'crypto',
    currency: 'USD',
    provider: 'coingecko',
    providerSymbol: 'ripple',
    searchableAliases: ['XRP', 'Ripple'],
  }),
  instrument({
    id: 'forex:EUR-USD',
    symbol: 'EUR/USD',
    canonicalSymbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    marketType: 'forex',
    assetClass: 'forex',
    currency: 'USD',
    provider: 'exchange-rate-api',
    providerSymbol: 'EUR/USD',
    searchableAliases: ['EURUSD', 'Euro', 'EUR USD'],
  }),
  instrument({
    id: 'forex:GBP-USD',
    symbol: 'GBP/USD',
    canonicalSymbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    marketType: 'forex',
    assetClass: 'forex',
    currency: 'USD',
    provider: 'exchange-rate-api',
    providerSymbol: 'GBP/USD',
    searchableAliases: ['GBPUSD', 'Cable', 'Pound'],
  }),
  instrument({
    id: 'forex:USD-JPY',
    symbol: 'USD/JPY',
    canonicalSymbol: 'USD/JPY',
    name: 'US Dollar / Japanese Yen',
    marketType: 'forex',
    assetClass: 'forex',
    currency: 'JPY',
    provider: 'exchange-rate-api',
    providerSymbol: 'USD/JPY',
    searchableAliases: ['USDJPY'],
  }),
  instrument({
    id: 'forex:USD-CHF',
    symbol: 'USD/CHF',
    canonicalSymbol: 'USD/CHF',
    name: 'US Dollar / Swiss Franc',
    marketType: 'forex',
    assetClass: 'forex',
    currency: 'CHF',
    provider: 'exchange-rate-api',
    providerSymbol: 'USD/CHF',
    searchableAliases: ['USDCHF'],
  }),
  instrument({
    id: 'forex:EUR-CHF',
    symbol: 'EUR/CHF',
    canonicalSymbol: 'EUR/CHF',
    name: 'Euro / Swiss Franc',
    marketType: 'forex',
    assetClass: 'forex',
    currency: 'CHF',
    provider: 'exchange-rate-api',
    providerSymbol: 'EUR/CHF',
    searchableAliases: ['EURCHF'],
  }),
  instrument({
    id: 'forex:AUD-USD',
    symbol: 'AUD/USD',
    canonicalSymbol: 'AUD/USD',
    name: 'Australian Dollar / US Dollar',
    marketType: 'forex',
    assetClass: 'forex',
    currency: 'USD',
    provider: 'exchange-rate-api',
    providerSymbol: 'AUD/USD',
    searchableAliases: ['AUDUSD'],
  }),
  instrument({
    id: 'forex:USD-CAD',
    symbol: 'USD/CAD',
    canonicalSymbol: 'USD/CAD',
    name: 'US Dollar / Canadian Dollar',
    marketType: 'forex',
    assetClass: 'forex',
    currency: 'CAD',
    provider: 'exchange-rate-api',
    providerSymbol: 'USD/CAD',
    searchableAliases: ['USDCAD'],
  }),
  instrument({
    id: 'commodity:XAU-USD',
    symbol: 'XAU/USD',
    canonicalSymbol: 'XAU/USD',
    name: 'Gold',
    marketType: 'commodities',
    assetClass: 'commodity',
    currency: 'USD',
    provider: 'finnhub',
    providerSymbol: 'GC=F',
    searchableAliases: ['Gold', 'XAUUSD', 'XAU', 'Gold Spot'],
  }),
  instrument({
    id: 'commodity:XAG-USD',
    symbol: 'XAG/USD',
    canonicalSymbol: 'XAG/USD',
    name: 'Silver',
    marketType: 'commodities',
    assetClass: 'commodity',
    currency: 'USD',
    provider: 'finnhub',
    providerSymbol: 'SI=F',
    searchableAliases: ['Silver', 'XAGUSD', 'XAG'],
  }),
  instrument({
    id: 'commodity:CL-F',
    symbol: 'CL=F',
    canonicalSymbol: 'CL=F',
    name: 'WTI Crude Oil',
    marketType: 'commodities',
    assetClass: 'commodity',
    currency: 'USD',
    provider: 'finnhub',
    providerSymbol: 'CL=F',
    searchableAliases: ['Oil', 'WTI', 'Crude', 'Crude Oil', 'WTI Crude'],
  }),
  instrument({
    id: 'commodity:BZ-F',
    symbol: 'BZ=F',
    canonicalSymbol: 'BZ=F',
    name: 'Brent Crude Oil',
    marketType: 'commodities',
    assetClass: 'commodity',
    currency: 'USD',
    provider: 'finnhub',
    providerSymbol: 'BZ=F',
    searchableAliases: ['Brent', 'Brent Crude', 'Brent Oil'],
  }),
  instrument({
    id: 'commodity:HG-F',
    symbol: 'HG=F',
    canonicalSymbol: 'HG=F',
    name: 'Copper',
    marketType: 'commodities',
    assetClass: 'commodity',
    currency: 'USD',
    provider: 'finnhub',
    providerSymbol: 'HG=F',
    searchableAliases: ['Copper'],
  }),
];

/** Example unsupported identity — known name, no tradable data source in-app. */
export const UNSUPPORTED_INSTRUMENT_EXAMPLES: Instrument[] = [
  instrument({
    id: 'other:FAKE-UNSUPPORTED',
    symbol: 'FAKEUNSUP',
    canonicalSymbol: 'FAKEUNSUP',
    name: 'Unsupported Demo Instrument',
    marketType: 'stocks',
    assetClass: 'equity',
    currency: 'USD',
    provider: 'internal',
    providerSymbol: 'FAKEUNSUP',
    isSupported: false,
    isTradableDataSource: false,
    searchableAliases: ['Unsupported Demo Instrument'],
    dataCapabilities: { quote: false, candles: false },
  }),
];

const byId = new Map<string, Instrument>();
const byKey = new Map<string, Instrument>();

function indexInstrument(item: Instrument) {
  byId.set(item.id, item);
  const keys = [
    item.canonicalSymbol,
    item.symbol,
    item.providerSymbol,
    item.name,
    ...item.searchableAliases,
  ];
  for (const key of keys) {
    const k = instrumentMatchKey(key);
    if (!byKey.has(k)) byKey.set(k, item);
  }
}

for (const item of CANONICAL_INSTRUMENTS) {
  indexInstrument(item);
}

export function getCanonicalInstrumentById(id: string): Instrument | undefined {
  return byId.get(id);
}

/** Exact symbol / alias / name match against the curated catalog. */
export function findExactCanonicalInstrument(normalizedQuery: string): Instrument | undefined {
  return byKey.get(instrumentMatchKey(normalizedQuery));
}

export function listCanonicalInstruments(): Instrument[] {
  return CANONICAL_INSTRUMENTS.slice();
}

/** Prefix / contains search over catalog (for ranking before remote). */
export function searchCanonicalInstruments(normalizedQuery: string, limit = 20): Instrument[] {
  const q = instrumentMatchKey(normalizedQuery);
  if (!q) return [];
  const scored: { item: Instrument; score: number }[] = [];

  for (const item of CANONICAL_INSTRUMENTS) {
    const symbol = instrumentMatchKey(item.canonicalSymbol);
    const name = instrumentMatchKey(item.name);
    const aliases = item.searchableAliases.map(instrumentMatchKey);
    let score = 0;
    if (symbol === q || aliases.includes(q) || name === q) score = 100;
    else if (symbol.startsWith(q)) score = 80;
    else if (name.startsWith(q)) score = 70;
    else if (aliases.some((a) => a.startsWith(q))) score = 65;
    else if (symbol.includes(q) || name.includes(q) || aliases.some((a) => a.includes(q))) score = 40;
    if (score > 0) scored.push({ item, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
}
