import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { canUseFirestore } from '@/firebase/config';
import { subscriptionService } from '@/features/subscription/services/subscription.service';
import type {
  SubscriptionPlanId,
  SubscriptionRecord,
} from '@/features/subscription/types/subscription.types';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

const SUBSCRIPTION_QUERY_KEY = 'subscription';

export function useSubscription() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const queryClient = useQueryClient();
  const { setPremium, setLoading, isPremium, isLoading, tier, expirationDate, productId } =
    useSubscriptionStore();

  const subscriptionQuery = useQuery({
    queryKey: [SUBSCRIPTION_QUERY_KEY, uid],
    queryFn: async (): Promise<SubscriptionRecord | null> => {
      if (!uid) return null;
      setLoading(true);
      try {
        const record =
          (await subscriptionService.getSubscription(uid)) ??
          (await subscriptionService.syncFromRevenueCat(uid));
        setPremium(record.isPremium, record.productId ?? undefined, record.expiresAt ?? undefined);
        return record;
      } finally {
        setLoading(false);
      }
    },
    enabled: canUseFirestore(uid),
    staleTime: 60_000,
  });

  const purchaseMutation = useMutation({
    mutationFn: (planId: SubscriptionPlanId) => {
      if (!uid) throw new Error('Sign in to purchase premium.');
      return subscriptionService.purchasePlan(uid, planId);
    },
    onSuccess: (result) => {
      if (result.subscription) {
        setPremium(
          result.subscription.isPremium,
          result.subscription.productId ?? undefined,
          result.subscription.expiresAt ?? undefined,
        );
      }
      void queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY, uid] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => {
      if (!uid) throw new Error('Sign in to restore purchases.');
      return subscriptionService.restorePurchases(uid);
    },
    onSuccess: (record) => {
      setPremium(record.isPremium, record.productId ?? undefined, record.expiresAt ?? undefined);
      void queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY, uid] });
    },
  });

  const refresh = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const record = await subscriptionService.syncFromRevenueCat(uid);
      setPremium(record.isPremium, record.productId ?? undefined, record.expiresAt ?? undefined);
      await queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY, uid] });
    } finally {
      setLoading(false);
    }
  }, [uid, setPremium, setLoading, queryClient]);

  return {
    uid,
    plans: subscriptionService.getPlans(),
    subscription: subscriptionQuery.data,
    isPremium: subscriptionQuery.data?.isPremium ?? isPremium,
    tier: subscriptionQuery.data?.tier ?? tier,
    expirationDate: subscriptionQuery.data?.expiresAt ?? expirationDate,
    productId: subscriptionQuery.data?.productId ?? productId,
    isLoading: subscriptionQuery.isLoading || isLoading,
    isRefreshing: subscriptionQuery.isFetching,
    error: subscriptionQuery.error,
    purchase: purchaseMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    purchaseError: purchaseMutation.error,
    restore: restoreMutation.mutateAsync,
    isRestoring: restoreMutation.isPending,
    restoreError: restoreMutation.error,
    refresh,
  };
}
