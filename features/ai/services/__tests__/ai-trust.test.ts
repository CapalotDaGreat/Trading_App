import { buildConfidenceBreakdown } from '@/features/ai/services/ai-confidence.service';
import { buildEvidencePack } from '@/features/ai/services/ai-evidence.service';
import { buildAiCounterfactuals } from '@/features/ai/services/ai-counterfactual.service';
import { buildAiTrustPayload } from '@/features/ai/services/ai-trust.service';
import type { AiEnrichedContext } from '@/features/ai/types/ai.types';

const context: AiEnrichedContext = {
  symbol: 'MSFT',
  quote: { price: 420, change: 2, changePercent: 0.5, volume: 2_500_000 },
  trend: 'uptrend',
  overallBias: 'bullish',
  biasConfidence: 72,
  rsi: { value: 58, signal: 'neutral' },
  macd: { signal: 'bullish', histogram: 0.2 },
  atr: 6,
  adx: 28,
  supportLevels: [410],
  resistanceLevels: [430],
  newsHeadlines: [{ id: '1', title: 'Cloud demand steady', source: 'Wire' }],
  fearGreedIndex: 55,
  fearGreedLabel: 'Neutral',
  decisionIntelligence: {
    psychologyReminder: 'Write invalidation first.',
    recommendedFocus: 'Process over P&L',
    regimeLabel: 'trending',
    tradingStyle: 'swing',
  },
  assembledAt: Date.now(),
};

describe('ai trust engine', () => {
  it('builds a multi-pillar confidence breakdown', () => {
    const breakdown = buildConfidenceBreakdown(context);
    expect(breakdown.overall).toBeGreaterThanOrEqual(35);
    expect(breakdown.overall).toBeLessThanOrEqual(95);
    expect(breakdown.pillars.map((p) => p.id)).toEqual(
      expect.arrayContaining([
        'trend',
        'momentum',
        'volume',
        'volatility',
        'macro',
        'news',
        'breadth',
        'regimeFit',
        'dataFreshness',
      ]),
    );
    expect(breakdown.notice.toLowerCase()).toMatch(/not predict|do not predict/);
  });

  it('builds evidence with module links', () => {
    const pack = buildEvidencePack(context, 'bullish');
    expect(pack.observation.length).toBeGreaterThan(10);
    expect(pack.items.find((i) => i.id === 'rsi')?.present).toBe(true);
    expect(pack.items.find((i) => i.id === 'regime')?.href).toBe('/decision/regime');
  });

  it('builds educational counterfactuals', () => {
    const breakdown = buildConfidenceBreakdown(context);
    const flips = buildAiCounterfactuals(context, breakdown);
    expect(flips.length).toBeGreaterThan(0);
    expect(flips.some((f) => /RSI|volume|ADX|catalyst|inflation/i.test(f.label))).toBe(true);
  });

  it('buildAiTrustPayload composes meta honesty fields', () => {
    const trust = buildAiTrustPayload(context, { sentiment: 'bullish', action: 'research' });
    expect(trust.meta.educationalReminder.length).toBeGreaterThan(20);
    expect(trust.meta.providerLabel.length).toBeGreaterThan(0);
    expect(trust.confidence.pillars.length).toBeGreaterThanOrEqual(9);
    expect(trust.evidence.items.length).toBeGreaterThan(5);
    expect(trust.counterfactuals.length).toBeGreaterThan(0);
    expect(['live', 'recent', 'stale', 'unknown']).toContain(trust.meta.freshness);
  });
});
