import { useMemo } from 'react';

import { useRemoteConfig } from '@/features/ops-config/hooks/useOpsConfig';
import { canUse, getLimit } from '@/features/subscription/services/entitlement.service';
import type { EntitlementCapability } from '@/shared/constants/entitlements';
import { isUnlimited } from '@/shared/constants/entitlements';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

export function useEntitlement(capability: EntitlementCapability) {
  const tier = useSubscriptionStore((s) => s.tier);
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const remote = useRemoteConfig();

  return useMemo(() => {
    const limit = getLimit(capability, tier);
    const allowed = canUse(capability, tier);
    return {
      tier,
      isPremium,
      allowed,
      limit,
      unlimited: typeof limit === 'number' && isUnlimited(limit),
    };
  }, [capability, tier, isPremium, remote]);
}
