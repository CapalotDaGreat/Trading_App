import AsyncStorage from '@react-native-async-storage/async-storage';

import { canConsumeMonthly, getLimit, incrementMonthlyUsage } from '../entitlement.service';

describe('entitlement enforcement', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('uses the central free-tier limits', () => {
    expect(getLimit('alertsMax', 'free')).toBe(5);
    expect(getLimit('portfolioPositions', 'free')).toBe(10);
  });

  it('blocks monthly consumption at the configured allowance', async () => {
    const uid = 'quota-user';
    const limit = getLimit('replaySessionsMonthly', 'free');
    await incrementMonthlyUsage(uid, 'replaySessionsMonthly', limit);

    await expect(canConsumeMonthly(uid, 'replaySessionsMonthly', 'free')).resolves.toEqual({
      allowed: false,
      used: limit,
      limit,
    });
  });
});
