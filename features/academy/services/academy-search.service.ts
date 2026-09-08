import { CATEGORY_LABELS, type Lesson, type LessonDifficulty } from '../types/academy.types';

export interface AcademySearchHit {
  lesson: Lesson;
  score: number;
  why: string;
  matchedTerms: string[];
}

export interface AcademySearchOptions {
  limit?: number;
  includePremium?: boolean;
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'the',
  'to',
  'of',
  'for',
  'in',
  'on',
  'is',
  'it',
  'how',
  'do',
  'i',
  'my',
  'me',
  'when',
  'what',
  'why',
  'with',
  'about',
  'know',
  'learn',
  'stock',
  'stocks',
  'trade',
  'trading',
  'market',
  'markets',
]);

/**
 * Intent aliases expand conversational queries into lesson concepts.
 * Keys are phrases; values are extra tokens mixed into scoring.
 */
export const ACADEMY_INTENT_ALIASES: Record<string, string[]> = {
  overbought: ['rsi', 'momentum', 'oscillator', 'stretched', 'overbought'],
  oversold: ['rsi', 'momentum', 'washed', 'oversold'],
  rsi: ['rsi', 'momentum', 'relative strength', 'overbought', 'divergence'],
  momentum: ['rsi', 'macd', 'trend', 'relative strength'],
  divergence: ['rsi', 'momentum', 'confirmation'],
  candle: ['candles', 'candlestick', 'ohlc', 'wick', 'body'],
  candles: ['candlestick', 'ohlc', 'wick', 'body', 'hammer'],
  candlestick: ['candles', 'ohlc', 'patterns', 'wick'],
  ohlc: ['candles', 'open', 'high', 'low', 'close'],
  support: ['structure', 'levels', 'resistance', 'zone'],
  resistance: ['structure', 'levels', 'support', 'zone'],
  'support and resistance': ['structure', 'levels', 'zone', 'retest'],
  trend: ['higher high', 'higher low', 'structure', 'range'],
  range: ['chop', 'mean', 'breakout', 'structure'],
  breakout: ['range', 'acceptance', 'retest', 'failed breakout', 'volume'],
  'why did my breakout fail': ['false breakout', 'failed breakout', 'acceptance', 'volume'],
  'false breakout': ['breakout', 'failed breakout', 'acceptance', 'volume'],
  'how do i size a position': ['position sizing', 'risk', 'stop', '1 percent'],
  'what does drawdown actually mean': ['drawdown', 'peak', 'equity', 'risk'],
  'how can i tell if support is strong': ['support', 'structure', 'zone', 'retest'],
  'why does rsi stay overbought': ['rsi', 'momentum', 'trend', 'stretch'],
  confirmed: ['breakout', 'acceptance', 'retest', 'volume'],
  volume: ['participation', 'confirmation', 'expansion', 'contraction'],
  'moving average': ['sma', 'ema', 'trend', 'crossover', 'average'],
  sma: ['moving average', 'trend', 'crossover'],
  ema: ['moving average', 'trend', 'crossover'],
  ma: ['moving average', 'sma', 'ema'],
  risk: ['position sizing', 'stop', 'expectancy', 'drawdown', 'invalidation'],
  'risk management': ['position sizing', 'stop', 'expectancy', 'portfolio', 'drawdown'],
  'position sizing': ['risk', 'size', 'stop', 'expectancy'],
  'stop loss': ['invalidation', 'stop', 'risk', 'structure'],
  drawdown: ['risk', 'portfolio', 'expectancy'],
  volatility: ['atr', 'regime', 'risk', 'size'],
  psychology: ['fomo', 'tilt', 'emotion', 'discipline', 'why not'],
  options: ['option', 'premium', 'expression'],
  fundamental: ['catalyst', 'calendar', 'earnings', 'news'],
  'fundamental analysis': ['catalyst', 'calendar', 'earnings'],
  chart: ['candles', 'structure', 'trend', 'volume'],
  'how to read a chart': ['candles', 'structure', 'trend', 'volume', 'support'],
  beginner: ['basics', 'orders', 'plan', 'structure', 'candles'],
  'technical analysis': ['structure', 'candles', 'trend', 'volume', 'rsi'],
  'beginner technical analysis': ['structure', 'candles', 'trend', 'volume'],
  'learn rsi': ['rsi', 'momentum', 'overbought'],
  'how do i trade currencies': ['forex', 'eur usd', 'currency pair', 'pip'],
  'currency pair': ['forex', 'base', 'quote', 'eur usd'],
  'risk before entering': ['plan', 'invalidation', 'position sizing', 'checklist'],
};

