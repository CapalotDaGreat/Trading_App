import {
  CORE_BENCHMARKS,
  DEFAULT_BRIEF_SYMBOLS,
} from '@/features/markets/constants/freshness';
import {
  buildAssetFromSymbol,
  fetchFearGreedIndex,
  fetchQuotes,
} from '@/features/markets/services/market-data.service';
import { fetchFinancialNews } from '@/features/news/services/news.service';
import { POPULAR_SYMBOLS } from '@/shared/constants/markets';
import type { Quote } from '@/shared/types/market';

export interface IndexSummary {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface MarketSummary {
  indices: IndexSummary[];
  marketStatus: 'open' | 'closed' | 'pre' | 'post';
  lastUpdated: number;
}

export interface WatchlistHighlight {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  currency: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: number;
  symbols: string[];
  sentiment?: 'bullish' | 'bearish' | 'neutral';
}

export interface FearGreedIndex {
  value: number;
  label: string;
  previousValue: number;
  updatedAt: number;
}

export interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  direction: 'gainer' | 'loser';
}

export interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  impact: 'low' | 'medium' | 'high';
  scheduledAt: number;
  actual?: string;
  forecast?: string;
  previous?: string;
}

export interface AiInsightPreview {
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  generatedAt: number;
}

export interface DashboardData {
  marketSummary: MarketSummary;
  watchlistHighlights: WatchlistHighlight[];
  news: NewsItem[];
  fearGreed: FearGreedIndex;
  aiInsight: AiInsightPreview;
  marketMovers: MarketMover[];
  economicEvents: EconomicEvent[];
}

const INDEX_NAMES: Record<string, string> = {
  SPY: 'S&P 500 (SPY)',
  QQQ: 'Nasdaq 100 (QQQ)',
  DIA: 'Dow (DIA)',
  IWM: 'Russell 2000 (IWM)',
  'BTC/USD': 'Bitcoin',
};

function marketSessionStatus(): MarketSummary['marketStatus'] {
  const now = new Date();
  const utcDay = now.getUTCDay();
  if (utcDay === 0 || utcDay === 6) return 'closed';
  const etHour = (now.getUTCHours() * 60 + now.getUTCMinutes() - 5 * 60 + 24 * 60) % (24 * 60);
  const minutes = etHour;
  if (minutes >= 4 * 60 && minutes < 9 * 60 + 30) return 'pre';
  if (minutes >= 9 * 60 + 30 && minutes < 16 * 60) return 'open';
  if (minutes >= 16 * 60 && minutes < 20 * 60) return 'post';
  return 'closed';
}

function quoteToIndex(q: Quote): IndexSummary {
  return {
    symbol: q.symbol,
    name: INDEX_NAMES[q.symbol] ?? q.symbol,
    price: q.price,
    change: q.change,
    changePercent: q.changePercent,
  };
}

export function quoteToHighlight(quote: Quote, name?: string): WatchlistHighlight {
  return {
    symbol: quote.symbol,
    name: name ?? buildAssetFromSymbol(quote.symbol).name,
    price: quote.price,
    changePercent: quote.changePercent,
    currency: quote.currency,
  };
}

function fallbackEconomicEvents(now: number): EconomicEvent[] {
  return [
    {
      id: 'e1',
      title: 'US Economic data window',
      country: 'US',
      impact: 'medium',
      scheduledAt: now + 24 * 60 * 60 * 1000,
      forecast: '—',
      previous: '—',
    },
  ];
}

async function buildLiveDashboard(): Promise<DashboardData> {
  const now = Date.now();
  const watchSymbols = [...DEFAULT_BRIEF_SYMBOLS].slice(0, 6);
  const moverSymbols = [...POPULAR_SYMBOLS.stocks.slice(0, 8), 'BTC/USD', 'ETH/USD'];

  const [benchmarkQuotes, watchQuotes, moverQuotes, fearGreedRaw, newsRaw] = await Promise.all([
    fetchQuotes([...CORE_BENCHMARKS]),
    fetchQuotes(watchSymbols),
    fetchQuotes(moverSymbols),
    fetchFearGreedIndex().catch(() => null),
    fetchFinancialNews({ pageSize: 5 }).catch(() => null),
  ]);

  const indices = (benchmarkQuotes.length ? benchmarkQuotes : watchQuotes)
    .slice(0, 4)
    .map(quoteToIndex);

  const sortedMovers = [...moverQuotes].sort(
    (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent),
  );
  const gainers = sortedMovers
    .filter((q) => q.changePercent >= 0)
    .slice(0, 3)
    .map(
      (q): MarketMover => ({
        symbol: q.symbol,
        name: buildAssetFromSymbol(q.symbol).name,
        price: q.price,
        changePercent: q.changePercent,
        volume: q.volume ?? 0,
        direction: 'gainer',
      }),
    );
  const losers = sortedMovers
    .filter((q) => q.changePercent < 0)
    .slice(0, 3)
    .map(
      (q): MarketMover => ({
        symbol: q.symbol,
        name: buildAssetFromSymbol(q.symbol).name,
        price: q.price,
        changePercent: q.changePercent,
        volume: q.volume ?? 0,
        direction: 'loser',
      }),
    );

  const avgChange =
    benchmarkQuotes.length > 0
      ? benchmarkQuotes.reduce((s, q) => s + q.changePercent, 0) / benchmarkQuotes.length
      : 0;
  const sentiment: AiInsightPreview['sentiment'] =
    avgChange > 0.35 ? 'bullish' : avgChange < -0.35 ? 'bearish' : 'neutral';

  let aiInsight: AiInsightPreview = {
    summary: `Live tape: benchmarks averaging ${avgChange.toFixed(2)}%. Prefer researching setups that match the current regime instead of forcing trades.`,
    sentiment,
    generatedAt: now,
  };

  try {
    const { aiService } = await import('@/features/ai/services/ai.service');
    const { useSubscriptionStore } = await import('@/shared/stores/subscription.store');
    const tier = useSubscriptionStore.getState().tier;
    aiInsight = await aiService.getInsightPreview(tier);
  } catch {
    // keep live-derived insight
  }

  const news: NewsItem[] =
    newsRaw?.articles?.map((a) => ({
      id: a.id,
      title: a.title,
      source: a.source,
      url: a.url,
      publishedAt: a.publishedAt,
      symbols: a.symbols ?? [],
    })) ?? [];

  return {
    marketSummary: {
      indices:
        indices.length > 0
          ? indices
          : [{ symbol: 'SPY', name: 'S&P 500 (SPY)', price: 0, change: 0, changePercent: 0 }],
      marketStatus: marketSessionStatus(),
      lastUpdated: now,
    },
    watchlistHighlights: (watchQuotes.length ? watchQuotes : benchmarkQuotes).map((q) =>
      quoteToHighlight(q),
    ),
    news,
    fearGreed: fearGreedRaw
      ? {
          value: fearGreedRaw.value,
          label: fearGreedRaw.classification,
          previousValue: fearGreedRaw.value,
          updatedAt: fearGreedRaw.timestamp,
        }
      : {
          value: 50,
          label: 'Neutral',
          previousValue: 50,
          updatedAt: now,
        },
    aiInsight,
    marketMovers: [...gainers, ...losers],
    economicEvents: fallbackEconomicEvents(now),
  };
}

export async function getDashboard(): Promise<DashboardData> {
  return buildLiveDashboard();
}
