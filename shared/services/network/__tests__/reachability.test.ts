import {
  getReachabilityListenerCount,
  resetReachabilityForTests,
  subscribeReachability,
} from '../reachability';

describe('shared reachability', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    resetReachabilityForTests();
    global.fetch = originalFetch;
  });

  it('dedupes probes across multiple subscribers', async () => {
    let fetchCount = 0;
    global.fetch = jest.fn(async () => {
      fetchCount += 1;
      return { ok: true } as Response;
    });

    const unsubA = subscribeReachability(() => undefined);
    const unsubB = subscribeReachability(() => undefined);

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(getReachabilityListenerCount()).toBe(2);
    expect(fetchCount).toBeLessThanOrEqual(1);

    unsubA();
    unsubB();
    expect(getReachabilityListenerCount()).toBe(0);
  });
});
