/**
 * @jest-environment node
 */

describe('crypto polyfill', () => {
  it('installs crypto.randomUUID and getRandomValues on globalThis', () => {
    const previous = globalThis.crypto;
    // Force a missing Web Crypto surface like Hermes Expo Go.
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../../polyfills/crypto');
    });

    expect(typeof globalThis.crypto?.randomUUID).toBe('function');
    expect(typeof globalThis.crypto?.getRandomValues).toBe('function');

    const a = globalThis.crypto!.randomUUID();
    const b = globalThis.crypto!.randomUUID();
    expect(a).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(b).not.toBe(a);

    const bytes = new Uint8Array(8);
    globalThis.crypto!.getRandomValues(bytes);
    expect(bytes.some((value) => value !== 0)).toBe(true);

    Object.defineProperty(globalThis, 'crypto', {
      value: previous,
      configurable: true,
      writable: true,
    });
  });
});
