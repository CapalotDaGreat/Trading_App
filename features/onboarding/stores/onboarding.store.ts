import { create } from 'zustand';

import {
  clearOnboardingDraft,
  loadOnboardingDraft,
  saveOnboardingDraft,
} from '../services/onboarding-draft.service';
import type { OnboardingDraft } from '../types/onboarding.types';

interface OnboardingState {
  draft: OnboardingDraft | null;
  isHydrating: boolean;
  hydrate: (uid: string) => Promise<OnboardingDraft>;
  updateDraft: (
    uid: string,
    updates: Partial<Omit<OnboardingDraft, 'uid' | 'version' | 'updatedAt'>>,
  ) => Promise<OnboardingDraft>;
  clearDraft: (uid: string) => Promise<void>;
  resetMemory: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  draft: null,
  isHydrating: false,
  hydrate: async (uid) => {
    set({ isHydrating: true });
    try {
      const draft = await loadOnboardingDraft(uid);
      set({ draft });
      return draft;
    } finally {
      set({ isHydrating: false });
    }
  },
  updateDraft: async (uid, updates) => {
    const draft = await saveOnboardingDraft(uid, updates);
    set({ draft });
    return draft;
  },
  clearDraft: async (uid) => {
    await clearOnboardingDraft(uid);
    set((state) => ({ draft: state.draft?.uid === uid ? null : state.draft }));
  },
  resetMemory: () => set({ draft: null, isHydrating: false }),
}));
