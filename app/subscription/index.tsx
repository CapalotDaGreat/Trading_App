import { useCallback, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { PaywallScreen } from '@/features/subscription/components/PaywallScreen';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { RevenueCatPaywallScreen } from '@/features/subscription/screens/RevenueCatPaywallScreen';
import { isRevenueCatPaywallViewAvailable } from '@/features/subscription/services/revenuecat-ui';
import { DEMO_USER_UID } from '@/firebase/config';

export default function SubscriptionRoute() {
  const { user } = useAuth();
  const { isPremium, nativeBillingAvailable } = useSubscription();
  const [useFallback, setUseFallback] = useState(false);
  const isGuest = user?.uid === DEMO_USER_UID;
  const showNativePaywall =
    !isPremium &&
    !isGuest &&
    !useFallback &&
    nativeBillingAvailable &&
    isRevenueCatPaywallViewAvailable();

  const handleFallback = useCallback(() => setUseFallback(true), []);

  if (showNativePaywall) {
    return <RevenueCatPaywallScreen onFallback={handleFallback} />;
  }

  return <PaywallScreen />;
}
