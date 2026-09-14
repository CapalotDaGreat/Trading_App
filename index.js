/**
 * Delay Expo Router until retired persist keys have been copied onto TradeAcademy keys.
 * Zustand persist hydrates on import, so this must run before `expo-router/entry`.
 */
import { migrateLegacyPersistKeys } from './shared/services/user-data/legacy-persist-migration';

void migrateLegacyPersistKeys().finally(() => {
  require('expo-router/entry');
});
