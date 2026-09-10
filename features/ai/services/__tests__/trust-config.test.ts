import { CLOUD_AI_ENABLED, isCloudAiEnabled } from '../../constants/ai-release';
import { generateEngineAnalysis } from '../ai-engine.service';
import { fetchCloudAiBrief } from '../cloud-ai.service';

describe('release trust configuration', () => {
  it('keeps cloud AI disabled even when an endpoint is present', () => {
    process.env.EXPO_PUBLIC_AI_API_URL = 'https://example.invalid';
    process.env.EXPO_PUBLIC_AI_API_KEY = 'sk-client-must-not-enable';

    expect(CLOUD_AI_ENABLED).toBe(false);
    expect(isCloudAiEnabled()).toBe(false);
  });

  it('uses research/watch/skip language and local engine provenance', async () => {
    const context = {
      symbol: 'SPY',
      overallBias: 'bullish' as const,
      biasConfidence: 70,
      assembledAt: Date.now(),
      quote: { price: 500, change: 1, changePercent: 0.2 },
      supportLevels: [490],
      resistanceLevels: [510],
    };

    const result = await fetchCloudAiBrief(context);
    const directLocalResult = await generateEngineAnalysis('trade_suggestion', {
      symbol: 'SPY',
      enriched: context,
    });

    expect(result.metadata?.source).toBe('engine');
    expect(result.tradeSuggestion?.action).toBe('research');
    expect(result.tradeSuggestion?.action).toBe(directLocalResult.tradeSuggestion?.action);
    expect(['buy', 'sell']).not.toContain(result.tradeSuggestion?.action);
  });

  it('never calls an external AI HTTP endpoint from the client', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    await fetchCloudAiBrief({
      symbol: 'QQQ',
      overallBias: 'neutral',
      biasConfidence: 40,
      assembledAt: Date.now(),
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
