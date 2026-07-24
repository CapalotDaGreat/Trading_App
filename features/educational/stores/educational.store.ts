import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

interface EducationalState {
  /** First-run Decision Lab onboarding card. */
  labOnboardingDismissed: boolean;
  dismissLabOnboarding: () => void;
}

export const useEducationalStore = create<EducationalState>()(
  persist(
    (set) => ({
      labOnboardingDismissed: false,
      dismissLabOnboarding: () => set({ labOnboardingDismissed: true }),
    }),
    {
      name: 'tradevision-educational-mode-v1',
      storage: createPersistedStorage(),
      partialize: (state) => ({
        labOnboardingDismissed: state.labOnboardingDismissed,
      }),
    },
  ),
);
