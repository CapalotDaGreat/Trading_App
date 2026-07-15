import type { AssetClass, MarketType } from '@/shared/types/market';

export interface MarketDefinition {
  type: MarketType;
  label: string;
  shortLabel: string;
  assetClasses: AssetClass[];
  defaultCurrency: string;
  tradingHours: string;
  timezone: string;
}

export const MARKET_TYPES: Record<MarketType, MarketDefinition> = {
  stocks: {
    type: 'stocks',
    label: 'Stocks',
    shortLabel: 'EQ',
    assetClasses: ['equity', 'etf'],
    defaultCurrency: 'USD',
    tradingHours: '09:30 - 16:00',
    timezone: 'America/New_York',
  },
  crypto: {
    type: 'crypto',
    label: 'Crypto',
    shortLabel: 'CRYPTO',
    assetClasses: ['crypto'],
    defaultCurrency: 'USD',
    tradingHours: '24/7',
    timezone: 'UTC',
  },
  forex: {
    type: 'forex',
    label: 'Forex',
    shortLabel: 'FX',
    assetClasses: ['forex'],
    defaultCurrency: 'USD',
    tradingHours: '24/5',
    timezone: 'America/New_York',
  },
  commodities: {
    type: 'commodities',
    label: 'Commodities',
    shortLabel: 'CMDTY',
    assetClasses: ['commodity'],
    defaultCurrency: 'USD',
    tradingHours: 'Varies',
    timezone: 'America/New_York',
  },
  indices: {
    type: 'indices',
    label: 'Indices',
    shortLabel: 'IDX',
    assetClasses: ['index'],
    defaultCurrency: 'USD',
    tradingHours: 'Varies',
    timezone: 'America/New_York',
  },
  options: {
    type: 'options',
    label: 'Options',
    shortLabel: 'OPT',
    assetClasses: ['option'],
    defaultCurrency: 'USD',
    tradingHours: '09:30 - 16:00',
    timezone: 'America/New_York',
  },
};

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  equity: 'Equity',
  etf: 'ETF',
  crypto: 'Cryptocurrency',
  forex: 'Forex Pair',
  commodity: 'Commodity',
  index: 'Index',
  option: 'Option',
  bond: 'Bond',
  futures: 'Futures',
};

export const POPULAR_SYMBOLS: Record<MarketType, string[]> = {
  stocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META'],
  crypto: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'XRP/USD'],
  forex: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'],
  commodities: ['GC=F', 'CL=F', 'SI=F', 'NG=F'],
  indices: ['SPY', 'QQQ', 'DIA', 'IWM', '^GSPC', '^IXIC'],
  options: [],
};

export const MARKET_TYPE_LIST = Object.values(MARKET_TYPES);

export function getMarketDefinition(type: MarketType): MarketDefinition {
  return MARKET_TYPES[type];
}

export function isMarketOpen(type: MarketType, date: Date = new Date()): boolean {
  if (type === 'crypto') return true;

  const day = date.getUTCDay();
  if (day === 0 || day === 6) return false;

  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;

  const marketOpen = 14 * 60 + 30;
  const marketClose = 21 * 60;

  return totalMinutes >= marketOpen && totalMinutes < marketClose;
}
