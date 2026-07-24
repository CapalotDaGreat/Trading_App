import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

import { scoreSimulatorDecision } from '../services/simulator-score.service';
import type {
  SimulatorAction,
  SimulatorChecklist,
  SimulatorHistoryItem,
  SimulatorSession,
} from '../types/simulator.types';

interface SimulatorState {
  activeSession: SimulatorSession | null;
  history: SimulatorHistoryItem[];
  setActiveSession: (session: SimulatorSession | null) => void;
  updateChecklist: (patch: Partial<SimulatorChecklist>) => void;
  setReasoningNote: (note: string) => void;
  submitDecision: (action: SimulatorAction) => SimulatorSession | null;
  clearActive: () => void;
}

export const useSimulatorStore = create<SimulatorState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      history: [],
      setActiveSession: (session) => set({ activeSession: session }),
      updateChecklist: (patch) => {
        const active = get().activeSession;
        if (!active) return;
        set({
          activeSession: {
            ...active,
            checklist: { ...active.checklist, ...patch },
          },
        });
      },
      setReasoningNote: (note) => {
        const active = get().activeSession;
        if (!active) return;
        set({ activeSession: { ...active, reasoningNote: note } });
      },
      submitDecision: (action) => {
        const active = get().activeSession;
        if (!active || active.phase === 'revealed') return null;

        const scores = scoreSimulatorDecision({
          session: active,
          action,
          reasoningNote: active.reasoningNote,
          checklist: active.checklist,
        });

        const revealed: SimulatorSession = {
          ...active,
          userAction: action,
          phase: 'revealed',
          decidedAt: Date.now(),
          revealedAt: Date.now(),
          scores,
        };

        const historyItem: SimulatorHistoryItem = {
          id: revealed.id,
          symbol: revealed.symbol,
          action,
          processScore: scores.processScore,
          createdAt: revealed.revealedAt!,
          learningSummary: scores.learningSummary,
        };

        set({
          activeSession: revealed,
          history: [historyItem, ...get().history].slice(0, 40),
        });

        return revealed;
      },
      clearActive: () => set({ activeSession: null }),
    }),
    {
      name: 'tradevision-decision-simulator-v1',
      storage: createPersistedStorage(),
      partialize: (state) => ({
        // Do not persist full candle arrays (large). Keep history summaries only.
        history: state.history,
      }),
    },
  ),
);
