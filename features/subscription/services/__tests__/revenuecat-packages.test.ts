import {
  FALLBACK_SUBSCRIPTION_PLANS,
  findPackageForPlan,
  planIdFromOfferingPackage,
  plansFromOfferingPackages,
} from '../revenuecat-packages';

describe('RevenueCat offering package mapping', () => {
  it('maps monthly, yearly, and lifetime package types', () => {
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
  });

  it('builds the current offering in yearly → monthly → lifetime order', () => {
    const plans = plansFromOfferingPackages([
      { packageType: 'LIFETIME', product: { identifier: 'lifetime', priceString: '$249.00' } },
      { packageType: 'MONTHLY', product: { identifier: 'monthly', priceString: '$9.99' } },
      { packageType: 'ANNUAL', product: { identifier: 'yearly', priceString: '$71.99' } },
    ]);
    expect(plans.map((plan) => plan.id)).toEqual(['yearly', 'monthly', 'lifetime']);
    expect(plans.find((plan) => plan.id === 'lifetime')?.isLifetime).toBe(true);
    expect(plans.find((plan) => plan.id === 'lifetime')?.price).toBe('$249.00');
  });

  it('finds a lifetime package for a manual purchase', () => {
    const packages = [
      { identifier: '$rc_lifetime', packageType: 'LIFETIME', product: { identifier: 'lifetime' } },
    ];
    expect(findPackageForPlan(packages, 'lifetime')?.product.identifier).toBe('lifetime');
    expect(FALLBACK_SUBSCRIPTION_PLANS.some((plan) => plan.id === 'lifetime')).toBe(true);
  });
});
