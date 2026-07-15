export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  imageUrl?: string;
  publishedAt: number;
  symbols?: string[];
  category?: string;
}

export interface NewsFeedParams {
  query?: string;
  category?: 'business' | 'technology' | 'general';
  pageSize?: number;
  page?: number;
}

export interface NewsFeedResult {
  articles: NewsArticle[];
  totalResults: number;
  source: 'newsapi' | 'rss';
}

const NEWS_API_KEY = process.env.EXPO_PUBLIC_NEWS_API_KEY ?? '';
const NEWS_API_BASE = 'https://newsapi.org/v2';
const RSS_FEED_URL =
  process.env.EXPO_PUBLIC_NEWS_RSS_URL ??
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US';

interface NewsApiArticle {
  source?: { name?: string };
  title?: string;
  description?: string;
  url?: string;
  urlToImage?: string;
  publishedAt?: string;
}

interface NewsApiResponse {
  status: string;
  totalResults?: number;
  articles?: NewsApiArticle[];
}

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function parseRssItems(xml: string): NewsArticle[] {
  const items: NewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1] ?? '';
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    const description = extractTag(block, 'description');
    const pubDate = extractTag(block, 'pubDate');

    if (!title || !link) continue;

    items.push({
      id: hashString(link),
      title: decodeHtmlEntities(stripHtml(title)),
      description: decodeHtmlEntities(stripHtml(description)),
      url: link,
      source: 'Yahoo Finance',
      publishedAt: pubDate ? Date.parse(pubDate) : Date.now(),
    });
  }

  return items;
}

function extractTag(block: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = block.match(regex);
  return (match?.[1] ?? match?.[2] ?? '').trim();
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, '').trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function fetchFromNewsApi(params: NewsFeedParams): Promise<NewsFeedResult> {
  const { query = 'finance OR stocks OR trading', category = 'business', pageSize = 20, page = 1 } = params;

  const url = new URL(`${NEWS_API_BASE}/everything`);
  url.searchParams.set('q', query);
  url.searchParams.set('category', category);
  url.searchParams.set('language', 'en');
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('pageSize', String(pageSize));
  url.searchParams.set('page', String(page));
  url.searchParams.set('apiKey', NEWS_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`NewsAPI error: ${response.status}`);
  }

  const data = (await response.json()) as NewsApiResponse;
  if (data.status !== 'ok') {
    throw new Error('NewsAPI returned an error.');
  }

  const articles: NewsArticle[] = (data.articles ?? []).map((article, index) => ({
    id: hashString(article.url ?? `${index}-${article.title}`),
    title: article.title ?? 'Untitled',
    description: article.description ?? '',
    url: article.url ?? '',
    source: article.source?.name ?? 'Unknown',
    imageUrl: article.urlToImage ?? undefined,
    publishedAt: article.publishedAt ? Date.parse(article.publishedAt) : Date.now(),
    category,
  }));

  return {
    articles,
    totalResults: data.totalResults ?? articles.length,
    source: 'newsapi',
  };
}

async function fetchFromRss(params: NewsFeedParams): Promise<NewsFeedResult> {
  const response = await fetch(RSS_FEED_URL);
  if (!response.ok) {
    throw new Error(`RSS fetch error: ${response.status}`);
  }

  const xml = await response.text();
  let articles = parseRssItems(xml);

  if (params.query) {
    const q = params.query.toLowerCase();
    articles = articles.filter(
      (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q),
    );
  }

  const pageSize = params.pageSize ?? 20;
  const page = params.page ?? 1;
  const start = (page - 1) * pageSize;
  const paged = articles.slice(start, start + pageSize);

  return {
    articles: paged,
    totalResults: articles.length,
    source: 'rss',
  };
}

export async function fetchFinancialNews(params: NewsFeedParams = {}): Promise<NewsFeedResult> {
  if (NEWS_API_KEY) {
    try {
      return await fetchFromNewsApi(params);
    } catch {
      return fetchFromRss(params);
    }
  }

  return fetchFromRss(params);
}

export async function fetchNewsBySymbol(symbol: string, pageSize = 10): Promise<NewsFeedResult> {
  return fetchFinancialNews({
    query: symbol,
    pageSize,
  });
}
