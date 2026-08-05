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

  const applyRecord = useCallback(
    (record: SubscriptionRecord) => {
      setPremium(
        record.isPremium,
        record.productId ?? undefined,
        record.expiresAt ?? undefined,
        uid ?? undefined,
      );
      if (uid) {
        queryClient.setQueryData<SubscriptionRecord | null>([SUBSCRIPTION_QUERY_KEY, uid], record);
      }
    },
    [setPremium, queryClient, uid],
  );

  useEffect(() => {
    if (!uid || !subscriptionService.isNativeBillingAvailable()) return;
    return subscriptionService.addCustomerInfoListener(uid, applyRecord);
  }, [uid, applyRecord]);

  const plansQuery = useQuery({
    queryKey: [SUBSCRIPTION_QUERY_KEY, 'plans', uid],
    queryFn: () => subscriptionService.getStorePlans(),
    staleTime: 60_000,
    placeholderData: subscriptionService.getPlans(),
  });

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
      if (!uid) throw new Error('Sign in to purchase Aithera Pro.');
      return subscriptionService.purchasePlan(uid, planId);
    },
    onSuccess: (result) => {
      if (result.subscription) applyRecord(result.subscription);
      void queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY, uid] });
    },
  });

  const paywallMutation = useMutation({
    mutationFn: () => {
      if (!uid) throw new Error('Sign in to purchase Aithera Pro.');
      return subscriptionService.presentPaywall(uid);
    },
    onSuccess: (result) => {
      if (result.subscription) applyRecord(result.subscription);
      void queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY, uid] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => {
      if (!uid) throw new Error('Sign in to restore purchases.');
      return subscriptionService.restorePurchases(uid);
    },
    onSuccess: (record) => {
      applyRecord(record);
      void queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY, uid] });
    },
  });

  const refresh = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const record = await subscriptionService.syncFromRevenueCat(uid);
      applyRecord(record);
      await queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY, uid] });
    } finally {
      setLoading(false);
    }
  }, [uid, applyRecord, setLoading, queryClient]);

  const manage = useCallback(
    () => subscriptionService.manageSubscription(subscriptionQuery.data ?? null),
    [subscriptionQuery.data],
  );

  const openCustomerCenter = useCallback(async () => {
    if (!uid) throw new Error('Sign in to manage your subscription.');
    await subscriptionService.presentCustomerCenter(uid);
    await refresh();
  }, [uid, refresh]);

  const presentPaywall = useCallback(async () => {
    if (!uid) throw new Error('Sign in to purchase Aithera Pro.');
    return paywallMutation.mutateAsync();
  }, [uid, paywallMutation]);

  const presentPaywallIfNeeded = useCallback(async () => {
    if (!uid) throw new Error('Sign in to purchase Aithera Pro.');
    const result = await subscriptionService.presentPaywallIfNeeded(uid);
    if (result.subscription) applyRecord(result.subscription);
    void queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY, uid] });
    return result;
  }, [uid, applyRecord, queryClient]);

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
    plans: plansQuery.data ?? subscriptionService.getPlans(),
    subscription: subscriptionQuery.data,
    isPremium: subscriptionQuery.data?.isPremium ?? cachedPremium,
    hasAitheraPro: subscriptionQuery.data?.isPremium ?? cachedPremium,
    tier: subscriptionQuery.data?.tier ?? (cachedPremium ? tier : 'free'),
    expirationDate: subscriptionQuery.data?.expiresAt ?? expirationDate,
    productId: subscriptionQuery.data?.productId ?? productId,
    isLoading: subscriptionQuery.isLoading || isLoading,
    isRefreshing: subscriptionQuery.isFetching,
    error: subscriptionQuery.error,
    purchase: purchaseMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending || paywallMutation.isPending,
    purchaseError: purchaseMutation.error ?? paywallMutation.error,
    presentPaywall,
    presentPaywallIfNeeded,
    restore: restoreMutation.mutateAsync,
    isRestoring: restoreMutation.isPending,
    restoreError: restoreMutation.error,
    manage,
    openCustomerCenter,
    nativeBillingAvailable: subscriptionService.isNativeBillingAvailable(),
    refresh,
  };
}
