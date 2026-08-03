import { generateEngineAnalysis } from '@/features/ai/services/ai-engine.service';
import type { AiEnrichedContext } from '@/features/ai/types/ai.types';

const baseContext: AiEnrichedContext = {
  symbol: 'TEST',
  quote: { price: 100, change: 1.5, changePercent: 1.5 },
  trend: 'uptrend',
  overallBias: 'bullish',
  biasConfidence: 72,
  rsi: { value: 58, signal: 'neutral' },
  macd: { signal: 'bullish', histogram: 0.12 },
  atr: 2.5,
  adx: 28,
  supportLevels: [95, 92],
  resistanceLevels: [105, 108],
  detectedPatterns: [{ name: 'Bullish Engulfing', bullish: true, confidence: 68 }],
  assembledAt: Date.now(),
};

describe('ai-engine', () => {
  it('generates trade suggestion with why reasons from live context', async () => {
    const result = await generateEngineAnalysis('trade_suggestion', {
      symbol: 'TEST',
      enriched: baseContext,
    });

    expect(result.tradeSuggestion?.why.length).toBeGreaterThan(0);
    expect(result.metadata?.source).toBe('engine');
    expect(result.tradeSuggestion?.observationZone).toBeDefined();
    expect(result.tradeSuggestion?.invalidationLevel).toBeDefined();
    expect(result.tradeSuggestion?.nextResearchLevel).toBeDefined();
  });

  it('generates risk analysis with ATR-based factors', async () => {
    const result = await generateEngineAnalysis('risk_analysis', {
      symbol: 'TEST',
      enriched: baseContext,
    });

    expect(result.riskAnalysis?.factors.some((f) => f.label.includes('ATR'))).toBe(true);
    expect(result.riskAnalysis?.positionSizing).toContain('ATR');
  });

  it('explains detected pattern by name', async () => {
    const result = await generateEngineAnalysis('pattern_explanation', {
      symbol: 'TEST',
      pattern: 'Bullish Engulfing',
      enriched: baseContext,
    });

    expect(result.patternExplanation?.pattern).toContain('Bullish');
    expect(result.patternExplanation?.explanation.length).toBeGreaterThan(20);
  });
});
