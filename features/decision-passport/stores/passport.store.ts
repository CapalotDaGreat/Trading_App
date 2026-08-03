import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  buildLabProcessCredential,
  buildPassportCredential,
  summarizePassport,
  type DecisionPassportSnapshot,
  type PassportCredential,
} from '@/features/decision-passport/services/passport.service';
import type { SimulatorAction, SimulatorScores } from '@/features/decision-simulator/types/simulator.types';
import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

function mergeCredentials(
  existing: PassportCredential[],
  incoming: PassportCredential[],
): PassportCredential[] {
  const byId = new Map(existing.map((c) => [c.id, c]));
  for (const cred of incoming) {
    if (!byId.has(cred.id)) byId.set(cred.id, cred);
  }
  return Array.from(byId.values())
    .sort((a, b) => b.earnedAt - a.earnedAt)
    .slice(0, 40);
}

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
  recordLabResult: (input: {
    symbol: string;
    processScore: number;
    stopHonored: boolean;
    journaled: boolean;
  }) => PassportCredential | null;
  syncDerivedCredentials: (derived: PassportCredential[]) => void;
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
            ? mergeCredentials(get().credentials, [credential])
            : get().credentials,
        });
        return credential;
      },
      recordLabResult: ({ symbol, processScore, stopHonored, journaled }) => {
        const credential = buildLabProcessCredential({
          symbol,
          processScore,
          stopHonored,
          journaled,
        });
        set({
          processScores: [processScore, ...get().processScores].slice(0, 100),
          credentials: credential
            ? mergeCredentials(get().credentials, [credential])
            : get().credentials,
        });
        return credential;
      },
      syncDerivedCredentials: (derived) => {
        if (!derived.length) return;
        const prev = get().credentials;
        const merged = mergeCredentials(prev, derived);
        const changed =
          merged.length !== prev.length || merged.some((c) => !prev.find((p) => p.id === c.id));
        if (changed) set({ credentials: merged });
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
