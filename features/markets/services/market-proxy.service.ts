import type { Candle, CandleInterval, MarketType, Quote } from '@/shared/types/market';
import { callProxy, canUseVendorProxy } from '@/shared/services/firebase/callable-proxy';

import type { DataSourceKind } from '../constants/data-source';

type MarketDataProvider = 'finnhub' | 'alpha-vantage' | 'sample';

export interface ProxyQuoteResult {
  quote: Quote;
  provider: MarketDataProvider;
  kind: DataSourceKind;
  fetchedAt: number;
}

export interface ProxyCandleResult {
  candles: Candle[];
  provider: MarketDataProvider;
  kind: DataSourceKind;
  fetchedAt: number;
}

export async function proxyFetchQuote(
  symbol: string,
  marketType?: MarketType,
): Promise<ProxyQuoteResult | null> {
  if (!canUseVendorProxy()) return null;
  const data = await callProxy<
    { symbol: string; marketType?: string },
    {
      quote: Quote & { symbol: string };
      provider: 'finnhub' | 'alpha-vantage';
      kind: DataSourceKind;
      fetchedAt: number;
    }
  >('marketQuote', { symbol, marketType });

  return {
    quote: {
      symbol: data.quote.symbol,
      price: data.quote.price,
      change: data.quote.change,
      changePercent: data.quote.changePercent,
      high: data.quote.high,
      low: data.quote.low,
      open: data.quote.open,
      previousClose: data.quote.previousClose,
      volume: data.quote.volume ?? 0,
      timestamp: data.quote.timestamp,
      status: data.quote.status ?? 'open',
      currency: data.quote.currency ?? 'USD',
    },
    provider: data.provider,
    kind: data.kind,
    fetchedAt: data.fetchedAt,
  };
}

export async function proxyFetchCandles(input: {
  symbol: string;
  marketType?: MarketType;
  interval: CandleInterval;
  limit?: number;
}): Promise<ProxyCandleResult | null> {
  if (!canUseVendorProxy()) return null;
  const data = await callProxy<
    { symbol: string; marketType?: string; interval: string; limit?: number },
    {
      candles: Candle[];
      provider: 'finnhub' | 'alpha-vantage';
      kind: DataSourceKind;
      fetchedAt: number;
    }
  >('marketCandles', {
    symbol: input.symbol,
    marketType: input.marketType,
    interval: input.interval,
    limit: input.limit,
  });

  return {
    candles: data.candles,
    provider: data.provider,
    kind: data.kind,
    fetchedAt: data.fetchedAt,
  };
}

export async function proxyMarketSearch(query: string): Promise<
  | {
      results: { symbol: string; description: string; type: string }[];
      provider: 'finnhub';
    }
  | null
> {
  if (!canUseVendorProxy()) return null;
  return callProxy('marketSearch', { query });
}

export async function proxyEconomicCalendar(
  from: string,
  to: string,
): Promise<{
  events: {
    event: string;
    country: string;
    impact: string;
    actual?: string;
    estimate?: string;
    prev?: string;
    unit?: string;
    time?: string;
  }[];
  provider: 'finnhub';
} | null> {
  if (!canUseVendorProxy()) return null;
  return callProxy('economicCalendar', { from, to });
}
