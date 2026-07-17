import {
  buildResearchBalance,
  computeDecisionQualityScore,
  computeResearchValueScore,
} from '../research-value.service';
import type { SetupCardData } from '../../types/decision.types';

function mockSetup(partial: Partial<SetupCardData> = {}): SetupCardData {
  return {
    id: 't1',
    symbol: 'NVDA',
    title: 'Bullish pullback with trend',
    bias: 'bullish',
    status: 'forming',
    confidence: 70,
    why: ['Daily structure: uptrend', 'RSI: recovering', 'MACD: histogram rising'],
    invalidation: 'Below 120',
    risk: 'medium',
    explainability: {
      confidence: 70,
      factors: [],
      agrees: 2,
      disagrees: 0,
      dataAsOf: Date.now(),
      freshness: 'recent',
      reasoning: 'test',
    },
    researchChecklist: [
      { id: 'trend', label: 'Trend', done: true },
      { id: 'catalyst', label: 'Catalyst', done: true },
      { id: 'entry', label: 'Entry', done: true },
      { id: 'risk', label: 'Risk', done: true },
    ],
    ...partial,
  };
}

describe('research-value.service', () => {
  it('scores research value without implying price direction', () => {
    const result = computeResearchValueScore({
      setup: mockSetup(),
      regime: 'trending',
      portfolioSymbols: ['AAPL'],
      eventCount: 1,
      timeBudgetMinutes: 25,
    });
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.explanation.toLowerCase()).toContain('research value');
    expect(result.explanation.toLowerCase()).not.toContain('will go up');
  });

  it('grades decision quality from process checks', () => {
    const dqs = computeDecisionQualityScore(mockSetup({ invalidation: undefined }));
    expect(dqs.checks.some((c) => c.id === 'risk' && !c.passed)).toBe(true);
    expect(dqs.explanation.toLowerCase()).toContain('process');
  });

  it('builds balanced research reasons', () => {
    const balance = buildResearchBalance(
      mockSetup({
        whyNot: {
          symbol: 'NVDA',
          reasons: ['High event risk'],
          savedMinutes: 10,
          summary: 'Skip for now',
        },
      }),
      ['SPY', 'AAPL'],
    );
    expect(balance.reasonsToResearch.length).toBeGreaterThan(0);
    expect(balance.reasonsNotToResearch.length).toBeGreaterThan(0);
    expect(balance.alternativeSymbols).toContain('SPY');
  });
});
