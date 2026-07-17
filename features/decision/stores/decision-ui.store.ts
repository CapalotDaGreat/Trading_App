import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
