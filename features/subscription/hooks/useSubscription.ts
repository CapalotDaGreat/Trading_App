import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
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
  const {
    setPremium,
    setLoading,
    reset,
    ownerUid,
    isPremium,
    isLoading,
    tier,
    expirationDate,
    productId,
  } = useSubscriptionStore();

  useEffect(() => {
    if (ownerUid !== uid) {
      reset();
      queryClient.removeQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY] });
    }
    void subscriptionService.configureForUser(uid);
  }, [ownerUid, uid, reset, queryClient]);

  const subscriptionQuery = useQuery({
    queryKey: [SUBSCRIPTION_QUERY_KEY, uid],
    queryFn: async (): Promise<SubscriptionRecord | null> => {
      if (!uid) return null;
      setLoading(true);
      try {
        const record =
          (await subscriptionService.getSubscription(uid)) ??
          (await subscriptionService.syncFromRevenueCat(uid));
        setPremium(
          record.isPremium,
          record.productId ?? undefined,
          record.expiresAt ?? undefined,
          uid,
        );
        return record;
      } finally {
        setLoading(false);
      }
    },
    enabled: Boolean(uid),
    staleTime: 15_000,
    refetchInterval: 60_000,
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
          uid ?? undefined,
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
      setPremium(
        record.isPremium,
        record.productId ?? undefined,
        record.expiresAt ?? undefined,
        uid ?? undefined,
      );
      void queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY, uid] });
    },
  });

  const refresh = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const record = await subscriptionService.syncFromRevenueCat(uid);
      setPremium(
        record.isPremium,
        record.productId ?? undefined,
        record.expiresAt ?? undefined,
        uid,
      );
      await queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY, uid] });
    } finally {
      setLoading(false);
    }
  }, [uid, setPremium, setLoading, queryClient]);

  const manage = useCallback(
    () => subscriptionService.manageSubscription(subscriptionQuery.data ?? null),
    [subscriptionQuery.data],
  );

  useEffect(() => {
    const expiresAt = subscriptionQuery.data?.expiresAt;
    if (!uid || !expiresAt) return;
    const delay = Date.parse(expiresAt) - Date.now();
    if (delay <= 0) {
      setPremium(false, undefined, undefined, uid);
      return;
    }
    if (delay > 2_147_483_647) return;

    const timer = setTimeout(() => {
      setPremium(false, undefined, undefined, uid);
      queryClient.setQueryData<SubscriptionRecord | null>(
        [SUBSCRIPTION_QUERY_KEY, uid],
        (record) => (record ? { ...record, isPremium: false, tier: 'free' } : record),
      );
      void queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY, uid] });
    }, delay);
    return () => clearTimeout(timer);
  }, [subscriptionQuery.data?.expiresAt, uid, setPremium, queryClient]);

  const cachedPremium =
    ownerUid === uid &&
    isPremium &&
    (!expirationDate || Date.parse(expirationDate) > Date.now());

  return {
    uid,
    plans: subscriptionService.getPlans(),
    subscription: subscriptionQuery.data,
    isPremium: subscriptionQuery.data?.isPremium ?? cachedPremium,
    tier: subscriptionQuery.data?.tier ?? (cachedPremium ? tier : 'free'),
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
    manage,
    nativeBillingAvailable: subscriptionService.isNativeBillingAvailable(),
    refresh,
  };
}
