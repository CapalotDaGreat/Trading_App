import { getMarketDataHealthSnapshot } from '../market-data-health.service';

describe('getMarketDataHealthSnapshot', () => {
  it('states that client vendor keys are never required', () => {
    const health = getMarketDataHealthSnapshot({
      runtimeMode: 'synthetic',
      proxyAvailable: false,
      allowDevDirect: false,
    });

    expect(health.requiresClientVendorKeys).toBe(false);
    expect(health.runtimeMode).toBe('synthetic');
    expect(health.rows.find((r) => r.id === 'synthetic')?.status).toBe('active');
    expect(health.rows.find((r) => r.id === 'public-crypto-fx')?.detail).toMatch(/no-key/i);
    expect(health.rows.find((r) => r.id === 'dev-direct')?.status).toBe('not_applicable');
  });

  it('marks Functions proxy available only when signed-in proxy is enabled', () => {
    const guest = getMarketDataHealthSnapshot({
      runtimeMode: 'synthetic',
      proxyAvailable: false,
      allowDevDirect: false,
    });
    const signedIn = getMarketDataHealthSnapshot({
      runtimeMode: 'vendor',
      proxyAvailable: true,
      allowDevDirect: false,
    });

    expect(guest.rows.find((r) => r.id === 'functions-proxy')?.status).toBe('not_configured');
    expect(signedIn.rows.find((r) => r.id === 'functions-proxy')?.status).toBe('available');
    expect(signedIn.rows.find((r) => r.id === 'server-finnhub')?.status).toBe('optional_idle');
  });
});
