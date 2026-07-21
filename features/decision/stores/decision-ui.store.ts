import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

interface DecisionUiState {
  /** First-run explainer clarifying decision-quality score (DQS) vs price prediction. */
  dqsExplainerDismissed: boolean;
  dismissDqsExplainer: () => void;
}

export const useDecisionUiStore = create<DecisionUiState>()(
  persist(
    (set) => ({
      dqsExplainerDismissed: false,
      dismissDqsExplainer: () => set({ dqsExplainerDismissed: true }),
    }),
    {
      name: 'tradevision-decision-ui',
      storage: createPersistedStorage(),
    },
  ),
);
