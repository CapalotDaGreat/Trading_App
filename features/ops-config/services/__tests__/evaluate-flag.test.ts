import { createDefaultOpsBootstrap, DEFAULT_OPS_FLAGS } from '../../defaults';
import { evaluateAllFlags, evaluateFlag, uidBucket } from '../evaluate-flag';
import { normalizeOpsBootstrap } from '../ops-config.service';

describe('feature flag evaluation', () => {
  it('keeps defaults safe for guest/offline', () => {
    const snap = createDefaultOpsBootstrap();
    expect(snap.source).toBe('defaults');
    expect(snap.remote.aiAnalysisMonthlyFree).toBe(20);
    expect(snap.flags.globalKill.enabled).toBe(false);
    expect(snap.flags.aiChatEnabled.enabled).toBe(true);
  });

  it('stable uid buckets stay in 0–99', () => {
    expect(uidBucket('user-a')).toBeGreaterThanOrEqual(0);
    expect(uidBucket('user-a')).toBeLessThan(100);
    expect(uidBucket('user-a')).toBe(uidBucket('user-a'));
  });

  it('global kill disables high-risk flags', () => {
    const flags = {
      ...DEFAULT_OPS_FLAGS,
      globalKill: { ...DEFAULT_OPS_FLAGS.globalKill, enabled: true },
    };
    const evaluated = evaluateAllFlags(flags, { uid: 'u1', channel: 'production' });
    expect(evaluated.globalKill).toBe(true);
    expect(evaluated.aiChatEnabled).toBe(false);
    expect(evaluated.aggressiveMarketPollingEnabled).toBe(false);
    expect(evaluated.mentorEnabled).toBe(true);
  });

  it('percentage flags respect bucket', () => {
    const definition = {
      key: 'paywallExperimentsEnabled',
      kind: 'percentage' as const,
      enabled: true,
      percentage: 0,
    };
    expect(evaluateFlag(definition, { uid: 'anyone' })).toBe(false);
    expect(evaluateFlag({ ...definition, percentage: 100 }, { uid: 'anyone' })).toBe(true);
  });

  it('beta flags require beta/internal/development channel', () => {
    const definition = {
      ...DEFAULT_OPS_FLAGS.betaReplayStudioEnabled,
      enabled: true,
    };
    expect(evaluateFlag(definition, { channel: 'production' })).toBe(false);
    expect(evaluateFlag(definition, { channel: 'beta' })).toBe(true);
  });

  it('bounds release-critical remote limits and polling intervals', () => {
    const normalized = normalizeOpsBootstrap({
      remote: {
        marketQuotePollMs: 1,
        marketCandlePollMs: Number.NaN,
        researchQueueDepthFree: 500,
        decisionBriefMaxSetups: -4,
      },
    });

    expect(normalized.remote.marketQuotePollMs).toBe(10_000);
    expect(normalized.remote.marketCandlePollMs).toBe(120_000);
    expect(normalized.remote.researchQueueDepthFree).toBe(100);
    expect(normalized.remote.decisionBriefMaxSetups).toBe(0);
  });
});
