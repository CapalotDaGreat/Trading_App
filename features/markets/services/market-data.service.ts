import { apiRequest, ApiError } from '@/shared/services/api/api-client';
import {
  allowDevDirectVendors,
  canUseVendorProxy,
} from '@/shared/services/firebase/callable-proxy';
import { marketDataScheduler } from '@/shared/services/market-data/market-data-scheduler';
import { logger } from '@/shared/services/observability/logger';
import type { Asset, Candle, CandleInterval, MarketType, Quote } from '@/shared/types/market';

import type { DataSourceKind } from '../constants/data-source';
import { MARKET_DATA_POLICY } from '../constants/freshness';
import { proxyFetchCandles, proxyFetchQuote } from './market-proxy.service';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const EXCHANGE_RATE_BASE = 'https://api.open.er-api.com/v6/latest';
const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';
/** Dev-only direct vendor bypass. Production must use Cloud Functions proxies. */
export const USE_DIRECT_MARKET_DATA =
  allowDevDirectVendors() && process.env.EXPO_PUBLIC_MARKET_DATA_DIRECT === 'true';

/** Dev-only keys — never relied on in production release profiles. */
function getFinnhubKey(): string {
  if (!allowDevDirectVendors()) return '';
  return process.env.EXPO_PUBLIC_FINNHUB_API_KEY ?? '';
}

function getAlphaVantageKey(): string {
  if (!allowDevDirectVendors()) return '';
  return process.env.EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY ?? '';
}

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

export type MarketDataProvider =
  | 'coingecko'
  | 'exchange-rate-api'
  | 'finnhub'
  | 'alpha-vantage'
  | 'sample';

export interface MarketDataMetadata {
  provider: MarketDataProvider;
  fetchedAt: number;
  kind: DataSourceKind;
}

export interface QuoteResult extends MarketDataMetadata {
  quote: Quote;
}

export interface CandleResult extends MarketDataMetadata {
  candles: Candle[];
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

/** Deterministic sample quote when live vendors are slow/unreachable (Expo Go / demo). */
function buildSampleQuote(symbol: string, currency = 'USD'): Quote {
  const seed = [...symbol.toUpperCase()].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const upper = symbol.toUpperCase();
  const basePrice = upper.includes('BTC')
    ? 60_000 + (seed % 5_000)
    : upper.includes('ETH')
      ? 2_500 + (seed % 400)
      : upper.includes('/')
        ? 0.85 + (seed % 50) / 100
        : 80 + (seed % 120);
  const changePercent = ((seed % 9) - 4) * 0.12;
  const change = (basePrice * changePercent) / 100;
  const previousClose = basePrice - change;

  return {
    symbol,
    price: basePrice,
    change,
    changePercent,
    open: previousClose,
    high: Math.max(basePrice, previousClose) * 1.005,
    low: Math.min(basePrice, previousClose) * 0.995,
    previousClose,
    volume: 1_000_000 + seed * 100,
    timestamp: Date.now(),
    status: 'open',
    currency,
  };
}

async function fetchCryptoQuote(symbol: string): Promise<{ quote: Quote; sample: boolean }> {
  const coinId = getCryptoId(symbol);
  try {
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
      timeout: 4_000,
      retries: 0,
      failureLog: 'warn',
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
      quote: {
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
      },
      sample: false,
    };
  } catch (error) {
    logger.warn('market_data.crypto_quote_fallback_sample', {
      symbol,
      message: error instanceof Error ? error.message : 'unknown',
    });
    return { quote: buildSampleQuote(symbol), sample: true };
  }
}

async function fetchForexQuote(symbol: string): Promise<{ quote: Quote; sample: boolean }> {
  const [base, quoteCurrency = 'USD'] = symbol.split('/');
  try {
    const data = await apiRequest<{
      rates: Record<string, number>;
      time_last_update_unix: number;
    }>(`${EXCHANGE_RATE_BASE}/${base}`, {
      skipAuth: true,
      rateLimitKey: 'forex',
      timeout: 4_000,
      retries: 0,
      failureLog: 'warn',
    });

    const rate = data.rates[quoteCurrency];
    if (!rate) {
      throw new ApiError(`Forex pair not found: ${symbol}`, 404);
    }

    const inverseData = await apiRequest<{
      rates: Record<string, number>;
    }>(`${EXCHANGE_RATE_BASE}/${quoteCurrency}`, {
      skipAuth: true,
      rateLimitKey: 'forex',
      timeout: 4_000,
      retries: 0,
      failureLog: 'warn',
    });

    const previousRate = inverseData.rates[base];
    const previousClose = previousRate ? 1 / previousRate : rate;
    const change = rate - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return {
      quote: {
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
        currency: quoteCurrency,
      },
      sample: false,
    };
  } catch (error) {
    logger.warn('market_data.forex_quote_fallback_sample', {
      symbol,
      message: error instanceof Error ? error.message : 'unknown',
    });
    return { quote: buildSampleQuote(symbol, quoteCurrency), sample: true };
  }
}

