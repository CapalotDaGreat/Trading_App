import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { SubscriptionTier } from '@/shared/constants/subscription';
import { REVENUECAT_ENTITLEMENT_ID } from '@/shared/constants/subscription';
import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

interface SubscriptionState {
  ownerUid: string | null;
  tier: SubscriptionTier;
  isPremium: boolean;
  isLoading: boolean;
  expirationDate: string | null;
  productId: string | null;
  entitlementId: string;
  setTier: (tier: SubscriptionTier) => void;
  setPremium: (
    isPremium: boolean,
    productId?: string,
    expirationDate?: string,
    ownerUid?: string,
  ) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

const initialState = {
  ownerUid: null,
  tier: 'free' as SubscriptionTier,
  isPremium: false,
  isLoading: true,
  expirationDate: null,
  productId: null,
  entitlementId: REVENUECAT_ENTITLEMENT_ID,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setTier: (tier) => {
        const current = get();
        const isPremium = tier === 'premium';
        if (current.tier === tier && current.isPremium === isPremium) return;
        set({
          tier,
          isPremium,
        });
      },
      setPremium: (isPremium, productId, expirationDate, ownerUid) => {
        const current = get();
        const nextOwner = ownerUid ?? null;
        const nextProduct = productId ?? null;
        const nextExpires = expirationDate ?? null;
        const nextTier = isPremium ? 'premium' : 'free';
        if (
          current.ownerUid === nextOwner &&
          current.isPremium === isPremium &&
          current.tier === nextTier &&
          current.productId === nextProduct &&
          current.expirationDate === nextExpires &&
          current.isLoading === false
        ) {
          return;
        }
        set({
          ownerUid: nextOwner,
          isPremium,
          tier: nextTier,
          productId: nextProduct,
          expirationDate: nextExpires,
          isLoading: false,
        });
      },
      setLoading: (isLoading) => {
        if (get().isLoading === isLoading) return;
        set({ isLoading });
      },
      reset: () => set({ ...initialState, isLoading: false }),
    }),
    {
      name: 'tradeacademy-subscription',
      storage: createPersistedStorage(),
      partialize: (state) => ({
        ownerUid: state.ownerUid,
        tier: state.tier,
        isPremium: state.isPremium,
        expirationDate: state.expirationDate,
        productId: state.productId,
      }),
    },
  ),
);
