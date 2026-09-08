import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

export interface PracticeAttempt {
  drillId: string;
  at: string;
  correct: boolean;
  selectedIndex: number;
  confidence?: 'low' | 'medium' | 'high';
}

interface PracticeProgressState {
  attempts: PracticeAttempt[];
  recordAttempt: (attempt: Omit<PracticeAttempt, 'at'> & { at?: string }) => void;
  statsFor: (drillId: string) => { attempts: number; accuracy: number; lastCorrect?: boolean };
  repeatedMistakes: () => string[];
}

export const usePracticeProgressStore = create<PracticeProgressState>()(
  persist(
    (set, get) => ({
      attempts: [],
      recordAttempt: (attempt) => {
        const next: PracticeAttempt = {
          drillId: attempt.drillId,
          correct: attempt.correct,
          selectedIndex: attempt.selectedIndex,
          confidence: attempt.confidence,
          at: attempt.at ?? new Date().toISOString(),
        };
        set({ attempts: [...get().attempts, next].slice(-200) });
      },
      statsFor: (drillId) => {
        const rows = get().attempts.filter((item) => item.drillId === drillId);
        const correct = rows.filter((item) => item.correct).length;
        return {
          attempts: rows.length,
          accuracy: rows.length ? correct / rows.length : 0,
          lastCorrect: rows.at(-1)?.correct,
        };
      },
      repeatedMistakes: () => {
        const misses = new Map<string, number>();
        for (const attempt of get().attempts) {
          if (attempt.correct) continue;
          misses.set(attempt.drillId, (misses.get(attempt.drillId) ?? 0) + 1);
        }
        return [...misses.entries()]
          .filter(([, count]) => count >= 2)
          .sort((a, b) => b[1] - a[1])
          .map(([id]) => id);
      },
    }),
    {
      name: 'tradevision-practice-progress-v1',
      storage: createPersistedStorage(),
      version: 1,
    },
  ),
);
