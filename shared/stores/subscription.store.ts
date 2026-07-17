import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SubscriptionTier } from '@/shared/constants/subscription';
import { REVENUECAT_ENTITLEMENT_ID } from '@/shared/constants/subscription';

interface SubscriptionState {
  tier: SubscriptionTier;
  isPremium: boolean;
  isLoading: boolean;
  expirationDate: string | null;
  productId: string | null;
  entitlementId: string;
  setTier: (tier: SubscriptionTier) => void;
  setPremium: (isPremium: boolean, productId?: string, expirationDate?: string) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

const initialState = {
  tier: 'free' as SubscriptionTier,
  isPremium: false,
  isLoading: true,
  expirationDate: null,
  productId: null,
  entitlementId: REVENUECAT_ENTITLEMENT_ID,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      ...initialState,
      setTier: (tier) =>
        set({
          tier,
          isPremium: tier === 'premium',
        }),
      setPremium: (isPremium, productId, expirationDate) =>
        set({
          isPremium,
          tier: isPremium ? 'premium' : 'free',
          productId: productId ?? null,
          expirationDate: expirationDate ?? null,
          isLoading: false,
        }),
      setLoading: (isLoading) => set({ isLoading }),
      reset: () => set({ ...initialState, isLoading: false }),
    }),
    {
      name: 'tradevision-subscription',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tier: state.tier,
        isPremium: state.isPremium,
        expirationDate: state.expirationDate,
        productId: state.productId,
      }),
    },
  ),
);
