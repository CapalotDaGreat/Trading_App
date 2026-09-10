import AsyncStorage from '@react-native-async-storage/async-storage';

import { PREMIUM_PRODUCT_IDS } from '@/shared/constants/subscription';
import { canConsumeMonthly, getLimit, incrementMonthlyUsage } from '../entitlement.service';

describe('entitlement enforcement', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('uses the central free-tier limits', () => {
    expect(getLimit('alertsMax', 'free')).toBe(5);
    expect(getLimit('portfolioPositions', 'free')).toBe(10);
    expect(getLimit('aiDaily', 'free')).toBe(3);
    expect(getLimit('aiDaily', 'premium')).toBe(100);
  });

  it('maps store products to monthly and yearly Aithera Pro SKUs', () => {
    expect(PREMIUM_PRODUCT_IDS.monthly).toBe('tradevision_premium_monthly');
    expect(PREMIUM_PRODUCT_IDS.yearly).toBe('tradevision_premium_yearly');
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
