import { apiRequest, ApiError } from '@/shared/services/api/api-client';
import type { Asset, Candle, CandleInterval, MarketType, Quote } from '@/shared/types/market';

const FINNHUB_KEY = process.env.EXPO_PUBLIC_FINNHUB_API_KEY ?? '';
const ALPHA_VANTAGE_KEY = process.env.EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY ?? '';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const EXCHANGE_RATE_BASE = 'https://api.open.er-api.com/v6/latest';
const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

const CRYPTO_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  LTC: 'litecoin',
};

const CRYPTO_NAME_MAP: Record<string, string> = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  solana: 'Solana',
  binancecoin: 'BNB',
  ripple: 'XRP',
};

export interface MarketDataRequest {
  symbol: string;
  marketType: MarketType;
}

export interface CandlesRequest extends MarketDataRequest {
  interval: CandleInterval;
  limit?: number;
}

function parseCryptoSymbol(symbol: string): { base: string; quote: string } {
  const normalized = symbol.replace('/', '').toUpperCase();
  if (normalized.includes('USD')) {
    const base = normalized.replace('USD', '');
    return { base, quote: 'USD' };
  }
  return { base: normalized, quote: 'USD' };
}

function detectMarketType(symbol: string): MarketType {
  if (symbol.includes('/')) {
    const [base] = symbol.split('/');
    if (CRYPTO_ID_MAP[base.toUpperCase()]) return 'crypto';
    return 'forex';
  }
  if (symbol.startsWith('^') || symbol.endsWith('=F')) {
    return symbol.endsWith('=F') ? 'commodities' : 'indices';
  }
  return 'stocks';
}

function getCryptoId(symbol: string): string {
  const { base } = parseCryptoSymbol(symbol);
  return CRYPTO_ID_MAP[base] ?? base.toLowerCase();
}

function intervalToDays(interval: CandleInterval, limit: number): number {
  const candlesPerDay: Record<CandleInterval, number> = {
    '1m': 1440,
    '5m': 288,
    '15m': 96,
    '30m': 48,
    '1h': 24,
    '4h': 6,
    '1d': 1,
    '1w': 1 / 7,
    '1M': 1 / 30,
  };
  const perDay = candlesPerDay[interval];
  return Math.max(1, Math.ceil(limit / perDay) + 1);
}

function finnhubResolution(interval: CandleInterval): string {
  const map: Record<CandleInterval, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
    '1w': 'W',
    '1M': 'M',
  };
  return map[interval];
}

function alphaInterval(interval: CandleInterval): string {
  const map: Record<CandleInterval, string> = {
    '1m': '1min',
    '5m': '5min',
    '15m': '15min',
    '30m': '30min',
    '1h': '60min',
    '4h': '60min',
    '1d': 'daily',
    '1w': 'weekly',
    '1M': 'monthly',
  };
  return map[interval];
}

async function fetchCryptoQuote(symbol: string): Promise<Quote> {
  const coinId = getCryptoId(symbol);
  const data = await apiRequest<{
    [id: string]: {
      usd: number;
      usd_24h_change: number;
      usd_24h_vol: number;
      usd_market_cap: number;
    };
  }>(`${COINGECKO_BASE}/simple/price`, {
    skipAuth: true,
    rateLimitKey: 'coingecko',
    params: {
      ids: coinId,
      vs_currencies: 'usd',
      include_24hr_change: true,
      include_24hr_vol: true,
      include_market_cap: true,
    },
  });

  const coin = data[coinId];
  if (!coin) {
    throw new ApiError(`Crypto asset not found: ${symbol}`, 404);
  }

  const changePercent = coin.usd_24h_change ?? 0;
  const price = coin.usd;
  const change = (price * changePercent) / 100;
  const previousClose = price - change;

  return {
    symbol,
    price,
    change,
    changePercent,
    open: previousClose,
    high: price,
    low: price,
    previousClose,
    volume: coin.usd_24h_vol ?? 0,
    marketCap: coin.usd_market_cap,
    timestamp: Date.now(),
    status: 'open',
    currency: 'USD',
  };
}

