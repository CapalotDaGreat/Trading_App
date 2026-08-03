const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';
const NEWS_API_BASE = 'https://newsapi.org/v2';

function finnhubKey(): string {
  return process.env.FINNHUB_API_KEY ?? '';
}

function alphaKey(): string {
  return process.env.ALPHA_VANTAGE_API_KEY ?? '';
}

function newsKey(): string {
  return process.env.NEWS_API_KEY ?? '';
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }
  return (await response.json()) as T;
}

export async function finnhubQuote(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
} | null> {
  const key = finnhubKey();
  if (!key) return null;
  const data = await fetchJson<{
    c?: number;
    d?: number;
    dp?: number;
    h?: number;
    l?: number;
    o?: number;
    pc?: number;
    t?: number;
  }>(`${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(key)}`);
  if (typeof data.c !== 'number' || data.c <= 0) return null;
  return {
    price: data.c,
    change: data.d ?? 0,
    changePercent: data.dp ?? 0,
    high: data.h ?? data.c,
    low: data.l ?? data.c,
    open: data.o ?? data.c,
    previousClose: data.pc ?? data.c,
    timestamp: (data.t ?? Math.floor(Date.now() / 1000)) * 1000,
  };
}

function finnhubResolution(interval: string): string {
  switch (interval) {
    case '1m':
      return '1';
    case '5m':
      return '5';
    case '15m':
      return '15';
    case '30m':
      return '30';
    case '1h':
    case '4h':
      return '60';
    case '1w':
      return 'W';
    case '1M':
      return 'M';
    default:
      return 'D';
  }
}

export async function finnhubCandles(
  symbol: string,
  interval: string,
  limit: number,
  marketType: string,
): Promise<
  | {
      candles: {
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      }[];
      provider: 'finnhub';
    }
  | null
> {
  const key = finnhubKey();
  if (!key) return null;

  const resolution = finnhubResolution(interval);
  const to = Math.floor(Date.now() / 1000);
  const from = to - Math.max(limit, 30) * 86400;
  let pathSymbol = symbol.replace('^', '');
  let path = 'stock/candle';
  if (marketType === 'forex' && symbol.includes('/')) {
    const [base, quote = 'USD'] = symbol.split('/');
    pathSymbol = `OANDA:${base}_${quote}`;
    path = 'forex/candle';
  }

  const data = await fetchJson<{
    s: string;
    t?: number[];
    o?: number[];
    h?: number[];
    l?: number[];
    c?: number[];
    v?: number[];
  }>(
    `${FINNHUB_BASE}/${path}?symbol=${encodeURIComponent(pathSymbol)}&resolution=${resolution}&from=${from}&to=${to}&token=${encodeURIComponent(key)}`,
  );

  if (data.s !== 'ok' || !data.t?.length) return null;

  const candles = data.t
    .map((timestamp, i) => ({
      timestamp: timestamp * 1000,
      open: data.o![i],
      high: data.h![i],
      low: data.l![i],
      close: data.c![i],
      volume: data.v?.[i] ?? 0,
    }))
    .slice(-limit);

  return { candles, provider: 'finnhub' };
}

export async function alphaVantageQuote(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
} | null> {
  const key = alphaKey();
  if (!key) return null;
  const data = await fetchJson<{
    'Global Quote'?: Record<string, string>;
  }>(
    `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol.replace('^', ''))}&apikey=${encodeURIComponent(key)}`,
  );
  const g = data['Global Quote'];
  if (!g) return null;
  const price = parseFloat(g['05. price'] ?? '0');
  if (!price) return null;
  return {
    price,
    change: parseFloat(g['09. change'] ?? '0'),
    changePercent: parseFloat((g['10. change percent'] ?? '0').replace('%', '')),
    high: parseFloat(g['03. high'] ?? String(price)),
    low: parseFloat(g['04. low'] ?? String(price)),
    open: parseFloat(g['02. open'] ?? String(price)),
    previousClose: parseFloat(g['08. previous close'] ?? String(price)),
    timestamp: Date.now(),
  };
}

