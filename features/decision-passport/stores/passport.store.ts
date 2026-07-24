import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  buildPassportCredential,
  summarizePassport,
  type DecisionPassportSnapshot,
  type PassportCredential,
} from '@/features/decision-passport/services/passport.service';
import type { SimulatorAction, SimulatorScores } from '@/features/decision-simulator/types/simulator.types';
import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

interface PassportState {
  credentials: PassportCredential[];
  processScores: number[];
  lastAction?: SimulatorAction;
  /** Achievement id → first unlocked timestamp. */
  unlockedAchievementDates: Record<string, number>;
  recordSimulatorResult: (input: {
    symbol: string;
    action: SimulatorAction;
    scores: SimulatorScores;
  }) => PassportCredential | null;
  syncAchievementDates: (next: Record<string, number>) => void;
  getSnapshot: () => DecisionPassportSnapshot;
}

export const useDecisionPassportStore = create<PassportState>()(
  persist(
    (set, get) => ({
      credentials: [],
      processScores: [],
      lastAction: undefined,
      unlockedAchievementDates: {},
      recordSimulatorResult: ({ symbol, action, scores }) => {
        const credential = buildPassportCredential({ symbol, action, scores });
        set({
          processScores: [scores.processScore, ...get().processScores].slice(0, 100),
          lastAction: action,
          credentials: credential
            ? [credential, ...get().credentials].slice(0, 30)
            : get().credentials,
        });
        return credential;
      },
      syncAchievementDates: (next) => {
        const prev = get().unlockedAchievementDates;
        const merged = { ...prev, ...next };
        const changed =
          Object.keys(merged).length !== Object.keys(prev).length ||
          Object.keys(merged).some((k) => merged[k] !== prev[k]);
        if (changed) set({ unlockedAchievementDates: merged });
      },
      getSnapshot: () =>
        summarizePassport({
          processScores: get().processScores,
          credentials: get().credentials,
          lastAction: get().lastAction,
        }),
    }),
    {
      name: 'tradevision-decision-passport-v1',
      storage: createPersistedStorage(),
    },
  ),
);
