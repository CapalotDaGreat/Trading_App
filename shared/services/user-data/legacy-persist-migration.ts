import AsyncStorage from '@react-native-async-storage/async-storage';

import { FROZEN_TECHNICAL_IDS } from '@/shared/constants/brand';

/**
 * Previous persist-key token. Kept only so existing local data can be copied
 * onto TradeAcademy keys. Never shown in UI.
 */
export const RETIRED_PERSIST_TOKEN = 'tradevision';

const CURRENT_TOKEN = 'tradeacademy';
const MIGRATION_FLAG = `${FROZEN_TECHNICAL_IDS.persistKeyPrefix}persist-migrated-v1`;

export async function migrateLegacyPersistKeys(): Promise<{ copied: number }> {
  try {
    const done = await AsyncStorage.getItem(MIGRATION_FLAG);
    if (done === '1') return { copied: 0 };

    const keys = await AsyncStorage.getAllKeys();
    const keySet = new Set(keys);
    const pairs: [string, string][] = [];
    const retired: string[] = [];

    for (const key of keys) {
      if (!key.includes(RETIRED_PERSIST_TOKEN)) continue;
      const next = key.split(RETIRED_PERSIST_TOKEN).join(CURRENT_TOKEN);
      if (next === key) continue;
      retired.push(key);
      if (keySet.has(next)) continue;
      const value = await AsyncStorage.getItem(key);
      if (value == null) continue;
      pairs.push([next, value]);
      keySet.add(next);
    }

    if (pairs.length > 0) {
      await AsyncStorage.multiSet(pairs);
    }
    if (retired.length > 0) {
      await AsyncStorage.multiRemove(retired);
    }
    await AsyncStorage.setItem(MIGRATION_FLAG, '1');
    return { copied: pairs.length };
  } catch {
    return { copied: 0 };
  }
}
