import { shouldTriggerAlert } from '@/features/alerts/services/alert-rules';
import { biasFromScore, buildCounterfactuals } from '@/features/decision/services/explainability.service';
import { advanceSetupLifecycle } from '@/features/decision/services/setup-lifecycle.service';
import { prioritizeResearch } from '@/features/decision/services/research-prioritizer.service';
import type { DecisionBrief, SetupCardData } from '@/features/decision/types/decision.types';
import { getDataFreshness } from '@/features/markets/constants/freshness';

describe('shouldTriggerAlert', () => {
  const base = {
    id: '1',
    symbol: 'AAPL',
    targetPrice: 100,
    condition: 'above' as const,
    isActive: true,
    createdAt: Date.now(),
  };

  it('triggers when price crosses above target', () => {
    expect(shouldTriggerAlert(base, 100)).toBe(true);
    expect(shouldTriggerAlert(base, 99)).toBe(false);
  });

  it('does not trigger inactive alerts', () => {
    expect(shouldTriggerAlert({ ...base, isActive: false }, 150)).toBe(false);
  });
});

describe('explainability', () => {
  it('maps score to bias', () => {
    expect(biasFromScore(5, 1)).toBe('bullish');
    expect(biasFromScore(1, 5)).toBe('bearish');
    expect(biasFromScore(2, 2)).toBe('neutral');
  });

  it('builds counterfactuals', () => {
    const cfs = buildCounterfactuals({
      confidence: 70,
      factors: [{ label: 'Trend', agrees: false, detail: 'down' }],
      rsiSignal: 'overbought',
    });
    expect(cfs.length).toBeGreaterThan(0);
  });
});

describe('setup lifecycle', () => {
  const setup: SetupCardData = {
    id: 's1',
    symbol: 'TEST',
    title: 'Test',
    bias: 'bullish',
    status: 'forming',
    confidence: 72,
    why: ['trend up'],
    invalidation: 'Below 90',
    risk: 'medium',
    explainability: {
      confidence: 72,
      factors: [],
      agrees: 1,
      disagrees: 0,
      dataAsOf: Date.now(),
      freshness: 'recent',
      reasoning: '',
    },
  };

  it('invalidates bullish setup below support', () => {
    const next = advanceSetupLifecycle(setup, {
      timestamp: Date.now(),
      open: 89,
      high: 90,
      low: 88,
      close: 89,
      volume: 1,
    });
    expect(next.status).toBe('invalidated');
  });
});

describe('research prioritizer', () => {
  it('returns up to 3 symbols within budget', () => {
    const brief: DecisionBrief = {
      greeting: '',
      generatedAt: Date.now(),
      regime: 'trending',
      regimeLabel: 'Trending',
      highImpactEvents: [],
      setupCount: 2,
      topSetups: [],
      watchFocus: [],
      headline: '',
      summary: '',
      suggestResearch: ['AAPL'],
      explainability: {
        confidence: 60,
        factors: [],
        agrees: 1,
        disagrees: 0,
        dataAsOf: Date.now(),
        freshness: 'recent',
        reasoning: '',
      },
      quotesFetchedAt: Date.now(),
    };

    const setups: SetupCardData[] = [
      {
        id: '1',
        symbol: 'AAPL',
        title: 'A',
        bias: 'bullish',
        status: 'forming',
        confidence: 80,
        why: ['a'],
        risk: 'low',
        explainability: brief.explainability,
      },
      {
        id: '2',
        symbol: 'NVDA',
        title: 'B',
        bias: 'bullish',
        status: 'watching',
        confidence: 55,
        why: ['b', 'c', 'd', 'e'],
        risk: 'high',
        explainability: brief.explainability,
      },
    ];

    const picked = prioritizeResearch(brief, setups, 20);
    expect(picked.length).toBeGreaterThan(0);
    expect(picked.length).toBeLessThanOrEqual(3);
  });
});

describe('quote freshness', () => {
  it('marks stale data', () => {
    const stale = getDataFreshness(Date.now() - 10 * 60_000);
    expect(['stale', 'unknown']).toContain(stale);
  });
});