async function fetchForexQuote(symbol: string): Promise<Quote> {
  const [base, quote = 'USD'] = symbol.split('/');
  const data = await apiRequest<{
    rates: Record<string, number>;
    time_last_update_unix: number;
  }>(`${EXCHANGE_RATE_BASE}/${base}`, {
    skipAuth: true,
    rateLimitKey: 'forex',
  });

  const rate = data.rates[quote];
  if (!rate) {
    throw new ApiError(`Forex pair not found: ${symbol}`, 404);
  }

  const inverseData = await apiRequest<{
    rates: Record<string, number>;
  }>(`${EXCHANGE_RATE_BASE}/${quote}`, {
    skipAuth: true,
    rateLimitKey: 'forex',
  });

  const previousRate = inverseData.rates[base];
  const previousClose = previousRate ? 1 / previousRate : rate;
  const change = rate - previousClose;
  const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

  return {
    symbol,
    price: rate,
    change,
    changePercent,
    open: previousClose,
    high: Math.max(rate, previousClose),
    low: Math.min(rate, previousClose),
    previousClose,
    volume: 0,
    timestamp: (data.time_last_update_unix ?? Date.now() / 1000) * 1000,
    status: 'open',
    currency: quote,
  };
}

async function fetchFinnhubQuote(symbol: string): Promise<Quote | null> {
  if (!FINNHUB_KEY) return null;

  const cleanSymbol = symbol.replace('^', '');
  const data = await apiRequest<{
    c: number;
    d: number;
    dp: number;
    h: number;
    l: number;
    o: number;
    pc: number;
    v: number;
    t: number;
  }>(`${FINNHUB_BASE}/quote`, {
    skipAuth: true,
    rateLimitKey: 'finnhub',
    params: { symbol: cleanSymbol, token: FINNHUB_KEY },
  });

  if (!data.c) return null;

  return {
    symbol,
    price: data.c,
    change: data.d ?? 0,
    changePercent: data.dp ?? 0,
    open: data.o ?? data.c,
    high: data.h ?? data.c,
    low: data.l ?? data.c,
    previousClose: data.pc ?? data.c,
    volume: data.v ?? 0,
    timestamp: (data.t ?? Date.now() / 1000) * 1000,
    status: 'open',
    currency: 'USD',
  };
}

async function fetchAlphaVantageQuote(symbol: string): Promise<Quote> {
  if (!ALPHA_VANTAGE_KEY) {
    throw new ApiError('No stock API key configured', 503);
  }

  const data = await apiRequest<{
    'Global Quote'?: {
      '01. symbol': string;
      '05. price': string;
      '09. change': string;
      '10. change percent': string;
      '02. open': string;
      '03. high': string;
      '04. low': string;
      '08. previous close': string;
      '06. volume': string;
    };
    Note?: string;
  }>(ALPHA_VANTAGE_BASE, {
    skipAuth: true,
    rateLimitKey: 'alphavantage',
    params: {
      function: 'GLOBAL_QUOTE',
      symbol: symbol.replace('^', ''),
      apikey: ALPHA_VANTAGE_KEY,
    },
  });

  if (data.Note) {
    throw new ApiError(data.Note, 429);
  }

  const quote = data['Global Quote'];
  if (!quote) {
    throw new ApiError(`Stock quote not found: ${symbol}`, 404);
  }

  const price = parseFloat(quote['05. price']);
  const change = parseFloat(quote['09. change']);
  const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

  return {
    symbol,
    price,
    change,
    changePercent,
    open: parseFloat(quote['02. open']),
    high: parseFloat(quote['03. high']),
    low: parseFloat(quote['04. low']),
    previousClose: parseFloat(quote['08. previous close']),
    volume: parseFloat(quote['06. volume']),
    timestamp: Date.now(),
    status: 'open',
    currency: 'USD',
  };
}

async function fetchStockQuote(symbol: string): Promise<Quote> {
  const finnhubQuote = await fetchFinnhubQuote(symbol);
  if (finnhubQuote) return finnhubQuote;
  return fetchAlphaVantageQuote(symbol);
}

