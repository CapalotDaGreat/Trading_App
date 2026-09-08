export interface GlossaryTerm {
  id: string;
  term: string;
  aliases: string[];
  short: string;
  lessonId?: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'rsi',
    term: 'RSI',
    aliases: ['relative strength', 'overbought', 'oversold'],
    short:
      'A momentum oscillator from 0–100. High readings mean recent gains were stretched, not that price must fall.',
    lessonId: 'ta-rsi',
  },
  {
    id: 'macd',
    term: 'MACD',
    aliases: ['moving average convergence', 'histogram'],
    short:
      'A lagging momentum overlay. Crossovers describe persistence after the fact — not an automatic buy or sell.',
    lessonId: 'ta-macd',
  },
  {
    id: 'false-breakout',
    term: 'False breakout',
    aliases: ['failed breakout', 'fakeout'],
    short:
      'Price pokes beyond a level then is rejected. The first tick outside the range is not confirmation.',
    lessonId: 'ta-false-breakouts',
  },
  {
    id: 'fx-pair',
    term: 'Currency pair',
    aliases: ['forex', 'eur usd', 'base currency', 'quote currency'],
    short:
      'A relative price: base vs quote. EUR/USD at 1.10 means one euro costs 1.10 dollars. Conversion is not a trade signal.',
    lessonId: 'foundations-fx',
  },
  {
    id: 'atr',
    term: 'ATR',
    aliases: ['average true range'],
    short:
      'A measure of typical range. Useful for sizing and stop distance — not a direction signal.',
    lessonId: 'risk-position-sizing',
  },
  {
    id: 'volatility',
    term: 'Volatility',
    aliases: ['vol'],
    short:
      'How much price tends to move. Higher volatility usually means wider invalidation and smaller size.',
    lessonId: 'foundations-volatility',
  },
  {
    id: 'drawdown',
    term: 'Drawdown',
    aliases: ['dd'],
    short: 'Peak-to-trough decline in equity. It describes pain and survival math, not skill.',
    lessonId: 'risk-drawdown',
  },
  {
    id: 'support',
    term: 'Support',
    aliases: ['demand'],
    short: 'A zone where buyers previously appeared. Treat it as an area, not a laser line.',
    lessonId: 'ta-structure',
  },
  {
    id: 'resistance',
    term: 'Resistance',
    aliases: ['supply'],
    short: 'A zone where sellers previously appeared. Breaks still need acceptance, not just a tick.',
    lessonId: 'ta-structure',
  },
  {
    id: 'divergence',
    term: 'Divergence',
    aliases: ['bearish divergence', 'bullish divergence'],
    short:
      'Price makes a new extreme while an oscillator does not. A research clue, never a standalone trigger.',
    lessonId: 'ta-divergence',
  },
  {
    id: 'momentum',
    term: 'Momentum',
    aliases: ['relative strength'],
    short: 'The speed of recent price change. Strong momentum can stay stretched longer than it feels fair.',
    lessonId: 'ta-momentum',
  },
  {
    id: 'liquidity',
    term: 'Liquidity',
    aliases: ['thin', 'spread'],
    short: 'How easily size can transact without moving price. Thin markets increase slippage and false breaks.',
    lessonId: 'foundations-liquidity',
  },
  {
    id: 'fomo',
    term: 'FOMO',
    aliases: ['fear of missing out', 'chase'],
    short: 'Chasing a move already extended. Skip is a complete decision.',
    lessonId: 'psych-fomo',
  },
  {
    id: 'confirmation-bias',
    term: 'Confirmation bias',
    aliases: ['cherry picking'],
    short: 'Collecting evidence that agrees with the idea and ignoring what would invalidate it.',
    lessonId: 'psych-confirmation',
  },
  {
    id: 'position-sizing',
    term: 'Position sizing',
    aliases: ['size', 'how do i size a position'],
    short: 'How large the position is given the stop distance and a fixed cash risk. Size follows risk, not conviction.',
    lessonId: 'risk-position-sizing',
  },
  {
    id: 'risk-of-ruin',
    term: 'Risk of ruin',
    aliases: ['blow up'],
    short: 'The chance of depleting the account given size, streak risk, and correlation. Survival first.',
    lessonId: 'risk-ruin',
  },
  {
    id: 'thesis',
    term: 'Thesis',
    aliases: ['setup thesis', 'evidence'],
    short: 'A testable claim plus what would prove it wrong. Not a mood or a ticker.',
    lessonId: 'dec-thesis',
  },
  {
    id: 'diversification',
    term: 'Diversification',
    aliases: ['concentration', 'allocation'],
    short: 'Spreading exposure so one name or one theme cannot dominate the outcome.',
    lessonId: 'port-diversification',
  },
  {
    id: 'pe',
    term: 'P/E',
    aliases: ['price to earnings', 'valuation'],
    short:
      'Price divided by earnings. A context number, not a buy or sell instruction. Compare with growth and cycle.',
    lessonId: 'fund-basics',
  },
  {
    id: 'beta',
    term: 'Beta',
    aliases: ['market sensitivity'],
    short: 'How much the name has historically moved with a benchmark. Past co-movement, not destiny.',
    lessonId: 'dec-portfolio-risk',
  },
  {
    id: 'market-cap',
    term: 'Market cap',
    aliases: ['market capitalization'],
    short: 'Share price times shares outstanding. Size context for liquidity and typical behaviour.',
    lessonId: 'fund-basics',
  },
];

export function findGlossaryTerm(query: string): GlossaryTerm | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  return (
    GLOSSARY_TERMS.find(
      (item) =>
        item.term.toLowerCase() === needle ||
        item.id === needle ||
        item.aliases.some((alias) => alias.toLowerCase() === needle),
    ) ??
    GLOSSARY_TERMS.find(
      (item) =>
        needle.includes(item.term.toLowerCase()) ||
        item.aliases.some((alias) => needle.includes(alias.toLowerCase())),
    ) ??
    null
  );
}

export function glossaryForTags(tags: string[]): GlossaryTerm[] {
  const hits: GlossaryTerm[] = [];
  for (const tag of tags) {
    const match = findGlossaryTerm(tag);
    if (match && !hits.some((item) => item.id === match.id)) hits.push(match);
  }
  return hits.slice(0, 4);
}
