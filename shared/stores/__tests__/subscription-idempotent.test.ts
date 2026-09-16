import { useSubscriptionStore } from '@/shared/stores/subscription.store';

describe('subscription store idempotent writes', () => {
  beforeEach(() => {
    useSubscriptionStore.setState({
      ownerUid: null,
      tier: 'free',
      isPremium: false,
      isLoading: false,
      expirationDate: null,
      productId: null,
    });
  });

  it('setPremium no-ops when the entitlement snapshot is unchanged', () => {
    const { setPremium } = useSubscriptionStore.getState();
    setPremium(false, undefined, '2020-01-01T00:00:00.000Z', 'user-a');

    let writes = 0;
    const unsub = useSubscriptionStore.subscribe(() => {
      writes += 1;
    });
    setPremium(false, undefined, '2020-01-01T00:00:00.000Z', 'user-a');
    setPremium(false, undefined, '2020-01-01T00:00:00.000Z', 'user-a');
    unsub();

    expect(writes).toBe(0);
  });
});