export async function alphaVantageCandles(
  symbol: string,
  interval: string,
  limit: number,
): Promise<{
  candles: {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  provider: 'alpha-vantage';
} | null> {
  const key = alphaKey();
  if (!key) return null;
  const isIntraday = ['1m', '5m', '15m', '30m', '1h', '4h'].includes(interval);
  const fn = isIntraday ? 'TIME_SERIES_INTRADAY' : 'TIME_SERIES_DAILY';
  let url = `${ALPHA_VANTAGE_BASE}?function=${fn}&symbol=${encodeURIComponent(symbol.replace('^', ''))}&apikey=${encodeURIComponent(key)}&outputsize=compact`;
  if (isIntraday) {
    const map: Record<string, string> = {
      '1m': '1min',
      '5m': '5min',
      '15m': '15min',
      '30m': '30min',
      '1h': '60min',
      '4h': '60min',
    };
    url += `&interval=${map[interval] ?? '15min'}`;
  }
  const data = await fetchJson<Record<string, Record<string, string>>>(url);
  const seriesKey = Object.keys(data).find((k) => k.includes('Time Series'));
  if (!seriesKey || !data[seriesKey]) return null;
  const series = data[seriesKey] as unknown as Record<string, Record<string, string>>;
  const candles = Object.entries(series)
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
  return { candles, provider: 'alpha-vantage' };
}

export async function finnhubSearch(query: string): Promise<
  {
    symbol: string;
    description: string;
    type: string;
  }[]
> {
  const key = finnhubKey();
  if (!key) return [];
  const data = await fetchJson<{
    result?: { symbol?: string; description?: string; type?: string }[];
  }>(
    `${FINNHUB_BASE}/search?q=${encodeURIComponent(query)}&token=${encodeURIComponent(key)}`,
  );
  return (data.result ?? [])
    .filter((r) => r.symbol)
    .slice(0, 20)
    .map((r) => ({
      symbol: r.symbol!,
      description: r.description ?? r.symbol!,
      type: r.type ?? 'Common Stock',
    }));
}

export async function finnhubEconomicCalendar(from: string, to: string): Promise<
  {
    event: string;
    country: string;
    impact: string;
    actual?: string;
    estimate?: string;
    prev?: string;
    unit?: string;
    time?: string;
  }[]
> {
  const key = finnhubKey();
  if (!key) return [];
  const data = await fetchJson<{
    economicCalendar?: {
      event?: string;
      country?: string;
      impact?: string;
      actual?: string;
      estimate?: string;
      prev?: string;
      unit?: string;
      time?: string;
    }[];
  }>(
    `${FINNHUB_BASE}/calendar/economic?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&token=${encodeURIComponent(key)}`,
  );
  return (data.economicCalendar ?? []).map((e) => ({
    event: e.event ?? 'Event',
    country: e.country ?? '',
    impact: e.impact ?? 'medium',
    actual: e.actual,
    estimate: e.estimate,
    prev: e.prev,
    unit: e.unit,
    time: e.time,
  }));
}

export async function newsApiHeadlines(input: {
  query?: string;
  category?: string;
  pageSize: number;
  page: number;
}): Promise<{
  articles: {
    id: string;
    title: string;
    description: string;
    url: string;
    source: string;
    imageUrl?: string;
    publishedAt: number;
  }[];
  totalResults: number;
}> {
  const key = newsKey();
  if (!key) {
    throw new Error('NEWS_API_KEY missing');
  }
  const params = new URLSearchParams({
    apiKey: key,
    pageSize: String(input.pageSize),
    page: String(input.page),
    language: 'en',
  });
  if (input.query) {
    params.set('q', input.query);
    params.set('sortBy', 'publishedAt');
  } else {
    params.set('category', input.category ?? 'business');
  }
  const path = input.query ? 'everything' : 'top-headlines';
  const data = await fetchJson<{
    status: string;
    totalResults?: number;
    articles?: {
      source?: { name?: string };
      title?: string;
      description?: string;
      url?: string;
      urlToImage?: string;
      publishedAt?: string;
    }[];
  }>(`${NEWS_API_BASE}/${path}?${params.toString()}`);

  const articles = (data.articles ?? [])
    .filter((a) => a.title && a.url)
    .map((a) => ({
      id: Buffer.from(a.url!).toString('base64url').slice(0, 32),
      title: a.title!,
      description: a.description ?? '',
      url: a.url!,
      source: a.source?.name ?? 'News',
      imageUrl: a.urlToImage,
      publishedAt: a.publishedAt ? Date.parse(a.publishedAt) : Date.now(),
    }));

  return { articles, totalResults: data.totalResults ?? articles.length };
}
