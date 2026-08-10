import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  loadTraderMemory,
  saveTraderMemory,
  traderMemoryStorageKey,
} from '../trader-intelligence.service';

describe('trader memory identity integrity', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('uses a different storage key for each uid', () => {
    expect(traderMemoryStorageKey('user-a')).not.toBe(traderMemoryStorageKey('user-b'));
  });

  it('does not expose one user memory to another user', async () => {
    await saveTraderMemory({ tradingStyle: 'position' }, 'user-a');

    expect((await loadTraderMemory('user-a')).tradingStyle).toBe('position');
    expect((await loadTraderMemory('user-b')).tradingStyle).toBe('swing');
  });
});