async function fetchFinnhubQuote(symbol: string): Promise<Quote | null> {
  if (!getFinnhubKey()) return null;

  try {
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
      retries: 0,
      failureLog: 'warn',
      params: { symbol: cleanSymbol, token: getFinnhubKey() },
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
  } catch {
    return null;
  }
}

async function fetchAlphaVantageQuote(symbol: string): Promise<Quote> {
  if (!getAlphaVantageKey()) {
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
      apikey: getAlphaVantageKey(),
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

export async function fetchQuoteWithMetadataDirect(
  symbol: string,
  marketType?: MarketType,
): Promise<QuoteResult> {
  const type = marketType ?? detectMarketType(symbol);

  switch (type) {
    case 'crypto': {
      if (!canUseVendorProxy() && !allowDevDirectVendors()) {
        return {
          quote: buildSampleQuote(symbol),
          provider: 'sample',
          fetchedAt: Date.now(),
          kind: 'sample',
        };
      }
      const result = await fetchCryptoQuote(symbol);
      return {
        quote: result.quote,
        provider: result.sample ? 'sample' : 'coingecko',
        fetchedAt: Date.now(),
        kind: result.sample ? 'sample' : 'delayed',
      };
    }
    case 'forex': {
      if (!canUseVendorProxy() && !allowDevDirectVendors()) {
        const [, quoteCurrency = 'USD'] = symbol.split('/');
        return {
          quote: buildSampleQuote(symbol, quoteCurrency),
          provider: 'sample',
          fetchedAt: Date.now(),
          kind: 'sample',
        };
      }
      const result = await fetchForexQuote(symbol);
      return {
        quote: result.quote,
        provider: result.sample ? 'sample' : 'exchange-rate-api',
        fetchedAt: Date.now(),
        kind: result.sample ? 'sample' : 'delayed',
      };
    }
    case 'stocks':
    case 'indices':
    case 'commodities': {
      if (canUseVendorProxy()) {
        try {
          const proxied = await proxyFetchQuote(symbol, type);
          if (proxied) return proxied;
        } catch (error) {
          logger.warn('market_data.proxy_quote_failed', {
            symbol,
            message: error instanceof Error ? error.message : 'unknown',
          });
        }
      }
      const finnhubQuote = await fetchFinnhubQuote(symbol);
      if (finnhubQuote) {
        return { quote: finnhubQuote, provider: 'finnhub', fetchedAt: Date.now(), kind: 'delayed' };
      }
      if (getAlphaVantageKey()) {
        return {
          quote: await fetchAlphaVantageQuote(symbol),
          provider: 'alpha-vantage',
          fetchedAt: Date.now(),
          kind: 'delayed',
        };
      }
      // Guest / demo / unsigned: honest sample path (no vendor secrets).
      return {
        quote: buildSampleQuote(symbol),
        provider: 'sample',
        fetchedAt: Date.now(),
        kind: 'sample',
      };
    }
    default:
      return {
        quote: await fetchStockQuote(symbol),
        provider: getFinnhubKey() ? 'finnhub' : 'sample',
        fetchedAt: Date.now(),
        kind: getFinnhubKey() ? 'delayed' : 'sample',
      };
  }
}

export async function fetchQuoteWithMetadata(
  symbol: string,
  marketType?: MarketType,
): Promise<QuoteResult> {
  const type = marketType ?? detectMarketType(symbol);
  return marketDataScheduler.quote(
    { symbol, marketType: type },
    () => fetchQuoteWithMetadataDirect(symbol, type),
    { ttlMs: MARKET_DATA_POLICY.quoteStaleMs, direct: USE_DIRECT_MARKET_DATA },
  );
}

export async function fetchQuote(symbol: string, marketType?: MarketType): Promise<Quote> {
  return (await fetchQuoteWithMetadata(symbol, marketType)).quote;
}

async function fetchCryptoCandles(
  symbol: string,
  interval: CandleInterval,
  limit: number,
): Promise<{ candles: Candle[]; sample: boolean }> {
  const coinId = getCryptoId(symbol);
  const days = intervalToDays(interval, limit);

  try {
    const data = await apiRequest<{
      prices: [number, number][];
      total_volumes: [number, number][];
    }>(`${COINGECKO_BASE}/coins/${coinId}/market_chart`, {
      skipAuth: true,
      rateLimitKey: 'coingecko',
      timeout: 4_000,
      retries: 0,
      failureLog: 'warn',
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

    return { candles: candles.slice(-limit), sample: false };
  } catch (error) {
    logger.warn('market_data.crypto_candles_fallback_sample', {
      symbol,
      message: error instanceof Error ? error.message : 'unknown',
    });
    return { candles: buildSampleEquityCandles(symbol, interval, limit), sample: true };
  }
}

async function fetchFinnhubCandles(
  symbol: string,
  interval: CandleInterval,
  limit: number,
): Promise<Candle[] | null> {
  if (!getFinnhubKey()) return null;

  try {
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
      retries: 0,
      failureLog: 'warn',
      params: {
        symbol: cleanSymbol,
        resolution,
        from: String(from),
        to: String(to),
        token: getFinnhubKey(),
      },
    });

    if (data.s !== 'ok' || !data.t?.length) return null;

    return data.t
      .map((timestamp, i) => ({
        timestamp: timestamp * 1000,
        open: data.o![i],
        high: data.h![i],
        low: data.l![i],
        close: data.c![i],
        volume: data.v![i] ?? 0,
      }))
      .slice(-limit);
  } catch {
    // Free Finnhub plans often return 403 for /stock/candle — fall through to Alpha Vantage/sample.
    return null;
  }
}

async function fetchAlphaVantageCandles(
  symbol: string,
  interval: CandleInterval,
  limit: number,
): Promise<Candle[]> {
  if (!getAlphaVantageKey()) {
    throw new ApiError('No stock API key configured for candles', 503);
  }

  const isIntraday = ['1m', '5m', '15m', '30m', '1h', '4h'].includes(interval);
  const fn = isIntraday ? 'TIME_SERIES_INTRADAY' : 'TIME_SERIES_DAILY';
  const params: Record<string, string> = {
    function: fn,
    symbol: symbol.replace('^', ''),
    apikey: getAlphaVantageKey(),
    outputsize: 'compact',
  };

  if (isIntraday) {
    params.interval = alphaInterval(interval);
  }

  const data = await apiRequest<Record<string, Record<string, string>>>(ALPHA_VANTAGE_BASE, {
    skipAuth: true,
    rateLimitKey: 'alphavantage',
    retries: 0,
    failureLog: 'warn',
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

async function fetchFinnhubForexCandles(
  symbol: string,
  interval: CandleInterval,
  limit: number,
): Promise<Candle[] | null> {
  if (!getFinnhubKey()) return null;

  try {
    const [base, quote = 'USD'] = symbol.split('/');
    const finnhubSymbol = `OANDA:${base}_${quote}`;
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
    }>(`${FINNHUB_BASE}/forex/candle`, {
      skipAuth: true,
      rateLimitKey: 'finnhub',
      retries: 0,
      failureLog: 'warn',
      params: {
        symbol: finnhubSymbol,
        resolution,
        from: String(from),
        to: String(to),
        token: getFinnhubKey(),
      },
    });

    if (data.s !== 'ok' || !data.t?.length) return null;

    return data.t
      .map((timestamp, i) => ({
        timestamp: timestamp * 1000,
        open: data.o![i],
        high: data.h![i],
        low: data.l![i],
        close: data.c![i],
        volume: data.v?.[i] ?? 0,
      }))
      .slice(-limit);
  } catch {
    return null;
  }
}

async function fetchForexCandles(
  symbol: string,
  interval: CandleInterval,
  limit: number,
): Promise<{ candles: Candle[]; sample: boolean }> {
  const finnhub = await fetchFinnhubForexCandles(symbol, interval, limit);
  if (finnhub?.length) return { candles: finnhub, sample: false };

  logger.warn('market_data.forex_candles_fallback_sample', { symbol, interval, limit });
  return { candles: buildSampleEquityCandles(symbol, interval, limit), sample: true };
}

/** Deterministic sample equity path for demo when live OHLC providers fail. Never used for FX. */
function buildSampleEquityCandles(
  symbol: string,
  interval: CandleInterval,
  limit: number,
): Candle[] {
  const seed = [...symbol.toUpperCase()].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  let price = 80 + (seed % 120);
  const stepMs =
    interval === '1w'
      ? 7 * 86_400_000
      : interval === '1M'
        ? 30 * 86_400_000
        : interval === '1d'
          ? 86_400_000
          : interval === '4h'
            ? 4 * 3_600_000
            : interval === '1h'
              ? 3_600_000
              : 15 * 60_000;
  const now = Date.now();
  const candles: Candle[] = [];

  for (let i = 0; i < limit; i += 1) {
    const wave = Math.sin((i + seed) / 9) * 1.8;
    const drift = i * 0.04;
    const open = price;
    const close = Math.max(1, open + wave * 0.35 + ((i + seed) % 5) * 0.05 - 0.1);
    const high = Math.max(open, close) + 0.6;
    const low = Math.min(open, close) - 0.55;
    candles.push({
      timestamp: now - (limit - i) * stepMs,
      open,
      high,
      low,
      close: close + drift * 0.01,
      volume: 500_000 + ((i * 17 + seed) % 900_000),
    });
    price = candles[candles.length - 1]!.close;
  }

  return candles;
}

async function fetchStockLikeCandles(
  symbol: string,
  interval: CandleInterval,
  limit: number,
): Promise<CandleResult> {
  if (canUseVendorProxy()) {
    try {
      const proxied = await proxyFetchCandles({
        symbol,
        marketType: 'stocks',
        interval,
        limit,
      });
      if (proxied?.candles.length) return proxied;
    } catch (error) {
      logger.warn('market_data.proxy_candles_failed', {
        symbol,
        message: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  const finnhubCandles = await fetchFinnhubCandles(symbol, interval, limit);
  if (finnhubCandles?.length) {
    return {
      candles: finnhubCandles,
      provider: 'finnhub',
      fetchedAt: Date.now(),
      kind: 'delayed',
    };
  }

  if (getAlphaVantageKey()) {
    try {
      const candles = await fetchAlphaVantageCandles(symbol, interval, limit);
      if (candles.length) {
        return {
          candles,
          provider: 'alpha-vantage',
          fetchedAt: Date.now(),
          kind: 'delayed',
        };
      }
    } catch (error) {
      logger.warn('market_data.alpha_vantage_candles_unavailable', {
        symbol,
        message: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  logger.warn('market_data.using_sample_equity_candles', { symbol, interval, limit });
  return {
    candles: buildSampleEquityCandles(symbol, interval, limit),
    provider: 'sample',
    fetchedAt: Date.now(),
    kind: 'sample',
  };
}

export async function fetchCandlesWithMetadataDirect(
  request: CandlesRequest,
): Promise<CandleResult> {
  const { symbol, marketType, interval, limit = 100 } = request;
  const type = marketType ?? detectMarketType(symbol);

  switch (type) {
    case 'crypto': {
      if (!canUseVendorProxy() && !allowDevDirectVendors()) {
        return {
          candles: buildSampleEquityCandles(symbol, interval, limit),
          provider: 'sample',
          fetchedAt: Date.now(),
          kind: 'sample',
        };
      }
      const result = await fetchCryptoCandles(symbol, interval, limit);
      return {
        candles: result.candles,
        provider: result.sample ? 'sample' : 'coingecko',
        fetchedAt: Date.now(),
        kind: result.sample ? 'sample' : 'approximate',
      };
    }
    case 'forex': {
      if (canUseVendorProxy()) {
        try {
          const proxied = await proxyFetchCandles({
            symbol,
            marketType: 'forex',
            interval,
            limit,
          });
          if (proxied?.candles.length) return proxied;
        } catch (error) {
          logger.warn('market_data.proxy_forex_candles_failed', {
            symbol,
            message: error instanceof Error ? error.message : 'unknown',
          });
        }
      }
      if (!allowDevDirectVendors()) {
        return {
          candles: buildSampleEquityCandles(symbol, interval, limit),
          provider: 'sample',
          fetchedAt: Date.now(),
          kind: 'sample',
        };
      }
      const result = await fetchForexCandles(symbol, interval, limit);
      return {
        candles: result.candles,
        provider: result.sample ? 'sample' : 'finnhub',
        fetchedAt: Date.now(),
        kind: result.sample ? 'sample' : 'delayed',
      };
    }
    case 'stocks':
    case 'indices':
    case 'commodities':
      return fetchStockLikeCandles(symbol, interval, limit);
    default:
      return fetchStockLikeCandles(symbol, interval, limit);
  }
}

export async function fetchCandlesWithMetadata(request: CandlesRequest): Promise<CandleResult> {
  const normalizedRequest = {
    ...request,
    marketType: request.marketType ?? detectMarketType(request.symbol),
  };
  return marketDataScheduler.candles(
    normalizedRequest,
    () => fetchCandlesWithMetadataDirect(normalizedRequest),
    { ttlMs: MARKET_DATA_POLICY.candleStaleMs, direct: USE_DIRECT_MARKET_DATA },
  );
}

export async function fetchCandles(request: CandlesRequest): Promise<Candle[]> {
  return (await fetchCandlesWithMetadata(request)).candles;
}

export async function fetchQuotes(symbols: string[]): Promise<Quote[]> {
  const results = await Promise.allSettled(symbols.map((symbol) => fetchQuote(symbol)));

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
    timeout: 3_000,
    retries: 0,
    failureLog: 'warn',
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
