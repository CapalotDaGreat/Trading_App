import type { Candle } from '@/shared/types/market';

import {
  createSimulatorSession,
  pickFreezeIndex,
  sliceSimulatorCandles,
} from '../simulator-session.service';
import { scoreSimulatorDecision } from '../simulator-score.service';

function makeCandles(count: number): Candle[] {
  const start = Date.UTC(2024, 0, 1);
  return Array.from({ length: count }, (_, i) => {
    const base = 100 + Math.sin(i / 5) * 4 + i * 0.05;
    return {
      timestamp: start + i * 86_400_000,
      open: base,
      high: base + 1.2,
      low: base - 1.1,
      close: base + 0.3,
      volume: 1_000_000 + i * 1000,
    };
  });
}

describe('decision simulator session', () => {
  it('hides future candles until freeze index', () => {
    const candles = makeCandles(90);
    const freeze = pickFreezeIndex(candles.length);
    const sliced = sliceSimulatorCandles(candles, freeze);
    expect(sliced.visibleCandles.length).toBe(freeze + 1);
    expect(sliced.futureCandles.length).toBe(candles.length - freeze - 1);
    expect(sliced.visibleCandles.at(-1)?.timestamp).toBeLessThan(
      sliced.futureCandles[0]?.timestamp ?? Number.POSITIVE_INFINITY,
    );
  });

  it('creates a deciding session with context and no reveal yet', () => {
    const session = createSimulatorSession({
      symbol: 'AAPL',
      interval: '1d',
      candles: makeCandles(100),
      regimeLabel: 'Trending',
      regime: 'trending',
      newsHeadlines: [{ id: '1', title: 'Services growth', source: 'Reuters' }],
      researchTimeMinutes: 15,
    });

    expect(session.phase).toBe('deciding');
    expect(session.visibleCandles.length).toBeGreaterThan(20);
    expect(session.futureCandles.length).toBeGreaterThan(0);
    expect(session.context.newsHeadlines[0]?.title).toContain('Services');
    expect(session.scores).toBeUndefined();
  });
});

describe('decision simulator scoring', () => {
  it('scores process quality and never uses profit as a grade', () => {
    const session = createSimulatorSession({
      symbol: 'MSFT',
      interval: '1d',
      candles: makeCandles(100),
      regimeLabel: 'Ranging',
      regime: 'ranging',
      researchTimeMinutes: 20,
    });

    const scores = scoreSimulatorDecision({
      session: {
        ...session,
        checklist: {
          reviewedIndicators: true,
          notedRegime: true,
          consideredPortfolio: true,
          setInvalidationThought: true,
          respectedTimeBudget: true,
        },
        reasoningNote: 'Wait for confirmation above resistance; invalidate below support.',
      },
      action: 'wait',
      reasoningNote: 'Wait for confirmation above resistance; invalidate below support.',
      checklist: {
        reviewedIndicators: true,
        notedRegime: true,
        consideredPortfolio: true,
        setInvalidationThought: true,
        respectedTimeBudget: true,
      },
    });

    expect(scores.processScore).toBeGreaterThan(50);
    expect(scores.decisionQualityScore).toBeGreaterThan(40);
    expect(scores.whatHappened.toLowerCase()).toContain('bars');
    expect(scores.whyItMatters.toLowerCase()).not.toMatch(/profit|p&l|winning trade/);
    expect(scores.journalPrompt.toLowerCase()).toContain('process');
    expect(scores.replayHref).toContain('decision-replay');
  });

  it('penalizes thin reasoning and missing invalidation thought', () => {
    const session = createSimulatorSession({
      symbol: 'NVDA',
      interval: '1d',
      candles: makeCandles(100),
    });

    const weak = scoreSimulatorDecision({
      session,
      action: 'research',
      reasoningNote: '',
      checklist: {
        reviewedIndicators: false,
        notedRegime: false,
        consideredPortfolio: false,
        setInvalidationThought: false,
        respectedTimeBudget: true,
      },
    });

    expect(weak.reasoningScore).toBeLessThan(50);
    expect(weak.whatWasMissed.join(' ').toLowerCase()).toMatch(/invalidation/);
  });
});
