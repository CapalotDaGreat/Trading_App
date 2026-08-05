import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import { PremiumOsGate } from '../PremiumOsGate';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('PremiumOsGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSubscriptionStore.setState({ tier: 'free', isPremium: false });
  });

  it('shows grounded upsell copy to free users and opens the paywall', async () => {
    const screen = await render(
      <PremiumOsGate feature="weeklyReviews">
        <Text>Weekly detail</Text>
      </PremiumOsGate>,
    );

    expect(screen.queryByText('Weekly detail')).toBeNull();
    expect(screen.getByText(/recorded decisions/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('premium-os-gate-weeklyReviews-cta'));
    expect(mockPush).toHaveBeenCalledWith('/subscription');
  });

  it('shows real capability content to Premium users while freeAlways bypasses gating', async () => {
    useSubscriptionStore.setState({ tier: 'premium', isPremium: true });
    const premium = await render(
      <PremiumOsGate feature="weeklyReviews">
        <Text>Weekly detail</Text>
      </PremiumOsGate>,
    );
    expect(premium.getByText('Weekly detail')).toBeTruthy();
    await premium.unmount();

    useSubscriptionStore.setState({ tier: 'free', isPremium: false });
    const freeCore = await render(
      <PremiumOsGate feature="weeklyReviews" freeAlways>
        <Text>Basic Review</Text>
      </PremiumOsGate>,
    );
    expect(freeCore.getByText('Basic Review')).toBeTruthy();
  });
});