export async function fetchQuote(symbol: string, marketType?: MarketType): Promise<Quote> {
  const type = marketType ?? detectMarketType(symbol);

  switch (type) {
    case 'crypto':
      return fetchCryptoQuote(symbol);
    case 'forex':
      return fetchForexQuote(symbol);
    case 'stocks':
    case 'indices':
    case 'commodities':
      return fetchStockQuote(symbol);
    default:
      return fetchStockQuote(symbol);
  }
}

async function fetchCryptoCandles(
  symbol: string,
  interval: CandleInterval,
  limit: number,
): Promise<Candle[]> {
  const coinId = getCryptoId(symbol);
  const days = intervalToDays(interval, limit);

  const data = await apiRequest<{
    prices: [number, number][];
    total_volumes: [number, number][];
  }>(`${COINGECKO_BASE}/coins/${coinId}/market_chart`, {
    skipAuth: true,
    rateLimitKey: 'coingecko',
    params: {
      vs_currency: 'usd',
      days: String(days),
    },
  });

  const volumes = new Map(data.total_volumes.map(([ts, vol]) => [ts, vol]));
  const candles: Candle[] = data.prices.map(([timestamp, price], index) => {
    const prevPrice = index > 0 ? data.prices[index - 1][1] : price;
    return {
      timestamp,
      open: prevPrice,
      high: Math.max(prevPrice, price),
      low: Math.min(prevPrice, price),
      close: price,
      volume: volumes.get(timestamp) ?? 0,
    };
  });

  return candles.slice(-limit);
}

async function fetchFinnhubCandles(
  symbol: string,
  interval: CandleInterval,
  limit: number,
): Promise<Candle[] | null> {
  if (!FINNHUB_KEY) return null;

  const cleanSymbol = symbol.replace('^', '');
  const resolution = finnhubResolution(interval);
  const to = Math.floor(Date.now() / 1000);
  const from = to - intervalToDays(interval, limit) * 86400;

  const data = await apiRequest<{
    s: string;
    t?: number[];
    o?: number[];
    h?: number[];
    l?: number[];
    c?: number[];
    v?: number[];
  }>(`${FINNHUB_BASE}/stock/candle`, {
    skipAuth: true,
    rateLimitKey: 'finnhub',
    params: {
      symbol: cleanSymbol,
      resolution,
      from: String(from),
      to: String(to),
      token: FINNHUB_KEY,
    },
  });

  if (data.s !== 'ok' || !data.t?.length) return null;

  return data.t.map((timestamp, i) => ({
    timestamp: timestamp * 1000,
    open: data.o![i],
    high: data.h![i],
    low: data.l![i],
    close: data.c![i],
    volume: data.v![i] ?? 0,
  })).slice(-limit);
}

