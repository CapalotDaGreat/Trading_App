import { planIdFromProductId, PREMIUM_PRODUCT_IDS } from '@/shared/constants/subscription';

import {
  FALLBACK_SUBSCRIPTION_PLANS,
  filterPlansForRuntime,
  findPackageForPlan,
  planIdFromOfferingPackage,
  plansFromOfferingPackages,
} from '../revenuecat-packages';

describe('RevenueCat offering package mapping', () => {
  it('maps monthly, yearly, lifetime, and 12m commitment package types', () => {
    expect(
      planIdFromOfferingPackage({
        identifier: '$rc_monthly',
        packageType: 'MONTHLY',
        product: { identifier: 'monthly' },
      }),
    ).toBe('monthly');
    expect(
      planIdFromOfferingPackage({
        identifier: '$rc_annual',
        packageType: 'ANNUAL',
        product: { identifier: 'yearly' },
      }),
    ).toBe('yearly');
    expect(
      planIdFromOfferingPackage({
        identifier: '$rc_lifetime',
        packageType: 'LIFETIME',
        product: { identifier: 'lifetime' },
      }),
    ).toBe('lifetime');
    expect(
      planIdFromOfferingPackage({
        identifier: 'monthly_12m_commitment',
        packageType: 'CUSTOM',
        product: { identifier: 'tradeacademy_premium_monthly_12m_commitment' },
      }),
    ).toBe('monthly_12m_commitment');
  });

  it('builds offering order yearly → commitment → monthly → lifetime', () => {
    const plans = plansFromOfferingPackages([
      { packageType: 'LIFETIME', product: { identifier: 'lifetime', priceString: '$249.00' } },
      { packageType: 'MONTHLY', product: { identifier: 'monthly', priceString: '$9.99' } },
      { packageType: 'ANNUAL', product: { identifier: 'yearly', priceString: '$71.99' } },
      {
        packageType: 'CUSTOM',
        product: {
          identifier: 'tradeacademy_premium_monthly_12m_commitment',
          priceString: '$6.99',
        },
      },
    ]);
    expect(plans.map((plan) => plan.id)).toEqual([
      'yearly',
      'monthly_12m_commitment',
      'monthly',
      'lifetime',
    ]);
    expect(plans.find((plan) => plan.id === 'monthly_12m_commitment')?.isApple12mCommitment).toBe(
      true,
    );
    expect(plans.find((plan) => plan.id === 'monthly_12m_commitment')?.price).toBe('$6.99');
  });

  it('uses the catalog product identifiers for Aithera Pro', () => {
    expect(FALLBACK_SUBSCRIPTION_PLANS.find((plan) => plan.id === 'monthly')?.productId).toBe(
      'tradeacademy_premium_monthly',
    );
    expect(FALLBACK_SUBSCRIPTION_PLANS.find((plan) => plan.id === 'yearly')?.productId).toBe(
      'tradeacademy_premium_yearly',
    );
    expect(
      FALLBACK_SUBSCRIPTION_PLANS.find((plan) => plan.id === 'monthly_12m_commitment')?.productId,
    ).toBe('tradeacademy_premium_monthly_12m_commitment');
  });

  it('maps product ids to plan ids without confusing commitment with monthly', () => {
    expect(planIdFromProductId(PREMIUM_PRODUCT_IDS.monthly_12m_commitment)).toBe(
      'monthly_12m_commitment',
    );
    expect(planIdFromProductId(PREMIUM_PRODUCT_IDS.monthly)).toBe('monthly');
    expect(planIdFromProductId(PREMIUM_PRODUCT_IDS.yearly)).toBe('yearly');
    expect(planIdFromProductId(PREMIUM_PRODUCT_IDS.lifetime)).toBe('lifetime');
  });

  it('hides commitment plans when the platform is ineligible', () => {
    const filtered = filterPlansForRuntime(FALLBACK_SUBSCRIPTION_PLANS, {
      platformEligible: false,
    });
    expect(filtered.some((plan) => plan.id === 'monthly_12m_commitment')).toBe(false);
    expect(filtered.some((plan) => plan.id === 'monthly')).toBe(true);
  });

  it('finds a lifetime package for a manual purchase', () => {
    const packages = [
      { identifier: '$rc_lifetime', packageType: 'LIFETIME', product: { identifier: 'lifetime' } },
    ];
    expect(findPackageForPlan(packages, 'lifetime')?.product.identifier).toBe('lifetime');
    expect(FALLBACK_SUBSCRIPTION_PLANS.some((plan) => plan.id === 'lifetime')).toBe(true);
  });
});
