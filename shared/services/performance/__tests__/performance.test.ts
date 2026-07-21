import { PerformanceDiagnostics } from '../performance';

describe('performance diagnostics', () => {
  it('is a production no-op', async () => {
    const diagnostics = new PerformanceDiagnostics(false);

    diagnostics.mark('startup.begin');
    diagnostics.increment('market.request.started');
    const value = await diagnostics.measureAsync('brief.build', async () => 42);

    expect(value).toBe(42);
    expect(diagnostics.snapshot()).toEqual({ events: [], counters: {} });
  });

  it('resets counters and events', () => {
    const diagnostics = new PerformanceDiagnostics(true);
    diagnostics.increment('market.request.started', 2);
    diagnostics.mark('startup.ready');

    diagnostics.reset();

    expect(diagnostics.snapshot()).toEqual({ events: [], counters: {} });
  });

  it('drops symbols, PII, and research content from metadata', () => {
    const diagnostics = new PerformanceDiagnostics(true);
    diagnostics.mark('chart.work.begin', {
      requestType: 'candles',
      symbol: 'PRIVATE',
      email: 'person@example.com',
      research: 'private thesis',
      outcome: 'PRIVATE',
    } as never);

    expect(diagnostics.snapshot().events[0]?.metadata).toEqual({ requestType: 'candles' });
    expect(JSON.stringify(diagnostics.snapshot())).not.toContain('PRIVATE');
    expect(JSON.stringify(diagnostics.snapshot())).not.toContain('person@example.com');
    expect(JSON.stringify(diagnostics.snapshot())).not.toContain('private thesis');
  });
});