async function fetchAlphaVantageCandles(
  symbol: string,
  interval: CandleInterval,
  limit: number,
): Promise<Candle[]> {
  if (!ALPHA_VANTAGE_KEY) {
    throw new ApiError('No stock API key configured for candles', 503);
  }

  const isIntraday = ['1m', '5m', '15m', '30m', '1h', '4h'].includes(interval);
  const fn = isIntraday ? 'TIME_SERIES_INTRADAY' : 'TIME_SERIES_DAILY';
  const params: Record<string, string> = {
    function: fn,
    symbol: symbol.replace('^', ''),
    apikey: ALPHA_VANTAGE_KEY,
    outputsize: 'compact',
  };

  if (isIntraday) {
    params.interval = alphaInterval(interval);
  }

  const data = await apiRequest<Record<string, Record<string, string>>>(ALPHA_VANTAGE_BASE, {
    skipAuth: true,
    rateLimitKey: 'alphavantage',
    params,
  });

  const seriesKey = Object.keys(data).find((k) => k.includes('Time Series'));
  if (!seriesKey || !data[seriesKey]) {
    throw new ApiError(`Candle data not found for ${symbol}`, 404);
  }

  const series = data[seriesKey] as unknown as Record<string, Record<string, string>>;
  const candles: Candle[] = Object.entries(series)
    .map(([dateStr, values]) => ({
      timestamp: new Date(dateStr).getTime(),
      open: parseFloat(values['1. open'] ?? '0'),
      high: parseFloat(values['2. high'] ?? '0'),
      low: parseFloat(values['3. low'] ?? '0'),
      close: parseFloat(values['4. close'] ?? '0'),
      volume: parseFloat(values['5. volume'] ?? '0'),
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-limit);

  return candles;
}

async function fetchForexCandles(
  symbol: string,
  interval: CandleInterval,
  limit: number,
): Promise<Candle[]> {
  const quote = await fetchForexQuote(symbol);
  const now = Date.now();
  const msPerCandle: Record<CandleInterval, number> = {
    '1m': 60_000,
    '5m': 300_000,
    '15m': 900_000,
    '30m': 1_800_000,
    '1h': 3_600_000,
    '4h': 14_400_000,
    '1d': 86_400_000,
    '1w': 604_800_000,
    '1M': 2_592_000_000,
  };

  const step = msPerCandle[interval];
  const candles: Candle[] = [];

  for (let i = limit - 1; i >= 0; i--) {
    const timestamp = now - i * step;
    const noise = (Math.sin(i * 0.3) * quote.changePercent) / 100;
    const close = quote.price * (1 + noise);
    candles.push({
      timestamp,
      open: close * 0.999,
      high: close * 1.001,
      low: close * 0.998,
      close,
      volume: 0,
    });
  }

  return candles;
}

export async function fetchCandles(request: CandlesRequest): Promise<Candle[]> {
  const { symbol, marketType, interval, limit = 100 } = request;
  const type = marketType ?? detectMarketType(symbol);

  switch (type) {
    case 'crypto':
      return fetchCryptoCandles(symbol, interval, limit);
    case 'forex':
      return fetchForexCandles(symbol, interval, limit);
    case 'stocks':
    case 'indices':
    case 'commodities': {
      const finnhubCandles = await fetchFinnhubCandles(symbol, interval, limit);
      if (finnhubCandles?.length) return finnhubCandles;
      return fetchAlphaVantageCandles(symbol, interval, limit);
    }
    default:
      return fetchAlphaVantageCandles(symbol, interval, limit);
  }
}

export async function fetchQuotes(symbols: string[]): Promise<Quote[]> {
  const results = await Promise.allSettled(
    symbols.map((symbol) => fetchQuote(symbol)),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<Quote> => r.status === 'fulfilled')
    .map((r) => r.value);
}

export function buildAssetFromSymbol(symbol: string, marketType?: MarketType): Asset {
  const type = marketType ?? detectMarketType(symbol);
  const coinId = type === 'crypto' ? getCryptoId(symbol) : undefined;

  return {
    id: coinId ?? symbol,
    symbol,
    name: type === 'crypto' ? (CRYPTO_NAME_MAP[coinId!] ?? symbol.split('/')[0]) : symbol,
    marketType: type,
    assetClass:
      type === 'crypto'
        ? 'crypto'
        : type === 'forex'
          ? 'forex'
          : type === 'commodities'
            ? 'commodity'
            : type === 'indices'
              ? 'index'
              : 'equity',
    currency: 'USD',
    isActive: true,
  };
}

export interface FearGreedData {
  value: number;
  classification: string;
  timestamp: number;
}

export async function fetchFearGreedIndex(): Promise<FearGreedData> {
  const data = await apiRequest<{
    data: { value: string; value_classification: string; timestamp: string }[];
  }>('https://api.alternative.me/fng/?limit=1', {
    skipAuth: true,
    rateLimitKey: 'feargreed',
  });

  const latest = data.data[0];
  if (!latest) {
    throw new ApiError('Fear & Greed data unavailable', 503);
  }

  return {
    value: parseInt(latest.value, 10),
    classification: latest.value_classification,
    timestamp: parseInt(latest.timestamp, 10) * 1000,
  };
}

export { detectMarketType };
