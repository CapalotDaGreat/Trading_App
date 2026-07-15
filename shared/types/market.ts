export type MarketType =
  | 'stocks'
  | 'crypto'
  | 'forex'
  | 'commodities'
  | 'indices'
  | 'options';

export type AssetClass =
  | 'equity'
  | 'etf'
  | 'crypto'
  | 'forex'
  | 'commodity'
  | 'index'
  | 'option'
  | 'bond'
  | 'futures';

export type QuoteStatus = 'open' | 'closed' | 'pre' | 'post' | 'halted';

export type CandleInterval =
  | '1m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '4h'
  | '1d'
  | '1w'
  | '1M';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  marketType: MarketType;
  assetClass: AssetClass;
  currency: string;
  exchange?: string;
  logoUrl?: string;
  isActive: boolean;
  metadata?: Record<string, string | number | boolean>;
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  marketCap?: number;
  timestamp: number;
  status: QuoteStatus;
  currency: string;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketSnapshot {
  asset: Asset;
  quote: Quote;
  candles?: Candle[];
}

export interface WatchlistItem {
  assetId: string;
  symbol: string;
  addedAt: number;
  sortOrder: number;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: number;
  triggeredAt?: number;
}
