/**
 * Hermes / Expo Go do not provide the Web Crypto global. Firebase App Check
 * (and a few other libs) call bare `crypto.randomUUID()` / `getRandomValues`,
 * which throws ReferenceError: Property 'crypto' doesn't exist.
 *
 * Must be required from index.js before any Firebase import.
 */
(function installCryptoPolyfill() {
  const g =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof global !== 'undefined'
        ? global
        : typeof self !== 'undefined'
          ? self
          : null;
  if (!g) return;

  let ExpoCrypto = null;
  try {
    ExpoCrypto = require('expo-crypto');
  } catch {
    // Fallback below when native module is unavailable (SSR / tests).
  }

  function randomUUID() {
    if (ExpoCrypto && typeof ExpoCrypto.randomUUID === 'function') {
      try {
        const token = ExpoCrypto.randomUUID();
        if (typeof token === 'string' && token.length > 0) return token;
      } catch {
        // Fall through to Math.random UUID when native crypto is unavailable.
      }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getRandomValues(typedArray) {
    if (!typedArray || typedArray.length == null) {
      throw new TypeError('Expected a TypedArray');
    }
    if (ExpoCrypto && typeof ExpoCrypto.getRandomBytes === 'function') {
      const bytes = ExpoCrypto.getRandomBytes(typedArray.length);
      typedArray.set(bytes);
      return typedArray;
    }
    for (let i = 0; i < typedArray.length; i += 1) {
      typedArray[i] = (Math.random() * 256) | 0;
    }
    return typedArray;
  }

  const existing = g.crypto;
  const api = {
    randomUUID: typeof existing?.randomUUID === 'function' ? existing.randomUUID.bind(existing) : randomUUID,
    getRandomValues:
      typeof existing?.getRandomValues === 'function'
        ? existing.getRandomValues.bind(existing)
        : getRandomValues,
    subtle: existing?.subtle,
  };

  try {
    Object.defineProperty(g, 'crypto', {
      value: api,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  } catch {
    g.crypto = api;
  }

  // Some RN runtimes expose `global` separately from `globalThis`.
  if (typeof global !== 'undefined' && global !== g) {
    try {
      Object.defineProperty(global, 'crypto', {
        value: api,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    } catch {
      global.crypto = api;
    }
  }
})();
