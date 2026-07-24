import type { AiEnrichedContext } from '@/features/ai/types/ai.types';
import type { RegimeSnapshot } from '@/features/decision/types/decision.types';
import { buildAiDebate } from '../ai-debate.service';

const enriched: AiEnrichedContext = {
  symbol: 'AAPL',
  quote: {
    price: 190,
    change: 2.4,
    changePercent: 1.28,
    volume: 52_000_000,
  },
  trend: 'Rising short-term trend',
  overallBias: 'bullish',
  biasConfidence: 68,
  rsi: { value: 61, signal: 'bullish' },
  macd: { signal: 'bullish', histogram: 0.42 },
  supportLevels: [185],
  resistanceLevels: [195],
  detectedPatterns: [{ name: 'Higher highs', bullish: true, confidence: 62 }],
  newsHeadlines: [
    { id: '1', title: 'Apple reports record services growth', source: 'Reuters' },
    { id: '2', title: 'Sector weakness weighs on tech peers', source: 'Bloomberg' },
  ],
  assembledAt: Date.now(),
};

const regime: RegimeSnapshot = {
  regime: 'trending',
  label: 'Trending',
  volatility: 'medium',
  trend: 'bullish',
  liquidity: 'high',
  bestStrategies: ['pullbacks'],
  avoidStrategies: ['chase breakouts'],
  asOf: Date.now(),
  explainability: {
    confidence: 70,
    factors: [],
    agrees: 1,
    disagrees: 0,
    dataAsOf: Date.now(),
    freshness: 'unknown',
    reasoning: 'test',
  },
};

describe('buildAiDebate', () => {
  it('always returns bull, bear, and neutral cases', () => {
    const debate = buildAiDebate({
      enriched,
      timeframe: '1d',
      regime,
      portfolioSymbols: [],
    });

    expect(debate.bullCase.side).toBe('bull');
    expect(debate.bearCase.side).toBe('bear');
    expect(debate.neutralCase.side).toBe('neutral');
    expect(debate.bullCase.points.length).toBeGreaterThan(0);
    expect(debate.bearCase.points.length).toBeGreaterThan(0);
    expect(debate.neutralCase.points.length).toBeGreaterThan(0);
  });

  it('cites real headlines and levels without inventing buy language', () => {
    const debate = buildAiDebate({
      enriched,
      timeframe: '1d',
      regime,
    });

    const allText = [
      ...debate.bullCase.points.map((p) => p.text),
      ...debate.bearCase.points.map((p) => p.text),
      debate.scores.researchPriorityLabel,
      ...debate.questionsBeforeResearch,
    ].join(' ');

    expect(allText).toMatch(/record services growth|RSI|Resistance|support/i);
    expect(allText.toLowerCase()).not.toMatch(/buy now|sell now|moon/);
    expect(debate.questionsBeforeResearch.some((q) => /invalidat/i.test(q))).toBe(true);
    expect(debate.scores.researchValueScore).toBeGreaterThan(0);
    expect(debate.scores.decisionQualityScore).toBeGreaterThan(0);
  });

  it('keeps provisional language when evidence is thin', () => {
    const debate = buildAiDebate({
      enriched: { symbol: 'XYZ', assembledAt: Date.now() },
      timeframe: '4h',
    });

    expect(debate.bullCase.points[0]?.text.toLowerCase()).toMatch(/insufficient|provisional|timeframe/);
    expect(debate.bearCase.points[0]?.text.toLowerCase()).toMatch(/insufficient|provisional|timeframe/);
    expect(debate.neutralCase.points.length).toBeGreaterThan(0);
  });
});