const EXTRA_KEYWORDS: Record<string, string[]> = {
  'ta-candles': [
    'candlestick',
    'ohlc',
    'wick',
    'body',
    'hammer',
    'engulfing',
    'doji',
    'bullish candle',
    'bearish candle',
    'timeframe',
  ],
  'ta-structure': [
    'support',
    'resistance',
    'higher high',
    'higher low',
    'retest',
    'rejection',
    'swing',
    'levels',
  ],
  'ta-trend-range': ['trend', 'range', 'breakout', 'pullback', 'acceptance', 'failed breakout'],
  'ta-volume': ['volume', 'participation', 'expansion', 'contraction', 'climax'],
  'ta-macd': ['macd', 'histogram', 'crossover', 'momentum', 'lag'],
  'ta-false-breakouts': [
    'false breakout',
    'failed breakout',
    'fakeout',
    'acceptance',
    'poke',
    'why did my breakout fail',
  ],
  'ta-divergence': ['divergence', 'rsi', 'momentum'],
  'ta-momentum': ['momentum', 'overbought', 'persistence', 'why does rsi stay overbought'],
  'risk-per-trade': ['risk per trade', '1 percent', 'how do i size a position'],
  'risk-stops': ['stop loss', 'invalidation', 'structure'],
  'risk-drawdown': ['drawdown', 'peak equity', 'what does drawdown actually mean'],
  'risk-ruin': ['risk of ruin', 'blow up', 'size'],
  'foundations-volatility': ['volatility', 'atr', 'range'],
  'foundations-liquidity': ['liquidity', 'spread', 'thin'],
  'foundations-fx': ['forex', 'eur usd', 'currency pair', 'pip', 'how do i trade currencies'],
  'foundations-timeframes': ['timeframe', 'multiple timeframes'],
  'psych-fomo': ['fomo', 'chase'],
  'psych-revenge': ['revenge', 'tilt'],
  'psych-confirmation': ['confirmation bias', 'evidence'],
  'dec-thesis': ['thesis', 'evidence', 'assumptions'],
  'dec-quality': ['decision quality', 'process', 'dqs'],
  'port-diversification': ['diversification', 'concentration', '20 percent'],
  'ta-moving-averages': ['moving average', 'sma', 'ema', 'crossover', 'trend', 'lag'],
  'ta-mtf': ['multi timeframe', 'alignment', 'higher timeframe'],
  'risk-position-sizing': ['position sizing', 'risk', 'stop', 'size', 'volatility'],
  'risk-expectancy': ['expectancy', 'risk reward', 'drawdown', 'edge'],
  'basics-rr': ['plan', 'invalidation', 'risk reward', 'entry'],
  'dec-invalidation': ['stop', 'invalidation', 'thesis', 'what would change'],
  'dec-portfolio-risk': ['portfolio', 'exposure', 'correlation', 'concentration'],
  'dec-psychology': ['psychology', 'fomo', 'tilt', 'emotion'],
  'dec-journaling': ['journal', 'review', 'process'],
  'fund-basics': ['fundamental', 'catalyst', 'earnings', 'valuation'],
  'fund-calendar': ['calendar', 'event risk', 'news'],
  'opt-basics': ['options', 'premium', 'expression'],
};

