/**
 * App entry for Expo / Expo Go.
 *
 * AppRegistry must register "main" synchronously during the first evaluation of
 * this module. Deferring `expo-router/entry` until after AsyncStorage migration
 * causes "App entry not found" on device.
 *
 * Zustand persist hydrates asynchronously after import, so starting migration
 * immediately (then loading the router) still wins the race in practice when a
 * one-time copy is needed. See docs/IDENTITY_MIGRATION_PHASE0.md.
 */

// Must be first: Hermes has no Web Crypto; Firebase App Check calls bare `crypto`.
require('./shared/polyfills/crypto');

const { migrateLegacyPersistKeys } = require('./shared/services/user-data/legacy-persist-migration');

void migrateLegacyPersistKeys().catch(() => {
  // Best-effort; never block boot.
});

require('expo-router/entry');
