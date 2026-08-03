import { apiRequest, ApiError } from '@/shared/services/api/api-client';
import {
  allowDevDirectVendors,
  canUseVendorProxy,
} from '@/shared/services/firebase/callable-proxy';
import type { Asset, MarketType } from '@/shared/types/market';

import { POPULAR_SYMBOLS } from '@/shared/constants/markets';

import { buildAssetFromSymbol } from './market-data.service';
import { proxyMarketSearch } from './market-proxy.service';

const FINNHUB_KEY = allowDevDirectVendors()
  ? (process.env.EXPO_PUBLIC_FINNHUB_API_KEY ?? '')
  : '';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const FINNHUB_BASE = 'https://finnhub.io/api/v1';

export interface SearchResult extends Asset {
  relevance: number;
}

export interface MarketSearchOptions {
  query: string;
  marketType?: MarketType;
  limit?: number;
}

async function searchCrypto(query: string, limit: number): Promise<SearchResult[]> {
  const data = await apiRequest<{
    coins: { id: string; symbol: string; name: string; thumb?: string; market_cap_rank?: number }[];
  }>(`${COINGECKO_BASE}/search`, {
    skipAuth: true,
    rateLimitKey: 'coingecko',
    params: { query },
  });

  return data.coins.slice(0, limit).map((coin, index) => ({
    id: coin.id,
    symbol: `${coin.symbol.toUpperCase()}/USD`,
    name: coin.name,
    marketType: 'crypto' as const,
    assetClass: 'crypto' as const,
    currency: 'USD',
    logoUrl: coin.thumb,
    isActive: true,
    relevance: limit - index,
    metadata: { marketCapRank: coin.market_cap_rank ?? 0 },
  }));
}

async function searchStocks(query: string, limit: number): Promise<SearchResult[]> {
  if (canUseVendorProxy()) {
    try {
      const proxied = await proxyMarketSearch(query);
      if (proxied?.results.length) {
        return proxied.results.slice(0, limit).map((item, index) => ({
          id: item.symbol,
          symbol: item.symbol,
          name: item.description,
          marketType: 'stocks' as const,
          assetClass: item.type === 'ETP' ? ('etf' as const) : ('equity' as const),
          currency: 'USD',
          exchange: item.type,
          isActive: true,
          relevance: limit - index,
        }));
      }
    } catch {
      // Fall through to popular symbols / local.
    }
  }

  if (!FINNHUB_KEY) return [];

  const data = await apiRequest<{
    count: number;
    result: {
      description: string;
      displaySymbol: string;
      symbol: string;
      type: string;
    }[];
  }>(`${FINNHUB_BASE}/search`, {
    skipAuth: true,
    rateLimitKey: 'finnhub',
    params: { q: query, token: FINNHUB_KEY },
  });

  return data.result.slice(0, limit).map((item, index) => ({
    id: item.symbol,
    symbol: item.displaySymbol || item.symbol,
    name: item.description,
    marketType: 'stocks' as const,
    assetClass: item.type === 'ETP' ? ('etf' as const) : ('equity' as const),
    currency: 'USD',
    exchange: item.type,
    isActive: true,
    relevance: limit - index,
  }));
}

const FOREX_PAIRS = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar' },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar' },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen' },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar' },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar' },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc' },
  { symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar' },
  { symbol: 'EUR/GBP', name: 'Euro / British Pound' },
  { symbol: 'EUR/JPY', name: 'Euro / Japanese Yen' },
  { symbol: 'GBP/JPY', name: 'British Pound / Japanese Yen' },
];

function searchForex(query: string, limit: number): SearchResult[] {
  const normalized = query.toUpperCase();
  return FOREX_PAIRS.filter(
    (pair) =>
      pair.symbol.includes(normalized) ||
      pair.name.toUpperCase().includes(normalized) ||
      normalized.split('/').every((part) => pair.symbol.includes(part)),
  )
    .slice(0, limit)
    .map((pair, index) => ({
      ...buildAssetFromSymbol(pair.symbol, 'forex'),
      name: pair.name,
      relevance: limit - index,
    }));
}

function searchLocal(query: string, marketType: MarketType | undefined, limit: number): SearchResult[] {
  const types: MarketType[] = marketType
    ? [marketType]
    : ['stocks', 'crypto', 'forex', 'indices', 'commodities'];

  const normalized = query.toUpperCase();
  const results: SearchResult[] = [];

  for (const type of types) {
    for (const symbol of POPULAR_SYMBOLS[type] ?? []) {
      if (symbol.toUpperCase().includes(normalized) || normalized.includes(symbol.replace('/', ''))) {
        results.push({
          ...buildAssetFromSymbol(symbol, type),
          relevance: symbol.startsWith(normalized) ? 10 : 5,
        });
      }
    }
  }

  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

export async function searchMarkets(options: MarketSearchOptions): Promise<SearchResult[]> {
  const { query, marketType, limit = 20 } = options;
  const trimmed = query.trim();

  if (trimmed.length < 1) {
    return searchLocal('', marketType, limit);
  }

  const searches: Promise<SearchResult[]>[] = [];

  if (!marketType || marketType === 'crypto') {
    searches.push(searchCrypto(trimmed, limit).catch(() => []));
  }
  if (!marketType || marketType === 'stocks' || marketType === 'indices') {
    searches.push(searchStocks(trimmed, limit).catch(() => []));
  }

  const localResults = searchLocal(trimmed, marketType, limit);
  const forexResults = !marketType || marketType === 'forex' ? searchForex(trimmed, limit) : [];

  const remoteResults = await Promise.all(searches);
  const merged = new Map<string, SearchResult>();

  for (const result of [...localResults, ...forexResults, ...remoteResults.flat()]) {
    const key = result.symbol.toUpperCase();
    const existing = merged.get(key);
    if (!existing || result.relevance > existing.relevance) {
      merged.set(key, result);
    }
  }

  const sorted = Array.from(merged.values()).sort((a, b) => b.relevance - a.relevance);

  if (sorted.length === 0) {
    throw new ApiError(`No results found for "${trimmed}"`, 404);
  }

  return sorted.slice(0, limit);
}