export function tokenizeSearchQuery(raw: string): string[] {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9+\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function expandSearchIntent(query: string): string[] {
  const lowered = query.toLowerCase().trim();
  const expanded = new Set(tokenizeSearchQuery(lowered));
  for (const [phrase, aliases] of Object.entries(ACADEMY_INTENT_ALIASES)) {
    if (lowered.includes(phrase)) {
      for (const alias of aliases) {
        for (const token of tokenizeSearchQuery(alias)) expanded.add(token);
        if (!alias.includes(' ')) expanded.add(alias);
      }
    }
  }
  return [...expanded];
}

function haystack(lesson: Lesson): string {
  const extras = EXTRA_KEYWORDS[lesson.id] ?? [];
  return [
    lesson.title,
    lesson.description,
    lesson.content,
    lesson.category,
    CATEGORY_LABELS[lesson.category],
    lesson.difficulty,
    lesson.track,
    ...lesson.tags,
    ...extras,
    ...(lesson.searchKeywords ?? []),
    ...lesson.sections.map((section) => `${section.heading} ${section.body}`),
    ...lesson.keyTakeaways,
    ...(lesson.learningObjectives ?? []),
    lesson.whyItMatters ?? '',
    ...(lesson.exercises ?? []).map((exercise) => `${exercise.prompt} ${exercise.explanation}`),
    ...lesson.quiz.map((question) => question.prompt),
  ]
    .join(' ')
    .toLowerCase();
}

function scoreLesson(lesson: Lesson, terms: string[], rawQuery: string): AcademySearchHit | null {
  const text = haystack(lesson);
  const title = lesson.title.toLowerCase();
  const description = lesson.description.toLowerCase();
  const tags = lesson.tags.join(' ').toLowerCase();
  const extras = (EXTRA_KEYWORDS[lesson.id] ?? []).join(' ').toLowerCase();
  const matched: string[] = [];
  let score = 0;

  const phrase = rawQuery.toLowerCase().trim();
  const phraseClean = phrase.replace(/[^a-z0-9+\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (phraseClean.length > 3 && title.includes(phraseClean)) {
    score += 120;
    matched.push('title');
  } else if (phraseClean.length > 3 && description.includes(phraseClean)) {
    score += 50;
    matched.push('description');
  }
  if (phraseClean.length > 8 && extras.includes(phraseClean)) {
    score += 80;
    matched.push(phraseClean);
  }

  for (const term of terms) {
    if (!term) continue;
    if (title.includes(term)) {
      score += 42;
      matched.push(term);
      continue;
    }
    if (tags.includes(term) || extras.includes(term)) {
      score += 28;
      matched.push(term);
      continue;
    }
    if (description.includes(term)) {
      score += 18;
      matched.push(term);
      continue;
    }
    if (text.includes(term)) {
      score += 8;
      matched.push(term);
    }
  }

  if (score <= 0) return null;

  if (lesson.difficulty === 'beginner' && /\bbeginner|basics|start\b/i.test(rawQuery)) {
    score += 12;
  }

  const uniqueMatched = [...new Set(matched)].slice(0, 4);
  return {
    lesson,
    score,
    matchedTerms: uniqueMatched,
    why: explainMatch(lesson, uniqueMatched, rawQuery),
  };
}

function explainMatch(lesson: Lesson, matched: string[], rawQuery: string): string {
  if (matched.includes('title')) {
    return `Title matches “${rawQuery.trim()}”.`;
  }
  if (matched.includes('description')) {
    return `This lesson is about ${lesson.description.charAt(0).toLowerCase()}${lesson.description.slice(1)}`;
  }
  const concept = matched.find((term) => term !== 'title' && term !== 'description');
  if (concept) {
    return `Matches ${concept} in ${CATEGORY_LABELS[lesson.category].toLowerCase()} · ${lesson.difficulty}.`;
  }
  return `${CATEGORY_LABELS[lesson.category]} · ${lesson.difficulty}.`;
}

export function searchAcademyLessons(
  lessons: Lesson[],
  query: string,
  options: AcademySearchOptions = {},
): AcademySearchHit[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const terms = expandSearchIntent(trimmed);
  const limit = options.limit ?? 12;
  const pool = options.includePremium === false ? lessons.filter((lesson) => !lesson.isPremium) : lessons;

  return pool
    .map((lesson) => scoreLesson(lesson, terms, trimmed))
    .filter((hit): hit is AcademySearchHit => Boolean(hit))
    .sort((a, b) => b.score - a.score || a.lesson.title.localeCompare(b.lesson.title))
    .slice(0, limit);
}

export function difficultyLabel(difficulty: LessonDifficulty): string {
  return difficulty;
}
