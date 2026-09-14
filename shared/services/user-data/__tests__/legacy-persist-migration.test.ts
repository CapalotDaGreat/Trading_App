import AsyncStorage from '@react-native-async-storage/async-storage';

import { migrateLegacyPersistKeys, RETIRED_PERSIST_TOKEN } from '../legacy-persist-migration';

describe('legacy persist key migration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('copies retired persist keys onto TradeAcademy keys once', async () => {
    await AsyncStorage.setItem(`${RETIRED_PERSIST_TOKEN}-settings`, '{"theme":"dark"}');
    await AsyncStorage.setItem(`${RETIRED_PERSIST_TOKEN}:onboarding-draft:v1`, '{"step":2}');

    const first = await migrateLegacyPersistKeys();
    expect(first.copied).toBe(2);
    expect(await AsyncStorage.getItem('tradeacademy-settings')).toBe('{"theme":"dark"}');
    expect(await AsyncStorage.getItem('tradeacademy:onboarding-draft:v1')).toBe('{"step":2}');
    expect(await AsyncStorage.getItem(`${RETIRED_PERSIST_TOKEN}-settings`)).toBeNull();

    await AsyncStorage.setItem(`${RETIRED_PERSIST_TOKEN}-settings`, '{"theme":"light"}');
    const second = await migrateLegacyPersistKeys();
    expect(second.copied).toBe(0);
    expect(await AsyncStorage.getItem('tradeacademy-settings')).toBe('{"theme":"dark"}');
  });
});
