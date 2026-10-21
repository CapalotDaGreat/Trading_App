import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

import type { TradingDaySession } from '../services/trading-day.service';

export interface IntradaySessionRecord {
  id: string;
  at: string;
  mode: 'replay' | 'day' | 'scalp';
  processScore: number;
  tradesPlaced: number;
  flat: boolean;
  breakerHit: boolean;
  netPnl: number;
  reflection: string;
  findings: string[];
}

interface IntradaySessionState {
  activeSession: TradingDaySession | null;
  activeMode: 'replay' | 'day' | 'scalp';
  records: IntradaySessionRecord[];
  saveActive: (session: TradingDaySession | null, mode: IntradaySessionState['activeMode']) => void;
  completeSession: (record: IntradaySessionRecord) => void;
  clearActive: () => void;
}

/**
 * Local-first persistence for intraday sessions (guest-safe, works offline).
 * Progress resumes exactly at the revealed candle — future candles are never
 * persisted in a revealed state beyond the cursor.
 */
export const useIntradaySessionStore = create<IntradaySessionState>()(
  persist(
    (set) => ({
      activeSession: null,
      activeMode: 'day',
      records: [],
      saveActive: (session, mode) => set({ activeSession: session, activeMode: mode }),
      completeSession: (record) =>
        set((state) => ({
          records: [record, ...state.records].slice(0, 50),
          activeSession: null,
        })),
      clearActive: () => set({ activeSession: null }),
    }),
    {
      name: 'tradeacademy-intraday-v1',
      storage: createPersistedStorage(),
      version: 1,
      partialize: (state) => ({
        activeSession: state.activeSession,
        activeMode: state.activeMode,
        records: state.records,
      }),
    },
  ),
);
